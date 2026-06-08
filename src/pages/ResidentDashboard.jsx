import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobService, applicationService } from '../services/dataService';
import { useNavigate } from 'react-router-dom';
import BottomSheet from '../components/BottomSheet';
import DateNeededBadge from '../components/DateNeededBadge';
import AgeGroupBadge from '../components/AgeGroupBadge';
import WorkerTypeBadge from '../components/WorkerTypeBadge';
import { openWhatsApp, buildWorkerContactMessage } from '../utils/whatsapp';
import { TASK_CATEGORIES } from '../constants/taskCategories';
import { PlusCircle, MessageCircle, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const getIcon = (cat) => TASK_CATEGORIES.find((c) => c.label === cat)?.icon || '📋';

const ResidentDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [interested, setInterested] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  const load = async () => {
    setLoading(true);
    const list = await jobService.getJobsByResident(currentUser.uid);
    setTasks(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentUser.uid]);

  const stats = {
    posted: tasks.length,
    contacted: tasks.reduce((s, t) => s + (t.applicantCount || 0), 0),
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  const viewWorkers = async (task) => {
    setSelectedTask(task);
    setLoadingWorkers(true);
    const apps = await applicationService.getByJobWithWorkers(task.jobId);
    setInterested(apps);
    setLoadingWorkers(false);
  };

  const updateStatus = async (jobId, status) => {
    await jobService.updateJobStatus(jobId, status);
    toast.success(status === 'completed' ? 'Marked complete' : 'Task cancelled');
    load();
    setSelectedTask(null);
  };

  return (
    <div className="page pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>My Tasks</h1>
        <button type="button" className="btn-primary" style={{ width: 'auto', minHeight: 48, padding: '10px 16px' }} onClick={() => navigate('/resident/post-task')}>
          <PlusCircle size={18} /> Post
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="stat-card"><div className="stat-value">{stats.posted}</div><div className="stat-label">Posted</div></div>
        <div className="stat-card"><div className="stat-value">{stats.contacted}</div><div className="stat-label">Contacted</div></div>
        <div className="stat-card"><div className="stat-value">{stats.completed}</div><div className="stat-label">Done</div></div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><span className="spinner spinner-lg" /></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>No tasks yet</p>
          <button className="btn-primary" onClick={() => navigate('/resident/post-task')}>Post Your First Task</button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.jobId} className="card">
              <div className="flex gap-3 mb-2">
                <span className="text-2xl">{getIcon(task.taskCategory)}</span>
                <div className="flex-1">
                  <h3 className="font-semibold">{task.title}</h3>
                  <DateNeededBadge dateNeeded={task.dateNeeded} />
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {task.applicantCount || 0} interested · {task.status}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary" style={{ minHeight: 48, flex: 1 }} onClick={() => viewWorkers(task)}>View Workers</button>
                {task.status === 'active' && (
                  <>
                    <button type="button" className="btn-secondary" style={{ minHeight: 48 }} onClick={() => updateStatus(task.jobId, 'completed')}><Check size={16} /></button>
                    <button type="button" className="btn-secondary" style={{ minHeight: 48 }} onClick={() => updateStatus(task.jobId, 'cancelled')}><X size={16} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomSheet isOpen={!!selectedTask} onClose={() => setSelectedTask(null)}>
        {selectedTask && (
          <div>
            <h2 className="text-lg font-bold mb-4">{selectedTask.title} — Interested Workers</h2>
            {loadingWorkers ? (
              <div className="flex justify-center py-8"><span className="spinner" /></div>
            ) : interested.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>No workers yet. Share your task!</p>
            ) : (
              interested.map((app) => (
                <div key={app.applicationId} className="card mb-3">
                  <h4 className="font-semibold">{app.worker?.name || app.workerName || 'Worker'}</h4>
                  <div className="flex flex-wrap gap-1 my-2">
                    <AgeGroupBadge ageGroup={app.worker?.ageGroup || app.workerAgeGroup} />
                    <WorkerTypeBadge type={app.worker?.workerType || app.workerType} />
                    {app.worker?.availableToday && <span className="badge" style={{ color: '#86efac' }}>Available Today</span>}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(app.worker?.skills || []).slice(0, 3).map((s) => <span key={s} className="chip" style={{ cursor: 'default', fontSize: '0.7rem' }}>{s}</span>)}
                  </div>
                  <button
                    type="button"
                    className="btn-primary w-full"
                    style={{ background: 'var(--color-whatsapp)', minHeight: 48 }}
                    onClick={() => openWhatsApp(app.worker?.phoneNumber, buildWorkerContactMessage({ searcherName: currentUser.name, workerName: app.worker?.name }))}
                  >
                    <MessageCircle size={18} /> Contact on WhatsApp
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default ResidentDashboard;
