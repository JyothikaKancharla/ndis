import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Unlock, User, Calendar, Clock, FileText,
  AlertCircle, Mic, PenLine, ClipboardList
} from 'lucide-react';
import api from '../../api/api';
import styles from './UnlockNotesTab.module.css';

const UnlockNotesTab = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [unlockModal, setUnlockModal] = useState(null);
  const [unlockReason, setUnlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = { status: 'all' };
      if (dateFilter !== 'all') {
        params.dateRange = dateFilter;
      }

      const res = await api.get('/api/supervisor/notes', { params });
      setNotes(res.data.data || []);
    } catch (err) {
      setError('Failed to load notes');
      console.error('Fetch notes error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleUnlock = async () => {
    if (!unlockModal || !unlockReason.trim()) return;
    setActionLoading(unlockModal);
    try {
      await api.put(`/api/supervisor/notes/${unlockModal}/unlock`, {
        reason: unlockReason.trim()
      });
      // Refresh to get updated status
      fetchNotes();
      setUnlockModal(null);
      setUnlockReason('');
    } catch (err) {
      console.error('Unlock error:', err);
      setError('Failed to unlock note');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) return;
    setActionLoading(noteId);
    try {
      await api.delete(`/api/supervisor/notes/${noteId}`);
      fetchNotes();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete note');
    } finally {
      setActionLoading(null);
    }
  };

  const getDisplayStatus = (note) => {
    if (note.status === 'Submitted') return 'Submitted';
    if (note.status === 'Approved' && note.isLocked) return 'Locked';
    if (note.status === 'Pending' && note.isLocked) return 'Submitted';
    if (note.status === 'Rejected') return 'Rejected';
    if (!note.isLocked && note.unlockedAt) return 'Unlocked';
    if (note.status === 'Consolidated') return 'Consolidated';
    if (note.status === 'Review') return 'In Review';
    return note.status;
  };

  const getStatusBadgeClass = (displayStatus) => {
    switch (displayStatus) {
      case 'Submitted': return styles.submitted;
      case 'Locked': return styles.statusLocked;
      case 'Rejected': return styles.rejected;
      case 'Unlocked': return styles.statusUnlocked;
      case 'Consolidated': return styles.consolidated;
      case 'Draft': return styles.draft;
      default: return styles.draft;
    }
  };

  const getNoteTypeIcon = (type) => {
    switch (type) {
      case 'voice': return <Mic size={12} />;
      case 'consolidated': return <ClipboardList size={12} />;
      default: return <PenLine size={12} />;
    }
  };

  const getNoteTypeLabel = (type) => {
    switch (type) {
      case 'voice': return 'Voice';
      case 'consolidated': return 'Consolidated';
      case 'file': return 'File';
      default: return 'Text';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-AU', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-AU', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  // Filter notes by status tab
  const filteredNotes = statusFilter === 'all'
    ? notes
    : notes.filter(n => getDisplayStatus(n) === statusFilter);

  const statusTabs = [
    { key: 'all', label: 'All Notes' },
    { key: 'Submitted', label: 'Submitted' },
    { key: 'Locked', label: 'Locked' },
    { key: 'Unlocked', label: 'Unlocked' },
    { key: 'Rejected', label: 'Rejected' }
  ];

  const dateTabs = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Last Week' },
    { key: 'month', label: 'Last Month' },
    { key: 'all', label: 'All Time' }
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Loading notes...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Section */}
      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Status</span>
          <div className={styles.filterTabs}>
            {statusTabs.map(tab => (
              <button
                key={tab.key}
                className={`${styles.filterTab} ${statusFilter === tab.key ? styles.active : ''}`}
                onClick={() => setStatusFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Date Range</span>
          <div className={styles.filterTabs}>
            {dateTabs.map(tab => (
              <button
                key={tab.key}
                className={`${styles.filterTab} ${dateFilter === tab.key ? styles.active : ''}`}
                onClick={() => setDateFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.resultCount}>
          {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FileText size={40} />
          </div>
          <h3 className={styles.emptyTitle}>No notes found</h3>
          <p className={styles.emptyDescription}>
            Notes from staff will appear here. Try adjusting the filters.
          </p>
        </div>
      ) : (
        <div className={styles.notesGrid}>
          {filteredNotes.map((note, index) => (
            <motion.div
              key={note._id}
              className={styles.noteCard}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
            >
              {/* Card Header */}
              <div className={styles.noteHeader}>
                <div className={styles.headerBadges}>
                  <span className={styles.typeBadge}>
                    {getNoteTypeIcon(note.noteType)}
                    {getNoteTypeLabel(note.noteType)}
                  </span>
                  <span className={styles.shiftTimeBadge}>
                    <Clock size={12} />
                    {note.shift}
                  </span>
                </div>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(getDisplayStatus(note))}`}>
                  {note.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                  {getDisplayStatus(note)}
                </span>
              </div>

              {/* Card Body */}
              <div className={styles.noteBody}>
                {/* Client Info */}
                <div className={styles.clientRow}>
                  <div className={styles.clientAvatar}>
                    {(note.clientId?.name || note.clientName || 'C')[0].toUpperCase()}
                  </div>
                  <div className={styles.clientDetails}>
                    <h4 className={styles.clientName}>
                      {note.clientId?.name || note.clientName || 'Unknown Client'}
                    </h4>
                    {note.clientId?.careLevel && (
                      <span className={styles.careLevelBadge}>
                        {note.clientId.careLevel} Care
                      </span>
                    )}
                  </div>
                </div>

                {/* Staff & Date Info */}
                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <User size={14} />
                    <span>{note.staffId?.name || 'Unknown Staff'}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Calendar size={14} />
                    <span>{formatDate(note.shiftDate)}</span>
                  </div>
                </div>

                {/* Note Content */}
                <div className={styles.contentSection}>
                  <div className={styles.contentHeader}>
                    <FileText size={14} />
                    <span>Note Content</span>
                    {note.entries && note.entries.length > 0 && (
                      <span className={styles.entriesCount}>
                        {note.entries.length} entr{note.entries.length !== 1 ? 'ies' : 'y'}
                      </span>
                    )}
                  </div>
                  {/* Show images if attachments exist, otherwise show text */}
                  {note.attachments && note.attachments.length > 0 && note.attachments.some(att => att.mimetype && att.mimetype.startsWith('image/')) ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
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
                    <p className={styles.contentText}>
                      {note.entries && note.entries.length > 0
                        ? (note.entries[0].content.length > 200
                            ? note.entries[0].content.substring(0, 200) + '...'
                            : note.entries[0].content)
                        : (note.content.length > 200
                            ? note.content.substring(0, 200) + '...'
                            : note.content)}
                    </p>
                  )}
                </div>

                {/* Lock/Unlock Info */}
                {note.lockedAt && (
                  <div className={styles.lockedInfo}>
                    <Lock size={12} />
                    <span>Locked: {formatTimestamp(note.lockedAt)}</span>
                  </div>
                )}
                {note.unlockedAt && (
                  <div className={styles.lockedInfo}>
                    <Unlock size={12} />
                    <span>Unlocked: {formatTimestamp(note.unlockedAt)}</span>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className={styles.noteFooter}>
                {note.isLocked && (
                  <button
                    className={styles.unlockBtn}
                    onClick={() => { setUnlockModal(note._id); setUnlockReason(''); }}
                    disabled={actionLoading === note._id}
                  >
                    <Unlock size={14} />
                    Unlock for Editing
                  </button>
                )}
                <button
                  onClick={() => handleDelete(note._id)}
                  disabled={actionLoading === note._id}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: actionLoading === note._id ? 0.6 : 1
                  }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Unlock Modal */}
      <AnimatePresence>
        {unlockModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setUnlockModal(null)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>
                <Unlock size={20} />
                Unlock Note
              </h3>
              <p className={styles.modalDescription}>
                This will allow the staff member to edit and resubmit this note.
                Please provide a reason for unlocking.
              </p>
              <textarea
                className={styles.modalTextarea}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="Enter reason for unlocking..."
                rows={3}
              />
              <div className={styles.modalActions}>
                <button
                  className={styles.modalCancelBtn}
                  onClick={() => setUnlockModal(null)}
                >
                  Cancel
                </button>
                <button
                  className={styles.modalConfirmBtn}
                  onClick={handleUnlock}
                  disabled={!unlockReason.trim() || actionLoading === unlockModal}
                >
                  <Unlock size={14} />
                  Confirm Unlock
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnlockNotesTab;
