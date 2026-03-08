import { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, PenLine, ClipboardList, FileText, Lock, Unlock, Eye, Calendar, Upload, X, Paperclip, Image, File, Send, Check, Car, CalendarPlus, AlertTriangle } from 'lucide-react';
import api from '../../api/api';
import { AuthContext } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import IncidentConfirmationModal from '../../components/IncidentConfirmationModal';
import { getAssignmentDateStatus, formatDateForDisplay } from '../../utils/shiftStatus';
import styles from './ClientNotes.module.css';

export default function ClientNotes() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [notes, setNotes] = useState([]);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [lockingSending, setLockingSending] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentDetails, setIncidentDetails] = useState(null);
  const fileInputRef = useRef(null);
  const [assignment, setAssignment] = useState(null);
  const [shiftStatus, setShiftStatus] = useState(null);
  const [startOdometer, setStartOdometer] = useState('');
  const [endOdometer, setEndOdometer] = useState('');
  const [savingOdometer, setSavingOdometer] = useState(false);
  const [odometerSaved, setOdometerSaved] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (!clientId || !user?.id) return;

    if (showLoading) setLoading(true);
    try {
      const notesRes = await api.get(`/api/staff/clients/${clientId}/notes?t=${Date.now()}`);
      const notesData = notesRes.data?.data || notesRes.data || [];
      setNotes(notesData);

      if (notesData.length > 0 && notesData[0].clientId) {
        setClient(notesData[0].clientId);
      } else {
        const clientsRes = await api.get(`/api/staff/clients`);
        const clientsList = clientsRes.data?.data || clientsRes.data || [];
        const foundClient = clientsList.find(c => c._id === clientId);
        if (foundClient) {
          setClient(foundClient);
        }
      }

      try {
        const assignmentRes = await api.get(`/api/staff/clients/${clientId}/assignment`);
        const assignmentData = assignmentRes.data?.data || assignmentRes.data;
        setAssignment(assignmentData);

        if (assignmentData) {
          const status = getAssignmentDateStatus(assignmentData.startDate, assignmentData.shift);
          setShiftStatus(status);

          if (assignmentData.startOdometer !== null && assignmentData.startOdometer !== undefined) {
            setStartOdometer(String(assignmentData.startOdometer));
          }
          if (assignmentData.endOdometer !== null && assignmentData.endOdometer !== undefined) {
            setEndOdometer(String(assignmentData.endOdometer));
          }
          if (assignmentData.startOdometer !== null || assignmentData.endOdometer !== null) {
            setOdometerSaved(true);
          }
        }
      } catch (assignmentErr) {
        console.error('Error fetching assignment:', assignmentErr);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error loading notes");
    }
    if (showLoading) setLoading(false);
  }, [clientId, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (assignment) {
        const status = getAssignmentDateStatus(assignment.startDate, assignment.shift);
        setShiftStatus(status);
      }
    }, 60 * 1000);

    const handleFocus = () => {
      fetchData(false);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData, assignment]);


  const handleUnlockNote = async (noteId) => {
    if (!window.confirm('Unlock this note for editing?')) return;

    try {
      await api.post(`/api/staff/clients/${clientId}/notes/${noteId}/unlock`);
      const notesRes = await api.get(`/api/staff/clients/${clientId}/notes?t=${Date.now()}`);
      setNotes(notesRes.data?.data || notesRes.data || []);
    } catch (err) {
      setError('Failed to unlock note');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async () => {
    if (uploadFiles.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      uploadFiles.forEach(file => {
        formData.append('files', file);
      });

      await api.post(`/api/staff/clients/${clientId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const notesRes = await api.get(`/api/staff/clients/${clientId}/notes?t=${Date.now()}`);
      setNotes(notesRes.data?.data || notesRes.data || []);

      setShowFileUpload(false);
      setUploadFiles([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload files');
    }
    setUploading(false);
  };

  const handleLockAndSend = async (incidentConfirmed = false) => {
    if (!incidentConfirmed && !window.confirm('Lock all consolidated notes and send to supervisor? This cannot be undone.')) return;

    setLockingSending(true);
    setError("");

    try {
      await api.post(`/api/staff/clients/${clientId}/notes/lock-and-send`, {
        incidentConfirmed
      });
      await fetchData(false);
      setShowIncidentModal(false);
      setLockingSending(false);
    } catch (err) {
      console.log('Lock & Send Error:', err.response?.data);

      // PRIORITY: Check if incident was detected
      if (err.response?.data?.incident_detected === true) {
        console.log('Incident detected - showing modal');
        setIncidentDetails(err.response.data.incident_details);
        setShowIncidentModal(true);
        setLockingSending(false);
        setError(""); // Clear any error message
        return; // Exit early - don't show error
      }

      // Other errors
      console.error('Lock & Send failed:', err);
      setError(err.response?.data?.message || 'Failed to lock and send notes');
      setLockingSending(false);
    }
  };

  const handleConfirmNoIncident = async () => {
    await handleLockAndSend(true); // Retry with incident confirmed
  };

  const handleAddIncident = () => {
    setShowIncidentModal(false);
    navigate(`/staff/clients/${clientId}/incident`);
  };

  const handleSaveOdometer = async () => {
    setSavingOdometer(true);
    try {
      const data = {};
      if (startOdometer) data.startOdometer = parseFloat(startOdometer);
      if (endOdometer) data.endOdometer = parseFloat(endOdometer);
      await api.put(`/api/staff/clients/${clientId}/odometer`, data);
      setOdometerSaved(true);
      fetchData(false);
    } catch (err) {
      setError('Failed to save odometer reading');
    } finally {
      setSavingOdometer(false);
    }
  };

  const calculatedDistance = startOdometer && endOdometer && parseFloat(endOdometer) > parseFloat(startOdometer)
    ? (parseFloat(endOdometer) - parseFloat(startOdometer)).toFixed(1)
    : null;

  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith('image/')) return <Image size={16} />;
    return <File size={16} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getDisplayStatus = (note) => {
    if (note.status === 'Submitted') return 'Submitted';
    if (note.status === 'Approved' && note.isLocked) return 'Approved';
    if (note.status === 'Pending' && note.isLocked) return 'Pending';
    if (note.status === 'Rejected') return 'Rejected';
    if (!note.isLocked && note.unlockedAt) return 'Unlocked';
    if (note.status === 'Consolidated') return 'Consolidated';
    if (note.status === 'Review') return 'In Review';
    return 'Draft';
  };

  const getStatusBadgeClass = (displayStatus) => {
    switch (displayStatus) {
      case 'Submitted': return styles.submitted;
      case 'Approved': return styles.approved;
      case 'Pending': return styles.submitted;
      case 'Rejected': return styles.rejected;
      case 'Unlocked': return styles.unlocked;
      case 'Consolidated': return styles.consolidatedBadge;
      case 'In Review': return styles.review;
      default: return styles.draft;
    }
  };

  // Shift status helpers
  const isShiftActive = shiftStatus?.status === 'Current';
  const canCreateNotes = isShiftActive;

  const getDisabledReason = () => {
    if (!shiftStatus) return 'Loading shift information...';
    switch (shiftStatus.status) {
      case 'Pending':
        return `Shift starts ${shiftStatus.badge}`;
      case 'Previous':
        return `Shift ended ${shiftStatus.badge}`;
      default:
        return 'You can only create notes during your active shift';
    }
  };

  // Section A: Notes in Review
  const reviewNotes = notes.filter(note =>
    note.status === 'Review' && !note.isLocked
  );

  // Section B: Consolidated Notes (not yet submitted)
  const consolidatedNotes = notes.filter(note =>
    note.status === 'Consolidated' && !note.isLocked
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Section C: Submitted/Locked Notes
  const submittedNotes = notes.filter(note =>
    note.status === 'Submitted' || note.isLocked
  );

  const headerRight = (
    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)' }}>
      {notes.length} note{notes.length !== 1 ? 's' : ''} recorded
    </span>
  );

  return (
    <DashboardLayout
      title={client?.name ? `${client.name}'s Notes` : 'Client Notes'}
      subtitle="View and manage client notes"
      headerRight={headerRight}
      loading={loading}
      error={error}
    >
      {/* Shift Status Banner */}
      {shiftStatus && assignment && (
        <div className={styles.shiftStatusBanner}>
          <span className={styles.shiftStatusIcon}>
            {shiftStatus.status === 'Current' ? '🟢' : shiftStatus.status === 'Pending' ? '🟡' : '⚫'}
          </span>
          <div className={styles.shiftStatusText}>
            <div className={styles.shiftDateTimeBadges}>
              <span className={styles.shiftDateBadge}>
                <Calendar size={14} />
                {formatDateForDisplay(assignment.startDate).relative || 'Unknown'}
              </span>
              <span className={styles.shiftTimeBadge}>
                {assignment.shift}
              </span>
            </div>
            <span>{shiftStatus.badge}</span>
          </div>
          {!isShiftActive && (
            <div className={styles.shiftStatusMessage}>
              Note creation is only available during active shifts
            </div>
          )}
        </div>
      )}

      {/* Travel Tracking Section */}
      {assignment && (
        <div className={styles.travelTrackingSection}>
          <div className={styles.travelHeader}>
            <Car size={18} />
            <span>Travel Tracking</span>
            {odometerSaved && (
              <span className={styles.odometerSavedBadge}>
                <Check size={12} /> Saved
              </span>
            )}
          </div>
          <div className={styles.odometerRow}>
            <div className={styles.odometerField}>
              <label>Start Odometer (km)</label>
              <input
                type="number"
                className={styles.odometerInput}
                placeholder="e.g. 45000"
                value={startOdometer}
                onChange={(e) => { setStartOdometer(e.target.value); setOdometerSaved(false); }}
                min="0"
                step="0.1"
              />
            </div>
            <div className={styles.odometerField}>
              <label>End Odometer (km)</label>
              <input
                type="number"
                className={styles.odometerInput}
                placeholder="e.g. 45032"
                value={endOdometer}
                onChange={(e) => { setEndOdometer(e.target.value); setOdometerSaved(false); }}
                min="0"
                step="0.1"
              />
            </div>
          </div>
          {calculatedDistance && (
            <div className={styles.odometerDistance}>
              Total Distance: <strong>{calculatedDistance} km</strong>
            </div>
          )}
          <div className={styles.odometerActions}>
            <button
              className={styles.odometerSaveBtn}
              onClick={handleSaveOdometer}
              disabled={savingOdometer || (!startOdometer && !endOdometer)}
            >
              {savingOdometer ? 'Saving...' : 'Save Odometer'}
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <motion.button
          className={`${styles.actionBtn} ${styles.voiceBtn}`}
          onClick={() => navigate(`/staff/clients/${clientId}/voice-note`)}
          disabled={!canCreateNotes}
          title={!canCreateNotes ? getDisabledReason() : 'Record a voice note'}
          whileHover={canCreateNotes ? { scale: 1.02 } : {}}
          whileTap={canCreateNotes ? { scale: 0.98 } : {}}
        >
          <Mic size={20} />
          Record Voice Note
        </motion.button>
        <motion.button
          className={`${styles.actionBtn} ${styles.textBtn}`}
          onClick={() => navigate(`/staff/clients/${clientId}/write-note`)}
          disabled={!canCreateNotes}
          title={!canCreateNotes ? getDisabledReason() : 'Write a text note'}
          whileHover={canCreateNotes ? { scale: 1.02 } : {}}
          whileTap={canCreateNotes ? { scale: 0.98 } : {}}
        >
          <PenLine size={20} />
          Write Text Note
        </motion.button>
        <motion.button
          className={`${styles.actionBtn} ${styles.fileBtn}`}
          onClick={() => setShowFileUpload(true)}
          disabled={!canCreateNotes}
          title={!canCreateNotes ? getDisabledReason() : 'Upload files'}
          whileHover={canCreateNotes ? { scale: 1.02 } : {}}
          whileTap={canCreateNotes ? { scale: 0.98 } : {}}
        >
          <Upload size={20} />
          Upload Files
        </motion.button>
        <motion.button
          className={`${styles.actionBtn} ${styles.incidentBtn}`}
          onClick={() => navigate(`/staff/clients/${clientId}/incident`)}
          disabled={!canCreateNotes}
          title={!canCreateNotes ? getDisabledReason() : 'Report an incident'}
          whileHover={canCreateNotes ? { scale: 1.02 } : {}}
          whileTap={canCreateNotes ? { scale: 0.98 } : {}}
        >
          <AlertTriangle size={20} />
          Incident
        </motion.button>
        <motion.button
          className={`${styles.actionBtn} ${styles.appointmentBtn}`}
          onClick={() => navigate(`/staff/clients/${clientId}/view-appointments`)}
          title="View appointments for this client"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <CalendarPlus size={20} />
          Appointments
        </motion.button>
        <motion.button
          className={`${styles.actionBtn} ${styles.consolidationBtn}`}
          onClick={() => navigate(`/staff/clients/${clientId}/daily-consolidation`)}
          disabled={reviewNotes.length === 0}
          title={reviewNotes.length === 0 ? 'No notes in review to confirm' : 'Review and confirm notes'}
          whileHover={reviewNotes.length > 0 ? { scale: 1.02 } : {}}
          whileTap={reviewNotes.length > 0 ? { scale: 0.98 } : {}}
        >
          <ClipboardList size={20} />
          Review & Confirm Notes
        </motion.button>
      </div>

      {/* File Upload Modal */}
      <AnimatePresence>
        {showFileUpload && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !uploading && setShowFileUpload(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3>Upload Files</h3>
                <button
                  className={styles.modalClose}
                  onClick={() => !uploading && setShowFileUpload(false)}
                  disabled={uploading}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div
                  className={styles.dropZone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={40} strokeWidth={1} />
                  <p>Click to select files or drag and drop</p>
                  <span>Supports: Images only (JPEG, PNG, GIF, WebP - Max 10MB each)</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    style={{ display: 'none' }}
                  />
                </div>

                {uploadFiles.length > 0 && (
                  <div className={styles.fileList}>
                    {uploadFiles.map((file, index) => (
                      <div key={index} className={styles.fileItem}>
                        {/* Show image preview for image files */}
                        {file.type.startsWith('image/') ? (
                          <div className={styles.imagePreview}>
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className={styles.previewImage}
                            />
                            <div className={styles.imageInfo}>
                              <span className={styles.fileName}>{file.name}</span>
                              <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.fileInfo}>
                            {getFileIcon(file.type)}
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                          </div>
                        )}
                        <button
                          className={styles.removeFile}
                          onClick={() => removeFile(index)}
                          disabled={uploading}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setShowFileUpload(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  className={styles.uploadBtn}
                  onClick={handleFileUpload}
                  disabled={uploading || uploadFiles.length === 0}
                >
                  {uploading ? 'Uploading...' : `Upload ${uploadFiles.length} File${uploadFiles.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section A: Notes in Review */}
      {reviewNotes.length > 0 && (
        <div className={styles.pendingConsolidationSection}>
          <div className={styles.pendingConsolidationHeader}>
            <h2 className={styles.sectionTitle}>
              <ClipboardList size={20} />
              Notes in Review ({reviewNotes.length} note{reviewNotes.length !== 1 ? 's' : ''})
            </h2>
            <motion.button
              className={styles.consolidateNowBtn}
              onClick={() => navigate(`/staff/clients/${clientId}/daily-consolidation`)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Check size={18} />
              Review & Confirm
            </motion.button>
          </div>
          <p className={styles.pendingConsolidationDescription}>
            These notes are waiting to be reviewed and confirmed. Click "Review & Confirm" to move them to Consolidated.
          </p>
          <div className={styles.pendingNotesList}>
            {reviewNotes.slice(0, 3).map((note) => (
              <div key={note._id} className={styles.pendingNotePreview}>
                <span className={styles.pendingNoteTime}>
                  {new Date(note.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={styles.pendingNoteType}>
                  {note.noteType === 'voice' ? 'Voice' : note.noteType === 'file' ? 'File' : 'Text'}
                </span>

                {/* Show images if it's a file note with image attachments */}
                {note.noteType === 'file' && note.attachments && note.attachments.length > 0 ? (
                  <div className={styles.pendingNoteImages}>
                    {note.attachments.filter(att => att.mimetype && att.mimetype.startsWith('image/')).map((att, i) => {
                      const fileUrl = `http://localhost:5000/${att.path}`;
                      return (
                        <div key={att._id || i} className={styles.pendingImageThumb}>
                          <img src={fileUrl} alt={att.originalName} />
                        </div>
                      );
                    })}
                    {note.attachments.length > note.attachments.filter(att => att.mimetype && att.mimetype.startsWith('image/')).length && (
                      <span className={styles.pendingNoteContent}>
                        + {note.attachments.length - note.attachments.filter(att => att.mimetype && att.mimetype.startsWith('image/')).length} other file(s)
                      </span>
                    )}
                  </div>
                ) : (
                  <span className={styles.pendingNoteContent}>
                    {note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}
                  </span>
                )}
              </div>
            ))}
            {reviewNotes.length > 3 && (
              <div className={styles.pendingNoteMore}>
                +{reviewNotes.length - 3} more note{reviewNotes.length - 3 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section B: Consolidated Notes */}
      {consolidatedNotes.length > 0 && (
        <div className={styles.consolidatedSection}>
          <div className={styles.consolidatedHeader}>
            <h2 className={styles.sectionTitle}>
              <FileText size={20} />
              Consolidated Notes ({consolidatedNotes.length})
            </h2>
            <motion.button
              className={styles.lockSendBtn}
              onClick={() => handleLockAndSend(false)}
              disabled={lockingSending}
              whileHover={!lockingSending ? { scale: 1.02 } : {}}
              whileTap={!lockingSending ? { scale: 0.98 } : {}}
            >
              <Lock size={18} />
              <Send size={16} />
              {lockingSending ? 'Sending...' : 'Confirm, Lock & Send to Supervisor'}
            </motion.button>
          </div>

          {/* Continuous document view */}
          <div className={styles.consolidatedDocument}>
            {consolidatedNotes.map((note, index) => (
              <div key={note._id} className={styles.consolidatedEntry}>
                <div className={styles.entryTimestamp}>
                  <Calendar size={12} />
                  {new Date(note.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  <span className={styles.entryTypeBadge}>
                    {note.noteType === 'voice' && <Mic size={12} />}
                    {note.noteType === 'file' && <Paperclip size={12} />}
                    {(note.noteType === 'text' || !note.noteType) && <PenLine size={12} />}
                    {note.noteType === 'voice' ? 'Voice' : note.noteType === 'file' ? 'File' : 'Text'}
                  </span>
                </div>
                {/* Only show text content if it's not a file-type note or has meaningful content */}
                {note.noteType !== 'file' || !note.content.startsWith('File upload:') ? (
                  <div className={styles.entryContent}>
                    {note.content}
                  </div>
                ) : null}

                {note.attachments && note.attachments.length > 0 && (
                  <div className={styles.entryAttachments}>
                    {note.attachments.map((att, i) => {
                      const isImage = att.mimetype && att.mimetype.startsWith('image/');
                      const fileUrl = `http://localhost:5000/${att.path}`;

                      return isImage ? (
                        <div key={att._id || i} className={styles.attachmentImage}>
                          <img src={fileUrl} alt={att.originalName} className={styles.uploadedImage} />
                          <span className={styles.imageName}>{att.originalName}</span>
                        </div>
                      ) : (
                        <span key={att._id || i} className={styles.attachmentChip}>
                          <Paperclip size={12} /> {att.originalName}
                        </span>
                      );
                    })}
                  </div>
                )}
                {index < consolidatedNotes.length - 1 && <hr className={styles.entrySeparator} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section C: Submitted/Locked Notes */}
      {submittedNotes.length === 0 && reviewNotes.length === 0 && consolidatedNotes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FileText size={64} strokeWidth={1} />
          </div>
          <h3 className={styles.emptyTitle}>No notes yet</h3>
          <p className={styles.emptyDescription}>
            Create notes during your shift. They will go through Review, then Consolidation, before being sent to your supervisor.
          </p>
        </div>
      ) : submittedNotes.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>
            <Lock size={20} />
            Submitted Notes
          </h2>
          {submittedNotes.map((note) => (
            <motion.div
              key={note._id}
              className={styles.submittedDocumentCard}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Document Header */}
              <div className={styles.submittedDocHeader}>
                <div className={styles.badgeGroup}>
                  <span className={`${styles.badge} ${styles.lockedBadge}`}>
                    <Lock size={12} />
                    Locked
                  </span>
                  <span className={`${styles.badge} ${styles.statusBadge} ${getStatusBadgeClass(getDisplayStatus(note))}`}>
                    {getDisplayStatus(note)}
                  </span>
                </div>
                <div className={styles.submittedDocMeta}>
                  <span className={styles.submittedDocDate}>
                    <Calendar size={14} />
                    {new Date(note.shiftDate || note.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  {note.shift && (
                    <span className={styles.submittedDocShift}>
                      {note.shift}
                    </span>
                  )}
                  {note.entries && note.entries.length > 0 && (
                    <span className={styles.submittedDocCount}>
                      {note.entries.length} entr{note.entries.length !== 1 ? 'ies' : 'y'}
                    </span>
                  )}
                </div>
              </div>

              {/* Document Body — entries or plain content */}
              {note.entries && note.entries.length > 0 ? (
                <div className={styles.consolidatedDocument}>
                  {note.entries.map((entry, index) => (
                    <div key={index} className={styles.consolidatedEntry}>
                      <div className={styles.entryTimestamp}>
                        <Calendar size={12} />
                        {new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        <span className={styles.entryTypeBadge}>
                          {entry.noteType === 'voice' && <Mic size={12} />}
                          {entry.noteType === 'file' && <Paperclip size={12} />}
                          {(entry.noteType === 'text' || !entry.noteType) && <PenLine size={12} />}
                          {entry.noteType === 'voice' ? 'Voice' : entry.noteType === 'file' ? 'File' : 'Text'}
                        </span>
                      </div>
                      {/* Only show text content if it's not a file upload placeholder */}
                      {!entry.content.startsWith('File upload:') && !entry.content.includes('image uploaded') ? (
                        <div className={styles.entryContent}>
                          {entry.content}
                        </div>
                      ) : null}

                      {entry.attachments && entry.attachments.length > 0 && (
                        <div className={styles.entryAttachments}>
                          {entry.attachments.map((att, i) => {
                            const isImage = att.mimetype && att.mimetype.startsWith('image/');
                            const fileUrl = `http://localhost:5000/${att.path}`;

                            return isImage ? (
                              <div key={att._id || i} className={styles.attachmentImage}>
                                <img src={fileUrl} alt={att.originalName} className={styles.uploadedImage} />
                                <span className={styles.imageName}>{att.originalName}</span>
                              </div>
                            ) : (
                              <span key={att._id || i} className={styles.attachmentChip}>
                                <Paperclip size={12} /> {att.originalName}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {index < note.entries.length - 1 && <hr className={styles.entrySeparator} />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.consolidatedDocument}>
                  <div className={styles.consolidatedEntry}>
                    <div className={styles.entryContent}>{note.content}</div>
                  </div>
                </div>
              )}

              {/* Document Actions */}
              <div className={styles.submittedDocActions}>
                <button
                  className={styles.viewBtn}
                  onClick={() => navigate(`/staff/clients/${clientId}/notes/${note._id}`)}
                >
                  <Eye size={16} />
                  View Full Note
                </button>
                {note.isLocked && user?.role === 'supervisor' && (
                  <button
                    className={styles.unlockBtn}
                    onClick={() => handleUnlockNote(note._id)}
                  >
                    <Unlock size={16} />
                    Unlock
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </>
      )}

      {/* Incident Confirmation Modal */}
      {showIncidentModal && (
        <IncidentConfirmationModal
          incidentDetails={incidentDetails}
          onAddIncident={handleAddIncident}
          onConfirmNoIncident={handleConfirmNoIncident}
          onCancel={() => setShowIncidentModal(false)}
        />
      )}
    </DashboardLayout>
  );
}
