"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useImage } from "../context/ImageContext";

export default function DashboardPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { setImage, setResult } = useImage();
  const router = useRouter();

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const res = await fetch("/api/analysis");
        if (!res.ok) return;
        const data = await res.json();
        setAnalyses(data.analyses || []);
      } catch (err) {
        console.error("Failed to fetch analyses", err);
      }
    };

    fetchAnalyses();
  }, []);

  const handleAnalyze = async () => {
    if (files.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    try {
      setIsProcessing(true);

      // 🔥 SINGLE IMAGE FLOW
      if (files.length === 1) {
        const formData = new FormData();
        formData.append("file", files[0]);

        const res = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          alert(errorData.error || "Analysis failed");
          setIsProcessing(false);
          return;
        }

        const data = await res.json();

        // store result + image in context
        setResult(data);
        // optionally set image if available
        if (files[0]) {
          const imageUrl = URL.createObjectURL(files[0]);
          setImage(imageUrl);
        }
        router.push("/result");
        setIsProcessing(false);
        return;
      }

      // 🔥 BATCH FLOW
      const formData = new FormData();
      files.forEach((f) => {
        formData.append("files", f);
      });

      const res = await fetch("/api/analyze-batch", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Batch analysis failed");
        setIsProcessing(false);
        return;
      }

      await res.json();

      setIsProcessing(false);

      // ✅ redirect to batch viewer
      router.push("/batch");

    } catch (error) {
      console.error("Analysis failed:", error);
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          width: "800px",
          maxWidth: "100%",
          background: "#1e293b",
          borderRadius: "20px",
          padding: "40px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "32px", marginBottom: "30px", color: "white" }}>
          Fly AI Dashboard
        </h1>
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
          <button
            onClick={() => router.push("/batch")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              background: "#22c55e",
              color: "white",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            View Batch Results
          </button>
        </div>

        <input
          type="file"
          accept=".tiff,.png,.jpg,.jpeg"
          multiple
          onChange={(e) => {
            if (e.target.files) {
              const selectedFiles = Array.from(e.target.files);
              setFiles(selectedFiles);

              // set preview of first image only
              const imageUrl = URL.createObjectURL(selectedFiles[0]);
              setImage(imageUrl);
            }
          }}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #334155",
            background: "#0f172a",
            color: "#f8fafc",
            marginBottom: "20px",
          }}
        />

        {files.length > 0 && (
          <div style={{ marginTop: "20px", width: "100%", textAlign: "center" }}>
            <p style={{ color: "#cbd5e1" }}>Preview:</p>
            <img
              src={URL.createObjectURL(files[0])}
              alt="preview"
              style={{ maxWidth: "100%", borderRadius: "12px" }}
            />
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={isProcessing}
          style={{
            marginTop: "30px",
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: isProcessing ? "#64748b" : "#3b82f6",
            color: "white",
            fontWeight: 600,
            cursor: isProcessing ? "not-allowed" : "pointer",
          }}
        >
          {isProcessing
            ? `Processing ${files.length} file${files.length > 1 ? "s" : ""}...`
            : "Run Analysis"}
        </button>

        {isProcessing && (
          <p style={{ color: "#cbd5e1", marginTop: "10px" }}>
            Please wait while we analyze your images...
          </p>
        )}

        {analyses.length > 0 && (
          <div
            style={{
              marginTop: "40px",
              width: "100%",
              background: "#0f172a",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <h2 style={{ color: "white", marginBottom: "15px" }}>
              Recent Analyses
            </h2>

            {analyses.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #334155",
                  color: "#cbd5e1",
                  cursor: "pointer",
                }}
                onClick={() => {
                  router.push(`/result?id=${item.analysisId}`);
                }}
              >
                <p>ID: {item.id.slice(0, 8)}...</p>

                <p>Date: {new Date(item.createdAt).toLocaleString()}</p>

                <p>
                  Measurement: {item.measurement ?? "-"} mm
                </p>

                <p>
                  Status: {" "}
                  <span
                    style={{
                      color:
                        item.reviewerStatus === "accepted"
                          ? "lightgreen"
                          : item.reviewerStatus === "rejected"
                          ? "red"
                          : "orange",
                      fontWeight: "bold",
                    }}
                  >
                    {item.reviewerStatus}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}