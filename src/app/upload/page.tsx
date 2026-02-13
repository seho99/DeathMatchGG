"use client";

import { useState } from "react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("업로드에 실패했습니다.");
      }

      // TODO: OCR 결과와 검토용 폼 페이지로 이동하도록 수정
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError("업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-950 text-zinc-50">
      <header className="w-full max-w-3xl px-6 py-6">
        <h1 className="text-xl font-semibold tracking-tight">전적 업로드</h1>
        <p className="mt-2 text-sm text-zinc-400">
          롤 게임 결과 화면 스크린샷을 업로드하면, OCR로 내용을 읽어와서
          검토할 수 있게 만들 거예요.
        </p>
      </header>

      <main className="flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 pb-10">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
        >
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              경기 결과 스크린샷
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                setFile(selected);
                setStatus("idle");
                setError(null);
              }}
              className="block w-full text-sm text-zinc-200 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-950 hover:file:bg-emerald-400"
            />
            <p className="text-xs text-zinc-500">
              가능한 한 원본 해상도 그대로의 이미지를 올려주세요. (자르지 않는
              게 인식률이 더 좋아요)
            </p>
          </div>

          <button
            type="submit"
            disabled={!file || status === "uploading"}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-zinc-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "uploading" ? "업로드 중..." : "업로드 하기"}
          </button>

          {status === "success" && (
            <p className="mt-3 text-sm text-emerald-400">
              업로드를 완료했습니다. (이후 단계에서 OCR 결과 검토 화면으로
              연결할 예정)
            </p>
          )}
          {status === "error" && error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}
        </form>
      </main>
    </div>
  );
}


