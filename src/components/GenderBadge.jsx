const STYLES = {
  male: 'badge-gender-male',
  female: 'badge-gender-female',
  other: '',
};

const LABELS = {
  male: 'Male',
  female: 'Female',
};

const GenderBadge = ({ gender }) => {
  if (!gender || gender === 'other') return null;
  return (
    <span className={`badge ${STYLES[gender] || ''}`}>
      {LABELS[gender] || gender}
    </span>
  );
};

export default GenderBadge;
