/**
 * 네이버 CLOVA OCR API를 사용한 OCR 유틸리티
 */

export interface OCRTextBlock {
  text: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRResult {
  textBlocks: OCRTextBlock[];
  fullText: string;
}

/**
 * 네이버 CLOVA OCR API로 OCR 수행
 * 환경변수 CLOVA_OCR_SECRET_KEY, CLOVA_OCR_API_URL 필요
 * API Gateway 연동을 통한 OCR API 호출
 */
export async function performOCR(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<OCRResult> {
  const secretKey = process.env.CLOVA_OCR_SECRET_KEY;
  const apiUrl = process.env.CLOVA_OCR_API_URL;

  if (!secretKey) {
    throw new Error(
      "CLOVA_OCR_SECRET_KEY 환경변수가 설정되지 않았습니다.",
    );
  }

  if (!apiUrl) {
    throw new Error(
      "CLOVA_OCR_API_URL 환경변수가 설정되지 않았습니다. API Gateway Invoke URL을 설정해주세요.",
    );
  }

  // API Gateway Invoke URL 사용 (http를 https로 변경)
  // Invoke URL은 이미 완전한 경로이므로 그대로 사용
  const httpsApiUrl = apiUrl.replace("http://", "https://");

  // 디버깅: API 키가 로드되었는지 확인
  console.log("CLOVA OCR API 호출 (API Gateway):", {
    apiUrl: httpsApiUrl,
    originalApiUrl: apiUrl,
    hasSecretKey: !!secretKey,
  });

  // CLOVA OCR API는 multipart/form-data 형식으로 이미지를 전송
  // Node.js 환경에서는 form-data 패키지 사용
  const FormDataModule = await import("form-data");
  const FormData = FormDataModule.default;
  const formData = new FormData();
  
  // message 파라미터: OCR 설정 (version V2 사용)
  const messageObj = {
    version: "V2",
    requestId: `req-${Date.now()}`,
    timestamp: Date.now(),
    lang: "ko", // 한국어
    images: [
      {
        format: mimeType.split("/")[1] || "png",
        name: "image",
      },
    ],
  };
  formData.append("message", JSON.stringify(messageObj));
  
  // file 파라미터: 이미지 파일 (Buffer를 직접 전달)
  formData.append("file", imageBuffer, {
    filename: "image.png",
    contentType: mimeType,
  });

  // 타임아웃 설정 (30초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    // form-data의 헤더 가져오기
    const formHeaders = formData.getHeaders();
    
    // 디버깅: FormData 헤더 확인
    console.log("FormData 전송:", {
      contentType: formHeaders["content-type"],
      hasSecretKey: !!secretKey,
    });
    
    // Node.js의 내장 fetch는 form-data와 호환성 문제가 있음
    // node-fetch를 사용하여 해결 (form-data와 완벽 호환)
    const nodeFetch = (await import("node-fetch")).default;
    
    const response = await nodeFetch(httpsApiUrl, {
      method: "POST",
      headers: {
        "X-OCR-SECRET": secretKey,
        ...formHeaders,
      },
      // form-data는 node-fetch와 완벽 호환
      body: formData,
      signal: controller.signal,
    } as any);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CLOVA OCR API 에러 상세:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(
        `CLOVA OCR API 호출 실패: ${response.status} - ${errorText}`,
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`CLOVA OCR API 오류: ${JSON.stringify(data.error)}`);
    }

    // CLOVA OCR 응답 파싱
    const images = data.images || [];
    const fullTextParts: string[] = [];
    const textBlocks: OCRTextBlock[] = [];

    images.forEach((image: any) => {
      const fields = image.fields || [];
      fields.forEach((field: any) => {
        const text = field.inferText || "";
        if (text) {
          fullTextParts.push(text);
          textBlocks.push({
            text,
            boundingBox: {
              x: field.boundingPoly?.vertices?.[0]?.x || 0,
              y: field.boundingPoly?.vertices?.[0]?.y || 0,
              width:
                (field.boundingPoly?.vertices?.[1]?.x || 0) -
                (field.boundingPoly?.vertices?.[0]?.x || 0),
              height:
                (field.boundingPoly?.vertices?.[2]?.y || 0) -
                (field.boundingPoly?.vertices?.[0]?.y || 0),
            },
          });
        }
      });
    });

    const fullText = fullTextParts.join(" ");

    return {
      textBlocks,
      fullText,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(
        "CLOVA OCR API 호출 타임아웃: API Gateway 이용 신청이 완료되었는지 확인해주세요.",
      );
    }
    throw error;
  }
}

