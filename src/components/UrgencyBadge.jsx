/**
 * Urgency badge with spec-exact colors and pulse animation for urgent
 */
const urgencyConfig = {
  urgent: {
    label: '🔴 Urgent',
    className: 'badge-urgent solid',
  },
  'this-week': {
    label: '🟡 This Week',
    className: 'badge-week solid',
  },
  flexible: {
    label: '🟢 Flexible',
    className: 'badge-flexible solid',
  },
};

const UrgencyBadge = ({ urgency, size = 'default' }) => {
  const config = urgencyConfig[urgency] || urgencyConfig.flexible;
  const sizeClass = size === 'small' ? 'text-[0.65rem] px-2 py-0.5' : '';

  return (
    <span className={`badge ${config.className} ${sizeClass}`}>
      {config.label}
    </span>
  );
};

export default UrgencyBadge;
