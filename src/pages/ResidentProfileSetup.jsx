import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, Camera, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLocationWithFallback } from '../services/locationService';
import { storageService } from '../services/storageService';

const ResidentProfileSetup = () => {
  const { currentUser, updateProfile, updateUserRole, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    locality: currentUser?.locality || '',
    apartmentName: currentUser?.apartmentName || '',
    location: currentUser?.location || null,
    photoURL: currentUser?.photoURL || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Full name is required';
    if (!formData.locality.trim()) e.locality = 'Area / locality is required';
    if (!formData.location?.lat) e.location = 'Pin your location on the map (use Detect)';
    return e;
  };

  const detectLocation = async () => {
    setDetectingLocation(true);
    try {
      const coords = await getLocationWithFallback();
      setFormData({
        ...formData,
        location: {
          lat: coords.lat,
          lng: coords.lng,
          address: formData.locality || coords.address || 'Home location',
        },
      });
      toast.success('Location pinned!');
    } catch {
      toast.error('Could not detect location');
    }
    setDetectingLocation(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await storageService.uploadProfilePhoto(currentUser.uid, file);
      setFormData((prev) => ({ ...prev, photoURL: url }));
      toast.success('Photo uploaded');
    } catch {
      toast.error('Failed to upload photo');
    }
    setUploadingPhoto(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({
        name: formData.name,
        locality: formData.locality,
        apartmentName: formData.apartmentName,
        location: formData.location,
        photoURL: formData.photoURL,
        totalTasksPosted: currentUser?.totalTasksPosted ?? 0,
        rating: currentUser?.rating ?? 0,
        isVerified: currentUser?.isVerified ?? false,
      });
      toast.success('Resident profile saved!');
      navigate('/resident/dashboard');
    } catch {
      toast.error('Failed to save profile');
    }
    setIsLoading(false);
  };

  return (
    <div className="page animate-fade-in" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="pt-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2B7FFF, #6366f1)' }}
          >
            <Home size={24} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Resident Profile
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Post home tasks for workers near you
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col items-center">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden"
            style={{ border: '2px solid var(--color-border)', background: 'var(--color-bg-input)' }}
          >
            {formData.photoURL ? (
              <img src={formData.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Camera size={24} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="spinner spinner-sm" />
              </div>
            )}
          </div>
          <label className="mt-2 text-xs font-semibold cursor-pointer" style={{ color: 'var(--color-primary)' }}>
            Profile photo (optional)
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>

        <div className="input-group">
          <label className="input-label">Full Name *</label>
          <input
            className={`input-field ${errors.name ? 'input-error' : ''}`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          {errors.name && <p className="error-text">{errors.name}</p>}
        </div>

        <div className="input-group">
          <label className="input-label">Phone</label>
          <input className="input-field" value={currentUser?.phoneNumber || ''} disabled style={{ opacity: 0.6 }} />
        </div>

        <div className="input-group">
          <label className="input-label">Area / Locality *</label>
          <input
            className={`input-field ${errors.locality ? 'input-error' : ''}`}
            placeholder="e.g. Anna Nagar"
            value={formData.locality}
            onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
          />
          {errors.locality && <p className="error-text">{errors.locality}</p>}
        </div>

        <div className="input-group">
          <label className="input-label">Apartment / House Name (optional)</label>
          <input
            className="input-field"
            placeholder="e.g. Green Meadows Block B"
            value={formData.apartmentName}
            onChange={(e) => setFormData({ ...formData, apartmentName: e.target.value })}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Location pin on map *</label>
          <button
            type="button"
            className="btn-secondary w-full min-h-[48px]"
            onClick={detectLocation}
            disabled={detectingLocation}
          >
            {detectingLocation ? <span className="spinner spinner-sm" /> : <MapPin size={18} />}
            {formData.location?.lat ? 'Location pinned ✓' : 'Detect my location'}
          </button>
          {errors.location && <p className="error-text">{errors.location}</p>}
          {formData.location?.lat && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? <span className="spinner spinner-sm" /> : <><CheckCircle size={20} /> Save & Continue</>}
        </button>
      </form>
    </div>
  );
};

export default ResidentProfileSetup;
