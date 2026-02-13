# Deathmatch GG 개발 현황 및 다음 단계

이 문서는 현재까지의 개발 진행 상황과 다음에 해야 할 작업들을 정리한 문서입니다.

---

## 📅 오늘 (2026-02-13) 완료한 작업

### ✅ 1. CLOVA OCR API 연동 완료
- 네이버 클라우드 플랫폼 CLOVA OCR API Gateway 연동 완료
- API Gateway Invoke URL 및 Secret Key 설정 완료
- 환경변수 설정: `CLOVA_OCR_API_URL`, `CLOVA_OCR_SECRET_KEY`
- `node-fetch@2` 패키지 추가 (form-data 호환성 문제 해결)

### ✅ 2. OCR 자동 채우기 기능 구현
- 이미지 업로드 시 자동으로 OCR 수행
- OCR 결과를 파싱하여 입력 필드에 자동 채우기
- OCR 실패 시에도 수동 입력 가능하도록 처리

### ✅ 3. 전적 검토 페이지 구현 (`/upload/review`)
- 업로드된 스크린샷 미리보기
- OCR 결과를 입력 필드에 자동 채우기
- 시즌, 게임 시간 수동 입력
- 친구 실명 매핑 (드롭다운)
- DB 저장 기능 완료

### ✅ 4. 데이터베이스 연동 완료
- Supabase Storage: 스크린샷 이미지 저장
- Supabase PostgreSQL: `matches`, `player_matches` 테이블에 데이터 저장
- RLS 정책 설정 완료

### ✅ 5. OCR 파싱 로직 기본 구현
- K/D/A 파싱: ✅ 정상 작동
- 팀 구분 (블루/레드): ✅ 정상 작동
- 승리 팀 판단: ✅ 정상 작동
- 닉네임 파싱: ⚠️ 개선 필요 (중복, 누락 문제)
- 챔피언명 파싱: ⚠️ 일부만 추출됨
- 딜량/골드/CS 파싱: ⚠️ 추출 안 됨

---

## 🔧 다음에 해야 할 작업

### 1. OCR 파싱 로직 개선 (우선순위: 높음)

**현재 문제점:**
- 닉네임이 중복되거나 누락되는 경우 발생
- 챔피언명이 일부만 추출됨
- 딜량, 골드, CS가 추출되지 않음
- 화질이 낮은 이미지에서 OCR 인식률 저하

**개선 방향:**
- OCR 텍스트 패턴을 더 정확하게 분석
- 정규표현식 패턴 개선
- 화질이 좋은 이미지로 테스트하여 패턴 확인
- 필요시 OCR API의 텍스트 블록 위치 정보 활용

**관련 파일:**
- `src/lib/ocr.ts` - `parseOCRResultToPlayers()` 함수
- `src/lib/ocr.ts` - `parseTeamPlayers()` 함수

---

### 2. 전적 검색/통계 페이지 구현 (우선순위: 높음)

**구현할 페이지:**
- `/search` 또는 `/friend/[id]` - 친구 이름으로 전적 검색
- 시즌별 탭 기능 (전체, 2024, 2025 등)
- 전체 승률 통계
- 챔피언별 승률 통계
- 친구 시너지 통계 (같은 팀일 때 승률)

**필요한 기능:**
- 친구 목록에서 친구 선택
- 선택한 친구의 전적 조회
- 시즌별 필터링
- 통계 계산 및 표시

**데이터베이스 쿼리:**
- `player_matches` 테이블에서 `friendId`로 조회
- `matches` 테이블과 조인하여 시즌별 필터링
- 승률 계산: `win = true`인 경기 수 / 전체 경기 수
- 챔피언별 승률: `championName`으로 그룹화
- 시너지 통계: 같은 `matchId`에서 같은 팀(`team`)인 친구들과의 승률

---

### 3. UI/UX 개선 (우선순위: 중간)

**개선 사항:**
- 전적 검색 페이지 디자인
- 통계 차트/그래프 표시 (선택사항)
- 반응형 디자인 확인
- 로딩 상태 표시 개선

---

### 4. 추가 기능 (우선순위: 낮음)

**추가할 수 있는 기능:**
- 전적 수정/삭제 기능
- 친구 정보 수정/삭제 기능
- 게임 시간 자동 추출 (OCR에서)
- 레인(라인) 정보 입력 및 통계

---

## 📝 현재 프로젝트 구조

```
web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── upload/
│   │   │       └── route.ts          # 이미지 업로드 및 OCR API
│   │   ├── friends/
│   │   │   └── page.tsx              # 친구 관리 페이지
│   │   ├── upload/
│   │   │   ├── page.tsx              # 이미지 업로드 페이지
│   │   │   └── review/
│   │   │       └── page.tsx          # 전적 검토 및 저장 페이지
│   │   └── page.tsx                  # 홈 페이지
│   ├── lib/
│   │   ├── ocr.ts                    # OCR API 연동 및 파싱 로직
│   │   └── supabaseClient.ts         # Supabase 클라이언트
│   └── types/
│       └── domain.ts                 # 타입 정의
├── supabase_schema.sql               # 데이터베이스 스키마
├── PROJECT_GUIDE.md                  # 프로젝트 가이드
└── DEVELOPMENT_STATUS.md             # 이 문서
```

---

## 🔑 환경변수 설정

`.env.local` 파일에 다음 환경변수가 설정되어 있어야 합니다:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=여기에_프로젝트_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_public_key

# CLOVA OCR
CLOVA_OCR_API_URL=https://057gvpp945.apigw.ntruss.com/custom/v1/50271/9f63fcdd31af176bb9d147bb0e488f2b198eef621c7ee0a1732e8d068e82ed37/general
CLOVA_OCR_SECRET_KEY=여기에_Secret_Key
```

---

## 🐛 알려진 이슈

1. **OCR 파싱 정확도**: 화질이 낮은 이미지에서 닉네임, 챔피언명 추출이 부정확함
2. **딜량/골드/CS 추출**: 현재 추출되지 않음 (파싱 로직 개선 필요)

---

## 📚 참고 자료

- **CLOVA OCR API 가이드**: https://guide-fin.ncloud-docs.com/docs/clovaocr-general
- **Supabase 문서**: https://supabase.com/docs
- **Next.js 문서**: https://nextjs.org/docs

---

## 💡 개발 팁

1. **OCR 파싱 개선 시**: 실제 OCR 텍스트를 로그로 출력하여 패턴을 확인하세요
2. **데이터베이스 쿼리**: Supabase SQL Editor에서 직접 쿼리를 테스트해보세요
3. **타입 안정성**: TypeScript 타입을 잘 정의하면 개발이 수월합니다

---

**마지막 업데이트**: 2026-02-13

