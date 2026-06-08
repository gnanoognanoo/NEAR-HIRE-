import { CLASSIFICATION_FILTERS } from '../utils/matchClassification';

/** Gender + age group filter chips (map, tasks, jobs list). */
const ClassificationFilterChips = ({ value, onChange }) => (
  <div className="map-filter-chips">
    {CLASSIFICATION_FILTERS.map((chip) => (
      <button
        key={chip.value}
        type="button"
        className={`map-filter-chip ${value === chip.value ? 'active' : ''}`}
        onClick={() => onChange(chip.value)}
      >
        {chip.label}
      </button>
    ))}
  </div>
);

export default ClassificationFilterChips;
