"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!res?.error) {
      router.push("/dashboard");
    } else {
      alert("Login failed: " + res.error);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
        padding: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "900px",
          maxWidth: "100%",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Left Panel */}
        <div
          style={{
            flex: 1,
            background: "linear-gradient(160deg, #1e40af, #3b82f6)",
            color: "white",
            padding: "50px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>
            Fly AI
          </h1>
          <p style={{ fontSize: "18px", lineHeight: "1.6" }}>
            Automated Morphological Analysis for
            <br />
            Drosophila Research
          </p>
          <p style={{ marginTop: "30px", opacity: 0.8 }}>
            Precision. Reproducibility. Transparency.
          </p>
        </div>

        {/* Right Panel */}
        <div
          style={{
            flex: 1,
            background: "#1e293b",
            padding: "50px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h2 style={{ marginBottom: "30px", color: "white" }}>
            Researcher Login
          </h2>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#f8fafc",
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#f8fafc",
            }}
          />

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: "#3b82f6",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Login
          </button>
          <p
            style={{
              marginTop: "20px",
              color: "#cbd5e1",
              textAlign: "center",
              cursor: "pointer",
            }}
            onClick={() => router.push("/register")}
          >
            Don’t have an account? Register
          </p>
        </div>
      </div>
    </div>
  );
}