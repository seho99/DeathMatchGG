## Deathmatch GG 개발 가이드

친구들끼리만 사용하는 **롤 커스텀/사용자 설정 게임 전적 사이트**인 Deathmatch GG 프로젝트의 개발/운영 가이드입니다.  
이 파일은 앞으로 기능을 추가하거나 수정할 때마다 함께 업데이트합니다.

---

## 1. 환경 개요

- **프로젝트 루트**: `C:\DeathmatchGG\web`
- **기술 스택**
  - **Next.js (App Router, TypeScript)**
  - **Tailwind CSS**
  - **Supabase (PostgreSQL, Storage) – 추후 연결 예정**
  - **OCR (Google Cloud Vision / CLOVA OCR 중 택1) – 추후 연결 예정**

---

## 2. 개발 서버 실행 방법

- PowerShell에서 아래 명령 실행:

```bash
cd C:\DeathmatchGG\web
npm install          # 처음 한 번만
npm run dev          # 개발 서버 실행 (기본 포트: http://localhost:3000)
```

- 서버 중지: 개발 서버를 실행한 터미널에서 `Ctrl + C`

---

## 3. 주요 페이지 개요

- **`/` (홈)**
  - 프로젝트 소개, 빠른 이동 버튼:
    - 전적 스크린샷 업로드 (`/upload`)
    - 친구 목록 관리 (`/friends`)
    - 친구 이름으로 전적 검색 (`/search` – 추후 구현)

- **`/upload`**
  - 롤 경기 결과 스크린샷을 업로드하는 페이지.
  - 현재 상태:
    - 이미지 파일을 선택 후 업로드하면 `/api/upload` 로 전송.
    - 서버는 파일이 잘 도착했는지만 확인하고 JSON 응답을 돌려줌.
    - OCR, Supabase 저장, 검토 폼 연결은 추후 구현 예정.

- **`/friends`**
  - 친구 실명/메모를 관리하는 페이지.
  - 현재 상태:
    - “새 친구 추가 (임시)” 폼 UI만 구현.
    - 제출 시 콘솔에만 출력되며, 아직 Supabase DB에는 저장되지 않음.

---

## 4. 데이터 모델(개념 설계)

코드 상 타입 정의 파일: `src/types/domain.ts`

- **Friend (friends 테이블 예정)**
  - `id`: 친구 고유 ID (UUID)
  - `realName`: 실명 (검색 기준)
  - `memo`: 선택 메모 (탑 장인, 디코 닉네임 등)
  - `createdAt`: 생성일시

- **Match (matches 테이블 예정)**
  - `id`: 매치 ID
  - `playedAt`: 실제 경기 시각
  - `durationSeconds`: 게임 시간(초 단위)
  - `season`: 텍스트로 된 시즌 정보 (예: `"2025"`)
  - `screenshotUrl`: 스크린샷 저장 경로 (Supabase Storage)
  - `createdAt`: 생성일시

- **PlayerMatch (player_matches 테이블 예정)**
  - `id`: 레코드 ID
  - `matchId`: 어떤 경기인지 (Match와 연결)
  - `friendId`: 우리 친구 중 누구인지 (없으면 NULL)
  - `ingameNickname`: 그 판에서의 소환사 닉네임
  - `team`: `"BLUE"` / `"RED"`
  - `championName`: 챔피언 이름
  - `lane`: `TOP/JUNGLE/MID/ADC/SUPPORT` (선택)
  - `level`, `kills`, `deaths`, `assists`, `damage`, `gold`, `cs`
  - `win`: 해당 팀이 이겼는지 여부
  - `createdAt`: 생성일시

이 구조를 기반으로 시즌별 승률, 챔피언 승률, 친구 간 시너지(같이 한 팀일 때 승률) 등을 계산할 수 있습니다.

---

## 5. Supabase 연동 (준비 사항)

1. **Supabase 프로젝트 생성**
2. 프로젝트 설정에서
   - `Project URL`
   - `anon public key`
   값을 복사.
3. `C:\DeathmatchGG\web\.env.local` 파일을 만들고 아래처럼 설정:

```bash
NEXT_PUBLIC_SUPABASE_URL=여기에_프로젝트_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_public_key
```

4. 서버 재시작 (`npm run dev`) 후, `src/lib/supabaseClient.ts` 에서 이 값을 사용해 클라이언트를 생성함.

5. **Supabase Storage 버킷 생성**
   - Supabase 콘솔 → `Storage` → `New bucket`
   - 이름: `screenshots`, **Public bucket** 체크
   - Storage 정책은 `supabase_schema.sql` 파일 참고

6. **RLS 정책 추가** (필수!)
   - Supabase 콘솔 → `SQL` 탭
   - `supabase_schema.sql` 파일 하단의 RLS 정책 SQL 실행
   - 이걸 안 하면 `matches`, `player_matches` 테이블에 insert가 안 됨!
5. Supabase 콘솔 → SQL 탭에서 `supabase_schema.sql` 파일 내용을 그대로 붙여 넣고 실행하면
   - `friends`, `matches`, `player_matches` 테이블과 필요한 인덱스가 한 번에 생성됩니다.

---

## 6. 네이버 CLOVA OCR API 설정

OCR 자동 채우기 기능을 사용하려면 네이버 CLOVA OCR API 키가 필요합니다.  
**결제 정보 없이 무료로 사용 가능**하며, 월 1,000건까지 무료 할당량이 제공됩니다.

