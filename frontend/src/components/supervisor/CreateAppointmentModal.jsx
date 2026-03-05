import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText, MapPin } from 'lucide-react';
import api from '../../api/api';
import styles from './CreateAppointmentModal.module.css';

const CreateAppointmentModal = ({ clientId, clientName, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    staffId: '',
    location: '',
    notes: ''
  });

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/api/supervisor/staff');
      setStaffList(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title || !formData.appointmentDate || !formData.startTime || !formData.staffId) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/supervisor/appointments', {
        ...formData,
        clientId
      });

      onSuccess();
    } catch (err) {
      console.error('Failed to create appointment:', err);
      setError(err.response?.data?.message || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Schedule Appointment</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Client Info */}
        <div className={styles.clientInfo}>
          <User size={16} />
          <span>Client: <strong>{clientName}</strong></span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* Title */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FileText size={14} />
              Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Doctor Appointment, Therapy Session"
              className={styles.input}
              required
            />
          </div>

          {/* Staff Assignment */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <User size={14} />
              Assign Staff <span className={styles.required}>*</span>
            </label>
            <select
              name="staffId"
              value={formData.staffId}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Select staff member...</option>
              {staffList.map(staff => (
                <option key={staff._id} value={staff._id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Calendar size={14} />
                Date <span className={styles.required}>*</span>
              </label>
              <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Clock size={14} />
                Start Time <span className={styles.required}>*</span>
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Clock size={14} />
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>

          {/* Location */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <MapPin size={14} />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Main Clinic, Room 204"
              className={styles.input}
            />
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FileText size={14} />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Appointment details..."
              className={styles.textarea}
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FileText size={14} />
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special instructions..."
              className={styles.textarea}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAppointmentModal;
