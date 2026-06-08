import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/dataService';
import { calculateDistance, formatDistance, getLocationWithFallback } from '../services/locationService';
import { openWhatsApp, buildWorkerContactMessage } from '../utils/whatsapp';
import SkillChips from '../components/SkillChips';
import AgeGroupBadge from '../components/AgeGroupBadge';
import GenderBadge from '../components/GenderBadge';
import WorkerTypeBadge from '../components/WorkerTypeBadge';
import { AGE_GROUP_LABELS } from '../utils/matchClassification';
import EmptyState from '../components/EmptyState';
import { Search, Star, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const LANGUAGES = ['Tamil', 'Hindi', 'English', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Other'];

const FindWorkers = () => {
  const { currentUser } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState(null);
  const [filters, setFilters] = useState({
    distance: 3,
    skills: [],
    ageGroup: 'all',
    gender: 'any',
    workerType: 'any',
    availability: 'any',
    openToHomeTasks: currentUser?.role === 'resident',
    language: 'any',
    hasVehicle: false,
  });

  const runSearch = async (searchFilters = filters) => {
    setLoading(true);
    try {
      const loc = center || (await getLocationWithFallback());
      if (!center) setCenter(loc);
      const list = await userService.searchWorkers(
        {
          ...searchFilters,
          openToHomeTasks: searchFilters.openToHomeTasks || undefined,
          hasVehicle: searchFilters.hasVehicle || undefined,
          availableToday: searchFilters.availability === 'today',
        },
        loc.lat,
        loc.lng
      );
      setWorkers(list);
    } catch {
      toast.error('Could not load workers');
    }
    setLoading(false);
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => {
    if (!center) return workers;
    return workers
      .map((w) => ({
        ...w,
        distance: w.location?.lat
          ? calculateDistance(center.lat, center.lng, w.location.lat, w.location.lng)
          : null,
      }))
      .filter((w) => filters.distance === 'all' || w.distance == null || w.distance <= filters.distance)
      .sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));
  }, [workers, center, filters.distance]);

  const contactWorker = (worker) => {
    const msg = buildWorkerContactMessage({
      searcherName: currentUser.name || 'NearHire user',
      workerName: worker.name,
    });
    openWhatsApp(worker.phoneNumber, msg);
  };

  const initials = (name) =>
    (name || 'W').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="page pb-24">
      <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Find Workers</h1>
      <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
        {currentUser?.role === 'resident' ? 'Workers open to home tasks near you' : 'Available workers near your shop'}
      </p>

      <div className="filter-toggle-group mb-3">
        {[1, 3, 5].map((km) => (
          <button key={km} type="button" className={`filter-toggle ${filters.distance === km ? 'active' : ''}`} onClick={() => setFilters({ ...filters, distance: km })}>{km} km</button>
        ))}
      </div>

      {currentUser?.role === 'resident' && (
        <label className="card flex items-center justify-between mb-4 min-h-[48px]">
          <span className="text-sm">Open to home tasks only</span>
          <button type="button" className={`toggle-switch ${filters.openToHomeTasks ? 'active' : ''}`} onClick={() => setFilters({ ...filters, openToHomeTasks: !filters.openToHomeTasks })} />
        </label>
      )}

      <div className="mb-4">
        <label className="input-label">Skills</label>
        <SkillChips selected={filters.skills} onChange={(skills) => setFilters({ ...filters, skills })} />
      </div>

      <button type="button" className="btn-primary mb-4" onClick={() => runSearch()}>
        Apply Filters
      </button>

      <div className="space-y-3 mb-4">
        <div>
          <label className="input-label">Age group</label>
          <div className="filter-toggle-group flex-wrap">
            {['all', 'youngster', 'adult', 'senior'].map((a) => (
              <button key={a} type="button" className={`filter-toggle ${filters.ageGroup === a ? 'active' : ''}`} onClick={() => setFilters({ ...filters, ageGroup: a })}>
                {a === 'all' ? 'All Ages' : AGE_GROUP_LABELS[a] ? `${a === 'youngster' ? '👦' : a === 'adult' ? '🧑' : '👴'} ${AGE_GROUP_LABELS[a]}` : a}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="input-label">Gender</label>
          <div className="filter-toggle-group">
            {['any', 'male', 'female'].map((g) => (
              <button key={g} type="button" className={`filter-toggle ${filters.gender === g ? 'active' : ''}`} onClick={() => setFilters({ ...filters, gender: g })}>{g}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="input-label">Worker type</label>
          <div className="filter-toggle-group flex-wrap">
            {['any', 'student', 'homemaker', 'daily-wage', 'skilled', 'fresher'].map((w) => (
              <button key={w} type="button" className={`filter-toggle ${filters.workerType === w ? 'active' : ''}`} onClick={() => setFilters({ ...filters, workerType: w })}>{w}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="input-label">Language</label>
          <select className="input-field" value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })}>
            <option value="any">Any</option>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><span className="spinner spinner-lg" /></div>
      ) : results.length === 0 ? (
        <EmptyState icon="search" title="No workers found" description="Try widening distance or changing filters." />
      ) : (
        <div className="space-y-3">
          {results.map((w) => (
            <div key={w.userId || w.uid} className="card">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold" style={{ background: 'var(--color-bg-input)' }}>
                  {w.photoURL ? <img src={w.photoURL} alt="" className="w-full h-full rounded-full object-cover" /> : initials(w.name)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{w.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <AgeGroupBadge ageGroup={w.ageGroup} />
                    <GenderBadge gender={w.gender} />
                    <WorkerTypeBadge type={w.workerType} />
                    {w.availableToday && <span className="badge" style={{ background: 'rgba(0,200,81,0.2)', color: '#86efac' }}>Available Today</span>}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(w.skills || []).slice(0, 3).map((s) => <span key={s} className="chip" style={{ cursor: 'default', padding: '4px 10px', fontSize: '0.7rem' }}>{s}</span>)}
                    {(w.skills?.length || 0) > 3 && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>+{w.skills.length - 3}</span>}
                  </div>
                  {(w.languages?.length > 0) && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{w.languages.join(' · ')}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                      {w.distance != null && formatDistance(w.distance)}
                      {w.rating && <><Star size={12} fill="#FFB800" color="#FFB800" /> {w.rating}</>}
                    </span>
                    <button type="button" className="btn-primary" style={{ width: 'auto', minHeight: 48, padding: '8px 14px', fontSize: '0.8rem', background: 'var(--color-whatsapp)' }} onClick={() => contactWorker(w)}>
                      <MessageCircle size={16} /> WhatsApp
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

export default FindWorkers;
