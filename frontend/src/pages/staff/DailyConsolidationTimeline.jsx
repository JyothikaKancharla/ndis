import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import { ClipboardList, Clock, Check, X, AlertCircle, Edit3, Save, Mic, PenLine, Paperclip } from 'lucide-react';
import api from "../../api/api";
import DashboardLayout from '../../components/layout/DashboardLayout';
import styles from './DailyConsolidationTimeline.module.css';

export default function DailyConsolidationTimeline() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [client, setClient] = useState(null);
  const [confirmedChecked, setConfirmedChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContents, setEditContents] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const notesRes = await api.get(`/api/staff/clients/${clientId}/notes`);
        const allNotes = Array.isArray(notesRes.data) ? notesRes.data : (notesRes.data?.data || []);

        if (allNotes.length > 0 && allNotes[0].clientId) {
          const clientData = typeof allNotes[0].clientId === 'object' ? allNotes[0].clientId : { name: 'Client' };
          setClient(clientData);
        }

        // Filter for Review notes (not locked)
        const reviewNotes = allNotes.filter(n => {
          if (!n.createdAt) return false;
          return n.status === 'Review' && !n.isLocked;
        });

        reviewNotes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setNotes(reviewNotes);
        setLoading(false);
      } catch (err) {
        console.error("Error loading notes:", err);
        setError("Failed to load notes");
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId]);

  const handleCancel = () => {
    navigate(`/staff/clients/${clientId}/notes`);
  };

  const handleConfirm = async () => {
    if (!confirmedChecked) return;

    setSaving(true);
    try {
      await api.post(`/api/staff/clients/${clientId}/notes/confirm-review`);
      navigate(`/staff/clients/${clientId}/notes`);
    } catch (err) {
      console.error('Error confirming review notes:', err);
      setError(err.response?.data?.message || 'Failed to confirm review notes');
    }
    setSaving(false);
  };

  const handleStartEdit = (note) => {
    setEditingNoteId(note._id);
    setEditContents(prev => ({ ...prev, [note._id]: note.content }));
  };

  const handleSaveEdit = async (noteId) => {
    const newContent = editContents[noteId]?.trim();
    if (!newContent) {
      setError('Note content cannot be empty');
      return;
    }

    setSavingEdit(true);
    try {
      await api.put(`/api/staff/clients/${clientId}/notes/${noteId}`, {
        content: newContent
      });
      setNotes(prev => prev.map(n =>
        n._id === noteId ? { ...n, content: newContent } : n
      ));
      setEditingNoteId(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save edit');
    }
    setSavingEdit(false);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
  };

  const getNoteTypeIcon = (noteType) => {
    switch (noteType) {
      case 'voice': return <Mic size={14} />;
      case 'file': return <Paperclip size={14} />;
      default: return <PenLine size={14} />;
    }
  };

  const getNoteTypeLabel = (noteType) => {
    switch (noteType) {
      case 'voice': return 'Voice';
      case 'file': return 'File';
      default: return 'Text';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const headerRight = (
    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)' }}>
      {notes.length} note{notes.length !== 1 ? 's' : ''} in review
    </span>
  );

  if (!loading && notes.length === 0) {
    return (
      <DashboardLayout
        title="Review Notes"
        subtitle={client?.name ? `${client.name}'s notes in review` : "Notes in review"}
        headerRight={headerRight}
        loading={loading}
      >
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <ClipboardList size={40} />
          </div>
          <h3 className={styles.emptyTitle}>No notes to review</h3>
          <p className={styles.emptyDescription}>
            There are no notes in review. Write or record some notes first.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Review Notes"
      subtitle={client?.name ? `Review ${client.name}'s notes before consolidation` : "Review notes before consolidation"}
      headerRight={headerRight}
      loading={loading}
    >
      <motion.div
        className={styles.timelineContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Timeline */}
        <motion.div
          className={styles.timeline}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {notes.map((note, index) => {
            const noteTime = new Date(note.createdAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const isEditing = editingNoteId === note._id;

            return (
              <motion.div
                key={note._id || index}
                className={styles.timelineItem}
                variants={itemVariants}
              >
                {/* Time Display */}
                <div className={styles.timeDisplay}>
                  <Clock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {noteTime}
                </div>

                {/* Timeline Dot */}
                <div className={styles.timelineDot}></div>

                {/* Note Card */}
                <div className={styles.noteCard}>
                  {isEditing ? (
                    <>
                      {/* For file notes, don't allow text editing - only show message */}
                      {note.noteType === 'file' ? (
                        <div className={styles.fileEditMessage}>
                          <AlertCircle size={20} />
                          <p>File notes cannot be edited. Please delete and re-upload if needed.</p>
                          <button
                            className={styles.cancelEditBtn}
                            onClick={handleCancelEdit}
                          >
                            <X size={14} />
                            Close
                          </button>
                        </div>
                      ) : (
                        <>
                          <textarea
                            className={styles.editTextarea}
                            value={editContents[note._id] || ''}
                            onChange={(e) => setEditContents(prev => ({
                              ...prev,
                              [note._id]: e.target.value
                            }))}
                            autoFocus
                          />
                          <div className={styles.editActions}>
                            <button
                              className={styles.saveEditBtn}
                              onClick={() => handleSaveEdit(note._id)}
                              disabled={savingEdit}
                            >
                              <Save size={14} />
                              {savingEdit ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              className={styles.cancelEditBtn}
                              onClick={handleCancelEdit}
                              disabled={savingEdit}
                            >
                              <X size={14} />
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Show images if file note with attachments, otherwise show content */}
                      {note.noteType === 'file' && note.attachments && note.attachments.length > 0 ? (
                        <div className={styles.attachmentsDisplay}>
                          {note.attachments.map((att, i) => {
                            const isImage = att.mimetype && att.mimetype.startsWith('image/');
                            const fileUrl = `http://localhost:5000/${att.path}`;

                            return isImage ? (
                              <div key={att._id || i} className={styles.imageAttachment}>
                                <img src={fileUrl} alt={att.originalName} className={styles.attachmentImage} />
                                <span className={styles.attachmentName}>{att.originalName}</span>
                              </div>
                            ) : (
                              <div key={att._id || i} className={styles.fileAttachment}>
                                <Paperclip size={14} />
                                <span>{att.originalName}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={styles.noteContent}>
                          {note.content}
                        </div>
                      )}

                      <div className={styles.noteMeta}>
                        <span className={styles.noteTypeBadge}>
                          {getNoteTypeIcon(note.noteType)}
                          {getNoteTypeLabel(note.noteType)}
                        </span>
                        <span>Created: {new Date(note.createdAt).toLocaleString()}</span>
                        {/* Only show Edit button for text/voice notes, not file notes */}
                        {note.noteType !== 'file' && (
                          <button
                            className={styles.editNoteBtn}
                            onClick={() => handleStartEdit(note)}
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Action Section */}
        <div className={styles.actionSection}>
          {/* Confirmation Checkbox */}
          <div className={styles.confirmationBox}>
            <label className={styles.confirmationLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={confirmedChecked}
                onChange={(e) => setConfirmedChecked(e.target.checked)}
              />
              <Check size={18} color={confirmedChecked ? 'var(--color-success)' : 'var(--color-text-muted)'} />
              <span className={styles.confirmationText}>
                I have reviewed all notes and confirm they are correct
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <motion.button
              className={styles.cancelBtn}
              onClick={handleCancel}
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X size={18} />
              Cancel
            </motion.button>
            <motion.button
              className={styles.submitBtn}
              onClick={handleConfirm}
              disabled={!confirmedChecked || saving}
              whileHover={confirmedChecked && !saving ? { scale: 1.02 } : {}}
              whileTap={confirmedChecked && !saving ? { scale: 0.98 } : {}}
            >
              {saving ? (
                <>Confirming...</>
              ) : (
                <>
                  <Check size={18} />
                  Confirm & Move to Consolidated
                </>
              )}
            </motion.button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              className={styles.error}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
