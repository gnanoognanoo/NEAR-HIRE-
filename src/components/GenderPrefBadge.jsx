const GenderPrefBadge = ({ preference }) => {
  if (!preference || preference === 'any') return null;
  const cls = preference === 'male' ? 'badge-gender-male' : 'badge-gender-female';
  const label = preference === 'male' ? 'Male Only' : 'Female Only';
  return <span className={`badge ${cls}`}>{label}</span>;
};

export default GenderPrefBadge;
