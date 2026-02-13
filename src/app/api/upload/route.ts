import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // TODO: 멀티파트 파싱 → Supabase Storage 업로드 → OCR 호출 → 파싱 로직 구현
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

    // 현재는 개발 초기 단계라, 파일을 그대로 받았는지만 확인하고
    // 이후 단계에서 Supabase + OCR 연동을 추가할 예정입니다.

    return NextResponse.json({
      ok: true,
      message: "파일을 정상적으로 업로드 요청까지 받았습니다.",
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "업로드 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}


