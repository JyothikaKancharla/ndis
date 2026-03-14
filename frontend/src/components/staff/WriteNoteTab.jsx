import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/api';
import { AuthContext } from '../../context/AuthContext';
import { SHIFTS, NOTE_CATEGORIES } from '../../constants/shifts';
import Modal from '../common/Modal';

const WriteNoteTab = ({ onStatsUpdate }) => {
  const { user } = useContext(AuthContext);
  const [assignedClients, setAssignedClients] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [useCustomShift, setUseCustomShift] = useState(false);
  const [customShiftStart, setCustomShiftStart] = useState('');
  const [customShiftEnd, setCustomShiftEnd] = useState('');
  const [formData, setFormData] = useState({
    clientId: '',
    category: '',
    content: '',
    shift: SHIFTS[0].time,
    shiftDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAssignedClients();
  }, []);

  useEffect(() => {
    if (formData.clientId) {
      fetchRecentNotes(formData.clientId);
    }
  }, [formData.clientId]);

  const fetchAssignedClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff/clients');
      if (res.data.success) {
        setAssignedClients(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setMessage({ type: 'error', text: 'Failed to load assigned clients' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentNotes = async (clientId) => {
    try {
      const res = await api.get(`/staff/notes?client=${clientId}&limit=3`);
      if (res.data.success) {
        setRecentNotes(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching recent notes:', err);
    }
  };

  const handleClientChange = (e) => {
    const clientId = e.target.value;
    setFormData({ ...formData, clientId });
    const client = assignedClients.find(c => c._id === clientId);
    setSelectedClient(client);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCategorySelect = (categoryId) => {
    const category = NOTE_CATEGORIES.find(c => c.id === categoryId);
    setSelectedCategory(categoryId);
    setFormData({ ...formData, category: category.label });
  };

  const saveNote = async (status = 'Draft') => {
    if (!formData.clientId) {
      setMessage({ type: 'error', text: 'Please select a client' });
      return;
    }
    if (!formData.category) {
      setMessage({ type: 'error', text: 'Please select a category' });
      return;
    }
    if (!formData.content || formData.content.length < 10) {
      setMessage({ type: 'error', text: 'Content must be at least 10 characters' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/staff/notes', {
        ...formData,
        status
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: `Note ${status === 'Draft' ? 'saved' : 'submitted'} successfully!` });
        setFormData({
          clientId: '',
          category: '',
          content: '',
          shift: SHIFTS[0].time,
          shiftDate: new Date().toISOString().split('T')[0]
        });
        setSelectedCategory('');
        setSelectedClient(null);
        onStatsUpdate?.();

        // Clear message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to save note';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      {/* Message Display */}
      {message.text && (
        <div style={{
          gridColumn: '1 / -1',
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          marginBottom: '16px'
        }}>
          {message.type === 'success' ? '✓' : '⚠️'} {message.text}
        </div>
      )}

      {/* Left Column - Form */}
      <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1a1a2e' }}>✏️ Write Client Note</h3>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Record care notes for your assigned clients. Notes are locked after shift completion.
        </p>

        {/* Client Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
            Client *
          </label>
          <select
            name="clientId"
            value={formData.clientId}
            onChange={handleClientChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          >
            <option value="">Select a client</option>
            {assignedClients.map(client => (
              <option key={client._id} value={client._id}>
                {client.name} - Room {client.room} ({client.careLevel} Care)
              </option>
            ))}
          </select>
        </div>

        {/* Category Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#374151' }}>
            Category *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {NOTE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                style={{
                  padding: '10px',
                  border: selectedCategory === cat.id ? `2px solid ${cat.color}` : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: selectedCategory === cat.id ? `${cat.color}15` : 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12px',
                  transition: 'all 0.2s',
                  color: cat.color
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shift Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
            Shift *
          </label>
          {!useCustomShift ? (
            <>
              <select
                name="shift"
                value={formData.shift}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  marginBottom: '8px'
                }}
              >
                {SHIFTS.map(shift => (
                  <option key={shift.id} value={shift.time}>
                    {shift.time}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setUseCustomShift(true);
                  setCustomShiftStart('');
                  setCustomShiftEnd('');
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#6b7280',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e5e7eb';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.color = '#6b7280';
                }}
              >
                + Add Custom Shift Time
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={customShiftStart}
                    onChange={(e) => setCustomShiftStart(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #6d28d9',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={customShiftEnd}
                    onChange={(e) => setCustomShiftEnd(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #6d28d9',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (customShiftStart && customShiftEnd) {
                    // Convert 24-hour format to 12-hour format with AM/PM
                    const formatTime = (time) => {
                      const [hours, minutes] = time.split(':');
                      const hour = parseInt(hours);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const displayHour = hour % 12 || 12;
                      return `${displayHour}:${minutes} ${ampm}`;
                    };
                    
                    const shiftDisplay = `${formatTime(customShiftStart)} - ${formatTime(customShiftEnd)}`;
                    setFormData({ ...formData, shift: shiftDisplay });
                    setUseCustomShift(false);
                    setCustomShiftStart('');
                    setCustomShiftEnd('');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#6d28d9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: customShiftStart && customShiftEnd ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  opacity: customShiftStart && customShiftEnd ? 1 : 0.5
                }}
                disabled={!customShiftStart || !customShiftEnd}
              >
                ✓ Save Custom Shift
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseCustomShift(false);
                  setCustomShiftStart('');
                  setCustomShiftEnd('');
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </>
          )}
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
            Current: <strong>{formData.shift}</strong>
          </p>
        </div>

        {/* Shift Date */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
            Shift Date *
          </label>
          <input
            type="date"
            name="shiftDate"
            value={formData.shiftDate}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Content */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
            Note Content * ({formData.content.length}/2000)
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows="6"
            placeholder="Enter detailed care note here..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              maxHeight: '200px'
            }}
          />
          <small style={{ color: '#6b7280' }}>Minimum 10 characters, maximum 2000</small>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={() => saveNote('Draft')}
            disabled={submitting}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1
            }}
          >
            💾 Save Draft
          </button>
          <button
            type="button"
            onClick={() => saveNote('Pending')}
            disabled={submitting}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1
            }}
          >
            📤 Submit Note
          </button>
        </div>
      </form>

      {/* Right Column - Quick Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Client Info */}
        {selectedClient && (
          <div style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#1a1a2e' }}>📋 Client Information</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Name:</span>
                <strong>{selectedClient.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Room:</span>
                <strong>{selectedClient.room}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Care Level:</span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: selectedClient.careLevel === 'High' ? '#fef2f2' : selectedClient.careLevel === 'Medium' ? '#fff7ed' : '#f0fdf4',
                  color: selectedClient.careLevel === 'High' ? '#dc2626' : selectedClient.careLevel === 'Medium' ? '#ea580c' : '#16a34a',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {selectedClient.careLevel}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>NDIS #:</span>
                <strong>{selectedClient.ndisNumber}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Recent Notes */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#1a1a2e' }}>📝 Recent Notes</h4>
          {recentNotes.length === 0 ? (
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>No recent notes</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentNotes.slice(0, 3).map(note => (
                <div key={note._id} style={{
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${NOTE_CATEGORIES.find(c => c.label === note.category)?.color || '#6b7280'}`
                }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#7c3aed' }}>
                    {note.category}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                    {formatDate(note.createdAt)}
                  </span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#374151' }}>
                    {note.content.substring(0, 60)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guidelines */}
        <div style={{
          padding: '20px',
          backgroundColor: '#fdf2f8',
          borderRadius: '8px',
          border: '1px solid #fbcfe8'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#831843' }}>📌 Note Guidelines</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
            <li>Be specific and objective</li>
            <li>Include times when relevant</li>
            <li>Document any incidents immediately</li>
            <li>Notes cannot be edited after locking</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WriteNoteTab;
