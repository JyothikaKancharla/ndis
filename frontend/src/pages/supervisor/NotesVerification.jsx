
import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function SupervisorNotesVerification() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [urgency, setUrgency] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/supervisor/notes-summary");
        setSummary(res.data);
      } catch (err) {
        setError("Failed to fetch notes summary");
      }
      setLoading(false);
    };
    fetchSummary();
  }, []);

  if (loading) return <div style={{ color: '#805AD5', textAlign: 'center', marginTop: 40, fontSize: 18 }}>Loading summary...</div>;
  if (error) return <div style={{ color: '#C53030', textAlign: 'center', marginTop: 40, fontSize: 18 }}>{error}</div>;
  if (!summary) return null;

  // Filtered clients
  let filtered = summary.clients;
  if (search) filtered = filtered.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));
  if (urgency) filtered = filtered.filter(c => (urgency === "High" && c.highPriority) || (urgency === "Medium" && c.priority === "Medium") || (urgency === "Normal" && c.priority === "Normal"));
  if (status) filtered = filtered.filter(c => (status === "Pending" && c.pendingCount > 0) || (status === "Verified" && c.lastNote?.status === "Approved"));

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h2 style={styles.pageTitle}>Client Care Notes Summary</h2>
        <div style={styles.pageSubtitle}>Review and manage client care notes across all shifts</div>
      </div>
      {/* Summary cards */}
      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}><div style={styles.summaryLabel}>Total Clients</div><div style={styles.summaryValue}>{summary.totalClients}</div></div>
        <div style={{ ...styles.summaryCard, background: '#FFF5F5', border: '1.5px solid #F56565' }}><div style={styles.summaryLabel}>High Priority</div><div style={styles.summaryValue}>{summary.highPriorityCount}</div></div>
        <div style={{ ...styles.summaryCard, background: '#FFFBEB', border: '1.5px solid #F6E05E' }}><div style={styles.summaryLabel}>Pending Review</div><div style={styles.summaryValue}>{summary.pendingReviewCount}</div></div>
        
      </div>
      {/* Filters */}
      <div style={styles.filtersRow}>
        <input style={styles.searchInput} placeholder="Search by client name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={styles.filterSelect} value={urgency} onChange={e => setUrgency(e.target.value)}>
          <option value="">All Urgency Levels</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Normal">Normal</option>
        </select>
        <select style={styles.filterSelect} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending Review</option>
          <option value="Verified">Verified</option>
        </select>
      </div>
      {/* Client list */}
      <div style={styles.clientList}>
        {filtered.map(client => (
          <div key={client._id} style={styles.clientCard}>
            <div style={styles.clientHeader}>
              <span style={styles.clientIcon}><svg width="32" height="32" fill="none" stroke="#B8A6D9" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a7.5 7.5 0 0 1 13 0"/></svg></span>
              <span style={styles.clientName}>{client.name}</span>
              <span style={styles.clientId}>ID: {client.code}</span>
              {client.highPriority && <span style={styles.highPriorityBadge}>High Priority</span>}
              {client.lastNote?.status === 'Pending' && <span style={styles.pendingBadge}>Pending Review</span>}
              
              {client.priority === 'Medium' && <span style={styles.mediumPriorityBadge}>Medium Priority</span>}
              {client.priority === 'Normal' && <span style={styles.normalPriorityBadge}>Normal</span>}
              {client.lastNote?.status === 'Approved' && <span style={styles.verifiedBadge}>Verified</span>}
            </div>
            <div style={styles.clientMeta}>
              <span>Last note: {client.lastNote ? (new Date(client.lastNote.createdAt)).toLocaleString() : '—'}</span>
              <span style={{ marginLeft: 18 }}>{client.notesCount} notes</span>
            </div>
            <div style={styles.clientNoteContent}>{client.lastNote?.content || <span style={{ color: '#B8A6D9' }}>No notes yet.</span>}</div>
            <div style={styles.clientFooter}>
              <span>{client.staffAssigned} staff assigned</span>
              <a href={`/supervisor/clients/${client._id}`} style={styles.detailsLink}>View Details &rarr;</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#F8F9ED', minHeight: '100vh', fontFamily: 'Inter, Poppins, Roboto, Arial, sans-serif', padding: 0 },
  headerRow: { margin: '32px 0 0 32px' },
  pageTitle: { fontWeight: 700, fontSize: 28, color: '#2E2E2E', margin: 0 },
  pageSubtitle: { color: '#6B6B6B', fontSize: 16, marginTop: 6, marginBottom: 18 },
  summaryRow: { display: 'flex', gap: 24, margin: '18px 0 18px 32px' },
  summaryCard: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px #E0E7EF', padding: 24, minWidth: 180, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  summaryLabel: { color: '#6B6B6B', fontSize: 15, marginBottom: 8 },
  summaryValue: { fontWeight: 700, fontSize: 24, color: '#2E2E2E' },
  filtersRow: { display: 'flex', gap: 12, margin: '0 0 18px 32px', alignItems: 'center' },
  searchInput: { padding: '10px 16px', borderRadius: 8, border: '1.5px solid #B8A6D9', fontSize: 15, minWidth: 320 },
  filterSelect: { padding: '10px 16px', borderRadius: 8, border: '1.5px solid #B8A6D9', fontSize: 15, minWidth: 180 },
  clientList: { margin: '0 32px' },
  clientCard: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px #E0E7EF', padding: 28, marginBottom: 24 },
  clientHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  clientIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  clientName: { fontWeight: 600, color: '#2E2E2E', fontSize: 17 },
  clientId: { color: '#B8A6D9', fontWeight: 500, fontSize: 14, marginLeft: 8 },
  highPriorityBadge: { background: '#F56565', color: '#fff', borderRadius: 8, padding: '2px 10px', fontWeight: 500, fontSize: 13, marginLeft: 8 },
  pendingBadge: { background: '#F6E05E', color: '#2E2E2E', borderRadius: 8, padding: '2px 10px', fontWeight: 500, fontSize: 13, marginLeft: 8 },
  flaggedBadge: { background: '#F56565', color: '#fff', borderRadius: 8, padding: '2px 10px', fontWeight: 500, fontSize: 13, marginLeft: 8 },
  mediumPriorityBadge: { background: '#F6E05E', color: '#2E2E2E', borderRadius: 8, padding: '2px 10px', fontWeight: 500, fontSize: 13, marginLeft: 8 },
  normalPriorityBadge: { background: '#E0E7EF', color: '#6B6B6B', borderRadius: 8, padding: '2px 10px', fontWeight: 500, fontSize: 13, marginLeft: 8 },
  verifiedBadge: { background: '#E6F4EA', color: '#2F7A4E', borderRadius: 8, padding: '2px 10px', fontWeight: 500, fontSize: 13, marginLeft: 8 },
  clientMeta: { color: '#6B6B6B', fontSize: 14, marginBottom: 8 },
  clientNoteContent: { color: '#2E2E2E', fontSize: 15, background: '#F8F9ED', borderRadius: 8, padding: 14, marginBottom: 8 },
  clientFooter: { display: 'flex', alignItems: 'center', gap: 18, color: '#6B6B6B', fontSize: 14 },
  detailsLink: { color: '#2563EB', fontWeight: 600, marginLeft: 8, textDecoration: 'none' }
};
