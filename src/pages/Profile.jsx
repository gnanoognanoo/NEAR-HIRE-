import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, MapPin, CheckCircle, Camera } from 'lucide-react';
import SkillChips from '../components/SkillChips';
import toast from 'react-hot-toast';
import { getLocationWithFallback } from '../services/locationService';
import { storageService } from '../services/storageService';

const CATEGORIES = ['Tea Shop', 'Salon', 'Restaurant', 'Retail', 'Other'];

const Profile = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isWorker = currentUser?.role === 'worker';
  const isResident = currentUser?.role === 'resident';
  const isEmployer = currentUser?.role === 'employer';
  const isContractor = currentUser?.role === 'contractor';

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    skills: currentUser?.skills || [],
    experience: currentUser?.experience || '',
    availability: currentUser?.availability || 'full-time',
    availableToday: currentUser?.availableToday || false,
    ageGroup: currentUser?.ageGroup || '',
    gender: currentUser?.gender || '',
    shopName: currentUser?.shopName || '',
    shopCategory: currentUser?.shopCategory || 'Restaurant',
    shopAddress: currentUser?.shopAddress || '',
    businessDescription: currentUser?.businessDescription || '',
    locality: currentUser?.locality || '',
    apartmentName: currentUser?.apartmentName || '',
    locationText: currentUser?.location?.address || currentUser?.locality || '',
    location: currentUser?.location || null,
    photoURL: currentUser?.photoURL || '',
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const url = await storageService.uploadProfilePhoto(currentUser.uid, file);
      setFormData(prev => ({ ...prev, photoURL: url }));
      toast.success('Photo uploaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const detectLocation = async () => {
    setDetectingLocation(true);
    try {
      const coords = await getLocationWithFallback();
      setFormData({
        ...formData,
        location: { lat: coords.lat, lng: coords.lng, address: formData.locationText || formData.shopAddress || 'Current Location' },
      });
      toast.success('Location updated!');
    } catch (e) {
      toast.error('Could not detect location');
    }
    setDetectingLocation(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let updates;
      if (isWorker) {
        updates = {
          name: formData.name,
          skills: formData.skills,
          experience: formData.experience,
          availability: formData.availability,
          availableToday: formData.availableToday,
          ageGroup: formData.ageGroup || undefined,
          gender: formData.gender || undefined,
          location: formData.location || { lat: 28.6139, lng: 77.209, address: formData.locationText },
          photoURL: formData.photoURL,
        };
      } else if (isResident) {
        updates = {
          name: formData.name,
          locality: formData.locality,
          apartmentName: formData.apartmentName,
          location: formData.location || { lat: 28.6139, lng: 77.209, address: formData.locality },
          photoURL: formData.photoURL,
        };
      } else {
        updates = {
          name: formData.name,
          shopName: formData.shopName,
          shopCategory: formData.shopCategory,
          shopAddress: formData.shopAddress,
          businessDescription: formData.businessDescription,
          location: formData.location || { lat: 28.6139, lng: 77.209, address: formData.shopAddress },
          photoURL: formData.photoURL,
        };
      }

      await updateProfile(updates);
      toast.success('Profile updated!');
      setIsEditing(false);
    } catch (e) {
      toast.error('Failed to update profile');
    }
    setIsLoading(false);
  };

  // ── View Mode ──────────────────────────────────────────
  if (!isEditing) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Profile</h1>
          <button
            className="flex items-center gap-1.5 text-sm"
            style={{ color: 'var(--color-urgent)' }}
            onClick={handleLogout}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Profile Card */}
        <div className="card flex flex-col items-center py-8 px-6 mb-5 animate-fade-in">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), #ff8f5c)',
              boxShadow: '0 4px 16px var(--color-primary-glow)',
            }}
          >
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <User size={36} color="white" />
            )}
          </div>

          <h2 className="text-lg font-bold mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>
            {currentUser.name || currentUser.shopName || currentUser.companyName || 'User'}
          </h2>
          <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
            +91 {currentUser.phoneNumber}
          </p>
          <span
            className="badge mt-2"
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              letterSpacing: '0.06em',
            }}
          >
            {currentUser.role}
          </span>
        </div>

        {/* Details */}
        <div className="card mb-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-secondary)' }}>
            Details
          </h3>

          {isWorker ? (
            <div className="space-y-3">
              <DetailRow label="Skills" value={currentUser.skills?.join(', ') || 'Not set'} />
              <DetailRow label="Experience" value={currentUser.experience || 'Not set'} />
              <DetailRow label="Availability" value={currentUser.availability || 'Not set'} />
              <DetailRow label="Available Today" value={currentUser.availableToday ? '✅ Yes' : '❌ No'} />
              <DetailRow label="Age group" value={currentUser.ageGroup || 'Not set'} />
              <DetailRow label="Gender" value={currentUser.gender || 'Not set'} />
              <DetailRow label="Open to Home Tasks" value={currentUser.openToHomeTasks !== false ? '✅ Yes' : 'No'} />
              <DetailRow label="Construction Skills" value={currentUser.constructionSkills?.join(', ') || 'Not set'} />
              <DetailRow label="Open to Site Work" value={currentUser.openToSiteWork ? '✅ Yes' : 'No'} />
              {currentUser.openToSiteWork && (
                <>
                  <DetailRow label="Max Travel" value={currentUser.maxTravelDistance || 'Not set'} />
                  <DetailRow label="Needs Accommodation" value={currentUser.needsAccommodation || 'Not set'} />
                  <DetailRow label="Physical Work Level" value={currentUser.physicalWorkLevel || 'Not set'} />
                </>
              )}
              <DetailRow label="Location" value={currentUser.location?.address || 'Not set'} />
            </div>
          ) : isResident ? (
            <div className="space-y-3">
              <DetailRow label="Locality" value={currentUser.locality || 'Not set'} />
              <DetailRow label="Apartment" value={currentUser.apartmentName || '—'} />
              <DetailRow label="Tasks Posted" value={String(currentUser.totalTasksPosted ?? 0)} />
              <DetailRow label="Rating" value={currentUser.rating ? `${currentUser.rating} ★` : '—'} />
              <DetailRow label="Location" value={currentUser.location?.address || currentUser.locality || 'Not set'} />
            </div>
          ) : isContractor ? (
            <div className="space-y-3">
              <DetailRow label="Company" value={currentUser.companyName || 'Not set'} />
              <DetailRow label="Owner" value={currentUser.ownerName || 'Not set'} />
              <DetailRow label="Contractor Type" value={currentUser.contractorType || 'Not set'} />
              <DetailRow label="GST" value={currentUser.gstNumber ? `${currentUser.gstNumber}${currentUser.isGSTVerified ? ' ✓' : ''}` : '—'} />
              <DetailRow label="Service Radius" value={currentUser.serviceRadius || 'Not set'} />
              <DetailRow label="Projects Posted" value={String(currentUser.totalProjectsPosted ?? 0)} />
              <DetailRow label="Rating" value={currentUser.rating ? `${currentUser.rating} ★` : '—'} />
            </div>
          ) : (
            <div className="space-y-3">
              <DetailRow label="Shop Name" value={currentUser.shopName || 'Not set'} />
              <DetailRow label="Category" value={currentUser.shopCategory || 'Not set'} />
              <DetailRow label="Address" value={currentUser.shopAddress || 'Not set'} />
              <DetailRow label="Description" value={currentUser.businessDescription || 'Not set'} />
            </div>
          )}
        </div>

        <button
          className="btn-primary"
          onClick={() => (isContractor ? navigate('/setup/contractor') : setIsEditing(true))}
          id="edit-profile-btn"
          style={isContractor ? { background: 'var(--color-contractor-orange)', boxShadow: '0 4px 16px rgba(249, 115, 22, 0.25)' } : undefined}
        >
          {isContractor ? 'Edit Contractor Profile' : 'Edit Profile'}
        </button>
      </div>
    );
  }

  // ── Edit Mode ──────────────────────────────────────────
  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Edit Profile</h1>
        <button
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-muted)' }}
          onClick={() => setIsEditing(false)}
        >
          Cancel
        </button>
      </div>

      <div className="space-y-5">
        {/* Photo Upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden" style={{ border: '2px solid var(--color-border)', background: 'var(--color-bg-input)' }}>
            {formData.photoURL ? (
              <img src={formData.photoURL} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Camera size={20} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="spinner spinner-sm" />
              </div>
            )}
          </div>
          <label className="mt-2 text-xs font-semibold cursor-pointer transition-colors hover:text-white" style={{ color: 'var(--color-primary)' }}>
            Change Photo
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
          </label>
        </div>

        {/* Common: Name */}
        <div className="input-group">
          <label className="input-label">{isWorker || isResident ? 'Full Name' : 'Owner Name'}</label>
          <input
            type="text"
            className="input-field"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        {/* Phone (read-only) */}
        <div className="input-group">
          <label className="input-label">Phone</label>
          <input type="tel" className="input-field" value={currentUser.phoneNumber || ''} disabled style={{ opacity: 0.6 }} />
        </div>

        {isResident ? (
          <>
            <div className="input-group">
              <label className="input-label">Area / Locality</label>
              <input className="input-field" value={formData.locality} onChange={(e) => setFormData({ ...formData, locality: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Apartment / House (optional)</label>
              <input className="input-field" value={formData.apartmentName} onChange={(e) => setFormData({ ...formData, apartmentName: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Location pin</label>
              <button type="button" className="btn-secondary w-full min-h-[48px]" onClick={detectLocation} disabled={detectingLocation}>
                {detectingLocation ? <span className="spinner spinner-sm" /> : <><MapPin size={18} /> Update location</>}
              </button>
            </div>
          </>
        ) : isWorker ? (
          <>
            {/* Location */}
            <div className="input-group">
              <label className="input-label">Location</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="Your area"
                  value={formData.locationText}
                  onChange={(e) => setFormData({ ...formData, locationText: e.target.value })}
                />
                <button
                  type="button"
                  className="px-3 rounded-xl flex items-center gap-1.5 text-sm shrink-0"
                  style={{ background: 'var(--color-bg-input)', border: '1.5px solid var(--color-border)', color: 'var(--color-primary)' }}
                  onClick={detectLocation}
                  disabled={detectingLocation}
                >
                  {detectingLocation ? <span className="spinner spinner-sm" /> : <MapPin size={16} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Age group <span className="font-normal text-[0.7rem]" style={{ color: 'var(--color-text-muted)' }}>(optional)</span></label>
              <div className="filter-toggle-group flex-wrap">
                {['youngster', 'adult', 'senior'].map((a) => (
                  <button key={a} type="button" className={`filter-toggle ${formData.ageGroup === a ? 'active' : ''}`} onClick={() => setFormData({ ...formData, ageGroup: a })}>{a}</button>
                ))}
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Gender <span className="font-normal text-[0.7rem]" style={{ color: 'var(--color-text-muted)' }}>(optional)</span></label>
              <div className="filter-toggle-group">
                {['male', 'female', 'other'].map((g) => (
                  <button key={g} type="button" className={`filter-toggle ${formData.gender === g ? 'active' : ''}`} onClick={() => setFormData({ ...formData, gender: g })}>{g === 'other' ? 'Prefer not to say' : g}</button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="input-group">
              <label className="input-label">Skills</label>
              <SkillChips selected={formData.skills} onChange={(skills) => setFormData({ ...formData, skills })} />
            </div>

            {/* Experience */}
            <div className="input-group">
              <label className="input-label">Experience</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Cook — 3 years"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              />
            </div>

            {/* Availability */}
            <div className="input-group">
              <label className="input-label">Availability</label>
              <div className="filter-toggle-group">
                {['full-time', 'part-time', 'temporary'].map(a => (
                  <button
                    key={a}
                    type="button"
                    className={`filter-toggle ${formData.availability === a ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, availability: a })}
                  >
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Available Today */}
            <div className="card flex items-center justify-between"
              style={{
                background: formData.availableToday ? 'rgba(0,200,81,0.08)' : 'var(--color-bg-card)',
                borderColor: formData.availableToday ? 'rgba(0,200,81,0.25)' : 'var(--color-border)',
              }}
            >
              <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Available Today</span>
              <button
                type="button"
                className={`toggle-switch ${formData.availableToday ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, availableToday: !formData.availableToday })}
              />
            </div>
          </>
        ) : (
          <>
            {/* Shop Name */}
            <div className="input-group">
              <label className="input-label">Shop Name</label>
              <input
                type="text"
                className="input-field"
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              />
            </div>

            {/* Category */}
            <div className="input-group">
              <label className="input-label">Shop Category</label>
              <div className="filter-toggle-group flex-wrap">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`filter-toggle ${formData.shopCategory === c ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, shopCategory: c })}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="input-group">
              <label className="input-label">Shop Address</label>
              <input
                type="text"
                className="input-field"
                value={formData.shopAddress}
                onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
              />
            </div>

            {/* Location */}
            <div className="input-group">
              <label className="input-label">Location Pin</label>
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={detectLocation}
                disabled={detectingLocation}
              >
                {detectingLocation ? <span className="spinner spinner-sm" /> : <><MapPin size={18} /> {formData.location ? '📍 Update Location' : 'Detect Location'}</>}
              </button>
            </div>

            {/* Business Description */}
            <div className="input-group">
              <label className="input-label">Business Description</label>
              <textarea
                className="input-field"
                rows={3}
                value={formData.businessDescription}
                onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                style={{ resize: 'vertical' }}
              />
            </div>
          </>
        )}

        <button className="btn-primary" onClick={handleSave} disabled={isLoading}>
          {isLoading ? <span className="spinner spinner-sm" /> : <><CheckCircle size={20} /> Save Changes</>}
        </button>
      </div>
    </div>
  );
};

// Helper component for view mode
const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
    <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
    <span className="text-sm text-right max-w-[60%]" style={{ color: 'var(--color-text-secondary)' }}>{value}</span>
  </div>
);

export default Profile;
