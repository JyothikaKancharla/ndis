
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function SupervisorClientProfile() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ shift: "", category: "", status: "" });

  useEffect(() => {
    async function fetchAll() {
      try {
        const [clientRes, staffRes, notesRes] = await Promise.all([
          api.get(`/api/supervisor/clients/${clientId}`),
          api.get(`/api/supervisor/clients/${clientId}/staff`),
          api.get(`/api/supervisor/clients/${clientId}/notes`)
        ]);
        setClient(clientRes.data);
        setStaff(staffRes.data);
        // notesRes now includes populated shiftId (if set)
        setNotes(notesRes.data || []);
        // build unique shifts from notes (populated shiftId objects or ids)
        const shiftMap = new Map();
        (notesRes.data || []).forEach(n => {
          const s = n.shiftId;
          if (s) {
            const id = s._id ? s._id : s;
            if (!shiftMap.has(id.toString())) shiftMap.set(id.toString(), s);
          }
        });
        setShifts(Array.from(shiftMap.values()));
      } catch (e) {
        console.error(e);
        setError("Failed to fetch client details");
      }
      setLoading(false);
    }
    fetchAll();
  }, [clientId]);

  if (loading) return <div style={{ color: '#805AD5', textAlign: 'center', marginTop: 40, fontSize: 18 }}>Loading...</div>;
  if (error) return <div style={{ color: '#d9534f', textAlign: 'center', marginTop: 40, fontSize: 18 }}>{error}</div>;
  if (!client) return <div>Client not found.</div>;

  // Note status counts
  const verifiedCount = notes.filter(n => n.status === "Approved").length;
  const pendingCount = notes.filter(n => n.status === "Pending").length;
  

  // Filtered notes
  let filteredNotes = notes;
  if (filters.shift) filteredNotes = filteredNotes.filter(n => {
    const sid = n.shiftId ? (n.shiftId._id ? n.shiftId._id.toString() : n.shiftId.toString()) : null;
    return sid === filters.shift;
  });
  if (filters.category) filteredNotes = filteredNotes.filter(n => n.category === filters.category);
  if (filters.status) filteredNotes = filteredNotes.filter(n => n.status === filters.status);

  // Category color map
  const catColors = {
    Bathing: { bg: '#E6F0FF', color: '#2563EB' },
    Medication: { bg: '#F3E8FF', color: '#A259D9' },
    Eating: { bg: '#FFF7E6', color: '#F59E42' },
    Hygiene: { bg: '#E6F4EA', color: '#2F7A4E' },
    Mobility: { bg: '#F1F8FF', color: '#63B3ED' },
    Other: { bg: '#E0E7EF', color: '#6B6B6B' }
  };

  return (
    <div style={{ background: '#F8F9ED', minHeight: '100vh', fontFamily: 'Inter, Poppins, Roboto, Arial, sans-serif', padding: 0 }}>
      <div style={{ maxWidth: 900, margin: '32px auto 0 auto' }}>
        {/* Header Card */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px #E0E7EF', padding: 28, display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 22, color: '#2E2E2E' }}>{client.name}</div>
            <div style={{ color: '#6B6B6B', fontSize: 15 }}>Client ID: {client.code || client._id?.slice(-4).toUpperCase()}</div>
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            <div style={{ background: '#F1F8FF', color: '#2563EB', borderRadius: 8, padding: '6px 16px', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 6 }}>{staff.length}</span> Staff Members
            </div>
            <div style={{ background: '#E6F4EA', color: '#2F7A4E', borderRadius: 8, padding: '6px 16px', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 6 }}>{notes.length}</span> Total Notes
            </div>
          </div>
        </div>
        {/* Summary Cards */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2F7A4E' }}>{verifiedCount}</div>
            <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 6 }}>Verified</div>
          </div>
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#F59E42' }}>{pendingCount}</div>
            <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 6 }}>Pending Review</div>
          </div>
        </div>
        {/* Filters Row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          <select style={filterSelect} value={filters.shift} onChange={e => setFilters(f => ({ ...f, shift: e.target.value }))}>
            <option value="">All Shifts</option>
            {shifts.map(s => (
              <option key={s._id ? s._id : s} value={s._id ? s._id : s}>
                {`${s.startTime || '-'} - ${s.endTime || '-'} ${s.date ? (s.date.split ? s.date.split('T')[0] : s.date) : ''}`}
              </option>
            ))}
          </select>
          <select style={filterSelect} value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            <option value="">All Categories</option>
            <option value="Bathing">Bathing</option>
            <option value="Medication">Medication</option>
            <option value="Eating">Eating</option>
            <option value="Hygiene">Hygiene</option>
            <option value="Mobility">Mobility</option>
            <option value="Other">Other</option>
          </select>
          <select style={filterSelect} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="Approved">Verified</option>
            <option value="Pending">Pending Review</option>
          </select>
        </div>
        {/* Notes List */}
        <div>
          {filteredNotes.length === 0 ? <div style={{ color: '#B8A6D9', textAlign: 'center', marginTop: 32 }}>No notes found.</div> : (
            filteredNotes.map(note => {
              const cat = catColors[note.category] || catColors.Other;
              return (
                <div key={note._id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 24, marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ background: cat.bg, color: cat.color, borderRadius: 8, padding: '4px 14px', fontWeight: 600, fontSize: 15 }}>{note.category || 'Other'}</span>
                    <span style={{ color: '#6B6B6B', fontWeight: 500, fontSize: 15 }}>{note.staffId?.name || 'Unknown'}</span>
                    <span style={{ color: '#B8A6D9', fontSize: 14 }}>{note.createdAt ? new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <div style={{ color: '#2E2E2E', fontSize: 15, marginBottom: 16 }}>{note.content}</div>
                  {note.status !== 'Approved' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                        onClick={() => navigate('/supervisor/note-review', { state: { client, note } })}
                      >
                        View Note
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        {/* Bottom Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32, marginBottom: 16 }}>
          <button
            style={{ background: '#E0E7EF', color: '#6B6B6B', border: 'none', borderRadius: 6, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
            onClick={() => navigate('/supervisor/notes-verification')}
          >
            Cancel
          </button>
          <button
            style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
            onClick={() => {
              // For demo: navigate to /supervisor/note-review with mock data (replace with real note selection logic)
              const note = filteredNotes[0];
              if (note) {
                navigate('/supervisor/note-review', { state: { client, note } });
              }
            }}
          >
            Verify Notes
          </button>
        </div>
      </div>
    </div>
  );
}

const filterSelect = {
  padding: '10px 16px',
  borderRadius: 8,
  border: '1.5px solid #B8A6D9',
  fontSize: 15,
  minWidth: 180
};
