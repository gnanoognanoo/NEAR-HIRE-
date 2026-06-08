import { Briefcase, Search, MapPin } from 'lucide-react';

/**
 * Empty state component with icon, message, and CTA
 */
const EmptyState = ({ icon, title, description, actionLabel, onAction }) => {
  const IconComponent = {
    briefcase: Briefcase,
    search: Search,
    pin: MapPin,
  }[icon] || Briefcase;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{
          background: 'var(--color-bg-input)',
          color: 'var(--color-text-muted)',
        }}
      >
        <IconComponent size={28} />
      </div>
      <h3
        className="text-lg font-semibold mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
      >
        {title}
      </h3>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)', maxWidth: 280 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button className="btn-primary" style={{ width: 'auto', padding: '12px 32px' }} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
