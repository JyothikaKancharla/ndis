import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Calendar, Phone, MapPin, Heart, Clock,
  FileText, Plus, CheckCircle, XCircle, Download
} from 'lucide-react';
import api from '../../api/api';
import CreateAppointmentModal from '../../components/supervisor/CreateAppointmentModal';

const ClientDetailPage = ({ clientId: clientIdProp }) => {
  const { clientId: clientIdParam } = useParams();
  const clientId = clientIdProp || clientIdParam;
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [shifts, setShifts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  useEffect(() => {
    fetchClientDetails();
    fetchClientShifts();
    fetchClientNotes();
    fetchClientAppointments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const fetchClientDetails = async () => {
    try {
      const res = await api.get(`/api/clients/${clientId}`);
      setClient(res.data.data.client);
    } catch (err) {
      console.error('Failed to fetch client details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientShifts = async () => {
    try {
      const res = await api.get(`/api/clients/${clientId}/shifts`);
      setShifts(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch shifts:', err);
    }
  };

  const fetchClientNotes = async () => {
    try {
      const res = await api.get(`/api/clients/${clientId}/notes`);
      setNotes(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  const fetchClientAppointments = async () => {
    try {
      const res = await api.get('/api/supervisor/appointments', {
        params: { clientId }
      });
      setAppointments(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
      await api.put(`/api/supervisor/appointments/${appointmentId}/cancel`, {
        cancellationReason: reason
      });
      fetchClientAppointments();
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
    }
  };

  const handleDownloadSummary = async () => {
    try {
      const baseURL = 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/clients/${clientId}/summary-report`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${client.name}-Summary-Report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return '#3b82f6';
      case 'Completed': return '#22c55e';
      case 'Cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Loading client details...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#ef4444' }}>Client not found</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/supervisor/clients')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#7e3285',
            marginBottom: '16px'
          }}
        >
          <ArrowLeft size={16} />
          Back to Clients
        </button>

        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7e3285, #9b5a9b)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: '700'
          }}>
            {client.name.charAt(0)}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#333' }}>
              {client.name}
            </h1>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '14px' }}>
                <User size={14} />
                Age: {calculateAge(client.dateOfBirth)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '14px' }}>
                <Heart size={14} />
                {client.careLevel} Care
              </span>
              {client.ndisNumber && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '14px' }}>
                  NDIS: {client.ndisNumber}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleDownloadSummary()}
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} />
              Summary Report
            </button>
            <button
              onClick={() => setShowAppointmentModal(true)}
              style={{
                padding: '10px 20px',
                background: '#7e3285',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} />
              Add Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '2px solid #f3f4f6',
        paddingBottom: '0'
      }}>
        {[
          { key: 'overview', label: 'Overview', icon: User },
          { key: 'notes', label: 'All Notes', icon: FileText },
          { key: 'appointments', label: 'Appointments', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 20px',
              background: activeTab === tab.key ? '#7e3285' : 'transparent',
              color: activeTab === tab.key ? '#fff' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #7e3285' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '8px 8px 0 0',
              transition: 'all 0.2s'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Contact Details */}
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>
              Contact Details
            </h3>
            {client.address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <MapPin size={16} color="#7e3285" />
                <span style={{ fontSize: '14px', color: '#666' }}>{client.address}</span>
              </div>
            )}
            {client.emergencyContact?.name && (
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#999', marginTop: '16px', marginBottom: '8px' }}>
                  Emergency Contact
                </p>
                <div style={{ fontSize: '14px', color: '#333' }}>
                  <div>{client.emergencyContact.name}</div>
                  {client.emergencyContact.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <Phone size={14} color="#7e3285" />
                      {client.emergencyContact.phone}
                    </div>
                  )}
                  {client.emergencyContact.relationship && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      ({client.emergencyContact.relationship})
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>
              Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{
                padding: '16px',
                background: '#f8f4f9',
                borderRadius: '8px',
                border: '1px solid #e9d5f0'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#7e3285' }}>
                  {shifts.length}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Completed Shifts
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #dbeafe'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                  {notes.length}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Verified Notes
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>
                  {appointments.filter(a => a.status === 'Scheduled').length}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Upcoming Appointments
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: '#fef3c7',
                borderRadius: '8px',
                border: '1px solid #fde68a'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                  {client.isActive ? 'Active' : 'Inactive'}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Client Status
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Notes Tab */}
      {activeTab === 'notes' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333' }}>
              All Client Notes ({notes.length} {notes.length === 1 ? 'note' : 'notes'})
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              {notes.reduce((acc, note) => acc + (note.entries?.length || 1), 0)} total entries
            </p>
          </div>

          {notes.length === 0 ? (
            <div style={{
              background: '#fff',
              padding: '60px',
              textAlign: 'center',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <FileText size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: '#6b7280', fontSize: '16px' }}>No notes found for this client</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {notes.map(note => (
                <motion.div
                  key={note._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: '#fff',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  {/* Note Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: '#eff6ff',
                          color: '#1e40af',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {note.category}
                        </span>
                        <span style={{
                          padding: '4px 12px',
                          background: '#dcfce7',
                          color: '#166534',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {note.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', display: 'flex', gap: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={14} />
                          {note.staffId?.name || 'Unknown Staff'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={14} />
                          {new Date(note.shiftDate).toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} />
                          {note.shift}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Note Content - Show all entries if consolidated, otherwise show content */}
                  {note.entries && note.entries.length > 0 ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {note.entries.map((entry, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '16px',
                            background: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                            {new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            <span style={{ fontWeight: '600', color: '#7e3285' }}>
                              {entry.noteType === 'voice' ? 'Voice' : entry.noteType === 'file' ? 'File' : 'Text'}
                            </span>
                          </div>

                          {/* Show images if file entry with attachments */}
                          {entry.noteType === 'file' && entry.attachments && entry.attachments.length > 0 ? (
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              {entry.attachments.map((att, i) => {
                                const isImage = att.mimetype && att.mimetype.startsWith('image/');
                                const fileUrl = `http://localhost:5000/${att.path}`;

                                return isImage ? (
                                  <div key={i} style={{
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '2px solid #e5e7eb',
                                    maxWidth: '250px'
                                  }}>
                                    <img
                                      src={fileUrl}
                                      alt={att.originalName}
                                      style={{
                                        width: '100%',
                                        height: 'auto',
                                        maxHeight: '250px',
                                        objectFit: 'contain',
                                        display: 'block',
                                        background: '#fff'
                                      }}
                                    />
                                    <div style={{
                                      padding: '6px',
                                      background: '#fff',
                                      fontSize: '11px',
                                      color: '#666',
                                      textAlign: 'center'
                                    }}>
                                      {att.originalName}
                                    </div>
                                  </div>
                                ) : (
                                  <div key={i} style={{
                                    padding: '8px 12px',
                                    background: '#fff',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    color: '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}>
                                    📎 {att.originalName}
                                  </div>
                                );
                              })}
                            </div>
                          ) : !entry.content.startsWith('File upload:') ? (
                            <p style={{
                              margin: 0,
                              fontSize: '14px',
                              lineHeight: '1.6',
                              color: '#333',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {entry.content}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#333',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {note.content || 'No content'}
                      </p>
                    </div>
                  )}

                  {/* Note Footer */}
                  {note.verifiedAt && (
                    <div style={{
                      marginTop: '12px',
                      fontSize: '12px',
                      color: '#999',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <CheckCircle size={12} />
                      Verified by {note.verifiedBy?.name} on {new Date(note.verifiedAt).toLocaleDateString()}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333' }}>
              Appointments ({appointments.length})
            </h3>
            <button
              onClick={() => setShowAppointmentModal(true)}
              style={{
                padding: '10px 20px',
                background: '#7e3285',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} />
              New Appointment
            </button>
          </div>

          {/* Upcoming Appointments */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#7e3285', marginBottom: '12px' }}>
              Upcoming
            </h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {appointments
                .filter(apt => apt.status === 'Scheduled' && new Date(apt.appointmentDate) >= new Date())
                .map(appointment => (
                  <div
                    key={appointment._id}
                    style={{
                      background: '#fff',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid #7e3285',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
                        {appointment.title}
                      </h4>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#666' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} />
                          {new Date(appointment.appointmentDate).toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} />
                          {appointment.startTime}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} />
                          Staff: {appointment.staffId?.name}
                        </span>
                      </div>
                      {appointment.description && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#999' }}>
                          {appointment.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleCancelAppointment(appointment._id)}
                      style={{
                        padding: '8px 16px',
                        background: '#fee2e2',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <XCircle size={14} />
                      Cancel
                    </button>
                  </div>
                ))}
              {appointments.filter(apt => apt.status === 'Scheduled' && new Date(apt.appointmentDate) >= new Date()).length === 0 && (
                <div style={{
                  background: '#f9fafb',
                  padding: '40px',
                  textAlign: 'center',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <Calendar size={32} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>No upcoming appointments</p>
                </div>
              )}
            </div>
          </div>

          {/* Past Appointments */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#666', marginBottom: '12px' }}>
              Past Appointments
            </h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {appointments
                .filter(apt => apt.status !== 'Scheduled' || new Date(apt.appointmentDate) < new Date())
                .map(appointment => (
                  <div
                    key={appointment._id}
                    style={{
                      background: '#fff',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      opacity: 0.8
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
                          {appointment.title}
                        </h4>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#666' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} />
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} />
                            {appointment.startTime}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} />
                            {appointment.staffId?.name}
                          </span>
                        </div>
                      </div>
                      <span style={{
                        padding: '6px 12px',
                        background: `${getStatusColor(appointment.status)}20`,
                        color: getStatusColor(appointment.status),
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <CreateAppointmentModal
          clientId={clientId}
          clientName={client.name}
          onClose={() => setShowAppointmentModal(false)}
          onSuccess={() => {
            setShowAppointmentModal(false);
            fetchClientAppointments();
          }}
        />
      )}
    </div>
  );
};

export default ClientDetailPage;
