import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import { Briefcase, Clock, MapPin, MessageCircle, Navigation, Store, Users } from 'lucide-react';
import BottomSheet from '../components/BottomSheet';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/dataService';
import { calculateDistance, formatDistance, getLocationWithFallback } from '../services/locationService';
import toast from 'react-hot-toast';

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

const MapLoadGate = ({ children }) => {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <MapPin size={36} style={{ color: 'var(--color-urgent)' }} />
        <h2 className="text-lg font-semibold mt-4 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Google Maps Error
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)', maxWidth: 300 }}>
          Check your Maps API key in <code>.env</code>.
        </p>
      </div>
    );
  }

  if (status === APILoadingStatus.LOADING || status === APILoadingStatus.NOT_LOADED) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <span className="spinner spinner-lg" />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading workers map...</span>
        </div>
      </div>
    );
  }

  return children;
};

const EmployerWorkersMap = () => {
  const { currentUser } = useAuth();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [workers, setWorkers] = useState([]);
  const [shopLocation, setShopLocation] = useState(currentUser?.location || DEFAULT_CENTER);
  const [mapCenter, setMapCenter] = useState(currentUser?.location || DEFAULT_CENTER);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);

  useEffect(() => {
    const init = async () => {
      const center = currentUser?.location || await getLocationWithFallback();
      const loadedWorkers = await userService.getAvailableWorkers(center.lat, center.lng);
      setShopLocation(center);
      setMapCenter(center);
      setWorkers(loadedWorkers);
      setLoading(false);
    };

    init();
  }, [currentUser]);

  const visibleWorkers = useMemo(() => {
    return workers
      .filter((worker) => worker.availableToday !== false)
      .filter((worker) => worker.location?.lat && worker.location?.lng)
      .map((worker) => ({
        ...worker,
        distance: calculateDistance(
          shopLocation.lat,
          shopLocation.lng,
          worker.location.lat,
          worker.location.lng
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [workers, shopLocation]);

  const handleCameraChanged = useCallback((event) => {
    const nextCenter = event.detail?.center;
    if (!nextCenter) return;

    setMapCenter((currentCenter) => {
      const latChanged = Math.abs(currentCenter.lat - nextCenter.lat) > 0.000001;
      const lngChanged = Math.abs(currentCenter.lng - nextCenter.lng) > 0.000001;
      return latChanged || lngChanged ? nextCenter : currentCenter;
    });
  }, []);

  const handleLocateShop = useCallback(() => {
    setMapCenter(shopLocation);
    toast.success('Centered on your shop');
  }, [shopLocation]);

  const handleWhatsApp = (worker) => {
    const msg = encodeURIComponent(
      `Hi ${worker.name || 'Worker'}, this is ${currentUser.shopName || currentUser.name || 'Employer'} from NearHire. Are you available today for work?`
    );
    const phone = worker.phoneNumber?.replace(/\D/g, '') || '919999999999';
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <MapPin size={40} style={{ color: 'var(--color-text-muted)' }} />
        <h2 className="text-lg font-semibold mt-4 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Maps API Key Missing
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> file.
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      <APIProvider apiKey={apiKey}>
        <MapLoadGate>
          <Map
            center={mapCenter}
            defaultZoom={12}
            onCameraChanged={handleCameraChanged}
            mapId={MAP_ID}
            style={{ height: '100%', width: '100%' }}
            gestureHandling="greedy"
            disableDefaultUI
            zoomControl
            fullscreenControl={false}
            mapTypeControl={false}
            streetViewControl={false}
          >
            <AdvancedMarker position={shopLocation} zIndex={10000} title="Your shop">
              <div className="employer-shop-marker" aria-label="Your shop">
                <Store size={16} />
                <span>Shop</span>
              </div>
            </AdvancedMarker>

            {visibleWorkers.map((worker) => (
              <AdvancedMarker
                key={worker.userId || worker.uid}
                position={{ lat: worker.location.lat, lng: worker.location.lng }}
                title={`${worker.name || 'Worker'} available today`}
                onClick={() => setSelectedWorker(worker)}
              >
                <div
                  className="available-worker-marker"
                  aria-label={`${worker.name || 'Worker'} available today`}
                  onClick={() => setSelectedWorker(worker)}
                >
                  <span className="available-worker-dot" />
                </div>
              </AdvancedMarker>
            ))}
          </Map>
        </MapLoadGate>
      </APIProvider>

      <div
        style={{
          position: 'absolute', top: 16, left: 16, right: 16,
          zIndex: 10, pointerEvents: 'none',
        }}
      >
        <div
          className="glass flex items-center gap-3"
          style={{ padding: '10px 16px', borderRadius: 16, pointerEvents: 'auto' }}
        >
          <Users size={18} style={{ color: 'var(--color-flexible)', flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
              {loading ? 'Loading workers...' : `${visibleWorkers.length} workers available today`}
            </div>
            <div className="text-[0.68rem] truncate" style={{ color: 'var(--color-text-muted)' }}>
              {currentUser.shopName || 'Your shop'}
            </div>
          </div>
        </div>
      </div>

      {!loading && visibleWorkers.length === 0 && (
        <div style={{ position: 'absolute', left: 16, right: 16, top: 92, zIndex: 10 }}>
          <EmptyState
            icon="users"
            title="No Workers Available"
            description="Workers who mark themselves available today will appear on this map."
          />
        </div>
      )}

      <button
        onClick={handleLocateShop}
        className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{
          position: 'absolute',
          bottom: 90,
          right: 16,
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          color: 'var(--color-primary)',
          zIndex: 10,
        }}
      >
        <Navigation size={22} />
      </button>

      <div
        className="glass flex items-center gap-3"
        style={{
          position: 'absolute',
          bottom: 90,
          left: 16,
          padding: '8px 14px',
          borderRadius: 12,
          zIndex: 10,
          fontSize: '0.68rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#00C851' }} /> Worker</span>
        <span className="flex items-center gap-1.5"><Store size={12} style={{ color: 'var(--color-primary)' }} /> Shop</span>
      </div>

      <BottomSheet isOpen={!!selectedWorker} onClose={() => setSelectedWorker(null)}>
        {selectedWorker && (
          <div className="animate-fade-in">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {selectedWorker.name || 'Worker'}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {selectedWorker.location?.address || 'Nearby worker'}
                </p>
              </div>
              <span className="badge" style={{ color: 'var(--color-flexible)', borderColor: 'rgba(0,200,81,0.35)' }}>
                Available
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                  {formatDistance(selectedWorker.distance)}
                </div>
                <div className="stat-label">Distance</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                  {selectedWorker.rating || '4.5'}
                </div>
                <div className="stat-label">Rating</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                  {selectedWorker.completedJobs || 0}
                </div>
                <div className="stat-label">Jobs</div>
              </div>
            </div>

            {selectedWorker.skills?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedWorker.skills.map((skill) => (
                    <span key={skill} className="chip" style={{ cursor: 'default', padding: '6px 12px' }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Briefcase size={14} /> {selectedWorker.availability || 'Flexible'}
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Clock size={14} /> {selectedWorker.experience || 'Fresher'}
              </span>
            </div>

            <button className="btn-whatsapp w-full" onClick={() => handleWhatsApp(selectedWorker)}>
              <MessageCircle size={20} /> Contact on WhatsApp
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default EmployerWorkersMap;
