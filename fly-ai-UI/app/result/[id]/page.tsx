"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

export default function ResultByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/analysis?id=${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch analysis");
        }
        const data = await res.json();
        setResult(data?.analysis?.resultJson);
      } catch (err) {
        console.error("Failed to load result", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <div style={{ padding: 40, color: "white" }}>Loading...</div>;
  }

  if (!result) {
    return <div style={{ padding: 40, color: "white" }}>No result found</div>;
  }

  const p8 = result.point_8;
  const p13 = result.point_13;

  const width = result?.metadata?.width || 800;
  const height = result?.metadata?.height || 600;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
      }}
    >
      <div style={{ width: "900px", maxWidth: "100%" }}>
        <h1 style={{ color: "white", marginBottom: 20 }}>
          Saved Analysis
        </h1>

        <div style={{ position: "relative" }}>
          {(result?.overlay_path || result?.metadata?.saved_filename) && (
          <img
            src={result?.overlay_path
              ? `http://127.0.0.1:8000/${result.overlay_path}`
              : `http://127.0.0.1:8000/uploads/${result.metadata.saved_filename}`}
            alt="overlay"
            style={{ width: "100%", borderRadius: "12px" }}
          />
        )}

          {p8 && p13 && (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              <line
                x1={p8.x}
                y1={p8.y}
                x2={p13.x}
                y2={p13.y}
                stroke="red"
                strokeWidth="3"
              />

              <circle cx={p8.x} cy={p8.y} r="5" fill="yellow" />
              <circle cx={p13.x} cy={p13.y} r="5" fill="yellow" />
            </svg>
          )}
        </div>

        <div style={{ marginTop: 20, color: "white" }}>
          <p>
            Measurement: {result?.measurement?.length_mm ? result.measurement.length_mm.toFixed(3) : "-"} mm
          </p>
          <p>Status: {result?.reviewer_status}</p>
        </div>

        <Link href="/dashboard">
          <button
            style={{
              marginTop: 20,
              padding: "10px 20px",
              background: "#3b82f6",
              color: "white",
              borderRadius: "8px",
            }}
          >
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
