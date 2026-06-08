import { getMatchLabel } from '../utils/matchClassification';

const MatchBadge = ({ task, worker }) => {
  const match = getMatchLabel(task, worker);
  if (match === 'none' || !worker?.gender) return null;

  if (match === 'good') {
    return (
      <span className="badge" style={{ background: 'rgba(0, 200, 81, 0.2)', color: '#86efac', borderColor: 'rgba(0,200,81,0.3)' }}>
        ✓ Matches you
      </span>
    );
  }

  return (
    <span className="badge" style={{ background: 'rgba(255, 184, 0, 0.15)', color: '#FFB800' }}>
      Partial match
    </span>
  );
};

export default MatchBadge;
