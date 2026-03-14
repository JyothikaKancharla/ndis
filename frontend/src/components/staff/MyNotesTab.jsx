import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { SHIFTS, NOTE_CATEGORIES, NOTE_STATUSES } from '../../constants/shifts';
import Modal from '../common/Modal';

const MyNotesTab = () => {
  const [notes, setNotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const [filters, setFilters] = useState({
    status: '',
    client: '',
    shift: '',
    category: '',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    fetchNotes();
    fetchClients();
  }, []);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      fetchNotes();
    }, 300);
    return () => clearTimeout(delayTimer);
  }, [filters]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.client) params.append('client', filters.client);
      if (filters.shift) params.append('shift', filters.shift);
      if (filters.category) params.append('category', filters.category);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);

      const res = await api.get(`/staff/notes?${params.toString()}`);
      if (res.data.success) {
        setNotes(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get('/staff/clients');
      if (res.data.success) {
        setClients(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const lockNote = async (noteId) => {
    if (!window.confirm('Lock this note for supervisor review? It cannot be edited afterwards.')) return;

    try {
      const res = await api.put(`/staff/notes/${noteId}/lock`);
      if (res.data.success) {
        fetchNotes();
        setShowModal(false);
      }
    } catch (err) {
      alert('Error locking note: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  const saveEditedNote = async () => {
    if (!editContent.trim() || editContent.length < 10) {
      alert('Content must be at least 10 characters');
      return;
    }

    try {
      const res = await api.put(`/staff/notes/${selectedNote._id}`, {
        content: editContent,
        status: 'Pending'
      });
      if (res.data.success) {
        alert('Note updated successfully!');
        setIsEditing(false);
        setEditContent('');
        fetchNotes();
      }
    } catch (err) {
      alert('Error saving note: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (categoryLabel) => {
    const cat = NOTE_CATEGORIES.find(c => c.label === categoryLabel);
    return cat?.color || '#6b7280';
  };

  const getStatusColor = (status) => {
    const stat = NOTE_STATUSES.find(s => s.label === status);
    return stat?.color || '#6b7280';
  };

  return (
    <div style={{ padding: '32px' }}>
      <h3 style={{ margin: '0 0 8px 0', color: '#1a1a2e' }}>📋 My Notes</h3>
      <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>
        View all notes you've submitted. Lock notes at end of shift for supervisor review.
      </p>

      {/* Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px'
      }}>
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px'
          }}
        >
          <option value="">All Status</option>
          {NOTE_STATUSES.map(stat => (
            <option key={stat.id} value={stat.label}>
              {stat.icon} {stat.label}
            </option>
          ))}
        </select>

        <select
          name="client"
          value={filters.client}
          onChange={handleFilterChange}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px'
          }}
        >
          <option value="">All Clients</option>
          {clients.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <select
          name="shift"
          value={filters.shift}
          onChange={handleFilterChange}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px'
          }}
        >
          <option value="">All Shifts</option>
          {SHIFTS.map(s => (
            <option key={s.id} value={s.time}>{s.icon} {s.label}</option>
          ))}
        </select>

        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px'
          }}
        >
          <option value="">All Categories</option>
          {NOTE_CATEGORIES.map(c => (
            <option key={c.id} value={c.label}>{c.icon} {c.label}</option>
          ))}
        </select>

        <input
          type="date"
          name="fromDate"
          value={filters.fromDate}
          onChange={handleFilterChange}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px'
          }}
        />

        <input
          type="date"
          name="toDate"
          value={filters.toDate}
          onChange={handleFilterChange}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px'
          }}
        />
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading...</div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          No notes found. Create one to get started!
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {notes.map(note => (
            <div
              key={note._id}
              style={{
                padding: '16px',
                backgroundColor: 'white',
                border: `1px solid ${getStatusColor(note.status)}30`,
                borderLeft: `4px solid ${getStatusColor(note.status)}`,
                borderRadius: '8px'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: `${getCategoryColor(note.category)}15`,
                  color: getCategoryColor(note.category),
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '4px'
                }}>
                  {NOTE_CATEGORIES.find(c => c.label === note.category)?.icon} {note.category}
                </span>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: `${getStatusColor(note.status)}15`,
                  color: getStatusColor(note.status),
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '4px'
                }}>
                  {NOTE_STATUSES.find(s => s.label === note.status)?.icon} {note.status}
                </span>
              </div>

              {/* Meta */}
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>👤 {note.clientId?.name}</span>
                <span>{SHIFTS.find(s => s.time === note.shift)?.icon} {note.shift}</span>
                <span>📅 {formatDate(note.shiftDate)}</span>
              </div>

              {/* Content */}
              <p style={{ margin: '12px 0', fontSize: '13px', color: '#374151', lineHeight: '1.4' }}>
                {note.content.substring(0, 120)}...
              </p>

              {/* Footer */}
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '12px' }}>
                Created: {formatDateTime(note.createdAt)}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setSelectedNote(note);
                    setShowModal(true);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  👁️ View
                </button>
                {note.status === 'Draft' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedNote(note);
                        setShowModal(true);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        color: '#374151'
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => lockNote(note._id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#7c3aed',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      🔒 Lock
                    </button>
                  </>
                )}
                {!note.isLocked && note.status !== 'Draft' && (
                  <button
                    onClick={() => {
                      setSelectedNote(note);
                      setShowModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Edit Unlocked
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showModal && selectedNote}
        title={selectedNote?.category}
        onClose={() => {
          setShowModal(false);
          setIsEditing(false);
          setEditContent('');
        }}
        size="medium"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Client:</label>
              <p style={{ margin: '4px 0 0 0', color: '#1a1a2e' }}>{selectedNote?.clientId?.name}</p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Status:</label>
              <p style={{
                margin: '4px 0 0 0',
                padding: '4px 8px',
                backgroundColor: `${getStatusColor(selectedNote?.status)}15`,
                color: getStatusColor(selectedNote?.status),
                borderRadius: '4px',
                width: 'fit-content',
                fontWeight: '600',
                fontSize: '12px'
              }}>
                {selectedNote?.status}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Shift:</label>
              <p style={{ margin: '4px 0 0 0', color: '#1a1a2e' }}>{selectedNote?.shift}</p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Date:</label>
              <p style={{ margin: '4px 0 0 0', color: '#1a1a2e' }}>{formatDate(selectedNote?.shiftDate)}</p>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Content:</label>
            {!isEditing ? (
              <p style={{ margin: '8px 0 0 0', color: '#1a1a2e', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {selectedNote?.content}
              </p>
            ) : (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows="6"
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            )}
          </div>

          {selectedNote?.status === 'Rejected' && !isEditing && (
            <div style={{
              padding: '16px',
              backgroundColor: '#fef2f2',
              borderLeft: '4px solid #dc2626',
              borderRadius: '4px'
            }}>
              <label style={{ fontSize: '12px', color: '#991b1b', fontWeight: '600' }}>⚠️ Rejection Reason:</label>
              <p style={{ margin: '8px 0 0 0', color: '#7f1d1d' }}>{selectedNote?.rejectionReason}</p>
            </div>
          )}

          {/* Edit Actions */}
          {!isEditing && !selectedNote?.isLocked && selectedNote?.status !== 'Draft' && (
            <button
              onClick={() => {
                setIsEditing(true);
                setEditContent(selectedNote?.content);
              }}
              style={{
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✏️ Edit Note
            </button>
          )}

          {isEditing && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={saveEditedNote}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                💾 Save Changes
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent('');
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✕ Cancel
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MyNotesTab;
