import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function SupervisorClientDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const [summaryRes, dashboardRes] = await Promise.all([
        api.get("/api/supervisor/notes-summary"),
        api.get("/api/supervisor/dashboard")
      ]);
      setSummary({
        totalClients: summaryRes.data.totalClients,
        activeClients: dashboardRes.data.totalClients,
        recentNotes: dashboardRes.data.recentNotes,
        clients: summaryRes.data.clients
      });
    } catch (err) {
      setError("Failed to fetch client summary");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "2rem auto", background: "#fff", padding: 32, borderRadius: 16 }}>
      <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8 }}>Client Management</h1>
      <div style={{ color: '#6B6B6B', marginBottom: 32 }}>Manage client records, view details, and add new clients to the system</div>
      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <SummaryCard label="Total Clients" value={summary?.totalClients ?? 0} icon={<span role="img" aria-label="clients">👥</span>} />
        <SummaryCard label="Active Clients" value={summary?.activeClients ?? 0} icon={<span role="img" aria-label="active">👤</span>} sub={summary?.activeClients ? `${Math.round((summary.activeClients/(summary.totalClients||1))*100)}%` : ''} />
        <SummaryCard label="Recent Notes" value={summary?.recentNotes?.length ?? 0} icon={<span role="img" aria-label="notes">📄</span>} />
      </div>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <ActionCard title="View All Client Records" desc="Browse and search all client profiles" btnText="View Records" onClick={() => navigate("/supervisor/clients/records")} />
        <ActionCard title="Add New Client" desc="Register a new client in the system" btnText="Add Client" onClick={() => navigate("/supervisor/clients/add")}/>
      </div>
      {/* Recent Activity */}
      <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 20 }}>Recent Activity</div>
      <div style={{ background: '#F8F9ED', borderRadius: 12, padding: 24 }}>
        {summary?.recentNotes?.length ? summary.recentNotes.map((note, i) => (
          <div key={note._id || i} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', padding: '12px 0' }}>
            <span style={{ marginRight: 16 }}>{note.category === 'Medication' ? <span style={{ color: '#805AD5' }}>💊</span> : <span style={{ color: '#B8A6D9' }}>📝</span>}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{note.clientId?.name || 'Client'} <span style={{ color: '#6B6B6B', fontWeight: 400, marginLeft: 8 }}>{note.category ? `${note.category} note` : 'Note'} added</span></div>
              <div style={{ color: '#B8A6D9', fontSize: 13 }}>{timeAgo(note.createdAt)}</div>
            </div>
            <div style={{ background: '#E2E8F0', color: '#805AD5', borderRadius: 8, padding: '2px 10px', fontSize: 13 }}>{note.category || 'General'}</div>
          </div>
        )) : <div style={{ color: '#888' }}>No recent activity</div>}
      </div>
      {error && <div style={{ color: '#d9534f', marginTop: 16 }}>{error}</div>}
      {loading && <div>Loading...</div>}
    </div>
  );
}

function SummaryCard({ label, value, icon, sub }) {
  return (
    <div style={{ flex: 1, background: '#F8F9ED', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxShadow: '0 1px 4px #f3f3f3' }}>
      <div style={{ fontSize: 15, color: '#6B6B6B', marginBottom: 8 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 28, display: 'flex', alignItems: 'center', gap: 8 }}>{icon}{value}</div>
      {sub && <div style={{ color: '#4BB543', fontSize: 13, marginTop: 4 }}>{sub} Currently receiving care</div>}
    </div>
  );
}

function ActionCard({ title, desc, btnText, onClick }) {
  return (
    <div style={{ flex: 1, background: '#F8F9FF', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', border: '1.5px solid #B8A6D9', boxShadow: '0 1px 4px #f3f3f3' }}>
      <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>{title}</div>
      <div style={{ color: '#6B6B6B', fontSize: 14, marginBottom: 16 }}>{desc}</div>
      <button onClick={onClick} style={{ background: '#805AD5', color: '#fff', padding: '8px 18px', border: 'none', borderRadius: 8, fontWeight: 500, fontSize: 15 }}>{btnText} &rarr;</button>
    </div>
  );
}

function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}
