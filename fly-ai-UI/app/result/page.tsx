"use client";

import Link from "next/link";
import { useImage } from "../context/ImageContext";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ResultPage() {
  const { image, result } = useImage();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [fetchedResult, setFetchedResult] = useState<any>(null);
  const [p8, setP8] = useState((result || fetchedResult)?.point_8);
  const [p13, setP13] = useState((result || fetchedResult)?.point_13);
  const [liveMeasurement, setLiveMeasurement] = useState<number | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  const [improvement, setImprovement] = useState<"better" | "worse" | null>(null);
  const [snapping, setSnapping] = useState(false);
  const activeData = result || fetchedResult;
  const width = activeData?.metadata?.width || 800;
  const height = activeData?.metadata?.height || 600;

  const [dragging, setDragging] = useState<"p8" | "p13" | null>(null);
  const [hovered, setHovered] = useState<"p8" | "p13" | null>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [autoSaving, setAutoSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Overlay refresh key
  const [overlayKey, setOverlayKey] = useState(0);
  // Overlay image src for smooth transition
  const [overlaySrc, setOverlaySrc] = useState<string | null>(null);
  useEffect(() => {
    const activeResult = result || fetchedResult;
    if (!activeResult?.overlay_path) return;

    const newSrc = `http://127.0.0.1:8000/${activeResult.overlay_path}?t=${overlayKey}`;
    const img = new window.Image();

    img.onload = () => {
      setOverlaySrc(newSrc);
    };

    img.src = newSrc;
  }, [overlayKey, (result || fetchedResult)?.overlay_path]);

  // Ensure p8 and p13 are initialized after fetch
  useEffect(() => {
    const active = result || fetchedResult;
    if (active?.point_8 && active?.point_13) {
      setP8(active.point_8);
      setP13(active.point_13);
    }
  }, [result, fetchedResult]);

  // Track last saved points to avoid unnecessary auto-save API calls
  const [lastSaved, setLastSaved] = useState<{ p8: any; p13: any } | null>(null);

  const ppm = (result || fetchedResult)?.measurement?.pixels_per_mm || 1;

  const derivedMeasurement = (() => {
    if (p8 && p13) {
      const dx = p8.x - p13.x;
      const dy = p8.y - p13.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      return distPx / ppm;
    }
    return (result || fetchedResult)?.measurement?.length_mm ?? null;
  })();

  // Fetch saved result if no context but id param exists
  useEffect(() => {
    if (result) return; // already have fresh result
    if (!id) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/analysis?id=${id}`);
        const data = await res.json();

        const analysis = data?.analysis;

        if (Array.isArray(analysis)) {
          const first = analysis[0];
          setFetchedResult(first?.resultJson || first || null);
        } else {
          setFetchedResult(analysis?.resultJson || analysis || data || null);
        }
      } catch (e) {
        console.error("Failed to fetch saved result");
      }
    };

    fetchData();
  }, [id, result]);

  useEffect(() => {
    const activeResult = result || fetchedResult;
    if (!p8 || !p13 || !activeResult?.metadata?.analysis_id) return;

    // Avoid unnecessary auto-save if points haven't changed
    if (
      lastSaved &&
      p8 && p13 &&
      lastSaved.p8?.x === p8.x &&
      lastSaved.p8?.y === p8.y &&
      lastSaved.p13?.x === p13.x &&
      lastSaved.p13?.y === p13.y
    ) {
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setAutoSaving(true);
        setSaveStatus("saving");

        // 1. Sync with FastAPI (keeps overlay + backend consistent)
        await fetch(`http://127.0.0.1:8000/review/${activeResult?.metadata?.analysis_id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            point_8: {
              x: p8.x,
              y: p8.y,
              confidence: p8?.confidence ?? 1,
            },
            point_13: {
              x: p13.x,
              y: p13.y,
              confidence: p13?.confidence ?? 1,
            },
            reviewer: "auto",
            decision: "pending",
            comment: "auto-save",
          }),
        });

        // 2. Sync with Prisma DB
        await fetch("/api/analysis", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysisId: activeResult?.metadata?.analysis_id,
            reviewerStatus: "pending",
            measurement: derivedMeasurement,
            point_8: {
              x: p8.x,
              y: p8.y,
              confidence: p8?.confidence ?? 1,
            },
            point_13: {
              x: p13.x,
              y: p13.y,
              confidence: p13?.confidence ?? 1,
            },
          }),
        });
        // Trigger overlay refresh
        setOverlayKey((prev) => prev + 1);
        // Update last saved points after successful save
        setLastSaved({ p8, p13 });
      } catch (e) {
        setSaveStatus("error");
        console.error("Auto-save failed");
      } finally {
        setAutoSaving(false);
        if (saveStatus !== "error") {
          setSaveStatus("saved");
        }
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [p8, p13, result, fetchedResult]);

  const handleDrag = (e: any) => {
    if (!dragging) return;
    setSnapping(false);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;
    setCursor({ x: e.clientX, y: e.clientY });

    const activeResult = result || fetchedResult;
    const snapThreshold = 10;
    const aiP8 = activeResult?.point_8;
    const aiP13 = activeResult?.point_13;

    let snapX = x;
    let snapY = y;
    let snapped = false;

    if (dragging === "p8" && aiP8) {
      if (Math.abs(x - aiP8.x) < snapThreshold) {
        snapX = aiP8.x;
        setSnapping(true);
        snapped = true;
      }
      if (Math.abs(y - aiP8.y) < snapThreshold) {
        snapY = aiP8.y;
        setSnapping(true);
        snapped = true;
      }
    }

    if (dragging === "p13" && aiP13) {
      if (Math.abs(x - aiP13.x) < snapThreshold) {
        snapX = aiP13.x;
        setSnapping(true);
        snapped = true;
      }
      if (Math.abs(y - aiP13.y) < snapThreshold) {
        snapY = aiP13.y;
        setSnapping(true);
        snapped = true;
      }
    }

    // --- Smart line snapping ---
    const lineSnapThreshold = 12;
    if (aiP8 && aiP13) {
      const dx = aiP13.x - aiP8.x;
      const dy = aiP13.y - aiP8.y;
      const lengthSq = dx * dx + dy * dy;

      if (lengthSq > 0) {
        const t = ((snapX - aiP8.x) * dx + (snapY - aiP8.y) * dy) / lengthSq;
        const projX = aiP8.x + t * dx;
        const projY = aiP8.y + t * dy;

        const dist = Math.sqrt((snapX - projX) ** 2 + (snapY - projY) ** 2);

        if (dist < lineSnapThreshold) {
          snapX = projX;
          snapY = projY;
          setSnapping(true);
        } else {
          setSnapping(false);
        }
      }
    }

    if (dragging === "p8") {
      const newP8 = { ...p8, x: snapX, y: snapY };
      setP8(newP8);

      if (p13) {
        const dx = newP8.x - p13.x;
        const dy = newP8.y - p13.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const ppmVal = activeResult?.measurement?.pixels_per_mm || 1;
        const distMm = distPx / ppmVal;
        setLiveMeasurement(distMm);
        const aiLength = activeResult?.measurement?.length_mm;
        if (aiLength !== undefined) {
          const d = distMm - aiLength;
          setDelta(d);
          if (Math.abs(d) < 0.001) {
            setImprovement(null);
          } else {
            setImprovement(d < 0 ? "better" : "worse");
          }
        }
      }
    } else if (dragging === "p13") {
      const newP13 = { ...p13, x: snapX, y: snapY };
      setP13(newP13);

      if (p8) {
        const dx = p8.x - newP13.x;
        const dy = p8.y - newP13.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const ppmVal = activeResult?.measurement?.pixels_per_mm || 1;
        const distMm = distPx / ppmVal;
        setLiveMeasurement(distMm);
        const aiLength = activeResult?.measurement?.length_mm;
        if (aiLength !== undefined) {
          const d = distMm - aiLength;
          setDelta(d);
          if (Math.abs(d) < 0.001) {
            setImprovement(null);
          } else {
            setImprovement(d < 0 ? "better" : "worse");
          }
        }
      }
    }
  };

  const activeResult = result || fetchedResult;
  const measurements = activeResult
    ? [
        {
          trait: "Wing L3 Length (AI mm)",
          value: activeResult.measurement?.length_mm,
          confidence: p8?.confidence,
        },
        {
          trait: "Wing L3 Length (Adjusted mm)",
          value: derivedMeasurement,
          confidence: p8?.confidence,
        },
        {
          trait: "Difference (Δ mm)",
          value:
            derivedMeasurement !== null && activeResult.measurement?.length_mm !== undefined
              ? (derivedMeasurement - activeResult.measurement.length_mm)
              : null,
          confidence: "-",
        },
        {
          trait: "Wing L3 Length (px)",
          value: activeResult.measurement?.length_px,
          confidence: p13?.confidence,
        },
      ]
    : [];

  // Unified active result for rendering and fallback loading
  const active = result || fetchedResult;
  if (!active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-10">
        <div className="w-[900px] max-w-full bg-slate-800 rounded-2xl p-10 animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-6"></div>
          <div className="h-[300px] bg-slate-700 rounded-xl mb-6"></div>
          <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6 mb-2"></div>
          <div className="h-4 bg-slate-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-10">
      <div className="w-[900px] max-w-full bg-slate-800 rounded-2xl p-10 shadow-2xl flex flex-col items-center">
        <h1 className="text-3xl text-white mb-8 font-semibold">
          Analysis Result
        </h1>

        {/* Annotated Image Area */}
        <div className="w-full h-[300px] rounded-xl border-2 border-dashed border-slate-600 mb-8 bg-slate-900 shadow-lg text-slate-400 relative overflow-hidden">
          {image || active?.overlay_path || active?.metadata?.saved_filename ? (
            <>
              <img
                src={
                  image ||
                  (active?.overlay_path
                    ? `http://127.0.0.1:8000/${active.overlay_path}`
                    : active?.metadata?.saved_filename
                    ? `http://127.0.0.1:8000/${active.metadata.saved_filename}`
                    : "")
                }
                alt="uploaded"
                className="w-full h-full object-contain rounded-xl"
              />

              {p8 && p13 && (
                <>
                  <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="absolute top-0 left-0 w-full h-full"
                    onMouseMove={handleDrag}
                    onMouseUp={() => {
                      setDragging(null);
                      setDelta(null);
                      setImprovement(null);
                      setSnapping(false);
                    }}
                    onMouseLeave={() => {
                      setDragging(null);
                      setDelta(null);
                      setImprovement(null);
                      setSnapping(false);
                    }}
                    style={{ cursor: dragging ? "grabbing" : "default", transition: "all 0.05s linear" }}
                  >
                    {/* AI baseline (faded) */}
                    <line
                      x1={active?.point_8?.x}
                      y1={active?.point_8?.y}
                      x2={active?.point_13?.x}
                      y2={active?.point_13?.y}
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="6,6"
                      opacity="0.6"
                    />

                    {/* Adjusted line (active) */}
                    <line
                      x1={p8.x}
                      y1={p8.y}
                      x2={p13.x}
                      y2={p13.y}
                      stroke={
                        improvement === "better"
                          ? "#22c55e"
                          : improvement === "worse"
                          ? "#ef4444"
                          : "#ef4444"
                      }
                      strokeWidth="4"
                      style={{
                        transition: "all 0.1s linear",
                        filter: dragging ? "drop-shadow(0 0 4px rgba(239,68,68,0.7))" : "none",
                      }}
                    />

                    <circle
                      cx={p8.x}
                      cy={p8.y}
                      r={hovered === "p8" || dragging === "p8" ? 10 : 8}
                      fill="#facc15"
                      stroke="#000"
                      strokeWidth="1.5"
                      style={{
                        cursor: dragging === "p8" ? "grabbing" : "grab",
                        transition: "all 0.15s ease",
                        filter:
                          hovered === "p8" || dragging === "p8"
                            ? "drop-shadow(0 0 6px rgba(250,204,21,0.8))"
                            : "none",
                      }}
                      onMouseEnter={() => setHovered("p8")}
                      onMouseLeave={() => setHovered(null)}
                      onMouseDown={() => setDragging("p8")}
                    />

                    <circle
                      cx={p13.x}
                      cy={p13.y}
                      r={hovered === "p13" || dragging === "p13" ? 10 : 8}
                      fill="#facc15"
                      stroke="#000"
                      strokeWidth="1.5"
                      style={{
                        cursor: dragging === "p13" ? "grabbing" : "grab",
                        transition: "all 0.15s ease",
                        filter:
                          hovered === "p13" || dragging === "p13"
                            ? "drop-shadow(0 0 6px rgba(250,204,21,0.8))"
                            : "none",
                      }}
                      onMouseEnter={() => setHovered("p13")}
                      onMouseLeave={() => setHovered(null)}
                      onMouseDown={() => setDragging("p13")}
                    />
                  </svg>
                  {snapping && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "rgba(34,197,94,0.2)",
                        color: "#22c55e",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        border: "1px solid rgba(34,197,94,0.5)",
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      SNAP
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full">No Image</div>
          )}
        </div>

        {active?.overlay_path && (
          <div className="w-full mt-4">
            <p className="text-slate-300 mb-2">AI Overlay</p>
            <img
              src={overlaySrc || `http://127.0.0.1:8000/${active.overlay_path}`}
              alt="overlay"
              className="w-full rounded-xl shadow-lg"
              style={{ opacity: overlaySrc ? 1 : 0.5, transition: "opacity 0.4s ease" }}
            />
          </div>
        )}

        {active?.error && (
          <div className="w-full mb-4 p-3 rounded-lg bg-red-900 text-red-200 border border-red-700">
            <strong>Error:</strong> {active.error}
            {active.details && (
              <div className="text-xs mt-1 opacity-80">{active.details}</div>
            )}
          </div>
        )}

        {/* Measurements Table */}
        <h2 className="text-slate-100 mb-4 text-xl">Measurements</h2>

        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="text-slate-300">
              <th className="border-b border-slate-600 p-3 text-left">Trait</th>
              <th className="border-b border-slate-600 p-3 text-left">Value</th>
              <th className="border-b border-slate-600 p-3 text-left">Confidence</th>
            </tr>
          </thead>

          <tbody>
            {measurements.length > 0 ? (
              measurements.map((m, index) => (
                <tr
                  key={index}
                  className={`text-slate-100 ${
                    m.trait.includes("Difference")
                      ? (m.value ?? 0) > 0
                        ? "text-green-400"
                        : "text-red-400"
                      : ""
                  }`}
                >
                  <td className="p-3 border-b border-slate-700">{m.trait}</td>
                  <td className="p-3 border-b border-slate-700">{typeof m.value === "number" ? m.value.toFixed(3) : m.value ?? "-"}</td>
                  <td className="p-3 border-b border-slate-700">
                    {typeof m.confidence === "number" ? m.confidence.toFixed(2) : m.confidence ?? "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="p-4 text-center text-slate-400">
                  No measurements available. Run analysis from dashboard.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Metadata */}
        <div className="w-full text-slate-300 mb-6 space-y-1">
          <p><strong>Analysis ID:</strong> {active?.metadata?.analysis_id}</p>
          <p><strong>File:</strong> {active?.metadata?.original_filename}</p>
          <p><strong>Resolution:</strong> {active?.metadata?.width} x {active?.metadata?.height}</p>
          <p><strong>Model Version:</strong> {active?.metadata?.model_version}</p>
          <p><strong>Task:</strong> {active?.metadata?.task}</p>
          <p><strong>Method:</strong> {active?.metadata?.method}</p>
          <p><strong>Pixels/mm:</strong> {active?.measurement?.pixels_per_mm}</p>
        </div>

        {/* Export Section */}
        <div className="w-full flex gap-3 mb-6">
          <button
            onClick={() => {
              window.open(`http://127.0.0.1:8000/export/${active?.metadata?.analysis_id}?format=json`, "_blank");
            }}
            className="flex-1 py-2 bg-blue-600 rounded-lg text-white"
          >
            Export JSON
          </button>

          <button
            onClick={() => {
              window.open(`http://127.0.0.1:8000/export/${active?.metadata?.analysis_id}?format=csv`, "_blank");
            }}
            className="flex-1 py-2 bg-indigo-600 rounded-lg text-white"
          >
            Export CSV
          </button>

          <button
            onClick={() => {
              window.open(`http://127.0.0.1:8000/${active?.overlay_path}`, "_blank");
            }}
            className="flex-1 py-2 bg-purple-600 rounded-lg text-white"
          >
            Download Image
          </button>
        </div>

        {/* Human-in-loop actions */}
        <div className="w-full flex gap-3 mb-6">
          <button
            onClick={async () => {
              try {
                const res = await fetch(
                  `http://127.0.0.1:8000/review/${active?.metadata?.analysis_id}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      point_8: {
                        x: p8?.x,
                        y: p8?.y,
                        confidence: p8?.confidence ?? 1,
                      },
                      point_13: {
                        x: p13?.x,
                        y: p13?.y,
                        confidence: p13?.confidence ?? 1,
                      },
                      reviewer: "user",
                      decision: "accepted",
                      comment: "",
                    }),
                  }
                );

                await res.json();

                // Sync with Prisma DB
                await fetch("/api/analysis", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    analysisId: active?.metadata?.analysis_id,
                    reviewerStatus: "accepted",
                    measurement: derivedMeasurement,
                    point_8: {
                      x: p8?.x,
                      y: p8?.y,
                      confidence: p8?.confidence ?? 1,
                    },
                    point_13: {
                      x: p13?.x,
                      y: p13?.y,
                      confidence: p13?.confidence ?? 1,
                    },
                  }),
                });
                // Trigger overlay refresh
                setOverlayKey((prev) => prev + 1);
                alert("Saved successfully");
              } catch (err) {
                alert("Failed to save");
              }
            }}
            className="flex-1 py-2 bg-green-600 rounded-lg text-white"
          >
            Accept & Save
          </button>

          <button
            onClick={async () => {
              try {
                const res = await fetch(
                  `http://127.0.0.1:8000/review/${active?.metadata?.analysis_id}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      point_8: {
                        x: p8?.x,
                        y: p8?.y,
                        confidence: p8?.confidence ?? 1,
                      },
                      point_13: {
                        x: p13?.x,
                        y: p13?.y,
                        confidence: p13?.confidence ?? 1,
                      },
                      reviewer: "user",
                      decision: "rejected",
                      comment: "",
                    }),
                  }
                );

                await res.json();

                // Sync with Prisma DB
                await fetch("/api/analysis", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    analysisId: active?.metadata?.analysis_id,
                    reviewerStatus: "rejected",
                    measurement: derivedMeasurement,
                    point_8: {
                      x: p8?.x,
                      y: p8?.y,
                      confidence: p8?.confidence ?? 1,
                    },
                    point_13: {
                      x: p13?.x,
                      y: p13?.y,
                      confidence: p13?.confidence ?? 1,
                    },
                  }),
                });
                // Trigger overlay refresh
                setOverlayKey((prev) => prev + 1);
                alert("Marked as rejected");
              } catch (err) {
                alert("Failed to reject");
              }
            }}
            className="flex-1 py-2 bg-red-600 rounded-lg text-white"
          >
            Reject
          </button>
        </div>

        <p className="text-xs mt-2">
          {saveStatus === "saving" && <span className="text-slate-400">Saving...</span>}
          {saveStatus === "saved" && <span className="text-green-400">Saved</span>}
          {saveStatus === "error" && <span className="text-red-400">Save failed</span>}
        </p>

        {/* Floating tooltip */}
        {dragging && liveMeasurement !== null && (
          <div
            style={{
              position: "fixed",
              top: cursor.y + 12,
              left: cursor.x + 12,
              background: "rgba(0,0,0,0.85)",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              pointerEvents: "none",
              zIndex: 1000,
              backdropFilter: "blur(8px)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
              transform: "translateY(-2px)",
              transition: "all 0.1s ease",
            }}
          >
            <div>{liveMeasurement.toFixed(3)} mm</div>
            <div
              style={{
                fontSize: "10px",
                opacity: 0.9,
                color:
                  improvement === "better"
                    ? "#22c55e"
                    : improvement === "worse"
                    ? "#ef4444"
                    : "#94a3b8",
              }}
            >
              Δ {delta !== null ? delta.toFixed(3) : "-"} mm
            </div>
            <div
              style={{
                marginTop: 4,
                height: 4,
                width: 60,
                background: "rgba(255,255,255,0.1)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(Math.abs(delta ?? 0) * 50, 100)}%`,
                  background:
                    improvement === "better"
                      ? "#22c55e"
                      : improvement === "worse"
                      ? "#ef4444"
                      : "#94a3b8",
                  transition: "width 0.1s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* Back Button */}
        <Link href="/dashboard" className="w-full">
          <button className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors">
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}