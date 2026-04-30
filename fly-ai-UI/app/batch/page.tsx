"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SkeletonCard = () => (
  <div
    style={{
      background: "#1e293b",
      borderRadius: "16px",
      padding: "16px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
      animation: "pulse 1.5s infinite",
    }}
  >
    <div style={{ width: "100%", height: "160px", background: "#334155", borderRadius: "12px", marginBottom: "10px" }} />
    <div style={{ height: "10px", background: "#334155", marginBottom: "6px", borderRadius: "6px" }} />
    <div style={{ height: "10px", background: "#334155", width: "60%", borderRadius: "6px" }} />
  </div>
);

export default function BatchPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [preview, setPreview] = useState<{ src: string | null }>({ src: null });

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const res = await fetch("/api/analysis");
        if (!res.ok) throw new Error("Failed to fetch analyses");

        const data = await res.json();
        setBatches(data?.batches || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
        padding: "40px",
      }}
    >
      <h1 style={{ color: "white", marginBottom: "20px" }}>
        Batch Results
      </h1>

      {batches.length === 0 ? (
        <p style={{ color: "#cbd5e1" }}>No analyses found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {batches.map((batch) => (
            <div key={batch.batchId}>
              <h2
                style={{
                  color: "#e2e8f0",
                  marginBottom: "12px",
                  fontSize: "18px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                {batch.batchId === "single"
                  ? "Single Uploads"
                  : `Batch ${batch.batchId.slice(0, 6)}`}
                {` (${batch.items.length})`}
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "20px",
                }}
              >
                {batch.items.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.resultJson?.overlay_path) {
                        setPreview({
                          src: `http://127.0.0.1:8000/${item.resultJson.overlay_path}`,
                        });
                      }
                    }}
                    style={{
                      background: "#1e293b",
                      padding: "16px",
                      borderRadius: "16px",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform =
                        "translateY(-4px) scale(1.02)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow =
                        "0 20px 40px rgba(0,0,0,0.35)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform =
                        "translateY(0) scale(1)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow =
                        "0 10px 25px rgba(0,0,0,0.25)";
                    }}
                  >
                    {item.resultJson?.overlay_path && (
                      <img
                        src={`http://127.0.0.1:8000/${item.resultJson.overlay_path}`}
                        alt="overlay"
                        style={{
                          width: "100%",
                          height: "160px",
                          objectFit: "cover",
                          borderRadius: "12px",
                          marginBottom: "12px",
                        }}
                      />
                    )}

                    <p style={{ color: "#cbd5e1", fontSize: "12px" }}>
                      ID: {item.analysisId?.slice(0, 8)}...
                    </p>

                    <p style={{ color: "#cbd5e1", marginBottom: "6px" }}>
                      Measurement: {item.measurement ?? "-"} mm
                    </p>

                    <div
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background:
                          item.reviewerStatus === "accepted"
                            ? "rgba(34,197,94,0.2)"
                            : item.reviewerStatus === "rejected"
                            ? "rgba(239,68,68,0.2)"
                            : "rgba(251,191,36,0.2)",
                        color:
                          item.reviewerStatus === "accepted"
                            ? "#22c55e"
                            : item.reviewerStatus === "rejected"
                            ? "#ef4444"
                            : "#fbbf24",
                        width: "fit-content",
                      }}
                    >
                      {item.reviewerStatus?.toUpperCase()}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const id =
                          item?.analysisId || item?.resultJson?.metadata?.analysis_id;
                        if (!id) return;
                        router.push(`/result?id=${id}`);
                      }}
                      style={{
                        marginTop: "10px",
                        padding: "6px 10px",
                        fontSize: "12px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#3b82f6",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      Open Result
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {preview.src && (
        <div
          onClick={() => setPreview({ src: null })}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <img
            src={preview.src}
            alt="preview"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: "12px",
            }}
          />
        </div>
      )}
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}