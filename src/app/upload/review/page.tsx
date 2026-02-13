"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Friend, TeamSide } from "@/types/domain";
import { supabase } from "@/lib/supabaseClient";

type EditablePlayer = {
  row: number;
  ingameNickname: string;
  championName: string;
  team: TeamSide;
  kills: string;
  deaths: string;
  assists: string;
  damage: string;
  gold: string;
  cs: string;
  win: boolean;
  friendId: string;
};

function createInitialRows(): EditablePlayer[] {
  const rows: EditablePlayer[] = [];
  for (let i = 0; i < 10; i += 1) {
    rows.push({
      row: i + 1,
      ingameNickname: "",
      championName: "",
      team: i < 5 ? "BLUE" : "RED",
      kills: "",
      deaths: "",
      assists: "",
      damage: "",
      gold: "",
      cs: "",
      win: i < 5, // 임시로 블루 팀 승리로 가정
      friendId: "",
    });
  }
  return rows;
}

export default function ReviewUploadPage() {
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get("imageUrl") ?? "";
  const ocrDataParam = searchParams.get("ocrData");

  const [friends, setFriends] = useState<Friend[]>([]);
  const [rows, setRows] = useState<EditablePlayer[]>(() => createInitialRows());
  const [season, setSeason] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMatchId, setSavedMatchId] = useState<string | null>(null);

  // OCR 데이터가 있으면 인풋창에 채워넣기
  useEffect(() => {
    if (ocrDataParam) {
      try {
        const parsed = JSON.parse(ocrDataParam);
        // eslint-disable-next-line no-console
        console.log("검토 페이지에서 받은 OCR 데이터:", parsed);
        if (Array.isArray(parsed) && parsed.length === 10) {
          setRows(
            parsed.map((p: any, index: number) => ({
              row: index + 1,
              ingameNickname: p.ingameNickname || "",
              championName: p.championName || "",
              team: p.team || (index < 5 ? "BLUE" : "RED"),
              kills: String(p.kills || ""),
              deaths: String(p.deaths || ""),
              assists: String(p.assists || ""),
              damage: String(p.damage || ""),
              gold: String(p.gold || ""),
              cs: String(p.cs || ""),
              win: p.win ?? index < 5,
              friendId: "",
            })),
          );
          // eslint-disable-next-line no-console
          console.log("인풋창에 OCR 데이터 채우기 완료");
        } else {
          // eslint-disable-next-line no-console
          console.warn("OCR 데이터 형식이 올바르지 않습니다:", parsed);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("OCR 데이터 파싱 실패:", err);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log("OCR 데이터가 없습니다. 수동 입력 모드입니다.");
    }
  }, [ocrDataParam]);

  useEffect(() => {
    const loadFriends = async () => {
      const { data, error: fetchError } = await supabase
        .from("friends")
        .select("*")
        .order("real_name", { ascending: true });

      if (fetchError) {
        // eslint-disable-next-line no-console
        console.error(fetchError);
        setError("친구 목록을 불러오는 중 오류가 발생했습니다.");
      } else if (data) {
        const mapped: Friend[] = data.map((row: any) => ({
          id: row.id,
          realName: row.real_name,
          memo: row.memo,
          createdAt: row.created_at,
        }));
        setFriends(mapped);
      }
    };

    loadFriends();
  }, []);

  const hasAnyData = useMemo(
    () =>
      rows.some(
        (r) =>
          r.ingameNickname.trim() ||
          r.championName.trim() ||
          r.kills ||
          r.deaths ||
          r.assists,
      ),
    [rows],
  );

  const handleRowChange = (
    index: number,
    field: keyof EditablePlayer,
    value: string | boolean,
  ) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSavedMatchId(null);

    try {
      const durationSeconds = durationMinutes
        ? Math.round(Number(durationMinutes) * 60)
        : 0;

      const { data: match, error: matchError } = await supabase
        .from("matches")
        .insert({
          duration_seconds: durationSeconds,
          season: season || null,
          screenshot_url: imageUrl || null,
        })
        .select("*")
        .single();

      if (matchError || !match) {
        throw matchError || new Error("경기 레코드 생성 실패");
      }

      const playerRows = rows
        .filter(
          (r) =>
            r.ingameNickname.trim() ||
            r.championName.trim() ||
            r.kills ||
            r.deaths ||
            r.assists,
        )
        .map((r) => ({
          match_id: match.id,
          friend_id: r.friendId || null,
          ingame_nickname: r.ingameNickname.trim() || "UNKNOWN",
          team: r.team,
          champion_name: r.championName.trim() || "UNKNOWN",
          kills: Number(r.kills || "0"),
          deaths: Number(r.deaths || "0"),
          assists: Number(r.assists || "0"),
          damage: r.damage ? Number(r.damage) : null,
          gold: r.gold ? Number(r.gold) : null,
          cs: r.cs ? Number(r.cs) : null,
          win: r.win,
        }));

      if (playerRows.length === 0) {
        throw new Error("최소 한 명 이상의 플레이어 정보를 입력해야 합니다.");
      }

      const { error: playersError } = await supabase
        .from("player_matches")
        .insert(playerRows);

      if (playersError) {
        throw playersError;
      }

      setSavedMatchId(match.id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError("전적을 저장하는 중 문제가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-950 text-zinc-50">
      <header className="w-full max-w-6xl px-6 py-6">
        <h1 className="text-xl font-semibold tracking-tight">
          업로드 결과 검토 & 전적 저장
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          스크린샷을 보면서 닉네임/스탯을 확인하고, 오른쪽에서 친구 실명과
          시즌을 지정한 뒤 DB에 저장할 수 있습니다. 지금은 OCR 없이 수동
          입력이지만, 나중에 OCR 결과를 여기에 미리 채워 넣을 예정입니다.
        </p>
      </header>

      <main className="flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pb-10 lg:flex-row">
        <section className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="text-sm font-semibold mb-3">원본 스크린샷 미리보기</h2>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="업로드한 경기 결과 스크린샷"
              className="max-h-[70vh] w-full rounded-xl object-contain border border-zinc-800 bg-black"
            />
          ) : (
            <p className="text-sm text-zinc-500">
              이미지 URL이 없습니다. 다시 업로드 페이지에서 시작해 주세요.
            </p>
          )}
        </section>

        <section className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="text-sm font-semibold">전적 데이터 입력</h2>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="mb-1 block text-[11px] text-zinc-300">
                시즌 (예: 2025)
              </label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-50 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-zinc-300">
                게임 시간 (분 단위, 예: 35)
              </label>
              <input
                type="number"
                min={0}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-50 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="mt-4 max-h-[52vh] overflow-auto rounded-xl border border-zinc-800">
            <table className="min-w-full text-[11px]">
              <thead className="bg-zinc-900/80 text-zinc-300">
                <tr>
                  <th className="px-2 py-1 text-left">#</th>
                  <th className="px-2 py-1 text-left">팀</th>
                  <th className="px-2 py-1 text-left">닉네임</th>
                  <th className="px-2 py-1 text-left">챔피언</th>
                  <th className="px-2 py-1 text-left">K</th>
                  <th className="px-2 py-1 text-left">D</th>
                  <th className="px-2 py-1 text-left">A</th>
                  <th className="px-2 py-1 text-left">딜량</th>
                  <th className="px-2 py-1 text-left">골드</th>
                  <th className="px-2 py-1 text-left">CS</th>
                  <th className="px-2 py-1 text-left">승리</th>
                  <th className="px-2 py-1 text-left">친구 실명</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.row}
                    className={
                      row.team === "BLUE"
                        ? "bg-sky-950/40"
                        : "bg-rose-950/40 border-t border-zinc-800"
                    }
                  >
                    <td className="px-2 py-1">{row.row}</td>
                    <td className="px-2 py-1 text-[10px]">
                      {row.team === "BLUE" ? "블루" : "레드"}
                    </td>
                    <td className="px-2 py-1">
                      <input
                        value={row.ingameNickname}
                        onChange={(e) =>
                          handleRowChange(index, "ingameNickname", e.target.value)
                        }
                        className="w-28 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-[11px] outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        value={row.championName}
                        onChange={(e) =>
                          handleRowChange(index, "championName", e.target.value)
                        }
                        className="w-24 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-[11px] outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={row.kills}
                        onChange={(e) =>
                          handleRowChange(index, "kills", e.target.value)
                        }
                        className="w-10 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-[11px] outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={row.deaths}
                        onChange={(e) =>
                          handleRowChange(index, "deaths", e.target.value)
                        }
                        className="w-10 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-[11px] outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={row.assists}
                        onChange={(e) =>
                          handleRowChange(index, "assists", e.target.value)
                        }
                        className="w-10 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-[11px] outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={row.damage}
                        onChange={(e) =>
                          handleRowChange(index, "damage", e.target.value)
                        }
                        className="w-16 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-[11px] outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={row.gold}
                        onChange={(e) =>
                          handleRowChange(index, "gold", e.target.value)
                        }
                        className="w-16 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-[11px] outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={row.cs}
                        onChange={(e) =>
                          handleRowChange(index, "cs", e.target.value)
                        }
                        className="w-14 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-[11px] outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="px-1 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={row.win}
                        onChange={(e) =>
                          handleRowChange(index, "win", e.target.checked)
                        }
                        className="h-3 w-3 rounded border-zinc-700 bg-zinc-900 text-emerald-500"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={row.friendId}
                        onChange={(e) =>
                          handleRowChange(index, "friendId", e.target.value)
                        }
                        className="w-28 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-[11px] outline-none focus:border-emerald-500"
                      >
                        <option value="">(우리 친구 아님)</option>
                        {friends.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.realName}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {error && <p className="text-xs text-red-400">{error}</p>}
            {savedMatchId && (
              <p className="text-xs text-emerald-400">
                전적을 저장했습니다! (match id: {savedMatchId})
              </p>
            )}
            {!hasAnyData && (
              <p className="text-[11px] text-zinc-500">
                최소 한 명 이상은 닉네임 또는 K/D/A를 입력해야 저장할 수
                있습니다.
              </p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasAnyData}
              className="mt-1 inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-zinc-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "저장 중..." : "이 전적을 DB에 저장"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}


