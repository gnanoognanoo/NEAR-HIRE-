import { useState, useEffect, useMemo } from 'react';
import { jobService, applicationService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { calculateDistance, formatDistance, getLocationWithFallback } from '../services/locationService';
import JobCard from '../components/JobCard';
import FilterBar from '../components/FilterBar';
import BottomSheet from '../components/BottomSheet';
import UrgencyBadge from '../components/UrgencyBadge';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/SkeletonLoader';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { isShopJob, isSiteJob } from '../utils/jobHelpers';
import ClassificationFilterChips from '../components/ClassificationFilterChips';
import { passesClassificationFilter } from '../utils/matchClassification';
import { buildShopJobApplicationMessage, openWhatsApp } from '../utils/whatsapp';
import SiteJobCard from '../components/SiteJobCard';
import SiteJobDetail from '../components/SiteJobDetail';

const LIST_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'shop', label: 'Shop Jobs' },
  { value: 'site', label: 'Site Jobs' },
  { value: 'urgent', label: 'Urgent' },
];

const SORT_OPTIONS = [
  { value: 'nearest', label: 'Nearest' },
  { value: 'latest', label: 'Latest' },
  { value: 'salary', label: 'Salary ↑' },
];

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [siteJobs, setSiteJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedSiteJob, setSelectedSiteJob] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [sortBy, setSortBy] = useState('nearest');
  const [page, setPage] = useState(1);
  const [listFilter, setListFilter] = useState('all');
  const [filters, setFilters] = useState({
    distance: 3,
    type: 'all',
    urgency: 'all',
    classification: 'all',
  });

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const loc = await getLocationWithFallback();
      setUserLocation(loc);
      const [allJobs, sites] = await Promise.all([
        jobService.seedJobsNear(loc.lat, loc.lng),
        jobService.getSiteJobs(),
      ]);
      setJobs(allJobs);
      setSiteJobs(sites);
      setLoading(false);
    };
    init();
  }, []);

  // Filter, sort, paginate
  const processedJobs = useMemo(() => {
    let result = jobs.filter((j) => j.status === 'active' && isShopJob(j));

    // Add distance
    if (userLocation) {
      result = result.map(job => ({
        ...job,
        distance: calculateDistance(
          userLocation.lat, userLocation.lng,
          job.location?.lat || 0, job.location?.lng || 0
        ),
      }));
    }

    // Filter by distance
    if (userLocation && filters.distance !== 'all') {
      result = result.filter(j => j.distance <= filters.distance);
    }

    // Filter by type
    if (filters.type !== 'all') {
      result = result.filter(j => j.type === filters.type);
    }

    // Filter by urgency
    if (filters.urgency !== 'all') {
      result = result.filter(j => j.urgency === filters.urgency);
    }

    result = result.filter((j) => passesClassificationFilter(j, filters.classification, currentUser));

    // Sort
    switch (sortBy) {
      case 'nearest':
        result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      case 'latest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'salary':
        result.sort((a, b) => (b.salaryAmount || 0) - (a.salaryAmount || 0));
        break;
    }

    return result;
  }, [jobs, userLocation, filters, sortBy, currentUser]);

  const enrichedSiteJobs = useMemo(() => {
    let list = siteJobs
      .filter((j) => j.status === 'active' && isSiteJob(j))
      .map((job) => ({
        ...job,
        distance: userLocation && job.location?.lat
          ? calculateDistance(userLocation.lat, userLocation.lng, job.location.lat, job.location.lng)
          : null,
      }));
    if (userLocation && filters.distance !== 'all') {
      list = list.filter((j) => j.distance == null || j.distance <= filters.distance);
    }
    list.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    return list;
  }, [siteJobs, userLocation, filters.distance]);

  const activeSitesNearby = enrichedSiteJobs.slice(0, 8);

  const visibleSiteJobs = useMemo(() => {
    if (listFilter === 'shop') return [];
    let list = [...enrichedSiteJobs];
    if (listFilter === 'urgent') list = list.filter((j) => j.urgency === 'urgent');
    return list;
  }, [enrichedSiteJobs, listFilter]);

  const showShopList = listFilter === 'all' || listFilter === 'shop' || listFilter === 'urgent';
  const shopListForDisplay = useMemo(() => {
    if (!showShopList) return [];
    if (listFilter === 'urgent') return processedJobs.filter((j) => j.urgency === 'urgent');
    return processedJobs;
  }, [processedJobs, listFilter, showShopList]);

  // Apply
  const handleApply = async (job) => {
    if (appliedJobs.has(job.jobId)) return;

    setIsApplying(true);
    try {
      const exists = await applicationService.checkExisting(job.jobId, currentUser.uid);
      if (exists) {
        toast.error('Already applied');
        setAppliedJobs(prev => new Set([...prev, job.jobId]));
        setIsApplying(false);
        return;
      }

      await applicationService.createApplication({
        jobId: job.jobId,
        workerId: currentUser.uid,
        employerId: job.employerId,
        applicationType: 'job-application',
        posterType: 'employer',
        workerAgeGroup: currentUser.ageGroup,
        workerGender: currentUser.gender,
        workerType: currentUser.workerType,
        workerName: currentUser.name || 'Worker',
        workerPhone: currentUser.phoneNumber || '',
        workerSkills: currentUser.skills || [],
        jobTitle: job.title,
      });

      setAppliedJobs(prev => new Set([...prev, job.jobId]));
      toast.success('Application sent! 🎉');

      openWhatsApp(
        job.employerPhone,
        buildShopJobApplicationMessage({
          workerName: currentUser.name || 'Worker',
          jobTitle: job.title,
          shopName: job.shopName || 'your shop',
          topSkills: currentUser.skills || [],
        })
      );
    } catch {
      toast.error('Failed to apply');
    }
    setIsApplying(false);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Nearby Jobs
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {shopListForDisplay.length} shop jobs · {enrichedSiteJobs.length} site jobs ·{' '}
            <button type="button" className="underline" style={{ color: 'var(--color-resident-blue)' }} onClick={() => navigate('/tasks')}>Home tasks →</button>
          </p>
        </div>
        <button
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{
            background: showFilters ? 'var(--color-primary)' : 'var(--color-bg-input)',
            color: showFilters ? 'white' : 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* List source filters */}
      <div className="map-filter-chips mb-4">
        {LIST_FILTERS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={`map-filter-chip ${listFilter === chip.value ? 'active' : ''}`}
            style={
              listFilter === chip.value && chip.value === 'site'
                ? { background: 'var(--color-contractor-orange)', borderColor: 'var(--color-contractor-orange)' }
                : undefined
            }
            onClick={() => { setListFilter(chip.value); setPage(1); }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {activeSitesNearby.length > 0 && listFilter !== 'shop' && (
        <section className="mb-5 animate-fade-in">
          <h2 className="text-base font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>🏗️ Active Sites Near You</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {activeSitesNearby.map((job) => (
              <div key={job.jobId} className="shrink-0" style={{ width: 'min(82vw, 280px)' }}>
                <SiteJobCard job={job} compact onView={setSelectedSiteJob} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <ClassificationFilterChips
        value={filters.classification || 'all'}
        onChange={(classification) => setFilters((f) => ({ ...f, classification }))}
      />

      {showFilters && (
        <div className="card mb-4 animate-fade-in mt-3">
          <FilterBar filters={filters} onFilterChange={setFilters} showClassification />
        </div>
      )}

      {/* Sort bar */}
      <div className="flex items-center gap-2 mb-4">
        <ArrowUpDown size={14} style={{ color: 'var(--color-text-muted)' }} />
        <div className="flex gap-1.5">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sortBy === opt.value ? 'text-white' : ''
              }`}
              style={{
                background: sortBy === opt.value ? 'var(--color-primary)' : 'var(--color-bg-input)',
                color: sortBy === opt.value ? 'white' : 'var(--color-text-muted)',
              }}
              onClick={() => setSortBy(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Job List */}
      {loading ? (
        <SkeletonList count={4} />
      ) : shopListForDisplay.length === 0 && visibleSiteJobs.length === 0 ? (
        <EmptyState
          icon="search"
          title="No Jobs Found"
          description="Try adjusting your filters or increasing the search radius"
          actionLabel="Reset Filters"
          onAction={() => {
            setFilters({ distance: 'all', type: 'all', urgency: 'all', classification: 'all' });
            setListFilter('all');
          }}
        />
      ) : (
        <div className="space-y-3 stagger-children">
          {visibleSiteJobs.map((job) => (
            <SiteJobCard key={job.jobId} job={job} onView={setSelectedSiteJob} />
          ))}

          {showShopList && shopListForDisplay.slice(0, page * ITEMS_PER_PAGE).map((job) => (
            <JobCard
              key={job.jobId}
              job={job}
              onApply={handleApply}
              onView={setSelectedJob}
              applied={appliedJobs.has(job.jobId)}
            />
          ))}

          {showShopList && shopListForDisplay.length > page * ITEMS_PER_PAGE && (
            <button
              className="btn-secondary w-full mt-2"
              onClick={() => setPage(p => p + 1)}
            >
              Load More Jobs
            </button>
          )}
        </div>
      )}

      {/* Job Detail Bottom Sheet */}
      <BottomSheet isOpen={!!selectedJob} onClose={() => setSelectedJob(null)}>
        {selectedJob && (
          <div className="animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
                  {selectedJob.title}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {selectedJob.shopName} · {selectedJob.shopCategory || 'Shop'}
                </p>
              </div>
              <UrgencyBadge urgency={selectedJob.urgency} />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{selectedJob.salary}</div>
                <div className="stat-label">Salary</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                  {selectedJob.distance != null ? formatDistance(selectedJob.distance) : '—'}
                </div>
                <div className="stat-label">Distance</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                  {selectedJob.workersRequired || 1}
                </div>
                <div className="stat-label">Workers</div>
              </div>
            </div>

            {selectedJob.skillsRequired?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Skills Required</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.skillsRequired.map(s => (
                    <span key={s} className="chip" style={{ cursor: 'default', padding: '6px 12px' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedJob.description && (
              <div className="mb-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Description</h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {selectedJob.description}
                </p>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={() => handleApply(selectedJob)}
              disabled={isApplying || appliedJobs.has(selectedJob.jobId)}
            >
              {appliedJobs.has(selectedJob.jobId) ? '✓ Applied' : <><MessageCircle size={20} /> Apply Now</>}
            </button>
          </div>
        )}
      </BottomSheet>

      <BottomSheet isOpen={!!selectedSiteJob} onClose={() => setSelectedSiteJob(null)}>
        {selectedSiteJob && (
          <SiteJobDetail job={selectedSiteJob} currentUser={currentUser} onApplied={(jobId) => setAppliedJobs((prev) => new Set([...prev, jobId]))} />
        )}
      </BottomSheet>
    </div>
  );
};

export default JobsList;
