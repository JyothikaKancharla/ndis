import { AlertTriangle, CheckCircle, Download, FileText, TrendingUp } from 'lucide-react';
import styles from './NoteAnalysisPanel.module.css';

const NoteAnalysisPanel = ({ analysis, noteId, onDownload }) => {
  if (!analysis) return null;

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'High Risk': return '#ef4444';
      case 'Concerning': return '#f59e0b';
      case 'Positive': return '#22c55e';
      default: return '#6b7280';
    }
  };

  return (
    <div className={styles.analysisPanel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <TrendingUp size={20} />
          <h3 className={styles.title}>Clinical Analysis</h3>
        </div>
        <button onClick={onDownload} className={styles.downloadBtn}>
          <Download size={14} />
          Download Report
        </button>
      </div>

      {/* Risk and Sentiment Cards */}
      <div className={styles.statusCards}>
        {/* Risk Status */}
        <div className={`${styles.statusCard} ${analysis.risk_detected ? styles.riskDetected : styles.noRisk}`}>
          <div className={styles.cardLabel}>Risk Status</div>
          <div className={styles.cardValue}>
            {analysis.risk_detected ? (
              <>
                <AlertTriangle size={18} />
                <span>Risk Detected</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>No Risk</span>
              </>
            )}
          </div>
        </div>

        {/* Sentiment */}
        <div className={styles.statusCard} style={{
          background: `${getSentimentColor(analysis.sentiment)}15`,
          borderColor: `${getSentimentColor(analysis.sentiment)}40`
        }}>
          <div className={styles.cardLabel}>Sentiment</div>
          <div className={styles.cardValue} style={{ color: getSentimentColor(analysis.sentiment) }}>
            {analysis.sentiment}
          </div>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className={styles.summaryBox}>
        <div className={styles.summaryLabel}>Analysis Summary</div>
        <p className={styles.summaryText}>{analysis.sentiment_reason}</p>
      </div>

      {/* Keywords Found */}
      {analysis.keywords_found && analysis.keywords_found.length > 0 && (
        <div className={styles.keywordsSection}>
          <div className={styles.keywordsLabel}>
            Keywords Detected ({analysis.keywords_found.length})
          </div>
          <div className={styles.keywordTags}>
            {analysis.keywords_found.map((keyword, index) => (
              <span key={index} className={styles.keywordTag}>
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Incident Report Warning */}
      {analysis.incident_report?.required && (
        <div className={styles.incidentWarning}>
          <div className={styles.incidentHeader}>
            <AlertTriangle size={18} />
            <span>Incident Report Required</span>
          </div>

          {analysis.incident_report.incident_type && (
            <div className={styles.incidentDetails}>
              <div className={styles.incidentRow}>
                <strong>Type:</strong> {analysis.incident_report.incident_type}
              </div>
              <div className={styles.incidentRow}>
                <strong>What Happened:</strong> {analysis.incident_report.what_happened}
              </div>
              <div className={styles.incidentRow}>
                <strong>Follow-up:</strong> {analysis.incident_report.follow_up}
              </div>
            </div>
          )}

          {analysis.reminder_message && (
            <div className={styles.reminderMessage}>
              ⚠️ {analysis.reminder_message}
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      {analysis.metadata && (
        <div className={styles.metadata}>
          <FileText size={12} />
          <span>Analyzed: {new Date(analysis.metadata.analyzed_at).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

export default NoteAnalysisPanel;
