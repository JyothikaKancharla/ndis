import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

const CATEGORIES = ["Bathing", "Medication", "Eating", "Emotional State", "Other"];
const CATEGORY_COLORS = {
  Bathing: "#6C63FF",
  Medication: "#A259FF",
  Eating: "#2EC4B6",
  "Emotional State": "#FFB259",
  Other: "#B8A6D9"
};

export default function ClientNotesHistory() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      api.get(`/api/supervisor/clients/${clientId}`),
      api.get(`/api/supervisor/clients/${clientId}/notes`)
    ])
      .then(([clientRes, notesRes]) => {
        if (!isMounted) return;
        setClient(clientRes.data);
        setNotes(notesRes.data);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Failed to fetch notes");
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, [clientId]);

  // Stats
  const verified = notes.filter(n => n.status === "Approved").length;
  const pending = notes.filter(n => n.status === "Pending").length;
  

  // Filtered notes
  const filteredNotes = notes.filter(n =>
    (!search || n.content.toLowerCase().includes(search.toLowerCase()) || n.staffId?.name?.toLowerCase().includes(search.toLowerCase())) &&
    (!category || n.category === category)
  );

  // Group notes by date
  const notesByDate = {};
  filteredNotes.forEach(n => {
    const date = new Date(n.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    if (!notesByDate[date]) notesByDate[date] = [];
    notesByDate[date].push(n);
  });
  const sortedDates = Object.keys(notesByDate).sort((a, b) => new Date(b) - new Date(a));

  if (loading) return <div style={{ color: '#805AD5', textAlign: 'center', marginTop: 40, fontSize: 18 }}>Loading...</div>;
  if (error) return <div style={{ color: '#d9534f', textAlign: 'center', marginTop: 40, fontSize: 18 }}>{error}</div>;
  if (!client) return <div>Client not found.</div>;

  return (
    <div style={{ background: '#F8F9FD', minHeight: '100vh', fontFamily: 'Inter, Poppins, Roboto, Arial, sans-serif', padding: 0 }}>
      <div style={{ maxWidth: 1100, margin: '32px auto 0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#805AD5', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginBottom: 16 }}>&lt; Back to Client Profile</button>
        <div style={{ fontWeight: 700, fontSize: 32, color: '#2E2E2E', marginBottom: 4 }}>Historical Care Notes</div>
        <div style={{ color: '#6B6B6B', fontSize: 18, marginBottom: 24 }}>Complete record of observations for <b>{client.name}</b></div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
          <StatCard label="Verified Notes" value={verified} color="#22C55E" />
          <StatCard label="Pending Review" value={pending} color="#F59E42" />
        </div>
        {/* Filter */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 24, marginBottom: 32 }}>
          <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 10 }}>Filter Notes</div>
          <input placeholder="Search by content or staff name..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 320, padding: 12, borderRadius: 8, border: '1.5px solid #B8A6D9', fontSize: 15, marginRight: 16 }} />
          <span style={{ fontWeight: 500, fontSize: 15, marginRight: 8 }}>Category</span>
          <button onClick={() => setCategory("")} style={{ background: !category ? '#6C63FF' : '#F8F9FD', color: !category ? '#fff' : '#6B6B6B', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 500, fontSize: 15, marginRight: 8, cursor: 'pointer' }}>All Categories</button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{ background: category === cat ? CATEGORY_COLORS[cat] : '#F8F9FD', color: category === cat ? '#fff' : '#6B6B6B', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 500, fontSize: 15, marginRight: 8, cursor: 'pointer' }}>{cat}</button>
          ))}
        </div>
        {/* Timeline */}
        <div style={{ marginTop: 16 }}>
          {sortedDates.length === 0 ? <div style={{ color: '#B8A6D9', fontSize: 18, textAlign: 'center', marginTop: 40 }}>No notes found.</div> : (
            sortedDates.map(date => (
              <div key={date} style={{ marginBottom: 32, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: '#6C63FF', fontSize: 22, marginRight: 8 }}>📅</span>
                  <div style={{ fontWeight: 700, fontSize: 20 }}>{date}</div>
                  <div style={{ color: '#B8A6D9', fontSize: 15, marginLeft: 12 }}>{notesByDate[date].length} notes</div>
                </div>
                <div style={{ borderLeft: '3px solid #E0E7EF', marginLeft: 13, paddingLeft: 32 }}>
                  {notesByDate[date].map((n, idx) => (
                    <div key={n._id || idx} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 20, marginBottom: 18, position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ background: CATEGORY_COLORS[n.category] || '#B8A6D9', color: '#fff', borderRadius: 8, padding: '4px 14px', fontWeight: 600, fontSize: 15, marginRight: 12 }}>{n.category || 'Other'}</span>
                        <span style={{ color: '#805AD5', fontWeight: 500, fontSize: 15, marginRight: 10 }}>👤 {n.staffId?.name || '-'}</span>
                        <span style={{ color: '#B8A6D9', fontSize: 14 }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{ fontSize: 16, color: '#2E2E2E' }}>{n.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 28, textAlign: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ color: '#6B6B6B', fontSize: 16, marginTop: 6 }}>{label}</div>
    </div>
  );
}
