import { AlertTriangle, FileText, X, CheckCircle } from 'lucide-react';
import styles from './IncidentConfirmationModal.module.css';

const IncidentConfirmationModal = ({ incidentDetails, onAddIncident, onConfirmNoIncident, onCancel }) => {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerIcon}>
            <AlertTriangle size={24} />
          </div>
          <button onClick={onCancel} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          <h2 className={styles.modalTitle}>Incident Report Missing</h2>
          <p className={styles.modalMessage}>
            {incidentDetails?.reminder || 'This note appears to contain an incident. Please confirm before locking notes.'}
          </p>

          {/* Detected Keywords */}
          {incidentDetails?.keywords && incidentDetails.keywords.length > 0 && (
            <div className={styles.keywordsBox}>
              <div className={styles.keywordsLabel}>Detected Keywords:</div>
              <div className={styles.keywordTags}>
                {incidentDetails.keywords.map((keyword, index) => (
                  <span key={index} className={styles.keywordTag}>
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {incidentDetails?.severity && (
            <div className={styles.severityBadge}>
              Severity: <strong>{incidentDetails.severity}</strong>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.modalActions}>
          <button onClick={onAddIncident} className={styles.addIncidentBtn}>
            <FileText size={16} />
            Add Incident Report
          </button>
          <button onClick={onConfirmNoIncident} className={styles.confirmNoIncidentBtn}>
            <CheckCircle size={16} />
            No Incident Occurred
          </button>
        </div>

        <p className={styles.modalFooter}>
          You can also click outside to review your notes again.
        </p>
      </div>
    </div>
  );
};

export default IncidentConfirmationModal;
