export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-950 text-zinc-50">
      <header className="w-full max-w-5xl px-6 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Deathmatch GG
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          친구들끼리만 보는 커스텀 게임 전적 사이트
        </p>
      </header>

      <main className="flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 pb-10">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-lg font-medium">빠른 이동</h2>
          <p className="mt-1 text-sm text-zinc-400">
            스크린샷을 업로드해서 전적을 기록하고, 친구 이름으로 검색해 보세요.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/upload"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-zinc-950 shadow-sm transition hover:bg-emerald-400"
            >
              전적 스크린샷 업로드
            </a>
            <a
              href="/friends"
              className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              친구 목록 관리
            </a>
            <a
              href="/search"
              className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              친구 이름으로 전적 검색
            </a>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h3 className="text-sm font-semibold">시즌별 전적</h3>
            <p className="mt-2 text-xs text-zinc-400">
              업로드 시 시즌을 같이 저장해서, 한 시즌 전체 승률과 챔피언
              승률을 한눈에 볼 수 있게 설계할 거예요.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h3 className="text-sm font-semibold">친구 시너지 분석</h3>
            <p className="mt-2 text-xs text-zinc-400">
              어떤 친구와 같은 팀일 때 승률이 높은지, 주 챔피언 조합이
              무엇인지까지 전부 계산할 수 있게 만들 예정입니다.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h3 className="text-sm font-semibold">OCR 검토 후 저장</h3>
            <p className="mt-2 text-xs text-zinc-400">
              스크린샷에서 읽어온 값은 모두 수정 가능하고, 친구 실명과 매핑한
              뒤에 &quot;저장&quot; 버튼을 누르면 최종 전적이 기록됩니다.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
