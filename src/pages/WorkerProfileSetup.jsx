import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, Camera } from 'lucide-react';
import SkillChips from '../components/SkillChips';
import toast from 'react-hot-toast';
import { getLocationWithFallback } from '../services/locationService';
import { storageService } from '../services/storageService';
import { CONSTRUCTION_SKILLS } from '../constants/contractor';

const WorkerProfileSetup = () => {
  const { currentUser, updateProfile, updateUserRole, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    skills: currentUser?.skills || [],
    experience: currentUser?.experience || '',
    availability: currentUser?.availability || 'full-time',
    availableToday: currentUser?.availableToday !== false,
    location: currentUser?.location || null,
    locationText: currentUser?.location?.address || '',
    photoURL: currentUser?.photoURL || '',
    ageGroup: currentUser?.ageGroup || '',
    gender: currentUser?.gender || '',
    workerType: currentUser?.workerType || '',
    languages: currentUser?.languages || [],
    hasVehicle: currentUser?.hasVehicle || false,
    vehicleType: currentUser?.vehicleType || 'none',
    preferredTiming: currentUser?.preferredTiming || [],
    canWorkWeekends: currentUser?.canWorkWeekends !== false,
    openToHomeTasks: currentUser?.openToHomeTasks !== false,
    constructionSkills: currentUser?.constructionSkills || [],
    openToSiteWork: currentUser?.openToSiteWork || false,
    willingToRelocate: currentUser?.willingToRelocate || false,
    maxTravelDistance: currentUser?.maxTravelDistance || '10km',
    needsAccommodation: currentUser?.needsAccommodation || 'No',
    needsFood: currentUser?.needsFood || 'Preferred',
    physicalWorkLevel: currentUser?.physicalWorkLevel || 'Moderate',
  });

  const [errors, setErrors] = useState({});

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      toast.error('Failed to logout');
    }
  };

  const handleChangeRole = async () => {
    try {
      await updateUserRole(null);
      navigate('/role-select');
    } catch {
      toast.error('Failed to change role');
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.skills.length === 0) newErrors.skills = 'Select at least one skill';
    return newErrors;
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
        location: { lat: coords.lat, lng: coords.lng, address: formData.locationText || 'Current Location' },
        locationText: formData.locationText || 'Current Location',
      });
      toast.success('Location detected!');
    } catch (e) {
      toast.error('Could not detect location');
    }
    setDetectingLocation(false);
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
        skills: formData.skills,
        experience: formData.experience,
        availability: formData.availability,
        availableToday: formData.availableToday,
        location: formData.location || { lat: 28.6139, lng: 77.209, address: formData.locationText },
        photoURL: formData.photoURL,
        ageGroup: formData.ageGroup || undefined,
        gender: formData.gender || undefined,
        workerType: formData.workerType || undefined,
        languages: formData.languages,
        hasVehicle: formData.hasVehicle,
        vehicleType: formData.vehicleType,
        preferredTiming: formData.preferredTiming,
        canWorkWeekends: formData.canWorkWeekends,
        openToHomeTasks: formData.openToHomeTasks,
        constructionSkills: formData.constructionSkills,
        openToSiteWork: formData.openToSiteWork,
        willingToRelocate: formData.willingToRelocate,
        maxTravelDistance: formData.maxTravelDistance,
        needsAccommodation: formData.needsAccommodation,
        needsFood: formData.needsFood,
        physicalWorkLevel: formData.physicalWorkLevel,
      });
      toast.success('Profile saved!');
      navigate('/map');
    } catch (e) {
      toast.error('Failed to save profile');
    }
    setIsLoading(false);
  };

  const availabilityOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'temporary', label: 'Temporary' },
  ];

  return (
    <div className="page animate-fade-in" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="pt-4 mb-6 flex justify-between items-start gap-4">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Complete Your Profile
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Tell us about yourself to find the best jobs near you
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={handleChangeRole}
            className="text-xs font-semibold py-1.5 px-3 rounded-xl transition-all text-center"
            style={{
              color: 'var(--color-primary)',
              border: '1.5px solid rgba(255, 107, 44, 0.2)',
              background: 'rgba(255, 107, 44, 0.05)',
            }}
          >
            Change Role
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-semibold py-1.5 px-3 rounded-xl transition-all text-center"
            style={{
              color: 'var(--color-text-muted)',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-bg-input)',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Switch role banner */}
      <div
        className="p-3.5 rounded-xl mb-5 flex justify-between items-center text-xs animate-fade-in"
        style={{
          background: 'rgba(255, 107, 44, 0.06)',
          border: '1px solid rgba(255, 107, 44, 0.12)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span>Are you an Employer / Shop Owner looking to hire?</span>
        <button
          type="button"
          onClick={handleChangeRole}
          className="font-bold underline cursor-pointer"
          style={{ color: 'var(--color-primary)' }}
        >
          Setup Shop Details
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo Upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden" style={{ border: '2px solid var(--color-border)', background: 'var(--color-bg-input)' }}>
            {formData.photoURL ? (
              <img src={formData.photoURL} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Camera size={24} style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-[10px] mt-1 font-semibold" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>ADD PHOTO</span>
              </div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="spinner spinner-sm" />
              </div>
            )}
          </div>
          <label className="mt-2 text-xs font-semibold cursor-pointer transition-colors hover:text-white" style={{ color: 'var(--color-primary)' }}>
            {formData.photoURL ? 'Change Photo' : 'Upload Profile Photo'}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
          </label>
        </div>

        {/* Name */}
        <div className="input-group">
          <label className="input-label">Full Name *</label>
          <input
            type="text"
            className={`input-field ${errors.name ? 'input-error' : ''}`}
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              setErrors({ ...errors, name: '' });
            }}
            id="worker-name"
          />
          {errors.name && <p className="error-text">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div className="input-group">
          <label className="input-label">Phone Number</label>
          <input
            type="tel"
            className="input-field"
            value={currentUser?.phoneNumber || ''}
            disabled
            style={{ opacity: 0.6 }}
          />
        </div>

        {/* Location */}
        <div className="input-group">
          <label className="input-label">Location</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="Your area / locality"
              value={formData.locationText}
              onChange={(e) => setFormData({ ...formData, locationText: e.target.value })}
            />
            <button
              type="button"
              className="px-4 rounded-xl flex items-center gap-2 text-sm font-medium shrink-0 transition-all"
              style={{
                background: 'var(--color-bg-input)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-primary)',
              }}
              onClick={detectLocation}
              disabled={detectingLocation}
            >
              {detectingLocation ? (
                <span className="spinner spinner-sm" />
              ) : (
                <MapPin size={16} />
              )}
              Detect
            </button>
          </div>
        </div>

        {/* Skills */}
        <div className="input-group">
          <label className="input-label">Skills * <span className="normal-case text-[0.7rem] font-normal" style={{ color: 'var(--color-text-muted)' }}>(Select all that apply)</span></label>
          <SkillChips
            selected={formData.skills}
            onChange={(skills) => {
              setFormData({ ...formData, skills });
              setErrors({ ...errors, skills: '' });
            }}
          />
          {errors.skills && <p className="error-text">{errors.skills}</p>}
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
            {availabilityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`filter-toggle ${formData.availability === opt.value ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, availability: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Age group (optional) */}
        <div className="input-group">
          <label className="input-label">Age group <span className="font-normal text-[0.7rem]" style={{ color: 'var(--color-text-muted)' }}>(optional)</span></label>
          <div className="filter-toggle-group flex-wrap">
            {[
              { value: 'youngster', label: '👦 18–25' },
              { value: 'adult', label: '🧑 26–40' },
              { value: 'senior', label: '👴 40+' },
            ].map((opt) => (
              <button key={opt.value} type="button" className={`filter-toggle ${formData.ageGroup === opt.value ? 'active' : ''}`} onClick={() => setFormData({ ...formData, ageGroup: opt.value })}>{opt.label}</button>
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

        <div className="input-group">
          <label className="input-label">Worker type <span className="font-normal text-[0.7rem]" style={{ color: 'var(--color-text-muted)' }}>(optional)</span></label>
          <div className="flex flex-wrap gap-2">
            {['student', 'homemaker', 'daily-wage', 'skilled', 'fresher'].map((w) => (
              <button key={w} type="button" className={`chip ${formData.workerType === w ? 'chip-selected' : ''}`} onClick={() => setFormData({ ...formData, workerType: w })}>{w}</button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Languages <span className="font-normal text-[0.7rem]" style={{ color: 'var(--color-text-muted)' }}>(optional)</span></label>
          <div className="flex flex-wrap gap-2">
            {['Tamil', 'Hindi', 'English', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Other'].map((lang) => (
              <button
                key={lang}
                type="button"
                className={`chip ${formData.languages.includes(lang) ? 'chip-selected' : ''}`}
                onClick={() => setFormData({
                  ...formData,
                  languages: formData.languages.includes(lang)
                    ? formData.languages.filter((l) => l !== lang)
                    : [...formData.languages, lang],
                })}
              >{lang}</button>
            ))}
          </div>
        </div>

        <div className="card flex items-center justify-between min-h-[48px]">
          <div>
            <h4 className="text-sm font-semibold">Has own vehicle</h4>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Bike, car, or cycle</p>
          </div>
          <button type="button" className={`toggle-switch ${formData.hasVehicle ? 'active' : ''}`} onClick={() => setFormData({ ...formData, hasVehicle: !formData.hasVehicle })} />
        </div>
        {formData.hasVehicle && (
          <div className="filter-toggle-group">
            {['bike', 'car', 'cycle', 'none'].map((v) => (
              <button key={v} type="button" className={`filter-toggle ${formData.vehicleType === v ? 'active' : ''}`} onClick={() => setFormData({ ...formData, vehicleType: v })}>{v}</button>
            ))}
          </div>
        )}

        <div className="input-group">
          <label className="input-label">Preferred work timing <span className="font-normal text-[0.7rem]" style={{ color: 'var(--color-text-muted)' }}>(optional)</span></label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'morning', label: '🌅 Morning' },
              { value: 'afternoon', label: '☀️ Afternoon' },
              { value: 'evening', label: '🌆 Evening' },
              { value: 'night', label: '🌙 Night' },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                className={`chip ${formData.preferredTiming.includes(t.value) ? 'chip-selected' : ''}`}
                onClick={() => setFormData({
                  ...formData,
                  preferredTiming: formData.preferredTiming.includes(t.value)
                    ? formData.preferredTiming.filter((x) => x !== t.value)
                    : [...formData.preferredTiming, t.value],
                })}
              >{t.label}</button>
            ))}
          </div>
        </div>

        <div className="card flex items-center justify-between min-h-[48px]">
          <span className="text-sm">Can work weekends</span>
          <button type="button" className={`toggle-switch ${formData.canWorkWeekends ? 'active' : ''}`} onClick={() => setFormData({ ...formData, canWorkWeekends: !formData.canWorkWeekends })} />
        </div>

        <div
          className="card flex items-center justify-between min-h-[48px]"
          style={{
            borderColor: formData.openToHomeTasks ? 'rgba(43, 127, 255, 0.35)' : 'var(--color-border)',
          }}
        >
          <div>
            <h4 className="text-sm font-semibold">Open to home tasks</h4>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Visible to residents posting tasks</p>
          </div>
          <button type="button" className={`toggle-switch ${formData.openToHomeTasks ? 'active' : ''}`} onClick={() => setFormData({ ...formData, openToHomeTasks: !formData.openToHomeTasks })} />
        </div>

        <div className="card">
          <h3 className="text-base font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Construction & Site Work
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Used for contractor site jobs and construction alerts
          </p>

          <div className="input-group">
            <label className="input-label">Construction Skills</label>
            <div className="flex flex-wrap gap-2">
              {CONSTRUCTION_SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className={`chip ${formData.constructionSkills.includes(skill) ? 'selected' : ''}`}
                  style={formData.constructionSkills.includes(skill) ? { background: 'var(--color-contractor-orange)', borderColor: 'var(--color-contractor-orange)' } : undefined}
                  onClick={() => setFormData({
                    ...formData,
                    constructionSkills: formData.constructionSkills.includes(skill)
                      ? formData.constructionSkills.filter((s) => s !== skill)
                      : [...formData.constructionSkills, skill],
                  })}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div
            className="flex items-center justify-between min-h-[48px] mb-3"
            style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: 12,
            }}
          >
            <div>
              <h4 className="text-sm font-semibold">Open to site/construction work</h4>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Visible to contractors posting site jobs</p>
            </div>
            <button type="button" className={`toggle-switch ${formData.openToSiteWork ? 'active' : ''}`} onClick={() => setFormData({ ...formData, openToSiteWork: !formData.openToSiteWork })} />
          </div>

          {formData.openToSiteWork && (
            <div className="space-y-4">
              <div className="card flex items-center justify-between min-h-[48px]" style={{ padding: 12 }}>
                <span className="text-sm">Willing to work away from home</span>
                <button type="button" className={`toggle-switch ${formData.willingToRelocate ? 'active' : ''}`} onClick={() => setFormData({ ...formData, willingToRelocate: !formData.willingToRelocate })} />
              </div>

              <div className="input-group">
                <label className="input-label">Maximum distance willing to travel</label>
                <div className="flex flex-wrap gap-2">
                  {['5km', '10km', '25km', '50km', 'Anywhere'].map((distance) => (
                    <button key={distance} type="button" className={`chip ${formData.maxTravelDistance === distance ? 'selected' : ''}`} onClick={() => setFormData({ ...formData, maxTravelDistance: distance })}>{distance}</button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Need accommodation</label>
                <div className="filter-toggle-group">
                  {['Yes', 'No', 'Preferred'].map((value) => (
                    <button key={value} type="button" className={`filter-toggle ${formData.needsAccommodation === value ? 'active' : ''}`} onClick={() => setFormData({ ...formData, needsAccommodation: value })}>{value}</button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Need food facility</label>
                <div className="filter-toggle-group">
                  {['Yes', 'No', 'Preferred'].map((value) => (
                    <button key={value} type="button" className={`filter-toggle ${formData.needsFood === value ? 'active' : ''}`} onClick={() => setFormData({ ...formData, needsFood: value })}>{value}</button>
                  ))}
                </div>
              </div>

              <div className="input-group mb-0">
                <label className="input-label">Physical work comfort level</label>
                <div className="flex flex-wrap gap-2">
                  {['Light work only', 'Moderate', 'Heavy work OK'].map((level) => (
                    <button key={level} type="button" className={`chip ${formData.physicalWorkLevel === level ? 'selected' : ''}`} onClick={() => setFormData({ ...formData, physicalWorkLevel: level })}>{level}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Available Today Toggle */}
        <div
          className="card flex items-center justify-between"
          style={{
            background: formData.availableToday
              ? 'linear-gradient(135deg, rgba(0, 200, 81, 0.12), rgba(0, 200, 81, 0.05))'
              : 'var(--color-bg-card)',
            borderColor: formData.availableToday ? 'rgba(0, 200, 81, 0.3)' : 'var(--color-border)',
          }}
        >
          <div>
            <h4 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Available Today
            </h4>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Let employers know you can start now
            </p>
          </div>
          <button
            type="button"
            className={`toggle-switch ${formData.availableToday ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, availableToday: !formData.availableToday })}
            id="available-today-toggle"
          />
        </div>

        {/* Submit */}
        <button type="submit" className="btn-primary mt-4" disabled={isLoading} id="save-worker-profile">
          {isLoading ? (
            <span className="spinner spinner-sm" />
          ) : (
            <>
              <CheckCircle size={20} /> Save & Find Jobs
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default WorkerProfileSetup;
