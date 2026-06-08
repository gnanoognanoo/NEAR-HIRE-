import { MapPin, Users, CalendarDays, HardHat } from 'lucide-react';
import UrgencyBadge from './UrgencyBadge';
import { formatDistance } from '../services/locationService';
import { formatDateShort, timeAgo } from '../utils/jobHelpers';
import { getOpenWorkerCount, getWageRange, normalizeFacilities } from '../constants/contractor';

const FACILITY_LABELS = [
  ['accommodation', 'Stay'],
  ['food', 'Food'],
  ['advancePayment', 'Advance'],
  ['safetyEquipment', 'Safety'],
  ['transport', 'Transport'],
];

const SiteJobCard = ({ job, onView, compact = false }) => {
  const facilities = normalizeFacilities(job.facilitiesOffered);
  const openWorkers = getOpenWorkerCount(job);
  const wageRange = getWageRange(job.requirements);

  return (
    <button
      type="button"
      className={`card site-card w-full text-left animate-fade-in ${compact ? 'site-mini-card' : ''}`}
      onClick={() => onView?.(job)}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(249, 115, 22, 0.14)', color: 'var(--color-contractor-orange)' }}
        >
          <HardHat size={21} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-[1rem] truncate" style={{ fontFamily: 'var(--font-display)' }}>
              {job.projectName || job.title}
            </h3>
            {!compact && <UrgencyBadge urgency={job.urgency} size="small" />}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="badge badge-contractor">{job.contractorType || 'Contractor'}</span>
            <span className="badge" style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)' }}>
              {job.projectDuration || 'Project'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
            <span className="flex items-center gap-1"><MapPin size={12} /> {job.locality || job.location?.address || 'Nearby site'}</span>
            <span className="flex items-center gap-1"><Users size={12} /> {openWorkers} needed</span>
            <span className="flex items-center gap-1"><CalendarDays size={12} /> {formatDateShort(job.startDate)}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-base font-bold" style={{ color: 'var(--color-contractor-orange)', fontFamily: 'var(--font-display)' }}>
              {wageRange}
            </span>
            {job.distance != null && (
              <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                {typeof job.distance === 'number' ? formatDistance(job.distance) : job.distance}
              </span>
            )}
          </div>

          {!compact && (
            <>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {FACILITY_LABELS.filter(([key]) => facilities[key]).map(([key, label]) => (
                  <span key={key} className="text-[0.65rem] px-2 py-0.5 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-facility-green)' }}>
                    {label}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{timeAgo(job.createdAt)}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-contractor-orange)' }}>View Project</span>
              </div>
            </>
          )}
        </div>
      </div>
    </button>
  );
};

export default SiteJobCard;
