import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock, Calendar, Lock, Unlock, MapPin, CheckCircle, FileText, Edit3
} from 'lucide-react';
import api from '../../api/api';
import { AuthContext } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import styles from './ShiftHistory.module.css';

export default function ShiftHistory() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('month');

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/shift-history', {
        params: { dateRange: dateFilter }
      });
      setShifts(res.data.data || []);
    } catch (err) {
      setError('Failed to load shift history');
      console.error('Shift history error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, dateFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/staff/notes/${noteId}`);
      fetchHistory();
    } catch (err) {
      console.error('Delete note error:', err);
      setError('Failed to delete note. Only unlocked notes can be deleted.');
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm('Are you sure you want to delete this shift record and all its associated notes? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/shift-history/${shiftId}`);
      fetchHistory();
    } catch (err) {
      console.error('Delete shift error:', err);
      setError('Failed to delete shift record.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const filterTabs = [
    { key: 'week', label: 'Last Week' },
    { key: 'month', label: 'Last Month' },
    { key: '3months', label: 'Last 3 Months' },
    { key: 'all', label: 'All Time' }
  ];

  return (
    <DashboardLayout
      title="Shift History"
      subtitle="View your completed shift records"
      loading={loading}
      error={error}
    >
      {/* Filter Section */}
      <div className={styles.filterSection}>
        <div className={styles.filterTabs}>
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              className={`${styles.filterTab} ${dateFilter === tab.key ? styles.active : ''}`}
              onClick={() => setDateFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={styles.resultCount}>
          {shifts.length} completed shift{shifts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Shifts Grid */}
      {shifts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Clock size={40} />
          </div>
          <h3 className={styles.emptyTitle}>No completed shifts found</h3>
          <p className={styles.emptyDescription}>
            Your completed shift records will appear here.
          </p>
        </div>
      ) : (
        <div className={styles.shiftsGrid}>
          {shifts.map((shift, index) => (
            <motion.div
              key={shift._id}
              className={styles.shiftCard}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              {/* Card Header */}
              <div className={styles.shiftHeader}>
                <div className={styles.shiftDateTime}>
                  <span className={styles.shiftDateBadge}>
                    <Calendar size={12} />
                    {formatDate(shift.startDate)}
                  </span>
                  <span className={styles.shiftTimeBadge}>
                    <Clock size={12} />
                    {shift.shift}
                  </span>
                </div>
                <div className={`${styles.lockBadge} ${shift.isLocked ? styles.locked : styles.unlocked}`}>
                  {shift.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                  {shift.isLocked ? 'Locked' : 'Unlocked'}
                </div>
              </div>

              {/* Card Body */}
              <div className={styles.shiftBody}>
                {/* Client Info */}
                <div className={styles.clientInfo}>
                  <div className={styles.clientAvatar}>
                    {(shift.clientId?.name || 'C')[0].toUpperCase()}
                  </div>
                  <div className={styles.clientDetails}>
                    <h4 className={styles.clientName}>{shift.clientId?.name || 'Unknown Client'}</h4>
                    {shift.clientId?.careLevel && (
                      <span className={`${styles.careLevelBadge} ${styles[shift.clientId.careLevel.toLowerCase()]}`}>
                        {shift.clientId.careLevel} Care
                      </span>
                    )}
                  </div>
                </div>

                {/* Location */}
                {shift.clientId?.address && (
                  <div className={styles.locationInfo}>
                    <MapPin size={14} />
                    <span>{shift.clientId.address}</span>
                  </div>
                )}

                {/* Completion Info */}
                {shift.completedAt && (
                  <div className={styles.completedInfo}>
                    <CheckCircle size={14} />
                    <span>Completed: {formatTimestamp(shift.completedAt)}</span>
                  </div>
                )}

                {/* Shift Notes */}
                {shift.shiftNotes && (
                  <div className={styles.notesSection}>
                    <div className={styles.notesHeader}>
                      <FileText size={14} />
                      <span>Shift Notes</span>
                    </div>
                    <p className={styles.notesContent}>{shift.shiftNotes}</p>
                  </div>
                )}

                {/* Client Notes from Note model */}
                {shift.clientNotes && shift.clientNotes.length > 0 && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                      <FileText size={14} />
                      <span>Client Notes ({shift.clientNotes.length})</span>
                    </div>
                    {shift.clientNotes.map(note => {
                      const isUnlocked = note.status === 'Review' && !note.isLocked;
                      const preview = note.entries && note.entries.length > 0
                        ? note.entries[0].content.substring(0, 120) + (note.entries[0].content.length > 120 ? '...' : '')
                        : (note.content || '').substring(0, 120) + ((note.content || '').length > 120 ? '...' : '');
                      return (
                        <div key={note._id} style={{
                          padding: '10px',
                          marginBottom: '6px',
                          borderRadius: '6px',
                          border: isUnlocked ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                          backgroundColor: isUnlocked ? '#fffbeb' : '#f9fafb'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: isUnlocked ? '#fef3c7' : note.status === 'Approved' ? '#dcfce7' : note.status === 'Submitted' ? '#dbeafe' : '#f3f4f6',
                              color: isUnlocked ? '#92400e' : note.status === 'Approved' ? '#15803d' : note.status === 'Submitted' ? '#1e40af' : '#374151'
                            }}>
                              {isUnlocked ? 'Unlocked - Needs Edit' : note.status}
                            </span>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                              {note.shift}
                            </span>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>
                            {preview}
                          </p>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                            {isUnlocked && (
                              <button
                                onClick={() => navigate(`/staff/clients/${shift.clientId?._id}/notes`)}
                                style={{
                                  padding: '5px 12px',
                                  backgroundColor: '#f59e0b',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Edit3 size={12} />
                                Edit Note
                              </button>
                            )}
                            {!note.isLocked && (
                              <button
                                onClick={() => handleDeleteNote(note._id)}
                                style={{
                                  padding: '5px 12px',
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Delete Shift Button */}
                <div style={{ marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                  <button
                    onClick={() => handleDeleteShift(shift._id)}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    Delete Shift
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
