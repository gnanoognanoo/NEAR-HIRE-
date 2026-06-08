const STYLES = {
  today: 'badge-date-today',
  tomorrow: 'badge-date-tomorrow',
  'this-week': 'badge-date-week',
  flexible: 'badge-date-flexible',
};

const LABELS = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  'this-week': 'This Week',
  flexible: 'Flexible',
};

const DateNeededBadge = ({ dateNeeded }) => {
  if (!dateNeeded) return null;
  return (
    <span className={`badge ${STYLES[dateNeeded] || STYLES.flexible}`}>
      {LABELS[dateNeeded] || dateNeeded}
    </span>
  );
};

export default DateNeededBadge;
