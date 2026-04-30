"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "",
  });

  useEffect(() => {
    // fetch user (mock for now)
    const data = {
      id: "demo-user", // replace later
      name: "Rishi Raj",
      email: "rishiraj@example.com",
      role: "Research Analyst",
    };

    setUser(data);
    setForm({
      name: data.name,
      role: data.role,
    });
  }, []);

  const handleSave = async () => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setUser({ ...user, ...form });
      setEditing(false);
    }
  };

  if (!user) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", color: "#e2e8f0" }}>
      <h1 style={{ fontSize: 26, marginBottom: 20 }}>Profile</h1>

      <div
        style={{
          background: "rgba(2,6,23,0.8)",
          padding: 20,
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,0.15)",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(59,130,246,0.2)",
            display: "grid",
            placeItems: "center",
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          {user.name.charAt(0)}
        </div>

        {/* Name */}
        <div style={{ marginBottom: 12 }}>
          <strong>Name:</strong>
          {editing ? (
            <input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              style={{ marginLeft: 10 }}
            />
          ) : (
            <span style={{ marginLeft: 10 }}>{user.name}</span>
          )}
        </div>

        {/* Email */}
        <div style={{ marginBottom: 12 }}>
          <strong>Email:</strong>
          <span style={{ marginLeft: 10 }}>{user.email}</span>
        </div>

        {/* Role */}
        <div style={{ marginBottom: 12 }}>
          <strong>Role:</strong>
          {editing ? (
            <input
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
              style={{ marginLeft: 10 }}
            />
          ) : (
            <span style={{ marginLeft: 10 }}>{user.role}</span>
          )}
        </div>

        {/* Actions */}
        {editing ? (
          <button onClick={handleSave}>Save</button>
        ) : (
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        )}
      </div>
    </div>
  );
}