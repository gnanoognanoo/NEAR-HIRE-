import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import { jobService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { calculateDistance, formatDistance, getLocationWithFallback } from '../services/locationService';
import BottomSheet from '../components/BottomSheet';
import FilterBar from '../components/FilterBar';
import UrgencyBadge from '../components/UrgencyBadge';
import DateNeededBadge from '../components/DateNeededBadge';
import AgeGroupBadge from '../components/AgeGroupBadge';
import GenderPrefBadge from '../components/GenderPrefBadge';
import { MapPin, Navigation, SlidersHorizontal, X, Briefcase, Clock, Users, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { applicationService } from '../services/dataService';
import { getJobPinColor, PIN_COLORS } from '../utils/mapPins';
import { isHomeTask, isShopJob, isSiteJob, formatPay } from '../utils/jobHelpers';
import { buildShopJobApplicationMessage, buildTaskInterestMessage, openWhatsApp } from '../utils/whatsapp';
import { passesClassificationFilter, isGoodMatchForWorker } from '../utils/matchClassification';
import ClassificationFilterChips from '../components/ClassificationFilterChips';
import MatchBadge from '../components/MatchBadge';
import SiteJobDetail from '../components/SiteJobDetail';

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';
const MAX_MARKERS = 1000;

const getDistanceSummary = (distance) => (
  distance === 'all' ? 'across all distances' : `within ${distance} km`
);

const getVisibleJobsForMap = (jobsForMap, distanceFilter) => {
  if (jobsForMap.length <= MAX_MARKERS) return jobsForMap;

  if (distanceFilter === 'all') {
    const step = jobsForMap.length / MAX_MARKERS;
    return Array.from(
      { length: MAX_MARKERS },
      (_, index) => jobsForMap[Math.floor(index * step)]
    ).filter(Boolean);
  }

  return jobsForMap.slice(0, MAX_MARKERS);
};


// ── Map Load Gate ────────────────────────────────────────
const MapLoadGate = ({ children }) => {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--color-bg-input)', color: 'var(--color-urgent)' }}>
          <MapPin size={28} />
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Google Maps Error
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)', maxWidth: 300 }}>
          API key was rejected. Please check your <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--color-bg-input)' }}>VITE_GOOGLE_MAPS_API_KEY</code> in <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--color-bg-input)' }}>.env</code>
        </p>
      </div>
    );
  }

  if (status === APILoadingStatus.LOADING || status === APILoadingStatus.NOT_LOADED) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <span className="spinner spinner-lg" />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading map…</span>
        </div>
      </div>
    );
  }

  return children;
};

