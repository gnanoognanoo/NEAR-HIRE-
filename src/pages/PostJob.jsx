import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../services/dataService';
import SkillChips from '../components/SkillChips';
import { CheckCircle, Eye, ArrowLeft, Minus, Plus } from 'lucide-react';
import UrgencyBadge from '../components/UrgencyBadge';
import toast from 'react-hot-toast';

const PostJob = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    salaryAmount: '',
    salaryType: 'daily',
    type: 'full-time',
    urgency: 'urgent',
    skillsRequired: [],
    experienceRequired: '',
    description: '',
    workersRequired: 1,
  });

  const validate = () => {
    const e = {};
    if (!formData.title.trim()) e.title = 'Job title is required';
    if (!formData.salaryAmount) e.salaryAmount = 'Salary amount is required';
    if (!formData.description.trim()) e.description = 'Description is required';
    return e;
  };

  const handlePreview = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill required fields');
      return;
    }
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const salary = formData.salaryType === 'daily'
        ? `₹${formData.salaryAmount}/day`
        : `₹${formData.salaryAmount}/mo`;

      await jobService.createJob({
        ...formData,
        salary,
        salaryAmount: Number(formData.salaryAmount),
        employerId: currentUser.uid,
        employerPhone: currentUser.phoneNumber?.replace(/\D/g, '') || '919999999999',
        shopName: currentUser.shopName || 'My Shop',
        shopCategory: currentUser.shopCategory || 'Other',
        location: currentUser.location || { lat: 28.6139, lng: 77.209, address: currentUser.shopAddress || 'Local' },
        postedBy: 'shop',
        isTaskPost: false,
      });

      toast.success('Job posted successfully! 🎉');
      navigate('/employer/dashboard');
    } catch {
      toast.error('Failed to post job');
    }
    setIsLoading(false);
  };

  const urgencyOptions = [
    { value: 'urgent', label: '🔴 Urgent — Need Today', color: 'var(--color-urgent)' },
    { value: 'this-week', label: '🟡 This Week', color: 'var(--color-week)' },
    { value: 'flexible', label: '🟢 Flexible', color: 'var(--color-flexible)' },
  ];

  // ── Preview Screen ─────────────────────────────────────
  if (showPreview) {
    const salary = formData.salaryType === 'daily'
      ? `₹${formData.salaryAmount}/day`
      : `₹${formData.salaryAmount}/mo`;

    return (
      <div className="page animate-fade-in" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="page-header">
          <button
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
            onClick={() => setShowPreview(false)}
          >
            <ArrowLeft size={18} /> Edit
          </button>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Preview
          </span>
        </div>

        <div className="card mb-4">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {formData.title}
            </h2>
            <UrgencyBadge urgency={formData.urgency} />
          </div>

          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {currentUser.shopName || 'My Shop'} · {currentUser.shopCategory || 'Business'}
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: '1rem' }}>{salary}</div>
              <div className="stat-label">Salary</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                {formData.workersRequired}
              </div>
              <div className="stat-label">Workers</div>
            </div>
          </div>

          {formData.skillsRequired.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {formData.skillsRequired.map(s => (
                <span key={s} className="chip" style={{ cursor: 'default', padding: '5px 10px', fontSize: '0.75rem' }}>{s}</span>
              ))}
            </div>
          )}

          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {formData.description}
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={isLoading}
          id="publish-job-btn"
        >
          {isLoading ? (
            <span className="spinner spinner-sm" />
          ) : (
            <>
              <CheckCircle size={20} /> Publish Job
            </>
          )}
        </button>

        <button
          className="btn-secondary mt-3"
          onClick={() => setShowPreview(false)}
        >
          ← Go Back & Edit
        </button>
      </div>
    );
  }

  // ── Form Screen ────────────────────────────────────────
  return (
    <div className="page animate-fade-in" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="pt-2 mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Post a Job
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Find workers near your shop quickly
        </p>
      </div>

      <div className="space-y-5">
        {/* Title */}
        <div className="input-group">
          <label className="input-label">Job Title *</label>
          <input
            type="text"
            className={`input-field ${errors.title ? 'input-error' : ''}`}
            placeholder="e.g. Kitchen Helper, Delivery Rider"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              setErrors({ ...errors, title: '' });
            }}
            id="job-title-input"
          />
          {errors.title && <p className="error-text">{errors.title}</p>}
        </div>

        {/* Salary */}
        <div className="input-group">
          <label className="input-label">Salary *</label>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 px-3 rounded-xl shrink-0"
              style={{ background: 'var(--color-bg-input)', border: '1.5px solid var(--color-border)' }}>
              <span className="text-base font-medium" style={{ color: 'var(--color-primary)' }}>₹</span>
            </div>
            <input
              type="number"
              className={`input-field flex-1 ${errors.salaryAmount ? 'input-error' : ''}`}
              placeholder="Amount"
              value={formData.salaryAmount}
              onChange={(e) => {
                setFormData({ ...formData, salaryAmount: e.target.value });
                setErrors({ ...errors, salaryAmount: '' });
              }}
              inputMode="numeric"
            />
            <div className="filter-toggle-group" style={{ minWidth: 'fit-content' }}>
              <button
                type="button"
                className={`filter-toggle ${formData.salaryType === 'daily' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, salaryType: 'daily' })}
                style={{ padding: '8px 14px' }}
              >
                Daily
              </button>
              <button
                type="button"
                className={`filter-toggle ${formData.salaryType === 'monthly' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, salaryType: 'monthly' })}
                style={{ padding: '8px 14px' }}
              >
                Monthly
              </button>
            </div>
          </div>
          {errors.salaryAmount && <p className="error-text">{errors.salaryAmount}</p>}
        </div>

        {/* Job Type */}
        <div className="input-group">
          <label className="input-label">Job Type</label>
          <div className="filter-toggle-group">
            {['full-time', 'part-time', 'temporary'].map(t => (
              <button
                key={t}
                type="button"
                className={`filter-toggle ${formData.type === t ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, type: t })}
              >
                {t.charAt(0).toUpperCase() + t.slice(1).replace('-', '-')}
              </button>
            ))}
          </div>
        </div>

        {/* Urgency */}
        <div className="input-group">
          <label className="input-label">Urgency Level</label>
          <div className="space-y-2">
            {urgencyOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                className="w-full text-left rounded-xl p-3.5 transition-all flex items-center gap-3"
                style={{
                  background: formData.urgency === opt.value
                    ? `${opt.color}15`
                    : 'var(--color-bg-input)',
                  border: `1.5px solid ${formData.urgency === opt.value ? opt.color + '40' : 'var(--color-border)'}`,
                  color: formData.urgency === opt.value ? opt.color : 'var(--color-text-secondary)',
                }}
                onClick={() => setFormData({ ...formData, urgency: opt.value })}
              >
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="input-group">
          <label className="input-label">Skills Required</label>
          <SkillChips
            selected={formData.skillsRequired}
            onChange={(skills) => setFormData({ ...formData, skillsRequired: skills })}
          />
        </div>

        {/* Experience */}
        <div className="input-group">
          <label className="input-label">Experience Required <span className="normal-case font-normal text-[0.7rem]" style={{ color: 'var(--color-text-muted)' }}>(Optional)</span></label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. 1-2 years or Fresher"
            value={formData.experienceRequired}
            onChange={(e) => setFormData({ ...formData, experienceRequired: e.target.value })}
          />
        </div>

        {/* Description */}
        <div className="input-group">
          <label className="input-label">Job Description *</label>
          <textarea
            className={`input-field ${errors.description ? 'input-error' : ''}`}
            rows={4}
            placeholder="Describe the job responsibilities, timings, benefits..."
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              setErrors({ ...errors, description: '' });
            }}
            style={{ resize: 'vertical' }}
          />
          {errors.description && <p className="error-text">{errors.description}</p>}
        </div>

        {/* Workers Required */}
        <div className="input-group">
          <label className="input-label">Workers Required</label>
          <div className="number-stepper">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setFormData({ ...formData, workersRequired: Math.max(1, formData.workersRequired - 1) })}
              disabled={formData.workersRequired <= 1}
            >
              <Minus size={18} />
            </button>
            <span className="stepper-value">{formData.workersRequired}</span>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setFormData({ ...formData, workersRequired: Math.min(20, formData.workersRequired + 1) })}
              disabled={formData.workersRequired >= 20}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Location info */}
        <div className="card" style={{ padding: '12px 16px' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            📍 Job location will be set to your shop location: <span style={{ color: 'var(--color-text-secondary)' }}>{currentUser.shopAddress || currentUser.location?.address || 'Update in Profile'}</span>
          </p>
        </div>

        {/* Preview Button */}
        <button
          className="btn-primary mt-2"
          onClick={handlePreview}
          id="preview-job-btn"
        >
          <Eye size={20} /> Preview & Publish
        </button>
      </div>
    </div>
  );
};

export default PostJob;
