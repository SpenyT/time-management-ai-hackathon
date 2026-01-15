import { useEffect, useState } from "react";
import { type PostResponse } from "@/types/apiResponses";
import { fetchPost} from "@/utils/asyncRequest";

type Status = "idle" | "loading" | "success" | "error";

export default function HomePage() {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<PostResponse | null>(null);
  const [error, setError] = useState<string>("");

  async function runRequest() {
    setStatus("loading");
    setError("");
    setData(null);

    try {
      const result = await fetchPost(1);
      setData(result);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setStatus("error");
    }
  }

  useEffect(() => {
    runRequest();
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-950 text-white p-6">
      <h1 className="text-3xl font-bold">Hello World</h1>

      {/* Loading */}
      {status === "loading" && (
        <div className="flex items-center gap-3 text-slate-300">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
          Loading...
        </div>
      )}

      {/* Success */}
      {status === "success" && data && (
        <div className="text-green-400 text-center">
          <p className="font-semibold">Request successful</p>
          <p className="text-sm mt-1">{data.title}</p>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="text-red-400 text-center">
          <p className="font-semibold">Request failed</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Retry */}
      <button
        onClick={runRequest}
        disabled={status === "loading"}
        className="rounded-lg border border-slate-700 px-4 py-2 text-sm
                   hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Retry
      </button>
    </main>
  );
}