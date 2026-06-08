const STYLES = {
  student: 'badge-wt-student',
  homemaker: 'badge-wt-homemaker',
  'daily-wage': 'badge-wt-daily',
  skilled: 'badge-wt-skilled',
  fresher: 'badge-wt-fresher',
};

const LABELS = {
  student: 'Student',
  homemaker: 'Homemaker',
  'daily-wage': 'Daily Wage',
  skilled: 'Skilled',
  fresher: 'Fresher',
};

const WorkerTypeBadge = ({ type }) => {
  if (!type) return null;
  return (
    <span className={`badge ${STYLES[type] || ''}`}>
      {LABELS[type] || type}
    </span>
  );
};

export default WorkerTypeBadge;
