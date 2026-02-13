import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { performOCR, parseOCRResultToPlayers } from "@/lib/ocr";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data")) {
      return NextResponse.json(
        { error: "multipart/form-data 형식으로 업로드해주세요." },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: "파일을 찾을 수 없습니다." },
        { status: 400 },
      );
    }

    const fileBytes = await file.arrayBuffer();
    const buffer = Buffer.from(fileBytes);

    const fileExt = file.type.split("/")[1] || "png";
    const fileName = `match-${Date.now()}.${fileExt}`;
    const filePath = `raw/${fileName}`;

    // 1. Supabase Storage에 이미지 업로드
    // Buffer를 Blob으로 변환하여 업로드
    const blob = new Blob([buffer], { type: file.type });
    
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from("screenshots")
      .upload(filePath, blob, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage 업로드 에러 상세:", {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError,
      });
      return NextResponse.json(
        { 
          error: "Supabase Storage 업로드에 실패했습니다.",
          details: uploadError.message,
        },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("screenshots").getPublicUrl(filePath);

    // 2. OCR 수행 (API 키가 있으면)
    let ocrResult = null;
    let parsedPlayers = null;
    let ocrError = null;

    try {
      console.log("OCR 시작...");
      const ocr = await performOCR(buffer, file.type);
      console.log("OCR 성공! 텍스트 길이:", ocr.fullText.length);
      console.log("OCR 추출 텍스트 (처음 1000자):", ocr.fullText.substring(0, 1000));
      console.log("OCR 텍스트 블록 수:", ocr.textBlocks.length);
      ocrResult = {
        fullText: ocr.fullText.substring(0, 500), // 처음 500자만 전송 (디버깅용)
        textBlocks: ocr.textBlocks.slice(0, 50), // 처음 50개만 전송 (너무 크면 안 됨)
      };
      parsedPlayers = parseOCRResultToPlayers(ocr);
      console.log("OCR 파싱 완료. 플레이어 수:", parsedPlayers.length);
    } catch (err: any) {
      // OCR 실패해도 업로드는 성공한 것으로 처리 (수동 입력 가능)
      ocrError = err.message;
      console.warn("OCR 실패 (수동 입력으로 진행 가능):", err.message);
      console.error("OCR 에러 상세:", err);
      // API 키가 없거나 OCR 오류가 나도 계속 진행
    }

    return NextResponse.json({
      ok: true,
      message: "Supabase Storage 에 스크린샷을 저장했습니다.",
      path: filePath,
      publicUrl,
      ocrResult, // OCR 결과 (있으면)
      parsedPlayers, // 파싱된 플레이어 데이터 (있으면)
      ocrError, // OCR 에러 메시지 (있으면)
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "업로드 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}


