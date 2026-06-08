import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Eye, PlusCircle, RotateCcw, Search, Users, XCircle, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { applicationService, jobService } from '../services/dataService';
import EmptyState from '../components/EmptyState';
import UrgencyBadge from '../components/UrgencyBadge';
import { SkeletonList, SkeletonStats } from '../components/SkeletonLoader';

const getProjectStatusClass = (job) => {
  if (job.status === 'complete') return 'badge-complete';
  if (job.status === 'filled') return 'badge-filled';
  if (job.status === 'closed') return 'badge-closed';
  const total = Number(job.totalWorkersNeeded || 0);
  const filled = Number(job.totalWorkersFilled || 0);
  if (total && filled / total >= 0.7) return 'badge-filling-up';
  return 'badge-active';
};

const ContractorDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectData, appData] = await Promise.all([
        jobService.getJobsByContractor(currentUser.uid),
        applicationService.getByContractor(currentUser.uid),
      ]);
      setProjects(projectData);
      setApplications(appData);
    } catch {
      toast.error('Failed to load contractor dashboard');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser?.uid) loadData();
  }, [currentUser?.uid]);

  const stats = useMemo(() => ({
    activeProjects: projects.filter((p) => p.status === 'active').length,
    totalWorkersNeeded: projects.reduce((sum, p) => sum + Number(p.totalWorkersNeeded || p.workersRequired || 0), 0),
    totalApplicants: applications.length,
    workersHired: applications.filter((app) => app.status === 'hired').length,
  }), [projects, applications]);

  const updateProjectStatus = async (jobId, status) => {
    try {
      await jobService.updateJobStatus(jobId, status);
      toast.success(`Project marked ${status}`);
      loadData();
    } catch {
      toast.error('Failed to update project');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Contractor Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{currentUser.companyName || 'Contractor'}</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto', minHeight: 48, padding: '10px 14px', background: 'var(--color-contractor-orange)' }} onClick={() => navigate('/contractor/post-project')}>
          <PlusCircle size={16} /> Post
        </button>
      </div>

      <button
        type="button"
        className="card w-full text-left mb-4"
        style={{ borderColor: 'rgba(249, 115, 22, 0.35)' }}
        onClick={() => navigate('/setup/contractor')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-contractor-orange)' }}>Edit contractor profile</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{currentUser.contractorType || 'Add contractor details'}</p>
          </div>
          <Edit3 size={18} style={{ color: 'var(--color-contractor-orange)' }} />
        </div>
      </button>

      {loading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--color-contractor-orange)' }}>{stats.activeProjects}</div><div className="stat-label">Active Projects</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--color-contractor-orange)' }}>{stats.totalWorkersNeeded}</div><div className="stat-label">Workers Needed</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--color-week)' }}>{stats.totalApplicants}</div><div className="stat-label">Applicants</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--color-hired)' }}>{stats.workersHired}</div><div className="stat-label">Hired</div></div>
        </div>
      )}

      <button
        type="button"
        className="card w-full text-left mb-5"
        style={{ borderColor: 'rgba(16, 185, 129, 0.25)' }}
        onClick={() => navigate('/contractor/find-labour')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-facility-green)' }}>Need more workers? Find Labour Contractors</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Suppliers near your project areas</p>
          </div>
          <Search size={18} style={{ color: 'var(--color-facility-green)' }} />
        </div>
      </button>

      <h2 className="text-base font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>Active Projects</h2>

      {loading ? (
        <SkeletonList count={3} />
      ) : projects.length === 0 ? (
        <EmptyState icon="briefcase" title="No Projects Posted Yet" description="Post a site project and start receiving worker applications." actionLabel="Post Project" onAction={() => navigate('/contractor/post-project')} />
      ) : (
        <div className="space-y-3 stagger-children">
          {projects.map((project) => {
            const projectApps = applications.filter((app) => app.jobId === project.jobId);
            const total = Number(project.totalWorkersNeeded || project.workersRequired || 0);
            const filled = Number(project.totalWorkersFilled || 0);
            const pct = total ? Math.round((filled / total) * 100) : 0;
            return (
              <div key={project.jobId} className="card site-card">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate" style={{ fontFamily: 'var(--font-display)' }}>{project.projectName || project.title}</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{project.locality || project.siteAddress || 'Site location'} - {project.projectDuration}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <UrgencyBadge urgency={project.urgency} size="small" />
                    <span className={`badge badge-status ${getProjectStatusClass(project)}`}>{project.status}</span>
                  </div>
                </div>

                <div className="site-progress-track my-3"><div className={`site-progress-fill ${pct === 100 ? 'complete' : ''}`} style={{ width: `${pct}%` }} /></div>
                <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>{filled} of {total} workers filled</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(project.requirements || []).slice(0, 4).map((req) => (
                    <span key={req.reqId || req.workerType} className="badge" style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)' }}>
                      {req.workerType} {req.numberFilled || 0}/{req.numberNeeded}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button type="button" className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-contractor-orange)' }} onClick={() => navigate(`/contractor/projects/${project.jobId}/applicants`)}>
                    <Users size={16} /> {projectApps.length || project.applicantCount || 0} Applicants
                  </button>
                  <button type="button" className="text-xs" style={{ color: 'var(--color-text-muted)' }} onClick={() => navigate(`/contractor/projects/${project.jobId}/applicants`)}>
                    <Eye size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="btn-secondary" style={{ minHeight: 42, padding: '8px 10px', fontSize: '0.78rem' }} onClick={() => navigate('/contractor/post-project')}>Edit Project</button>
                  <button type="button" className="btn-secondary" style={{ minHeight: 42, padding: '8px 10px', fontSize: '0.78rem', color: 'var(--color-hired)' }} onClick={() => updateProjectStatus(project.jobId, 'complete')}><CheckCircle size={14} /> Mark Complete</button>
                  <button type="button" className="btn-secondary" style={{ minHeight: 42, padding: '8px 10px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }} onClick={() => updateProjectStatus(project.jobId, 'closed')}><XCircle size={14} /> Close</button>
                  <button type="button" className="btn-secondary" style={{ minHeight: 42, padding: '8px 10px', fontSize: '0.78rem', color: 'var(--color-contractor-orange)' }} onClick={() => updateProjectStatus(project.jobId, 'active')}><RotateCcw size={14} /> Repost</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContractorDashboard;
