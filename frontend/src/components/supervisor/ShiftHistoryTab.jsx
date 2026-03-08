import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Calendar, Lock, Unlock, X,
  User, MapPin, CheckCircle, AlertCircle, FileText, Download, Search
} from 'lucide-react';
import api from '../../api/api';
import styles from './ShiftHistoryTab.module.css';

const ShiftHistoryTab = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [unlockModal, setUnlockModal] = useState(null);
  const [unlockReason, setUnlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchShiftHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/shift-history', {
        params: { dateRange: dateFilter }
      });
      setShifts(res.data.data || []);
    } catch (err) {
      setError('Failed to load shift history');
      console.error('Shift history fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchShiftHistory();
  }, [fetchShiftHistory]);

  const handleUnlock = async () => {
    if (!unlockModal || !unlockReason.trim()) return;
    setActionLoading(unlockModal);
    try {
      const res = await api.put(`/api/shift-history/${unlockModal}/unlock`, {
        reason: unlockReason.trim()
      });
      setShifts(prev => prev.map(s => s._id === unlockModal ? { ...s, ...res.data.data, isLocked: false } : s));
      setUnlockModal(null);
      setUnlockReason('');
    } catch (err) {
      console.error('Unlock error:', err);
    } finally {
      setActionLoading(null);
    }
  };


  const handleDownloadExcel = async (period) => {
    try {
      const baseURL = api.defaults.baseURL || 'http://localhost:5000';
      const params = new URLSearchParams({ period });

      const response = await fetch(`${baseURL}/api/shift-history/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Verify the blob is valid
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
      link.download = `Shift_Report_${periodLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message (optional)
      console.log('Excel report downloaded successfully');
    } catch (err) {
      console.error('Download error:', err);
      setError(`Failed to download Excel report: ${err.message}`);
      setTimeout(() => setError(''), 5000);
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
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' }
  ];

  // Filter shifts based on search query
  const filteredShifts = shifts.filter(shift => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const clientName = shift.clientId?.name?.toLowerCase() || '';
    const staffName = shift.staffId?.name?.toLowerCase() || '';

    return clientName.includes(query) || staffName.includes(query);
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Loading shift history...</p>
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

      {/* Filter Bar */}
      <div className={styles.filterSection}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
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

          {/* Search Bar */}
          <div className={styles.searchContainer}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by client or staff name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={styles.clearSearch}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className={styles.resultCount}>
            {filteredShifts.length} of {shifts.length} shift{shifts.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleDownloadExcel('today')}
              className={styles.downloadBtn}
              title="Download Today's Report"
            >
              <Download size={16} />
              <span>Today</span>
            </button>
            <button
              onClick={() => handleDownloadExcel('week')}
              className={styles.downloadBtn}
              title="Download Weekly Report"
            >
              <Download size={16} />
              <span>Week</span>
            </button>
            <button
              onClick={() => handleDownloadExcel('month')}
              className={styles.downloadBtn}
              title="Download Monthly Report"
            >
              <Download size={16} />
              <span>Month</span>
            </button>
            <button
              onClick={() => handleDownloadExcel('year')}
              className={styles.downloadBtn}
              title="Download Yearly Report"
            >
              <Download size={16} />
              <span>Year</span>
            </button>
          </div>
        </div>
      </div>

      {/* Shifts Grid */}
      {filteredShifts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Clock size={40} />
          </div>
          <h3 className={styles.emptyTitle}>
            {searchQuery ? 'No shifts match your search' : 'No completed shifts found'}
          </h3>
          <p className={styles.emptyDescription}>
            {searchQuery ? 'Try a different search term' : 'Completed shift records will appear here.'}
          </p>
        </div>
      ) : (
        <div className={styles.shiftsGrid}>
          {filteredShifts.map((shift, index) => (
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

                {/* Staff Info */}
                <div className={styles.staffInfo}>
                  <User size={14} />
                  <span>Staff: <strong>{shift.staffId?.name || 'Unknown Staff'}</strong></span>
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

                {/* Shift Notes - Only show if notes exist */}
                {shift.shiftNotes && shift.shiftNotes.trim() && (
                  <div className={styles.notesSection}>
                    <div className={styles.notesHeader}>
                      <FileText size={14} />
                      <span>Shift Notes</span>
                    </div>
                    <p className={styles.notesContent}>
                      {shift.shiftNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer - Removed unlock/lock buttons as per requirement */}
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
                Unlock Shift Record
              </h3>
              <p className={styles.modalDescription}>
                Please provide a reason for unlocking this shift record. This will be logged for audit purposes.
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

export default ShiftHistoryTab;
