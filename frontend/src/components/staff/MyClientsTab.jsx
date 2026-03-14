import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { CARE_LEVEL_COLORS, NOTE_CATEGORIES } from '../../constants/shifts';

const MyClientsTab = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientNotes, setClientNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientNotes(selectedClient._id);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff/clients');
      if (res.data.success) {
        setClients(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedClient(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientNotes = async (clientId) => {
    try {
      const res = await api.get(`/staff/clients/${clientId}/notes`);
      if (res.data.success) {
        setClientNotes(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching client notes:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      <div>
        <h3 style={{ margin: '0 0 8px 0', color: '#1a1a2e' }}>👥 My Assigned Clients</h3>
        <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>
          Click on a client to see their details and recent notes.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {clients.map(client => (
            <div
              key={client._id}
              onClick={() => setSelectedClient(client)}
              style={{
                padding: '16px',
                backgroundColor: selectedClient?._id === client._id ? '#f3e8ff' : 'white',
                border: selectedClient?._id === client._id ? '2px solid #7c3aed' : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#7c3aed',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                marginBottom: '8px'
              }}>
                {client.name.charAt(0)}
              </div>
              <h4 style={{ margin: 0, color: '#1a1a2e' }}>{client.name}</h4>
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                Room {client.room}
              </p>
              <span style={{
                display: 'inline-block',
                padding: '4px 8px',
                backgroundColor: CARE_LEVEL_COLORS[client.careLevel]?.bg,
                color: CARE_LEVEL_COLORS[client.careLevel]?.text,
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '4px'
              }}>
                {client.careLevel} Care
              </span>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#7c3aed', fontWeight: '600' }}>
                📝 {client.notesCount || 0} notes
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column - Details */}
      {selectedClient && (
        <div style={{
          padding: '24px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#7c3aed',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '24px'
              }}>
                {selectedClient.name.charAt(0)}
              </div>
              <div>
                <h2 style={{ margin: 0, color: '#1a1a2e' }}>{selectedClient.name}</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                  NDIS #: {selectedClient.ndisNumber}
                </p>
              </div>
              <span style={{
                padding: '6px 12px',
                backgroundColor: CARE_LEVEL_COLORS[selectedClient.careLevel]?.bg,
                color: CARE_LEVEL_COLORS[selectedClient.careLevel]?.text,
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                marginLeft: 'auto'
              }}>
                {selectedClient.careLevel} Care
              </span>
            </div>

            {/* Info Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '6px'
            }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Room</label>
                <p style={{ margin: '4px 0 0 0', color: '#1a1a2e' }}>{selectedClient.room}</p>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>DOB</label>
                <p style={{ margin: '4px 0 0 0', color: '#1a1a2e' }}>
                  {selectedClient.dateOfBirth ? formatDate(selectedClient.dateOfBirth) : 'N/A'}
                </p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Emergency Contact</label>
                <p style={{ margin: '4px 0 0 0', color: '#1a1a2e' }}>
                  {selectedClient.emergencyContact?.name} ({selectedClient.emergencyContact?.relationship})
                </p>
                {selectedClient.emergencyContact?.phone && (
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
                    {selectedClient.emergencyContact.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Notes */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', color: '#1a1a2e' }}>📋 Recent Notes</h4>
            {clientNotes.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px' }}>No notes recorded yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {clientNotes.map(note => (
                  <div key={note._id} style={{
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${NOTE_CATEGORIES.find(c => c.label === note.category)?.color}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#7c3aed' }}>
                        {note.category}
                      </span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {formatDateTime(note.createdAt)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>
                      {note.content.substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyClientsTab;
