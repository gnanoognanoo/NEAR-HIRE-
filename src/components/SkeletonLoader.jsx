/**
 * Skeleton loading components — shimmer animations
 */

export const SkeletonCard = () => (
  <div className="card" style={{ border: '1px solid var(--color-border)' }}>
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <div className="skeleton" style={{ height: 18, width: '70%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: '45%' }} />
      </div>
      <div className="skeleton" style={{ height: 24, width: 70, borderRadius: 999 }} />
    </div>
    <div className="flex gap-3 mb-3">
      <div className="skeleton" style={{ height: 16, width: 80 }} />
      <div className="skeleton" style={{ height: 16, width: 60 }} />
    </div>
    <div className="flex gap-2 mb-3">
      <div className="skeleton" style={{ height: 22, width: 60, borderRadius: 999 }} />
      <div className="skeleton" style={{ height: 22, width: 50, borderRadius: 999 }} />
      <div className="skeleton" style={{ height: 22, width: 70, borderRadius: 999 }} />
    </div>
    <div className="skeleton" style={{ height: 36, width: 80, borderRadius: 12, marginLeft: 'auto' }} />
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonProfile = () => (
  <div className="flex flex-col items-center py-6">
    <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 16 }} />
    <div className="skeleton" style={{ height: 20, width: 140, marginBottom: 8 }} />
    <div className="skeleton" style={{ height: 14, width: 100, marginBottom: 4 }} />
    <div className="skeleton" style={{ height: 24, width: 80, borderRadius: 999, marginTop: 8 }} />
  </div>
);

export const SkeletonStats = () => (
  <div className="stats-grid">
    {[1, 2, 3].map((i) => (
      <div key={i} className="stat-card">
        <div className="skeleton" style={{ height: 28, width: 40, margin: '0 auto 8px' }} />
        <div className="skeleton" style={{ height: 10, width: 50, margin: '0 auto' }} />
      </div>
    ))}
  </div>
);
