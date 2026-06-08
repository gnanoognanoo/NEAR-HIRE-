import { Briefcase, MapPin, Clock } from 'lucide-react';
import UrgencyBadge from './UrgencyBadge';
import { formatDistance } from '../services/locationService';

/**
 * Job card component for list views
 * Shows: urgency border, title, shop, salary, distance, type, skills, apply button
 */
const JobCard = ({ job, onApply, onView, showApply = true, applied = false }) => {
  const urgencyBorderClass = {
    urgent: 'urgency-border-urgent',
    'this-week': 'urgency-border-this-week',
    flexible: 'urgency-border-flexible',
  }[job.urgency] || 'urgency-border-flexible';

  const typeLabel = {
    'full-time': 'Full-time',
    'part-time': 'Part-time',
    'temporary': 'Temporary',
  }[job.type] || job.type;

  return (
    <div
      className={`card ${urgencyBorderClass} animate-fade-in cursor-pointer`}
      onClick={() => onView?.(job)}
      style={{ paddingLeft: '20px' }}
    >
      {/* Header row */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 pr-3">
          <h3
            className="text-[1.05rem] font-semibold truncate"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          >
            {job.title}
          </h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {job.shopName || 'Local Business'}
          </p>
        </div>
        <UrgencyBadge urgency={job.urgency} size="small" />
      </div>

      {/* Info row */}
      <div className="flex flex-wrap items-center gap-3 mt-3 mb-3">
        <span
          className="font-semibold text-base"
          style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}
        >
          {job.salary}
        </span>
        {job.distance !== undefined && (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <MapPin size={12} />
            {typeof job.distance === 'number' ? formatDistance(job.distance) : job.distance}
          </span>
        )}
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: 'var(--color-bg-input)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          {typeLabel}
        </span>
      </div>

      {/* Skills */}
      {job.skillsRequired && job.skillsRequired.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.skillsRequired.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="text-[0.7rem] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(255, 107, 44, 0.08)',
                color: 'var(--color-primary)',
                border: '1px solid rgba(255, 107, 44, 0.15)',
              }}
            >
              {skill}
            </span>
          ))}
          {job.skillsRequired.length > 4 && (
            <span className="text-[0.7rem] px-2 py-0.5" style={{ color: 'var(--color-text-muted)' }}>
              +{job.skillsRequired.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Action row */}
      {showApply && (
        <div className="flex items-center justify-between mt-1 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <Clock size={12} />
            {job.createdAt ? getTimeAgo(job.createdAt) : 'Recently'}
          </span>
          <button
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: applied ? 'var(--color-bg-input)' : 'var(--color-primary)',
              color: applied ? 'var(--color-text-muted)' : 'white',
              boxShadow: applied ? 'none' : '0 2px 8px var(--color-primary-glow)',
              fontFamily: 'var(--font-display)',
              cursor: applied ? 'default' : 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!applied) onApply?.(job);
            }}
            disabled={applied}
          >
            {applied ? '✓ Applied' : 'Apply'}
          </button>
        </div>
      )}
    </div>
  );
};

function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default JobCard;
