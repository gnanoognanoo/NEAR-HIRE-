import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobService, applicationService } from '../services/dataService';
import { calculateDistance, formatDistance, getLocationWithFallback } from '../services/locationService';
import { isHomeTask, formatPay, timeAgo } from '../utils/jobHelpers';
import { buildTaskInterestMessage, openWhatsApp } from '../utils/whatsapp';
import { TASK_BOARD_FILTER_CHIPS, TASK_CATEGORIES } from '../constants/taskCategories';
import DateNeededBadge from '../components/DateNeededBadge';
import GenderPrefBadge from '../components/GenderPrefBadge';
import MatchBadge from '../components/MatchBadge';
import AgeGroupBadge from '../components/AgeGroupBadge';
import ClassificationFilterChips from '../components/ClassificationFilterChips';
import EmptyState from '../components/EmptyState';
import { passesClassificationFilter, isGoodMatchForWorker } from '../utils/matchClassification';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: 'matches', label: 'Best Match' },
  { value: 'newest', label: 'Newest' },
  { value: 'nearest', label: 'Nearest' },
  { value: 'pay', label: 'Highest Pay' },
  { value: 'today', label: 'Today Only' },
];

const getCategoryIcon = (taskCategory) => {
  const cat = TASK_CATEGORIES.find((c) => c.label === taskCategory || c.id === taskCategory);
  return cat?.icon || '📋';
};

const TaskBoard = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [distanceKm, setDistanceKm] = useState(3);
  const [sort, setSort] = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [classificationFilter, setClassificationFilter] = useState('all');
  const [interestLoading, setInterestLoading] = useState(null);

  const loadTasks = async (loc) => {
    setLoading(true);
    try {
      let list = await jobService.getHomeTasks();
      list = list.filter(isHomeTask).filter((t) => t.status === 'active');
      setTasks(list);
    } catch {
      const cached = jobService.getCachedHomeTasks();
      setTasks(cached.filter(isHomeTask));
      toast.error('Offline — showing cached tasks');
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const loc = await getLocationWithFallback();
      setUserLocation(loc);
      await loadTasks(loc);
    })();
  }, []);

  const enriched = useMemo(() => {
    let list = tasks.map((t) => ({
      ...t,
      distance: userLocation && t.location?.lat
        ? calculateDistance(userLocation.lat, userLocation.lng, t.location.lat, t.location.lng)
        : null,
    }));

    if (distanceKm !== 'all') list = list.filter((t) => t.distance == null || t.distance <= distanceKm);
    if (categoryFilter !== 'all') {
      list = list.filter((t) => {
        const cat = TASK_CATEGORIES.find((c) => c.id === categoryFilter);
        return t.taskCategory === cat?.label || t.taskCategory === categoryFilter;
      });
    }
    list = list.filter((t) => passesClassificationFilter(t, classificationFilter, currentUser));

    if (sort === 'today') list = list.filter((t) => t.dateNeeded === 'today');
    if (sort === 'matches') {
      list.sort((a, b) => {
        const aM = isGoodMatchForWorker(a, currentUser) ? 0 : 1;
        const bM = isGoodMatchForWorker(b, currentUser) ? 0 : 1;
        if (aM !== bM) return aM - bM;
        return (a.distance ?? 99) - (b.distance ?? 99);
      });
    } else if (sort === 'nearest') list.sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));
    else if (sort === 'pay') list.sort((a, b) => (b.payAmount ?? b.salaryAmount ?? 0) - (a.payAmount ?? a.salaryAmount ?? 0));
    else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return list;
  }, [tasks, userLocation, distanceKm, sort, categoryFilter, classificationFilter, currentUser]);

  const handleInterest = async (task) => {
    setInterestLoading(task.jobId);
    try {
      const exists = await applicationService.checkExisting(task.jobId, currentUser.uid);
      if (exists) {
        toast.error('You already expressed interest');
        return;
      }

      await applicationService.createApplication({
        jobId: task.jobId,
        workerId: currentUser.uid,
        residentId: task.residentId,
        employerId: null,
        applicationType: 'task-interest',
        posterType: 'resident',
        taskCategory: task.taskCategory,
        workerAgeGroup: currentUser.ageGroup,
        workerGender: currentUser.gender,
        workerType: currentUser.workerType,
        workerName: currentUser.name,
        jobTitle: task.title,
      });

      const msg = buildTaskInterestMessage({
        workerName: currentUser.name || 'Worker',
        taskTitle: task.title,
        locality: task.locality || 'your area',
        availability: task.dateNeeded === 'today' ? 'today' : 'this week',
        relevantSkill: (currentUser.skills || [])[0] || '',
      });
      openWhatsApp(task.employerPhone, msg);
      toast.success('Interest sent! The resident will contact you.');
    } catch {
      toast.error('Could not send interest');
    }
    setInterestLoading(null);
  };

  return (
    <div className="page pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Tasks Near You</h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Home tasks from residents</p>
        </div>
        <div className="filter-toggle-group">
          {[1, 3, 5].map((km) => (
            <button key={km} type="button" className={`filter-toggle ${distanceKm === km ? 'active' : ''}`} onClick={() => setDistanceKm(km)}>{km}km</button>
          ))}
        </div>
      </div>

      <div className="filter-toggle-group mb-3">
        {SORT_OPTIONS.map((s) => (
          <button key={s.value} type="button" className={`filter-toggle ${sort === s.value ? 'active' : ''}`} onClick={() => setSort(s.value)}>{s.label}</button>
        ))}
      </div>

      <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
        Filter by gender & age group (set in your profile)
      </p>
      <ClassificationFilterChips value={classificationFilter} onChange={setClassificationFilter} />

      <div className="map-filter-chips mb-4 mt-3">
        {TASK_BOARD_FILTER_CHIPS.map((c) => (
          <button key={c.value} type="button" className={`map-filter-chip ${categoryFilter === c.value ? 'active' : ''}`} onClick={() => setCategoryFilter(c.value)}>{c.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><span className="spinner spinner-lg" /></div>
      ) : enriched.length === 0 ? (
        <EmptyState icon="search" title="No tasks nearby" description="Check back later or widen your distance filter." actionLabel="Refresh" onAction={() => loadTasks(userLocation)} />
      ) : (
        <div className="space-y-3 stagger-children">
          {enriched.map((task) => (
            <div key={task.jobId} className="card">
              <div className="flex gap-3">
                <span className="text-3xl">{getCategoryIcon(task.taskCategory)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base mb-1">{task.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{task.locality || 'Nearby area'}</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: 'var(--color-primary)' }}>{formatPay(task)}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <MatchBadge task={task} worker={currentUser} />
                    <DateNeededBadge dateNeeded={task.dateNeeded} />
                    <span className="badge">{task.duration}</span>
                    <GenderPrefBadge preference={task.genderPreference} />
                    {(task.workerTypePreference || []).filter((p) => ['youngster', 'adult', 'senior'].includes(p)).map((p) => (
                      <AgeGroupBadge key={p} ageGroup={p} />
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {task.distance != null ? formatDistance(task.distance) : '—'} · {timeAgo(task.createdAt)}
                    </span>
                    <button
                      className="btn-primary"
                      style={{ width: 'auto', minHeight: 48, padding: '10px 16px', fontSize: '0.85rem' }}
                      disabled={interestLoading === task.jobId}
                      onClick={() => handleInterest(task)}
                    >
                      {interestLoading === task.jobId ? <span className="spinner spinner-sm" /> : "I'm Interested"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