/**
 * OCR 결과를 롤 게임 결과 화면 구조로 파싱
 * (현재는 기본적인 파싱만 하고, 실제 구조에 맞게 개선 필요)
 */
export interface ParsedPlayerData {
  ingameNickname: string;
  championName: string;
  team: "BLUE" | "RED";
  kills: number;
  deaths: number;
  assists: number;
  damage?: number;
  gold?: number;
  cs?: number;
  win: boolean;
}

/**
 * OCR 텍스트에서 플레이어 데이터 추출 시도
 * 롤 결과 화면의 고정된 레이아웃을 가정하고 파싱
 */
export function parseOCRResultToPlayers(
  ocrResult: OCRResult,
): ParsedPlayerData[] {
  const players: ParsedPlayerData[] = [];
  const fullText = ocrResult.fullText;

  // 게임 시간 추출 (예: "35:35")
  const timeMatch = fullText.match(/(\d+):(\d+)/);
  // 승리 팀 확인 (1팀이 승리하면 블루팀 승리)
  const blueTeamWins = fullText.includes("1팀") && fullText.includes("승");

  // 1팀 (블루팀) 파싱
  const team1Match = fullText.match(/1팀[※\s]*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
  if (team1Match) {
    // 1팀 플레이어들 파싱
    const team1Section = fullText.split("1팀")[1]?.split("2팀")[0] || "";
    const team1Players = parseTeamPlayers(team1Section, "BLUE", blueTeamWins);
    players.push(...team1Players);
  }

  // 2팀 (레드팀) 파싱
  const team2Match = fullText.match(/2팀[※\s]*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
  if (team2Match) {
    // 2팀 플레이어들 파싱
    const team2Section = fullText.split("2팀")[1] || "";
    const team2Players = parseTeamPlayers(team2Section, "RED", !blueTeamWins);
    players.push(...team2Players);
  }

  // 최소 10명이 안 되면 빈 데이터로 채우기
  while (players.length < 10) {
    const team = players.length < 5 ? "BLUE" : "RED";
    players.push({
      ingameNickname: "",
      championName: "",
      team,
      kills: 0,
      deaths: 0,
      assists: 0,
      win: team === "BLUE" ? blueTeamWins : !blueTeamWins,
    });
  }

  return players.slice(0, 10);
}

/**
 * 팀 섹션에서 플레이어 데이터 파싱
 */
function parseTeamPlayers(
  teamText: string,
  team: "BLUE" | "RED",
  win: boolean,
): ParsedPlayerData[] {
  const players: ParsedPlayerData[] = [];

  // 팀 전체 스코어 제거 (예: "1팀 ※ 34 / 24 / 46 66,692")
  const teamScorePattern = /[12]팀[※\s]*\d+\s*\/\s*\d+\s*\/\s*\d+\s*[\d,]+/;
  let cleanText = teamText.replace(teamScorePattern, "");

  // 플레이어 데이터 패턴: 닉네임 + K/D/A + 딜량 + 골드 + CS + 챔피언명
  // 예: "kind uncle 6/6/12 19,613 11,498 15 탐 켄치"
  // 더 정확한 패턴: (닉네임) + (K/D/A) + (딜량) + (골드) + (CS) + (챔피언명)
  
  // 각 플레이어를 개별적으로 파싱 (KDA를 기준으로 분리)
  const kdaPattern = /(\d+)\/(\d+)\/(\d+)/g;
  const kdaMatches = Array.from(cleanText.matchAll(kdaPattern));

  for (let i = 0; i < kdaMatches.length; i++) {
    const match = kdaMatches[i];
    const kills = parseInt(match[1], 10);
    const deaths = parseInt(match[2], 10);
    const assists = parseInt(match[3], 10);

    const matchIndex = match.index || 0;
    
    // 이전 KDA와 현재 KDA 사이의 텍스트에서 닉네임 찾기
    const prevMatchIndex = i > 0 ? (kdaMatches[i - 1].index || 0) + 50 : 0;
    const beforeText = cleanText.substring(prevMatchIndex, matchIndex);
    
    // 현재 KDA 이후 텍스트
    const nextMatchIndex = i < kdaMatches.length - 1 
      ? (kdaMatches[i + 1].index || cleanText.length) 
      : matchIndex + 200;
    const afterText = cleanText.substring(matchIndex, nextMatchIndex);

    // 닉네임 추출: KDA 바로 앞의 한글/영문 텍스트 (숫자 제외)
    // 패턴: 한글/영문 텍스트가 KDA 바로 앞에 있음
    let nickname = "";
    const nicknameMatch = beforeText.match(/([가-힣a-zA-Z\s]+?)\s+(?=\d+\/\d+\/\d+)/);
    if (nicknameMatch) {
      nickname = nicknameMatch[1]
        .trim()
        .replace(/[^\w가-힣\s]/g, "")
        .replace(/\d+/g, "") // 숫자 제거
        .replace(/분|골드|딜량|KDA|탐|켄치|조이|진|제라스|그레이브즈|질리언|오리아나|잭스|녹턴|미스|포츈/gi, "") // 챔피언명 제거
        .trim();
      
      // 너무 짧거나 의미없는 텍스트 제거
      if (nickname.length < 2 || /^\d+$/.test(nickname)) {
        nickname = "";
      }
    }

    // 딜량, 골드, CS 추출
    // 패턴: KDA + 딜량(큰 숫자) + 골드(큰 숫자) + CS(작은 숫자)
    const statsMatch = afterText.match(/\d+\/\d+\/\d+\s+(\d{4,}(?:,\d{3})*)\s+(\d{4,}(?:,\d{3})*)\s+(\d{1,3})/);
    const damage = statsMatch ? parseInt(statsMatch[1].replace(/,/g, ""), 10) : undefined;
    const gold = statsMatch ? parseInt(statsMatch[2].replace(/,/g, ""), 10) : undefined;
    const cs = statsMatch ? parseInt(statsMatch[3], 10) : undefined;

    // 챔피언명 추출: CS 뒤의 한글/영문 텍스트 (KDA, 분 등 제외)
    let champion = "";
    if (statsMatch) {
      const afterStats = afterText.substring(afterText.indexOf(statsMatch[3]) + statsMatch[3].length);
      const championMatch = afterStats.match(/\s+([가-힣a-zA-Z]+)/);
      if (championMatch) {
        champion = championMatch[1].trim();
        // KDA, 분 등의 단어 제거
        if (/KDA|분|골드|딜량|/i.test(champion)) {
          champion = "";
        }
      }
    }
    
    // 챔피언명이 없으면 다른 패턴 시도
    if (!champion) {
      const championMatch = afterText.match(/\d+\/\d+\/\d+\s+[\d,\s]+\s+([가-힣a-zA-Z]+)/);
      if (championMatch) {
        champion = championMatch[1].trim();
        if (!/KDA|분|골드|딜량/i.test(champion) && champion.length > 1) {
          // 챔피언명으로 인정
        } else {
          champion = "";
        }
      }
    }

    players.push({
      ingameNickname: nickname,
      championName: champion,
      team,
      kills,
      deaths,
      assists,
      damage,
      gold,
      cs,
      win,
    });
  }

  return players;
}

