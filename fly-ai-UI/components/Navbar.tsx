"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function NavBar() {
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

useEffect(() => {
  const cookies = document.cookie || "";

  const loggedIn =
    cookies.includes("next-auth.session-token") ||
    cookies.includes("__Secure-next-auth.session-token") ||
    cookies.includes("auth-token");

  // fallback: if not on login page, assume logged in (for now)
  if (pathname !== "/login") {
    setIsLoggedIn(true);
  } else {
    setIsLoggedIn(loggedIn);
  }
}, [pathname]);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(path + "/");
  };

  const getStyle = (path: string) => ({
    color: isActive(path) ? "#e2e8f0" : "#94a3b8",
    fontWeight: isActive(path) ? 600 : 500,
    textDecoration: "none",
    padding: "6px 12px",
    borderRadius: "999px",
    background: isActive(path)
      ? "rgba(59,130,246,0.18)"
      : "transparent",
    border: isActive(path)
      ? "1px solid rgba(59,130,246,0.45)"
      : "1px solid transparent",
    transition: "all 0.2s ease",
  });

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        background: "rgba(2,6,23,0.8)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(148,163,184,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        maxWidth: "100%",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* Brand */}
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: "18px",
              letterSpacing: "1px",
              background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Fly AI
          </div>
        </Link>

        {/* Nav group */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            padding: "6px",
            borderRadius: "999px",
            background: "rgba(148,163,184,0.08)",
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                style={{ ...getStyle("/dashboard"), cursor: "pointer" }}
              >
                Dashboard
              </Link>

              <Link
                href="/batch"
                style={{ ...getStyle("/batch"), cursor: "pointer" }}
              >
                Batch
              </Link>

              <Link
                href="/result"
                style={{ ...getStyle("/result"), cursor: "pointer" }}
              >
                Result
              </Link>

              <Link
                href="/profile"
                style={{ ...getStyle("/profile"), cursor: "pointer" }}
              >
                Profile
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              style={{ ...getStyle("/login"), cursor: "pointer" }}
              onMouseEnter={(e) => {
                if (!isActive("/login")) {
                  e.currentTarget.style.background = "rgba(148,163,184,0.12)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("/login")) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              Login
            </Link>
          )}
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isLoggedIn && (
            <>
              <div style={{ position: "relative" }} ref={menuRef}>
                {/* Avatar */}
                <div
                  onClick={() => setOpen(!open)}
                  title="User"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(59,130,246,0.2)",
                    color: "#e2e8f0",
                    fontWeight: 700,
                    border: "1px solid rgba(59,130,246,0.35)",
                    cursor: "pointer",
                  }}
                >
                  U
                </div>

                {/* Dropdown */}
                {open && (
                  <div
                    style={{
                      position: "absolute",
                      top: "110%",
                      right: 0,
                      minWidth: 140,
                      background: "rgba(2,6,23,0.95)",
                      border: "1px solid rgba(148,163,184,0.15)",
                      borderRadius: 10,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                      padding: "6px",
                      backdropFilter: "blur(10px)",
                      zIndex: 100,
                    }}
                  >
                    <Link
                      href="/profile"
                      style={{
                        display: "block",
                        padding: "8px 10px",
                        borderRadius: 8,
                        color: "#e2e8f0",
                        textDecoration: "none",
                        fontSize: 14,
                      }}
                    >
                      Profile
                    </Link>

                    <div
                      onClick={() => {
                        document.cookie = "next-auth.session-token=; Max-Age=0; path=/";
                        document.cookie = "__Secure-next-auth.session-token=; Max-Age=0; path=/";
                        document.cookie = "auth-token=; Max-Age=0; path=/";
                        window.location.href = "/login";
                      }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        color: "#f87171",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      Logout
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}