import { useState } from 'react';
import ClassificationFilterChips from './ClassificationFilterChips';

const DISTANCE_PRESETS = [1, 3, 5];
const DEFAULT_CUSTOM_DISTANCE = 10;

const normalizeCustomDistance = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return DEFAULT_CUSTOM_DISTANCE;
  return Math.min(100, Math.max(1, Math.round(numericValue)));
};

const isPresetDistance = (distance) =>
  distance === 'all' || DISTANCE_PRESETS.includes(distance);

/**
 * Filter bar component for job search — distance, type, urgency
 */
const FilterBar = ({ filters, onFilterChange, showMapSource = false, showClassification = false }) => {
  const isCustomDistance = !isPresetDistance(filters.distance);
  const [customDistance, setCustomDistance] = useState(
    isCustomDistance ? String(filters.distance) : String(DEFAULT_CUSTOM_DISTANCE)
  );

  const mapSourceChips = [
    { value: 'all', label: 'All' },
    { value: 'shop', label: 'Shop Jobs' },
    { value: 'home', label: 'Home Tasks' },
    { value: 'site', label: 'Sites' },
    { value: 'today', label: 'Today Only' },
  ];

  const jobTypes = [
    { value: 'all', label: 'All' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'temporary', label: 'Temporary' },
  ];

  const urgencies = [
    { value: 'all', label: 'All' },
    { value: 'urgent', label: '🔴 Urgent' },
    { value: 'this-week', label: '🟡 Week' },
    { value: 'flexible', label: '🟢 Flex' },
  ];

  const handleCustomDistanceChange = (event) => {
    const nextValue = event.target.value;
    setCustomDistance(nextValue);

    const numericValue = Number(nextValue);
    if (nextValue !== '' && Number.isFinite(numericValue) && numericValue > 0) {
      onFilterChange({ ...filters, distance: numericValue });
    }
  };

  const handleCustomDistanceBlur = () => {
    const normalizedDistance = normalizeCustomDistance(customDistance);
    setCustomDistance(String(normalizedDistance));
    onFilterChange({ ...filters, distance: normalizedDistance });
  };

  const handleCustomDistanceClick = () => {
    const normalizedDistance = normalizeCustomDistance(customDistance);
    setCustomDistance(String(normalizedDistance));
    onFilterChange({ ...filters, distance: normalizedDistance });
  };

  return (
    <div className="space-y-3">
      {/* Distance */}
      <div>
        <label className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1.5 block"
          style={{ color: 'var(--color-text-muted)' }}>
          Distance
        </label>
        <div className="filter-toggle-group filter-toggle-group-distance flex-wrap">
          <button
            className={`filter-toggle ${filters.distance === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filters, distance: 'all' })}
          >
            All
          </button>
          {DISTANCE_PRESETS.map((km) => (
            <button
              key={km}
              className={`filter-toggle ${filters.distance === km ? 'active' : ''}`}
              onClick={() => onFilterChange({ ...filters, distance: km })}
            >
              {km} km
            </button>
          ))}
          <button
            className={`filter-toggle ${isCustomDistance ? 'active' : ''}`}
            onClick={handleCustomDistanceClick}
          >
            Custom
          </button>
        </div>
        {isCustomDistance && (
          <div className="custom-distance-row">
            <input
              className="custom-distance-input"
              type="number"
              min="1"
              max="100"
              step="1"
              value={customDistance}
              onChange={handleCustomDistanceChange}
              onBlur={handleCustomDistanceBlur}
              aria-label="Custom distance in kilometers"
            />
            <span>km</span>
          </div>
        )}
      </div>

      {showMapSource && (
        <div>
          <label className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1.5 block"
            style={{ color: 'var(--color-text-muted)' }}>
            Show on map
          </label>
          <div className="map-filter-chips">
            {mapSourceChips.map((chip) => (
              <button
                key={chip.value}
                type="button"
                className={`map-filter-chip ${filters.mapSource === chip.value ? 'active' : ''}`}
                onClick={() => onFilterChange({ ...filters, mapSource: chip.value })}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showClassification && (
        <div>
          <label className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1.5 block"
            style={{ color: 'var(--color-text-muted)' }}>
            Gender & age group
          </label>
          <ClassificationFilterChips
            value={filters.classification || 'all'}
            onChange={(classification) => onFilterChange({ ...filters, classification })}
          />
        </div>
      )}

      {/* Job Type */}
      <div>
        <label className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1.5 block"
          style={{ color: 'var(--color-text-muted)' }}>
          Job Type
        </label>
        <div className="filter-toggle-group">
          {jobTypes.map((t) => (
            <button
              key={t.value}
              className={`filter-toggle ${filters.type === t.value ? 'active' : ''}`}
              onClick={() => onFilterChange({ ...filters, type: t.value })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Urgency */}
      <div>
        <label className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1.5 block"
          style={{ color: 'var(--color-text-muted)' }}>
          Urgency
        </label>
        <div className="filter-toggle-group">
          {urgencies.map((u) => (
            <button
              key={u.value}
              className={`filter-toggle ${filters.urgency === u.value ? 'active' : ''}`}
              onClick={() => onFilterChange({ ...filters, urgency: u.value })}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