// ══════════════════════════════════════════════════════════
// MAP DISCOVERY — Worker Home Screen
// ══════════════════════════════════════════════════════════
const MapDiscovery = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [filters, setFilters] = useState({
    distance: 3,
    type: 'all',
    urgency: 'all',
    mapSource: 'all',
    classification: 'all',
  });

  const { currentUser } = useAuth();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load jobs & user location on mount
  useEffect(() => {
    const init = async () => {
      const loc = await getLocationWithFallback();
      setUserLocation(loc);
      setMapCenter(loc);

      const allJobs = await jobService.seedJobsNear(loc.lat, loc.lng);
      setJobs(allJobs);
    };
    init();
  }, []);

  // Filter & distance-sort jobs
  const filteredJobs = useMemo(() => {
    if (!userLocation) return jobs.filter(j => j.status === 'active');

    return jobs
      .filter((job) => job.status === 'active')
      .map((job) => ({
        ...job,
        distance: calculateDistance(
          userLocation.lat, userLocation.lng,
          job.location?.lat || 0, job.location?.lng || 0
        ),
      }))
      .filter((job) => filters.distance === 'all' || job.distance <= filters.distance)
      .filter((job) => filters.type === 'all' || job.type === filters.type)
      .filter((job) => filters.urgency === 'all' || job.urgency === filters.urgency)
      .filter((job) => {
        if (filters.mapSource === 'shop') return isShopJob(job);
        if (filters.mapSource === 'home') return isHomeTask(job);
        if (filters.mapSource === 'site') return isSiteJob(job);
        if (filters.mapSource === 'today') return job.dateNeeded === 'today' || (isShopJob(job) && job.urgency === 'urgent');
        return true;
      })
      .filter((job) => passesClassificationFilter(job, filters.classification, currentUser))
      .sort((a, b) => {
        const aMatch = isGoodMatchForWorker(a, currentUser) ? 0 : 1;
        const bMatch = isGoodMatchForWorker(b, currentUser) ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
        return a.distance - b.distance;
      })
  }, [jobs, userLocation, filters, currentUser]);

  const visibleJobs = useMemo(
    () => getVisibleJobsForMap(filteredJobs, filters.distance),
    [filteredJobs, filters.distance]
  );

  const handleCameraChanged = useCallback((event) => {
    const nextCenter = event.detail?.center;
    if (!nextCenter) return;

    setMapCenter((currentCenter) => {
      const latChanged = Math.abs(currentCenter.lat - nextCenter.lat) > 0.000001;
      const lngChanged = Math.abs(currentCenter.lng - nextCenter.lng) > 0.000001;
      return latChanged || lngChanged ? nextCenter : currentCenter;
    });
  }, []);

  // Locate me
  const handleLocateMe = useCallback(async () => {
    try {
      const loc = await getLocationWithFallback();
      setUserLocation(loc);
      setMapCenter(loc);
      const jobsNearLocation = await jobService.seedJobsNear(loc.lat, loc.lng);
      setJobs(jobsNearLocation);
      toast.success('Centered on your location');
    } catch {
      toast.error('Could not get location');
    }
  }, []);

  // Apply for job
  const handleApply = async (job) => {
    if (appliedJobs.has(job.jobId)) {
      toast.error('Already applied!');
      return;
    }

    setIsApplying(true);
    try {
      const exists = await applicationService.checkExisting(job.jobId, currentUser.uid);
      if (exists) {
        toast.error('You already applied to this job');
        setAppliedJobs(prev => new Set([...prev, job.jobId]));
        setIsApplying(false);
        return;
      }

      const isTask = isHomeTask(job);
      await applicationService.createApplication({
        jobId: job.jobId,
        workerId: currentUser.uid,
        employerId: job.employerId || null,
        residentId: job.residentId || null,
        applicationType: isTask ? 'task-interest' : 'job-application',
        posterType: isTask ? 'resident' : 'employer',
        taskCategory: job.taskCategory,
        workerAgeGroup: currentUser.ageGroup,
        workerGender: currentUser.gender,
        workerType: currentUser.workerType,
        workerName: currentUser.name || 'Worker',
        workerPhone: currentUser.phoneNumber || '',
        workerSkills: currentUser.skills || [],
        jobTitle: job.title,
      });

      setAppliedJobs(prev => new Set([...prev, job.jobId]));
      toast.success(isTask ? 'Interest sent! 🎉' : 'Application sent! 🎉');

      const workerName = currentUser.name || 'Worker';
      const phone = job.employerPhone || '919999999999';
      if (isTask) {
        openWhatsApp(phone, buildTaskInterestMessage({
          workerName,
          taskTitle: job.title,
          locality: job.locality || 'your area',
          availability: job.dateNeeded === 'today' ? 'today' : 'this week',
          relevantSkill: (currentUser.skills || [])[0] || '',
        }));
      } else {
        openWhatsApp(phone, buildShopJobApplicationMessage({
          workerName,
          jobTitle: job.title,
          shopName: job.shopName || 'your shop',
          topSkills: currentUser.skills || [],
        }));
      }
    } catch {
      toast.error('Failed to apply. Try again.');
    }
    setIsApplying(false);
  };

  // No API key fallback
  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <MapPin size={40} style={{ color: 'var(--color-text-muted)' }} />
        <h2 className="text-lg font-semibold mt-4 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Maps API Key Missing
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> file
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      <APIProvider apiKey={apiKey}>
        <MapLoadGate>
          <Map
            center={mapCenter}
            defaultZoom={14}
            onCameraChanged={handleCameraChanged}
            mapId={MAP_ID}
            style={{ height: '100%', width: '100%' }}
            gestureHandling="greedy"
            disableDefaultUI
            zoomControl
            fullscreenControl={false}
            mapTypeControl={false}
            streetViewControl={false}
          >
            {/* Job markers */}
            {visibleJobs.map((job) => (
              <AdvancedMarker
                key={job.jobId}
                position={{ lat: job.location.lat, lng: job.location.lng }}
                onClick={() => setSelectedJob(job)}
                title={isSiteJob(job) ? `${job.projectName || job.title} construction site` : `${job.title} at ${job.shopName || 'Local Business'}`}
              >
                {isSiteJob(job) ? (
                  <div
                    className={`contractor-marker ${job.urgency === 'urgent' && job.status === 'active' ? 'urgent' : ''} ${job.status === 'filled' || job.status === 'complete' ? 'filled' : ''}`}
                    aria-label="Construction site"
                  >
                    🏗️
                  </div>
                ) : (
                  <Pin
                    background={getJobPinColor(job)}
                    borderColor="#ffffff"
                    glyphColor="#ffffff"
                  />
                )}
              </AdvancedMarker>
            ))}

            {userLocation && (
              <AdvancedMarker position={userLocation} zIndex={10000} title="Your location">
                <div className="user-location-marker" aria-label="Your location">
                  <span className="user-location-pulse" />
                  <span className="user-location-dot" />
                  <span className="user-location-label">You</span>
                </div>
              </AdvancedMarker>
            )}
          </Map>
        </MapLoadGate>
      </APIProvider>

      {/* ── Top Bar: Search + Filter ────────────── */}
      <div
        style={{
          position: 'absolute', top: 16, left: 16, right: 16,
          zIndex: 10, pointerEvents: 'none',
        }}
      >
        <div
          className="glass flex items-center gap-3"
          style={{
            padding: '10px 16px',
            borderRadius: 16,
            pointerEvents: 'auto',
          }}
        >
          <MapPin size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <span className="text-sm font-medium flex-1" style={{ color: 'var(--color-text-primary)' }}>
            {filteredJobs.length} jobs {getDistanceSummary(filters.distance)}
          </span>
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{
              background: showFilters ? 'var(--color-primary)' : 'var(--color-bg-input)',
              color: showFilters ? 'white' : 'var(--color-text-secondary)',
            }}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? <X size={18} /> : <SlidersHorizontal size={18} />}
          </button>
        </div>

        <div className="mt-2" style={{ pointerEvents: 'auto' }}>
          <div className="map-filter-chips">
            {[
              { value: 'all', label: 'All' },
              { value: 'shop', label: 'Shop Jobs' },
              { value: 'home', label: 'Home Tasks' },
              { value: 'site', label: 'Sites' },
              { value: 'today', label: 'Today Only' },
            ].map((chip) => (
              <button
                key={chip.value}
                type="button"
                className={`map-filter-chip ${filters.mapSource === chip.value ? 'active' : ''}`}
                style={
                  filters.mapSource === chip.value && chip.value === 'site'
                    ? { background: 'var(--color-contractor-orange)', borderColor: 'var(--color-contractor-orange)' }
                    : undefined
                }
                onClick={() => setFilters((f) => ({ ...f, mapSource: chip.value }))}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2" style={{ pointerEvents: 'auto' }}>
          <ClassificationFilterChips
            value={filters.classification || 'all'}
            onChange={(classification) => setFilters((f) => ({ ...f, classification }))}
          />
        </div>

        {showFilters && (
          <div
            className="glass mt-2 p-4 animate-fade-in"
            style={{ borderRadius: 16, pointerEvents: 'auto' }}
          >
            <FilterBar filters={filters} onFilterChange={setFilters} showMapSource showClassification />
          </div>
        )}
      </div>

      {/* ── Locate Me FAB ──────────────────────── */}
      <button
        onClick={handleLocateMe}
        className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{
          position: 'absolute',
          bottom: 90,
          right: 16,
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          color: 'var(--color-primary)',
          zIndex: 10,
        }}
      >
        <Navigation size={22} />
      </button>

      {/* ── Legend ─────────────────────────────── */}
      <div
        className="glass flex items-center gap-4"
        style={{
          position: 'absolute',
          bottom: 90,
          left: 16,
          padding: '8px 14px',
          borderRadius: 12,
          zIndex: 10,
          fontSize: '0.65rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: PIN_COLORS.shopUrgent }} /> Shop</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: PIN_COLORS.homeTask }} /> Home</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: PIN_COLORS.homeUrgent }} /> Today</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: PIN_COLORS.site }} /> Sites</span>
      </div>

      {/* ── Job Detail Bottom Sheet ────────────── */}
      <BottomSheet
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      >
        {selectedJob && isSiteJob(selectedJob) ? (
          <SiteJobDetail job={selectedJob} currentUser={currentUser} />
        ) : selectedJob && (
          <div className="animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
                  {selectedJob.title}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {isHomeTask(selectedJob)
                    ? `${selectedJob.locality || 'Nearby area'} · Home Task`
                    : `${selectedJob.shopName || 'Local Business'} · ${selectedJob.shopCategory || 'Shop'}`}
                </p>
              </div>
              {isHomeTask(selectedJob) ? (
                <DateNeededBadge dateNeeded={selectedJob.dateNeeded} />
              ) : (
                <UrgencyBadge urgency={selectedJob.urgency} />
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>
                  {formatPay(selectedJob)}
                </div>
                <div className="stat-label">{isHomeTask(selectedJob) ? 'Pay' : 'Salary'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                  {selectedJob.distance !== undefined ? formatDistance(selectedJob.distance) : '—'}
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

            {/* Skills */}
            {selectedJob.skillsRequired?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--color-text-muted)' }}>
                  Skills Required
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.skillsRequired.map((s) => (
                    <span key={s} className="chip" style={{ cursor: 'default', padding: '6px 12px' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {selectedJob.experienceRequired && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--color-text-muted)' }}>
                  Experience
                </h4>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {selectedJob.experienceRequired}
                </p>
              </div>
            )}

            {/* Description */}
            {selectedJob.description && (
              <div className="mb-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--color-text-muted)' }}>
                  Description
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {selectedJob.description}
                </p>
              </div>
            )}

            {/* Type & timing */}
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Briefcase size={14} /> {selectedJob.type}
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Clock size={14} /> {selectedJob.createdAt ? new Date(selectedJob.createdAt).toLocaleDateString() : 'Recent'}
              </span>
              {selectedJob.applicantCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <Users size={14} /> {selectedJob.applicantCount} applied
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <MatchBadge task={selectedJob} worker={currentUser} />
              {isHomeTask(selectedJob) && (
                <>
                  <span className="badge">{selectedJob.duration}</span>
                  <GenderPrefBadge preference={selectedJob.genderPreference} />
                  {(selectedJob.workerTypePreference || []).map((p) => (
                    <AgeGroupBadge key={p} ageGroup={p === 'youngster' || p === 'adult' || p === 'senior' ? p : null} />
                  ))}
                  {selectedJob.ageGroupPreference && (
                    <AgeGroupBadge ageGroup={selectedJob.ageGroupPreference} />
                  )}
                </>
              )}
            </div>

            <button
              className="btn-primary"
              onClick={() => (isHomeTask(selectedJob) ? handleApply(selectedJob) : handleApply(selectedJob))}
              disabled={isApplying || appliedJobs.has(selectedJob.jobId)}
              id="apply-now-btn"
            >
              {isApplying ? (
                <span className="spinner spinner-sm" />
              ) : appliedJobs.has(selectedJob.jobId) ? (
                <>✓ {isHomeTask(selectedJob) ? 'Interested' : 'Applied'}</>
              ) : (
                <>
                  <MessageCircle size={20} /> {isHomeTask(selectedJob) ? 'View Task & Apply' : 'Apply Now'}
                </>
              )}
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default MapDiscovery;
