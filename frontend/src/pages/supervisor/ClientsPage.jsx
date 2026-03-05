import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import api from '../../api/api';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/supervisor/clients');
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getCareLevelColor = (level) => {
    switch (level) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Loading clients...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#333', margin: 0 }}>
          All Clients
        </h1>
        <p style={{ color: '#666', marginTop: '8px' }}>
          Total: {clients.length} clients
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {clients.map(client => (
          <div
            key={client._id}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onClick={() => navigate(`/supervisor/clients/${client._id}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(126,50,133,0.15)';
              e.currentTarget.style.borderColor = '#7e3285';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7e3285, #9b5a9b)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '700'
              }}>
                {client.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333' }}>
                  {client.name}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
                  {client.ndisNumber || 'No NDIS Number'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                background: `${getCareLevelColor(client.careLevel)}20`,
                color: getCareLevelColor(client.careLevel)
              }}>
                {client.careLevel} Care
              </span>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                background: '#eff6ff',
                color: '#1e40af'
              }}>
                Age: {calculateAge(client.dateOfBirth)}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid #f3f4f6'
            }}>
              <span style={{ fontSize: '14px', color: '#7e3285', fontWeight: '600' }}>
                View Details
              </span>
              <ArrowRight size={18} color="#7e3285" />
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f9fafb',
          borderRadius: '12px'
        }}>
          <Users size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280', fontSize: '16px' }}>No clients found</p>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
