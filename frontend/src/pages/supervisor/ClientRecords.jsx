import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";

const priorityColors = {
  High: { bg: "#F3D6D6", color: "#C53030" },
  Medium: { bg: "#FDF6D6", color: "#B7791F" },
  Normal: { bg: "#E6F4EA", color: "#2F7A4E" },
  Other: { bg: '#E0E7EF', color: '#6B6B6B' }
};

function getPriorityStyle(p) {
  const key = p || 'Normal';
  if (priorityColors[key]) return priorityColors[key];
  return { bg: '#E0E7EF', color: '#6B6B6B' };
}

export default function ClientRecords() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [sort, setSort] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/api/supervisor/clients")
      .then((res) => {
        setClients(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch clients");
        setLoading(false);
      });
  }, []);

  let filtered = clients.filter(
    (c) =>
      (!search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.code &&
          c.code.toLowerCase().includes(search.toLowerCase()))) &&
      (!priority ||
        (c.priority || "Normal").toLowerCase() ===
          priority.toLowerCase())
  );

  if (sort === "name")
    filtered = filtered.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "2rem auto",
        background: "#fff",
        padding: 32,
        borderRadius: 16,
      }}
    >
      <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8 }}>
        Client Records
      </h1>

      <div style={{ color: "#6B6B6B", marginBottom: 32 }}>
        Manage and view all client records in the care center
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <input
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 2,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #E6E6FA",
            fontSize: 15,
          }}
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #E6E6FA",
            fontSize: 15,
          }}
        >
          <option value="">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Normal">Normal Priority</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #E6E6FA",
            fontSize: 15,
          }}
        >
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "#d9534f" }}>{error}</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
        >
          {filtered.map((client) => (
            <div
              key={client._id}
              style={{
                background: "#F8F9FD",
                borderRadius: 12,
                padding: 24,
                boxShadow: "0 1px 4px #f3f3f3",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                cursor: "pointer",
                transition: "box-shadow 0.2s",
                border: "1.5px solid transparent",
              }}
              onClick={() =>
                navigate(
                  `/supervisor/clients/${client._id}/profile`
                )
              }
              onMouseOver={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 16px #e0e7ef")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 1px 4px #f3f3f3")
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 18 }}>
                  {client.name}
                </span>

                <span
                  style={{
                    background: getPriorityStyle(client.priority).bg,
                    color: getPriorityStyle(client.priority).color,
                    borderRadius: 8,
                    padding: "2px 10px",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {client.priority ? client.priority : 'Normal'}
                  {client.priority ? " Priority" : ""}
                </span>
              </div>

              <div style={{ color: "#6B6B6B", fontSize: 13, marginBottom: 8 }}>
                ID: {client.code || client._id?.slice(-4).toUpperCase()}
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: "#444",
                  minHeight: 48,
                }}
              >
                {client.lastNote || "No recent notes."}
              </div>

              <div style={{ color: "#B8A6D9", fontSize: 13 }}>
                Last note: {client.lastNoteTime || "N/A"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