### API 키 발급 방법

1. **네이버 클라우드 플랫폼 접속**
   - https://www.ncloud.com/ 접속
   - 네이버 계정으로 로그인

2. **CLOVA OCR 서비스 신청**
   - 상단 메뉴 → `AI·NAVER API` → `CLOVA OCR` 클릭
   - 또는 직접: https://www.ncloud.com/product/aiService/ocr
   - `무료 체험 신청` 또는 `서비스 신청` 클릭

3. **Application 등록**
   - `Application` 탭 → `Application 등록` 클릭
   - Application 이름 입력 (예: `deathmatch-gg`)
   - `CLOVA OCR` 서비스 선택
   - 등록 완료

4. **도메인 생성 및 API Gateway 연동**
   - CLOVA OCR 콘솔에서 `Domain` 메뉴로 이동
   - 도메인 생성 (예: `deathmatch-gg`)
   - 생성한 도메인에서 `API Gateway 연동` → `자동 연동` 클릭
   - **API Gateway 이용 신청** 알림이 나오면 `확인` 클릭하여 신청 완료

5. **Invoke URL 및 Secret Key 확인**
   - API Gateway 연동 완료 후 `Invoke URL` 복사
   - `Secret Key` 복사

6. **환경변수에 추가**
   - `C:\DeathmatchGG\web\.env.local` 파일에 아래 추가:

```bash
CLOVA_OCR_API_URL=http://clovaocr-api-kr.ncloud.com/external/v1/50271/여기에_나머지_경로
CLOVA_OCR_SECRET_KEY=여기에_Secret_Key_붙여넣기
```

   - **중요**: `CLOVA_OCR_API_URL`은 API Gateway 연동 후 받은 **Invoke URL 전체**를 입력해야 합니다.

6. **서버 재시작**
   - `npm run dev` 재시작

### OCR 동작 방식

- 이미지 업로드 시 자동으로 OCR 수행
- OCR 결과를 파싱해서 플레이어 데이터로 변환 시도
- `/upload/review` 페이지에서 인풋창에 자동으로 채워짐
- OCR이 실패하거나 API 키가 없어도 수동 입력은 가능

> **참고**: 현재는 기본 파싱 로직만 구현되어 있고, 실제 롤 결과 화면 구조에 맞게 개선이 필요합니다.  
> `src/lib/ocr.ts` 파일의 `parseOCRResultToPlayers` 함수를 수정하면 됩니다.

---

## 7. 앞으로 구현할 큰 흐름 (요약)

- **1단계 – DB 연결**
  - Supabase에 friends / matches / player_matches 테이블 생성.
  - `/friends` 페이지를 Supabase와 연결해서 친구 목록 실제 저장/조회.

- **2단계 – 업로드 & OCR**
  - `/api/upload` 에서:
    - 이미지 → Supabase Storage 업로드
    - OCR API 호출 (Google Vision 등)
    - OCR 결과를 “한 경기 10명” 구조로 파싱.
  - `/upload` 이후에 “OCR 결과 검토 + 친구 실명 매핑 + 시즌 입력” 폼으로 연결.

- **3단계 – 확정 저장**
  - 검토 후 “저장” 버튼을 누르면:
    - `matches` 1개 + `player_matches` 여러 개를 Supabase에 저장.

- **4단계 – 전적/시너지 조회**
  - 친구 실명으로 검색하는 페이지(`/search` 혹은 `/friend/[id]`) 구현.
  - 시즌별 탭, 챔피언별 승률, 친구 조합 승률(시너지) 통계 표시.

---

## 8. 변경 이력 (Changelog)

- **2026-02-13 (오후)**
  - OCR 자동 채우기 기능 추가
    - CLOVA OCR API 연동 (`src/lib/ocr.ts`)
      - API Gateway 연동 없이 일반 OCR API 직접 사용
      - 환경변수: `CLOVA_OCR_SECRET_KEY`만 필요
    - `/api/upload` 에서 이미지 업로드 시 OCR 자동 수행
    - `/upload/review` 페이지에서 OCR 결과를 인풋창에 자동 채우기
    - OCR 실패 시에도 수동 입력 가능하도록 처리
  - Supabase RLS 정책 추가 (`supabase_schema.sql` 업데이트)
    - `friends`, `matches`, `player_matches` 테이블에 익명 사용자 읽기/쓰기 허용
  - 친구 관리 페이지 Supabase 연동 완료 (`/friends`)
    - 친구 목록 조회, 추가 기능 구현
  - 전적 저장 기능 완료 (`/upload/review`)
    - `matches`, `player_matches` 테이블에 데이터 저장 확인

- **2026-02-13 (오전)**
  - Next.js + TypeScript + Tailwind 기본 프로젝트 생성.
  - 홈(`/`), 업로드(`/upload`), 친구 관리(`/friends`) 기본 UI 구성.
  - `src/types/domain.ts` 에 Friend / Match / PlayerMatch 타입 정의.
  - `src/lib/supabaseClient.ts` 추가 (Supabase 클라이언트 초기 설정).
  - 이 `PROJECT_GUIDE.md` 파일 생성.

앞으로 기능을 추가하거나 수정할 때마다, 이 변경 이력 섹션에 날짜와 함께 어떤 변경을 했는지 간단히 적어 나갈 예정입니다.


