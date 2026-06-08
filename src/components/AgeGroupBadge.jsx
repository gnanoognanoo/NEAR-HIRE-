const STYLES = {
  youngster: 'badge-age-youngster',
  adult: 'badge-age-adult',
  senior: 'badge-age-senior',
};

const LABELS = {
  youngster: '18–25',
  adult: '26–40',
  senior: '40+',
};

const AgeGroupBadge = ({ ageGroup }) => {
  if (!ageGroup) return null;
  return (
    <span className={`badge ${STYLES[ageGroup] || ''}`}>
      {LABELS[ageGroup] || ageGroup}
    </span>
  );
};

export default AgeGroupBadge;
