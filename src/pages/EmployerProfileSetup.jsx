import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLocationWithFallback } from '../services/locationService';

const CATEGORIES = ['Tea Shop', 'Salon', 'Restaurant', 'Retail', 'Other'];

const EmployerProfileSetup = () => {
  const { currentUser, updateProfile, updateUserRole, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    shopName: currentUser?.shopName || '',
    shopCategory: currentUser?.shopCategory || 'Restaurant',
    shopAddress: currentUser?.shopAddress || '',
    businessDescription: currentUser?.businessDescription || '',
    location: currentUser?.location || null,
  });

  const [errors, setErrors] = useState({});

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
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
    const e = {};
    if (!formData.name.trim()) e.name = 'Owner name is required';
    if (!formData.shopName.trim()) e.shopName = 'Shop name is required';
    if (!formData.shopAddress.trim()) e.shopAddress = 'Address is required';
    return e;
  };

  const detectLocation = async () => {
    setDetectingLocation(true);
    try {
      const coords = await getLocationWithFallback();
      setFormData({
        ...formData,
        location: { lat: coords.lat, lng: coords.lng, address: formData.shopAddress || 'Current Location' },
      });
      toast.success('Location detected!');
    } catch {
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
        ...formData,
        location: formData.location || { lat: 28.6139, lng: 77.209, address: formData.shopAddress },
      });
      toast.success('Shop profile saved!');
      navigate('/employer/dashboard');
    } catch {
      toast.error('Failed to save profile');
    }
    setIsLoading(false);
  };

  return (
    <div className="page animate-fade-in" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="pt-4 mb-6 flex justify-between items-start gap-4">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Shop Details
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Set up your business profile to start posting jobs
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
          background: 'rgba(99, 102, 241, 0.06)',
          border: '1px solid rgba(99, 102, 241, 0.12)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span>Are you a Worker looking for daily wage jobs?</span>
        <button
          type="button"
          onClick={handleChangeRole}
          className="font-bold underline cursor-pointer"
          style={{ color: '#6366f1' }}
        >
          Setup Worker Profile
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Shop Name */}
        <div className="input-group">
          <label className="input-label">Shop / Business Name *</label>
          <input
            type="text"
            className={`input-field ${errors.shopName ? 'input-error' : ''}`}
            placeholder="e.g. Anand Tea Stall"
            value={formData.shopName}
            onChange={(e) => {
              setFormData({ ...formData, shopName: e.target.value });
              setErrors({ ...errors, shopName: '' });
            }}
            id="shop-name"
          />
          {errors.shopName && <p className="error-text">{errors.shopName}</p>}
        </div>

        {/* Owner Name */}
        <div className="input-group">
          <label className="input-label">Owner Name *</label>
          <input
            type="text"
            className={`input-field ${errors.name ? 'input-error' : ''}`}
            placeholder="Your full name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              setErrors({ ...errors, name: '' });
            }}
            id="owner-name"
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

        {/* Category */}
        <div className="input-group">
          <label className="input-label">Shop Category</label>
          <div className="filter-toggle-group flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-toggle ${formData.shopCategory === cat ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, shopCategory: cat })}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Address */}
        <div className="input-group">
          <label className="input-label">Shop Address *</label>
          <input
            type="text"
            className={`input-field ${errors.shopAddress ? 'input-error' : ''}`}
            placeholder="Full shop address"
            value={formData.shopAddress}
            onChange={(e) => {
              setFormData({ ...formData, shopAddress: e.target.value });
              setErrors({ ...errors, shopAddress: '' });
            }}
          />
          {errors.shopAddress && <p className="error-text">{errors.shopAddress}</p>}
        </div>

        {/* Location Pin */}
        <div className="input-group">
          <label className="input-label">Location Pin</label>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={detectLocation}
            disabled={detectingLocation}
          >
            {detectingLocation ? (
              <span className="spinner spinner-sm" />
            ) : (
              <>
                <MapPin size={18} />
                {formData.location ? '📍 Location Set — Tap to Update' : 'Detect My Location'}
              </>
            )}
          </button>
        </div>

        {/* Business Description */}
        <div className="input-group">
          <label className="input-label">Business Description <span className="normal-case font-normal text-[0.7rem]" style={{ color: 'var(--color-text-muted)' }}>(Optional)</span></label>
          <textarea
            className="input-field"
            rows={3}
            placeholder="Brief description of your business..."
            value={formData.businessDescription}
            onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Submit */}
        <button type="submit" className="btn-primary mt-4" disabled={isLoading} id="save-employer-profile">
          {isLoading ? (
            <span className="spinner spinner-sm" />
          ) : (
            <>
              <CheckCircle size={20} /> Save & Start Hiring
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default EmployerProfileSetup;
