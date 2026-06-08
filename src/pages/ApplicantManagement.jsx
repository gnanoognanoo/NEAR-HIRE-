import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Phone, UserCheck, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { applicationService, jobService, userService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/SkeletonLoader';
import { openWhatsApp } from '../utils/whatsapp';

const TABS = ['all', 'by-role', 'contacted', 'hired'];

const ApplicantManagement = () => {
  const { projectId } = useParams();
  const { currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [job, appData] = await Promise.all([
        jobService.getJobById(projectId),
        applicationService.getByJobWithWorkers(projectId),
      ]);
      setProject(job);
      setApps(appData);
    } catch {
      toast.error('Failed to load applicants');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const roles = useMemo(() => {
    const fromProject = (project?.requirements || []).map((req) => req.workerType);
    const fromApps = apps.map((app) => app.selectedRole).filter(Boolean);
    return ['all', ...Array.from(new Set([...fromProject, ...fromApps]))];
  }, [project, apps]);

  const filteredApps = useMemo(() => {
    let list = [...apps];
    if (tab === 'contacted') list = list.filter((app) => app.status === 'contacted');
    if (tab === 'hired') list = list.filter((app) => app.status === 'hired');
    if ((tab === 'by-role' || roleFilter !== 'all') && roleFilter !== 'all') {
      list = list.filter((app) => app.selectedRole === roleFilter);
    }
    return list;
  }, [apps, tab, roleFilter]);

  const updateStatus = async (applicationId, status) => {
    try {
      await applicationService.updateStatus(applicationId, status);
      toast.success(`Applicant marked ${status}`);
      loadData();
    } catch {
      toast.error('Failed to update applicant');
    }
  };

  const addToLabourPool = async (app) => {
    const worker = app.worker || {};
    try {
      await userService.addTrustedWorker(currentUser.uid, {
        workerId: app.workerId,
        name: app.workerName || worker.name || 'Worker',
        role: app.selectedRole,
        phone: app.workerPhone || worker.phoneNumber,
        rating: worker.rating,
      });
      await updateProfile({
        trustedWorkers: [
          ...(currentUser.trustedWorkers || []),
          {
            workerId: app.workerId,
            name: app.workerName || worker.name || 'Worker',
            role: app.selectedRole,
            phone: app.workerPhone || worker.phoneNumber,
            rating: worker.rating,
          },
        ].filter((w, i, arr) => arr.findIndex((x) => x.workerId === w.workerId) === i),
      });
      toast.success('Added to labour pool');
    } catch {
      toast.error('Failed to add worker');
    }
  };

  const contactWorker = (app) => {
    const workerName = app.workerName || app.worker?.name || 'Worker';
    const phone = app.workerPhone || app.worker?.phoneNumber;
    openWhatsApp(phone, `Hi ${workerName}, this is ${currentUser.companyName || currentUser.ownerName || 'Contractor'} from NearHire. We reviewed your application for "${project?.projectName || project?.title}". Let's discuss the ${app.selectedRole || 'site'} role.`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <button type="button" className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }} onClick={() => navigate('/contractor/dashboard')}>
          <ArrowLeft size={18} /> Back
        </button>
        <span className="badge badge-contractor">Applicants</span>
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{project?.projectName || project?.title || 'Project'}</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{apps.length} total applicants</p>
      </div>

      <div className="map-filter-chips mb-3">
        {TABS.map((item) => (
          <button key={item} type="button" className={`map-filter-chip ${tab === item ? 'active' : ''}`} style={tab === item ? { background: 'var(--color-contractor-orange)', borderColor: 'var(--color-contractor-orange)' } : undefined} onClick={() => setTab(item)}>
            {item === 'by-role' ? 'By Role' : item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      <div className="input-group">
        <label className="input-label">Filter by role</label>
        <select className="input-field" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          {roles.map((role) => <option key={role} value={role}>{role === 'all' ? 'All Roles' : role}</option>)}
        </select>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : filteredApps.length === 0 ? (
        <EmptyState icon="users" title="No Applicants" description="Applicants will appear here after workers apply for this project." />
      ) : (
        <div className="space-y-3 stagger-children">
          {filteredApps.map((app) => {
            const worker = app.worker || {};
            return (
              <div key={app.applicationId} className="card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{app.workerName || worker.name || 'Worker'}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {worker.ageGroup && <span className="badge">{worker.ageGroup}</span>}
                      {worker.gender && <span className="badge">{worker.gender}</span>}
                      {worker.availableToday && <span className="badge badge-complete">Available Today</span>}
                    </div>
                  </div>
                  <span className="badge badge-contractor">{app.selectedRole || 'Site Role'}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {([...(app.workerSkills || []), ...(worker.constructionSkills || [])]).slice(0, 6).map((skill) => (
                    <span key={skill} className="badge" style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)' }}>{skill}</span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  <span>Experience: {worker.experience || 'Not set'}</span>
                  <span>Languages: {(worker.languages || []).join(', ') || 'Not set'}</span>
                  <span>Wage: Rs {app.selectedWage || '-'}</span>
                  <span>Status: {app.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button type="button" className="btn-whatsapp" style={{ minHeight: 42, padding: '8px 10px', fontSize: '0.8rem' }} onClick={() => contactWorker(app)}>
                    <MessageCircle size={16} /> WhatsApp
                  </button>
                  <button type="button" className="btn-secondary" style={{ minHeight: 42, padding: '8px 10px', fontSize: '0.8rem', color: '#60a5fa' }} onClick={() => updateStatus(app.applicationId, 'contacted')}>
                    <Phone size={16} /> Contacted
                  </button>
                  <button type="button" className="btn-secondary" style={{ minHeight: 42, padding: '8px 10px', fontSize: '0.8rem', color: 'var(--color-hired)' }} onClick={() => updateStatus(app.applicationId, 'hired')}>
                    <UserCheck size={16} /> Hire
                  </button>
                  <select className="input-field" style={{ minHeight: 42, padding: '8px 10px', fontSize: '0.8rem' }} value={app.status} onChange={(e) => updateStatus(app.applicationId, e.target.value)}>
                    <option value="applied">Applied</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="contacted">Contacted</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="btn-secondary w-full mt-2"
                  style={{ minHeight: 42, color: 'var(--color-contractor-orange)' }}
                  onClick={() => addToLabourPool(app)}
                >
                  <Star size={16} /> Add to My Labour Pool
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApplicantManagement;
