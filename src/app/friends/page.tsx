"use client";

import { useEffect, useState } from "react";
import type { Friend } from "@/types/domain";
import { supabase } from "@/lib/supabaseClient";

interface FriendForm {
  realName: string;
  memo: string;
}

export default function FriendsPage() {
  const [form, setForm] = useState<FriendForm>({ realName: "", memo: "" });
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFriends = async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("friends")
        .select("*")
        .order("created_at", { ascending: true });

      if (fetchError) {
        // eslint-disable-next-line no-console
        console.error(fetchError);
        setError("친구 목록을 불러오는 중 문제가 발생했습니다.");
      } else if (data) {
        const mapped: Friend[] = data.map((row: any) => ({
          id: row.id,
          realName: row.real_name,
          memo: row.memo,
          createdAt: row.created_at,
        }));
        setFriends(mapped);
      }
      setLoading(false);
    };

    loadFriends();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.realName.trim()) return;

    setLoading(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("friends")
      .insert({
        real_name: form.realName.trim(),
        memo: form.memo.trim() || null,
      })
      .select("*")
      .single();

    if (insertError) {
      // eslint-disable-next-line no-console
      console.error(insertError);
      setError("친구를 저장하는 중 문제가 발생했습니다.");
    } else if (data) {
      const newFriend: Friend = {
        id: data.id,
        realName: data.real_name,
        memo: data.memo,
        createdAt: data.created_at,
      };
      setFriends((prev) => [...prev, newFriend]);
      setForm({ realName: "", memo: "" });
    }

    setLoading(false);
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
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-zinc-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "저장 중..." : "친구 추가"}
            </button>
            {error && (
              <p className="mt-2 text-xs text-red-400">
                {error}
              </p>
            )}
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-sm font-semibold">등록된 친구 목록</h2>
          {friends.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">
              아직 등록된 친구가 없습니다. 위 폼에서 실명을 추가해 주세요.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-800 text-sm">
              {friends.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="font-medium">{f.realName}</p>
                    {f.memo && (
                      <p className="text-xs text-zinc-400">{f.memo}</p>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    {new Date(f.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

