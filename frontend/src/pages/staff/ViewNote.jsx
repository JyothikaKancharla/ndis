import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Mic, ClipboardList, Calendar, Clock, Lock, CheckCircle, PenLine, Paperclip, TrendingUp } from 'lucide-react';
import api from '../../api/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import NoteAnalysisPanel from '../../components/NoteAnalysisPanel';
import styles from './ViewNote.module.css';

export default function ViewNote() {
  const { clientId, noteId } = useParams();
  const location = useLocation();
  const isSupervisor = location.pathname.startsWith('/supervisor');
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        if (isSupervisor) {
          const res = await api.get(`/api/supervisor/notes/${noteId}`);
          setNote(res.data?.data || null);
          if (!res.data?.data) setError('Note not found');
        } else {
          const res = await api.get(`/api/staff/clients/${clientId}/notes`);
          const notes = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          const found = notes.find(n => n._id === noteId);
          if (found) {
            setNote(found);
          } else {
            setError('Note not found');
          }
        }
      } catch (err) {
        setError('Failed to load note');
      }
      setLoading(false);
    };
    fetchNote();
  }, [clientId, noteId, isSupervisor]);

  const getNoteTypeIcon = (type) => {
    switch (type) {
      case 'voice': return <Mic size={16} />;
      case 'consolidated': return <ClipboardList size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getNoteTypeLabel = (type) => {
    switch (type) {
      case 'voice': return 'Voice Note';
      case 'consolidated': return 'Consolidated Summary';
      default: return 'Text Note';
    }
  };

  const getDisplayStatus = (n) => {
    if (n.status === 'Submitted') return 'Submitted';
    if (n.status === 'Approved' && n.isLocked) return 'Approved';
    if (n.status === 'Pending' && n.isLocked) return 'Pending';
    if (n.status === 'Rejected') return 'Rejected';
    if (!n.isLocked && n.unlockedAt) return 'Unlocked';
    if (n.status === 'Consolidated') return 'Consolidated';
    if (n.status === 'Review') return 'In Review';
    return 'Draft';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Clinical Analysis Functions
  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post(`/api/notes/${noteId}/analyze`);
      setAnalysis(res.data.data);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const baseURL = api.defaults.baseURL || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/notes/${noteId}/analysis-report`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clinical-analysis-${noteId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  if (error || !note) {
    return (
      <DashboardLayout
        title="Note Not Found"
        loading={loading}
        error={error}
      >
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="View Note"
      subtitle="Read-only view of the note"
      loading={loading}
    >
      <motion.div
        className={styles.document}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Document Header */}
        <div className={styles.documentHeader}>
          <div className={styles.noteType}>
            {getNoteTypeIcon(note.noteType)}
            {getNoteTypeLabel(note.noteType)}
          </div>
          <h1 className={styles.documentTitle}>
            {note.noteType === 'consolidated' ? 'Daily Summary' : 'Staff Note'}
          </h1>
          <div className={styles.documentMeta}>
            <span className={styles.metaItem}>
              <Calendar size={14} />
              {new Date(note.shiftDate || note.createdAt).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            {note.shift && (
              <span className={styles.metaItem}>
                <Clock size={14} />
                {note.shift}
              </span>
            )}
          </div>
        </div>

        {/* Document Body */}
        <div className={styles.documentBody}>
          {/* Status Bar */}
          <div className={styles.statusBar}>
            <div className={`${styles.statusBadge} ${
              getDisplayStatus(note) === 'Submitted' ? styles.submittedBadge :
              getDisplayStatus(note) === 'Locked' ? styles.lockedBadge :
              getDisplayStatus(note) === 'Rejected' ? styles.rejectedBadge :
              getDisplayStatus(note) === 'Unlocked' ? styles.unlockedBadge : ''
            }`}>
              {note.isLocked ? <Lock size={14} /> : <CheckCircle size={14} />}
              {getDisplayStatus(note)}
            </div>
          </div>

          {/* Main Content */}
          {note.entries && note.entries.length > 0 ? (
            <div className={styles.entriesTimeline}>
              {note.entries.map((entry, index) => (
                <div key={index} className={styles.entryItem}>
                  <div className={styles.entryHeader}>
                    <Calendar size={12} />
                    <span className={styles.entryTime}>
                      {new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={styles.entryTypeBadge}>
                      {entry.noteType === 'voice' && <Mic size={12} />}
                      {entry.noteType === 'file' && <Paperclip size={12} />}
                      {(entry.noteType === 'text' || !entry.noteType) && <PenLine size={12} />}
                      {entry.noteType === 'voice' ? 'Voice' : entry.noteType === 'file' ? 'File' : 'Text'}
                    </span>
                  </div>
                  {/* Only show text content if it's not a file upload placeholder */}
                  {!entry.content.startsWith('File upload:') && !entry.content.includes('image uploaded') ? (
                    <div className={styles.entryBody}>
                      {entry.content}
                    </div>
                  ) : null}

                  {/* Display attachments with images */}
                  {entry.attachments && entry.attachments.length > 0 && (
                    <div className={styles.entryAttachments}>
                      {entry.attachments.map((att, i) => {
                        const isImage = att.mimetype && att.mimetype.startsWith('image/');
                        const fileUrl = `http://localhost:5000/${att.path}`;

                        return isImage ? (
                          <div key={att._id || i} style={{
                            marginBottom: '12px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '2px solid #e5e7eb',
                            maxWidth: '300px'
                          }}>
                            <img
                              src={fileUrl}
                              alt={att.originalName}
                              style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '300px',
                                objectFit: 'contain',
                                display: 'block',
                                background: '#f9fafb'
                              }}
                            />
                            <div style={{
                              padding: '8px',
                              background: '#f9fafb',
                              fontSize: '12px',
                              color: '#666',
                              textAlign: 'center'
                            }}>
                              {att.originalName}
                            </div>
                          </div>
                        ) : (
                          <span key={att._id || i} className={styles.entryAttachmentChip}>
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
            <div className={styles.noteContent}>
              {note.content}
            </div>
          )}

          {/* Metadata Footer */}
          <div className={styles.metadataFooter}>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Created</span>
              <span className={styles.metadataValue}>
                {formatDate(note.createdAt)}
              </span>
            </div>
            {note.lockedAt && (
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Locked</span>
                <span className={styles.metadataValue}>
                  {formatDate(note.lockedAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Document Footer */}
        <div className={styles.documentFooter}>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className={styles.analyzeBtn}
          >
            <TrendingUp size={16} />
            {analyzing ? 'Analyzing...' : 'Analyze Note'}
          </button>
        </div>
      </motion.div>

      {/* Analysis Results Panel */}
      {analysis && (
        <NoteAnalysisPanel
          analysis={analysis}
          noteId={noteId}
          onDownload={handleDownloadReport}
        />
      )}
    </DashboardLayout>
  );
}
