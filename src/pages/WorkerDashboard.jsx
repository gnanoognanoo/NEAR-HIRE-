import { useState, useEffect } from 'react';
import { applicationService } from '../services/dataService';
import { userService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, Phone, Briefcase, Edit3, MessageCircle, HardHat } from 'lucide-react';
import { SkeletonList, SkeletonStats } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';
import { openWhatsApp } from '../utils/whatsapp';

const WorkerDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadApplications();
  }, [currentUser]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await applicationService.getByWorker(currentUser.uid);
      setApplications(data);
    } catch {
      toast.error('Failed to load applications');
    }
    setLoading(false);
  };

  const toggleAvailableToday = async () => {
    const newValue = !currentUser.availableToday;
    await updateProfile({ availableToday: newValue });
    toast.success(newValue ? 'You are available today!' : 'Availability turned off');
  };

  const stats = {
    total: applications.length,
    hired: applications.filter(a => a.status === 'hired').length,
    pending: applications.filter(a => a.status === 'applied').length,
  };

  const siteApplications = applications.filter((a) => a.applicationType === 'site-application');
  const otherApplications = applications.filter((a) => a.applicationType !== 'site-application');

  const statusConfig = {
    applied: { icon: <Clock size={14} />, color: 'var(--color-week)', label: 'Applied', badgeClass: 'badge-applied' },
    contacted: { icon: <Phone size={14} />, color: '#60a5fa', label: 'Contacted', badgeClass: 'badge-contacted' },
    hired: { icon: <CheckCircle2 size={14} />, color: 'var(--color-hired)', label: 'Hired', badgeClass: 'badge-hired' },
    rejected: { icon: <XCircle size={14} />, color: 'var(--color-urgent)', label: 'Rejected', badgeClass: 'badge-rejected' },
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Dashboard
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {currentUser.name || 'Worker'}
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
          style={{
            background: 'var(--color-bg-input)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
          onClick={() => navigate('/profile')}
        >
          <Edit3 size={14} /> Edit Profile
        </button>
      </div>

      {/* Home tasks CTA */}
      <button
        type="button"
        className="card w-full text-left mb-4 min-h-[48px] animate-fade-in"
        style={{ borderColor: 'rgba(43, 127, 255, 0.35)' }}
        onClick={() => navigate('/tasks')}
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--color-resident-blue)' }}>📋 Home tasks near you</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Cleaning, care, errands from residents</p>
      </button>

      <button
        type="button"
        className="card w-full text-left mb-4 min-h-[48px] animate-fade-in"
        style={{ borderColor: 'rgba(249, 115, 22, 0.35)' }}
        onClick={() => navigate('/sites')}
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--color-contractor-orange)' }}>🏗️ Construction sites near you</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Site jobs with daily wages from contractors</p>
      </button>

      {/* Available Today Toggle */}
      <div
        className="card mb-5 animate-fade-in"
        style={{
          background: currentUser.availableToday
            ? 'linear-gradient(135deg, rgba(0, 200, 81, 0.15), rgba(0, 200, 81, 0.05))'
            : 'var(--color-bg-card)',
          borderColor: currentUser.availableToday ? 'rgba(0, 200, 81, 0.3)' : 'var(--color-border)',
          padding: '20px',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              {currentUser.availableToday ? '✅ Available Today' : 'Available Today?'}
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {currentUser.availableToday
                ? 'Employers can see you are ready to work'
                : 'Turn on to let employers know you can start now'}
            </p>
          </div>
          <button
            className={`toggle-switch ${currentUser.availableToday ? 'active' : ''}`}
            onClick={toggleAvailableToday}
            id="worker-availability-toggle"
          />
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <SkeletonStats />
      ) : (
        <div className="stats-grid mb-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Applied</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-hired)' }}>{stats.hired}</div>
            <div className="stat-label">Hired</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-week)' }}>{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      )}

      {/* Site Applications */}
      {siteApplications.length > 0 && (
        <>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <HardHat size={16} style={{ color: 'var(--color-contractor-orange)' }} /> Site Applications
          </h3>
          <div className="space-y-3 mb-5 stagger-children">
            {siteApplications.map((app) => {
              const sc = statusConfig[app.status] || statusConfig.applied;
              return (
                <div key={app.applicationId} className="card site-card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[0.95rem] font-semibold truncate" style={{ fontFamily: 'var(--font-display)' }}>
                        {app.projectName || app.jobTitle || app.job?.projectName || 'Site Project'}
                      </h4>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {app.selectedRole || 'Site role'} · Rs {app.selectedWage || app.job?.salaryAmount || '—'}/day
                      </p>
                    </div>
                    <span className={`badge badge-status ${sc.badgeClass}`}>{sc.icon} {sc.label}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Start {app.job?.startDate ? new Date(app.job.startDate).toLocaleDateString() : 'Flexible'}
                    </span>
                    <button
                      type="button"
                      className="btn-whatsapp"
                      style={{ minHeight: 40, padding: '8px 12px', fontSize: '0.78rem', width: 'auto' }}
                      onClick={() => openWhatsApp(
                        app.job?.contractorPhone || app.job?.employerPhone,
                        `Hi, I am ${currentUser.name}. I applied for the ${app.selectedRole} role on your project "${app.projectName || app.jobTitle}" via NearHire.`
                      )}
                    >
                      <MessageCircle size={14} /> Contact Contractor
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Application History */}
      <h3 className="text-base font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
        Application History
      </h3>

      {loading ? (
        <SkeletonList count={3} />
      ) : otherApplications.length === 0 && siteApplications.length === 0 ? (
        <EmptyState
          icon="briefcase"
          title="No Applications Yet"
          description="Start applying to jobs nearby to see your history here"
          actionLabel="Find Jobs"
          onAction={() => navigate('/map')}
        />
      ) : (
        <div className="space-y-3 stagger-children">
          {otherApplications.map((app) => {
            const sc = statusConfig[app.status] || statusConfig.applied;
            return (
              <div key={app.applicationId} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4
                      className="text-[0.95rem] font-semibold truncate"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {app.jobTitle || app.job?.title || 'Job'}
                    </h4>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {app.applicationType === 'task-interest'
                        ? `${app.job?.locality || 'Home task'} · Resident`
                        : app.job?.shopName || 'Local Business'}
                    </p>
                  </div>
                  <span className={`badge badge-status ${sc.badgeClass}`}>
                    {sc.icon} {sc.label}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Applied {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recently'}
                  </span>
                  {app.job?.salary && (
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>
                      {app.job.salary}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
