import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import DynamicShiftDropdown from './DynamicShiftDropdown';

const ViewNotesTab = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    client: 'all',
    staff: 'all',
    shift: 'all',
    dateRange: 'all'
  });

  // Fetch clients and staff on component mount
  useEffect(() => {
    const fetchClientsAndStaff = async () => {
      try {
        console.log('Fetching clients and staff...');
        const clientsResponse = await api.get('/api/supervisor/clients');
        console.log('Clients response:', clientsResponse.data);
        setClients(clientsResponse.data.data || []);
        
        const staffResponse = await api.get('/api/supervisor/staff');
        console.log('Staff response:', staffResponse.data);
        setStaff(staffResponse.data.data || []);
      } catch (error) {
        console.error('Failed to fetch clients and staff:', error);
      }
    };
    fetchClientsAndStaff();
  }, []);

  const fetchNotes = useCallback(async () => {
    try {
      console.log('📥 Fetching notes with filters:', JSON.stringify(filters, null, 2));
      const response = await api.get('/api/supervisor/notes', { params: filters });
      console.log('✅ Full API Response:', response);
      const notesData = response.data.data || [];
      console.log(`📊 Setting ${notesData.length} notes`);
      console.log('Notes:', notesData);
      setNotes(notesData);
    } catch (error) {
      console.error('❌ Failed to fetch notes:', error);
      setNotes([]);
    }
  }, [filters]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/supervisor/notes/${noteId}`);
      fetchNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>View All Notes</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            Showing {notes.length} note{notes.length !== 1 ? 's' : ''}
            {filters.client !== 'all' && ` for ${clients.find(c => c._id === filters.client)?.name || 'selected client'}`}
          </p>
        </div>
        <button
          onClick={() => {
            console.log('🔄 Resetting filters to defaults');
            setFilters({
              status: 'all',
              client: 'all',
              staff: 'all',
              shift: 'all',
              dateRange: 'all'
            });
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          🔄 Reset Filters
        </button>
      </div>
      
      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <select 
          value={filters.status} 
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={filters.client}
          onChange={(e) => {
            console.log('🔍 Client filter changed to:', e.target.value);
            // When selecting a specific client, automatically show all their notes (all statuses)
            const newFilters = {...filters, client: e.target.value};
            if (e.target.value !== 'all') {
              newFilters.status = 'all'; // Show all statuses for this client
              console.log('✅ Auto-set status to "all" for client-specific view');
            }
            setFilters(newFilters);
          }}
          style={{
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontWeight: filters.client !== 'all' ? '700' : '400',
            background: filters.client !== 'all' ? '#f8f4f9' : '#fff',
            borderColor: filters.client !== 'all' ? '#7e3285' : '#ddd'
          }}
        >
          <option value="all">All Clients</option>
          {clients.map(client => (
            <option key={client._id} value={client._id}>{client.name}</option>
          ))}
        </select>

        <select 
          value={filters.staff} 
          onChange={(e) => setFilters({...filters, staff: e.target.value})}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="all">All Staff</option>
          {staff.map(staffMember => (
            <option key={staffMember._id} value={staffMember._id}>{staffMember.name}</option>
          ))}
        </select>

        <DynamicShiftDropdown
          value={filters.shift}
          onChange={(shift) => setFilters({...filters, shift})}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
        />

        <select 
          value={filters.dateRange} 
          onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Notes List */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {notes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>No notes found</p>
        ) : (
          notes.map(note => {
            // Format date safely
            const formattedDate = note.shiftDate
              ? new Date(note.shiftDate).toLocaleDateString()
              : 'Unknown Date';

            return (
            <div key={note._id} style={{
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>
                    {note.clientId?.name || 'Unknown Client'}
                  </p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888' }}>
                    Staff: {note.staffId?.name || 'Unknown Staff'}
                  </p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
                    {note.category || 'General'} • <strong>{note.shift || 'Unknown Shift'}</strong> • {formattedDate}
                  </p>
                  {/* Show images if attachments exist, otherwise show text */}
                  {note.attachments && note.attachments.length > 0 && note.attachments.some(att => att.mimetype && att.mimetype.startsWith('image/')) ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '0 0 8px 0' }}>
                      {note.attachments.filter(att => att.mimetype && att.mimetype.startsWith('image/')).slice(0, 3).map((att, i) => (
                        <img
                          key={i}
                          src={`http://localhost:5000/${att.path}`}
                          alt={att.originalName}
                          style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid #e5e7eb'
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
                      {note.entries && note.entries.length > 0
                        ? note.entries[0].content.substring(0, 300) + (note.entries[0].content.length > 300 ? '...' : '')
                        : note.content}
                    </p>
                  )}
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: note.status === 'Approved' ? '#dcfce7' :
                                   note.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                  color: note.status === 'Approved' ? '#15803d' :
                         note.status === 'Rejected' ? '#991b1b' : '#92400e'
                }}>
                  {note.status}
                </span>
              </div>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => navigate(`/supervisor/view-note/${note.clientId?._id}/${note._id}`)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  View Full Note
                </button>
                <button
                  onClick={() => handleDelete(note._id)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
};

export default ViewNotesTab;
