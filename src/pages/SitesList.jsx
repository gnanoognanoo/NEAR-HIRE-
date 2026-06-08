import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { jobService } from '../services/dataService';
import { calculateDistance, getLocationWithFallback } from '../services/locationService';
import BottomSheet from '../components/BottomSheet';
import EmptyState from '../components/EmptyState';
import SiteJobCard from '../components/SiteJobCard';
import SiteJobDetail from '../components/SiteJobDetail';
import { SkeletonList } from '../components/SkeletonLoader';

const SitesList = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    distance: 5,
    urgency: 'all',
    siteType: 'all',
  });

  const loadSites = async () => {
    setLoading(true);
    try {
      const loc = await getLocationWithFallback();
      setUserLocation(loc);
      const siteJobs = await jobService.getSiteJobs();
      setJobs(siteJobs);
    } catch {
      toast.error('Failed to load site jobs');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSites();
  }, []);

  const enriched = useMemo(() => {
    let list = jobs
      .filter((job) => job.status === 'active')
      .map((job) => ({
        ...job,
        distance: userLocation && job.location?.lat
          ? calculateDistance(userLocation.lat, userLocation.lng, job.location.lat, job.location.lng)
          : null,
      }));
    if (filters.distance !== 'all') list = list.filter((job) => job.distance == null || job.distance <= filters.distance);
    if (filters.urgency !== 'all') list = list.filter((job) => job.urgency === filters.urgency);
    if (filters.siteType !== 'all') list = list.filter((job) => job.projectType === filters.siteType);
    list.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    return list;
  }, [jobs, userLocation, filters]);

  const siteTypes = useMemo(() => ['all', ...Array.from(new Set(jobs.map((job) => job.projectType).filter(Boolean)))], [jobs]);
  const activeNearby = enriched.slice(0, 6);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Site Jobs</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{enriched.length} active construction sites</p>
        </div>
        <button
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: showFilters ? 'var(--color-contractor-orange)' : 'var(--color-bg-input)',
            color: showFilters ? 'white' : 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {showFilters && (
        <div className="card mb-4 animate-fade-in">
          <label className="input-label">Distance</label>
          <div className="filter-toggle-group mb-3">
            {[3, 5, 10, 'all'].map((distance) => (
              <button key={distance} type="button" className={`filter-toggle ${filters.distance === distance ? 'active' : ''}`} style={filters.distance === distance ? { background: 'var(--color-contractor-orange)' } : undefined} onClick={() => setFilters({ ...filters, distance })}>
                {distance === 'all' ? 'All' : `${distance}km`}
              </button>
            ))}
          </div>
          <label className="input-label">Urgency</label>
          <div className="filter-toggle-group mb-3">
            {['all', 'urgent', 'this-week', 'flexible'].map((urgency) => (
              <button key={urgency} type="button" className={`filter-toggle ${filters.urgency === urgency ? 'active' : ''}`} style={filters.urgency === urgency ? { background: 'var(--color-contractor-orange)' } : undefined} onClick={() => setFilters({ ...filters, urgency })}>
                {urgency === 'all' ? 'All' : urgency}
              </button>
            ))}
          </div>
          <label className="input-label">Project Type</label>
          <select className="input-field" value={filters.siteType} onChange={(e) => setFilters({ ...filters, siteType: e.target.value })}>
            {siteTypes.map((type) => <option key={type} value={type}>{type === 'all' ? 'All Sites' : type}</option>)}
          </select>
        </div>
      )}

      {!loading && activeNearby.length > 0 && (
        <section className="mb-5">
          <h2 className="text-base font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>Active Sites Near You</h2>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {activeNearby.map((job) => <SiteJobCard key={job.jobId} job={job} compact onView={setSelectedJob} />)}
          </div>
        </section>
      )}

      {loading ? (
        <SkeletonList count={4} />
      ) : enriched.length === 0 ? (
        <EmptyState icon="search" title="No Site Jobs Nearby" description="Try widening distance or checking again later." actionLabel="Refresh" onAction={loadSites} />
      ) : (
        <div className="space-y-3 stagger-children">
          {enriched.map((job) => <SiteJobCard key={job.jobId} job={job} onView={setSelectedJob} />)}
        </div>
      )}

      <BottomSheet isOpen={!!selectedJob} onClose={() => setSelectedJob(null)}>
        {selectedJob && <SiteJobDetail job={selectedJob} currentUser={currentUser} />}
      </BottomSheet>
    </div>
  );
};

export default SitesList;
