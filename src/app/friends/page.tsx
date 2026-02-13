"use client";

import { useState } from "react";

interface FriendForm {
  realName: string;
  memo: string;
}

export default function FriendsPage() {
  const [form, setForm] = useState<FriendForm>({ realName: "", memo: "" });

  // TODO: 실제 Supabase와 연동해서 친구 목록을 불러오고 저장하도록 수정
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 임시: 콘솔에만 출력
    // eslint-disable-next-line no-console
    console.log("새 친구 등록 (임시)", form);
    setForm({ realName: "", memo: "" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-950 text-zinc-50">
      <header className="w-full max-w-3xl px-6 py-6">
        <h1 className="text-xl font-semibold tracking-tight">친구 관리</h1>
        <p className="mt-2 text-sm text-zinc-400">
          여기서 우리 친구들 실명을 미리 등록해 두고, 업로드할 때 매칭해서
          사용할 수 있게 할 거예요.
        </p>
      </header>

      <main className="flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 pb-10">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-sm font-semibold">새 친구 추가</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300">
                실명
              </label>
              <input
                type="text"
                value={form.realName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, realName: e.target.value }))
                }
                required
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none ring-0 transition placeholder:text-zinc-500 focus:border-emerald-500"
                placeholder="예: 민수"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300">
                메모 (선택)
              </label>
              <input
                type="text"
                value={form.memo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, memo: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none ring-0 transition placeholder:text-zinc-500 focus:border-emerald-500"
                placeholder="예: 탑 장인, 디코 닉 등"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-zinc-950 shadow-sm transition hover:bg-emerald-400"
            >
              친구 추가 (임시)
            </button>
            <p className="mt-2 text-xs text-zinc-500">
              지금은 UI만 만든 상태고, 다음 단계에서 Supabase DB와 실제로 연결할
              예정입니다.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}


