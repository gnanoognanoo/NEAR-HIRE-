import { useState, useEffect } from 'react';
import { jobService, applicationService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UrgencyBadge from '../components/UrgencyBadge';
import EmptyState from '../components/EmptyState';
import { SkeletonList, SkeletonStats } from '../components/SkeletonLoader';
import BottomSheet from '../components/BottomSheet';
import { PlusCircle, Users, Eye, XCircle, RotateCcw, CheckCircle, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployerDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [allApps, setAllApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobApps, setSelectedJobApps] = useState(null); // { job, apps }
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsData, appsData] = await Promise.all([
        jobService.getJobsByEmployer(currentUser.uid),
        applicationService.getByEmployer(currentUser.uid),
      ]);
      setJobs(jobsData);
      setAllApps(appsData);
    } catch {
      toast.error('Failed to load dashboard');
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (jobId, status) => {
    try {
      await jobService.updateJobStatus(jobId, status);
      toast.success(`Job marked as ${status}`);
      loadData();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleViewApplicants = (job) => {
    const apps = allApps.filter(a => a.jobId === job.jobId);
    setSelectedJobApps({ job, apps });
  };

  const handleUpdateAppStatus = async (appId, status) => {
    try {
      await applicationService.updateStatus(appId, status);
      toast.success(`Status updated to ${status}`);
      // Refresh
      const apps = await applicationService.getByEmployer(currentUser.uid);
      setAllApps(apps);
      if (selectedJobApps) {
        setSelectedJobApps({
          ...selectedJobApps,
          apps: apps.filter(a => a.jobId === selectedJobApps.job.jobId),
        });
      }
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleWhatsApp = (app) => {
    const msg = encodeURIComponent(
      `Hi ${app.workerName || 'Worker'}, this is ${currentUser.shopName || currentUser.name || 'Employer'} from NearHire. We reviewed your application for "${app.jobTitle}". Let's discuss!`
    );
    const phone = app.workerPhone?.replace(/\D/g, '') || '919999999999';
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const stats = {
    totalJobs: jobs.length,
    totalApplicants: allApps.length,
    activeJobs: jobs.filter(j => j.status === 'active').length,
  };

  const statusActions = {
    active: [
      { label: 'Mark Filled', icon: <CheckCircle size={14} />, status: 'filled', color: '#60a5fa' },
      { label: 'Close', icon: <XCircle size={14} />, status: 'closed', color: 'var(--color-text-muted)' },
    ],
    filled: [
      { label: 'Repost', icon: <RotateCcw size={14} />, status: 'active', color: 'var(--color-primary)' },
    ],
    closed: [
      { label: 'Repost', icon: <RotateCcw size={14} />, status: 'active', color: 'var(--color-primary)' },
    ],
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            My Jobs
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {currentUser.shopName || 'Employer'}
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            boxShadow: '0 2px 8px var(--color-primary-glow)',
            fontFamily: 'var(--font-display)',
          }}
          onClick={() => navigate('/employer/post-job')}
        >
          <PlusCircle size={16} /> Post Job
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <SkeletonStats />
      ) : (
        <div className="stats-grid mb-5 animate-fade-in">
          <div className="stat-card">
            <div className="stat-value">{stats.totalJobs}</div>
            <div className="stat-label">Total Jobs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-week)' }}>{stats.totalApplicants}</div>
            <div className="stat-label">Applicants</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-flexible)' }}>{stats.activeJobs}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {loading ? (
        <SkeletonList count={3} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="briefcase"
          title="No Jobs Posted Yet"
          description="Post your first job and find workers near your shop"
          actionLabel="Post a Job"
          onAction={() => navigate('/employer/post-job')}
        />
      ) : (
        <div className="space-y-3 stagger-children">
          {jobs.map((job) => {
            const appCount = allApps.filter(a => a.jobId === job.jobId).length;
            const actions = statusActions[job.status] || [];

            return (
              <div key={job.jobId} className="card">
                {/* Top row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-3">
                    <h4
                      className="text-[0.95rem] font-semibold truncate"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {job.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>
                        {job.salary}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        · {job.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <UrgencyBadge urgency={job.urgency} size="small" />
                    <span className={`badge badge-status badge-${job.status}`}>
                      {job.status}
                    </span>
                  </div>
                </div>

                {/* Applicant bar */}
                <button
                  className="w-full flex items-center justify-between py-3 mt-2 transition-colors"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                  onClick={() => handleViewApplicants(job)}
                >
                  <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-primary)' }}>
                    <Users size={16} />
                    <span className="font-medium">{appCount || job.applicantCount || 0} Applicants</span>
                  </span>
                  <Eye size={16} style={{ color: 'var(--color-text-muted)' }} />
                </button>

                {/* Action buttons */}
                {actions.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {actions.map((action) => (
                      <button
                        key={action.status}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-1"
                        style={{
                          background: 'var(--color-bg-input)',
                          border: '1px solid var(--color-border)',
                          color: action.color,
                        }}
                        onClick={() => handleUpdateStatus(job.jobId, action.status)}
                      >
                        {action.icon} {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Applicant List Bottom Sheet ────────── */}
      <BottomSheet
        isOpen={!!selectedJobApps}
        onClose={() => setSelectedJobApps(null)}
        title={selectedJobApps ? `Applicants — ${selectedJobApps.job.title}` : ''}
      >
        {selectedJobApps && (
          <div>
            {selectedJobApps.apps.length === 0 ? (
              <div className="text-center py-8">
                <Users size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No applicants yet. Share the job link to get more applications.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedJobApps.apps.map((app) => (
                  <div key={app.applicationId} className="card">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                          {app.workerName || 'Worker'}
                        </h4>
                        {app.workerSkills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {app.workerSkills.slice(0, 3).map(s => (
                              <span key={s} className="text-[0.65rem] px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Status selector */}
                      <select
                        className="text-xs rounded-lg px-2 py-1.5 outline-none"
                        style={{
                          background: 'var(--color-bg-input)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-secondary)',
                          appearance: 'auto',
                        }}
                        value={app.status}
                        onChange={(e) => handleUpdateAppStatus(app.applicationId, e.target.value)}
                      >
                        <option value="applied">Applied</option>
                        <option value="contacted">Contacted</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                      <button
                        className="btn-whatsapp flex-1"
                        style={{ padding: '8px 12px', fontSize: '0.8rem', minHeight: 36 }}
                        onClick={() => handleWhatsApp(app)}
                      >
                        <MessageCircle size={16} /> WhatsApp
                      </button>
                      <span className="text-[0.65rem]" style={{ color: 'var(--color-text-muted)' }}>
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default EmployerDashboard;
