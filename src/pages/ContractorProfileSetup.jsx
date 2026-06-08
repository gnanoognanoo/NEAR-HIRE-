import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getLocationWithFallback } from '../services/locationService';
import { storageService } from '../services/storageService';
import {
  ADVANCE_NOTICE_OPTIONS,
  CONTRACTOR_TYPES,
  EMPTY_FACILITIES,
  FACILITY_OPTIONS,
  LABOUR_AREAS,
  LABOUR_CONTRACTOR_TYPE,
  LABOUR_SUPPLY_CAPACITIES,
  LABOUR_SUPPLY_TYPES,
  PROJECT_SCALES,
  SERVICE_RADII,
  TEAM_SIZES,
  YEARS_IN_BUSINESS,
} from '../constants/contractor';

const ChipGroup = ({ options, selected, onChange, multi = false, orange = false }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => {
      const value = typeof option === 'string' ? option : option.value;
      const label = typeof option === 'string' ? option : option.label;
      const isSelected = multi ? selected.includes(value) : selected === value;
      return (
        <button
          key={value}
          type="button"
          className={`chip ${isSelected ? 'selected' : ''}`}
          style={isSelected && orange ? { background: 'var(--color-contractor-orange)', borderColor: 'var(--color-contractor-orange)' } : undefined}
          onClick={() => {
            if (!multi) onChange(value);
            else onChange(isSelected ? selected.filter((item) => item !== value) : [...selected, value]);
          }}
        >
          {label}
        </button>
      );
    })}
  </div>
);

const ContractorProfileSetup = () => {
  const { currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    companyName: currentUser?.companyName || '',
    ownerName: currentUser?.ownerName || currentUser?.name || '',
    phone: currentUser?.phone || currentUser?.phoneNumber || '',
    photoURL: currentUser?.photoURL || '',
    gstNumber: currentUser?.gstNumber || '',
    yearsInBusiness: currentUser?.yearsInBusiness || YEARS_IN_BUSINESS[0],
    contractorType: currentUser?.contractorType || 'Building Contractor',
    cityArea: currentUser?.cityArea || currentUser?.baseLocation?.address || '',
    baseLocation: currentUser?.baseLocation || currentUser?.location || null,
    serviceRadius: currentUser?.serviceRadius || '10km',
    typicalTeamSize: currentUser?.typicalTeamSize || '5-20 workers',
    projectScale: currentUser?.projectScale || PROJECT_SCALES[0],
    facilitiesOffered: { ...EMPTY_FACILITIES, ...(currentUser?.facilitiesOffered || {}) },
    description: currentUser?.description || '',
    workerTypesSupplied: currentUser?.workerTypesSupplied || [],
    supplyCapacity: currentUser?.supplyCapacity || '10-25 workers',
    areasServed: currentUser?.areasServed || [],
    advanceNotice: currentUser?.advanceNotice || '1 day',
  });

  const validate = () => {
    const next = {};
    if (!formData.companyName.trim()) next.companyName = 'Company / contractor name is required';
    if (!formData.ownerName.trim()) next.ownerName = 'Owner name is required';
    if (!formData.contractorType) next.contractorType = 'Select contractor type';
    if (formData.description.length > 300) next.description = 'Maximum 300 characters';
    return next;
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await storageService.uploadProfilePhoto(currentUser.uid, file);
      setFormData((prev) => ({ ...prev, photoURL: url }));
      toast.success('Logo uploaded');
    } catch {
      toast.error('Failed to upload logo');
    }
    setUploadingPhoto(false);
  };

  const detectLocation = async () => {
    setDetectingLocation(true);
    try {
      const coords = await getLocationWithFallback();
      const address = formData.cityArea || 'Current location';
      setFormData((prev) => ({
        ...prev,
        baseLocation: { lat: coords.lat, lng: coords.lng, address },
        cityArea: address,
      }));
      toast.success('Base location updated');
    } catch {
      toast.error('Could not detect location');
    }
    setDetectingLocation(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      toast.error('Please fix the highlighted fields');
      return;
    }

    setIsLoading(true);
    try {
      const isLabourSupplier = formData.contractorType === LABOUR_CONTRACTOR_TYPE;
      const profile = {
        role: 'contractor',
        companyName: formData.companyName.trim(),
        ownerName: formData.ownerName.trim(),
        name: formData.ownerName.trim(),
        phone: formData.phone,
        phoneNumber: currentUser?.phoneNumber || formData.phone,
        photoURL: formData.photoURL,
        gstNumber: formData.gstNumber.trim(),
        isGSTVerified: Boolean(formData.gstNumber.trim()),
        yearsInBusiness: formData.yearsInBusiness,
        contractorType: formData.contractorType,
        cityArea: formData.cityArea,
        baseLocation: formData.baseLocation || { lat: 13.0827, lng: 80.2707, address: formData.cityArea || 'Chennai' },
        location: formData.baseLocation || { lat: 13.0827, lng: 80.2707, address: formData.cityArea || 'Chennai' },
        serviceRadius: formData.serviceRadius,
        typicalTeamSize: formData.typicalTeamSize,
        projectScale: formData.projectScale,
        facilitiesOffered: formData.facilitiesOffered,
        description: formData.description.slice(0, 300),
        totalProjectsPosted: currentUser?.totalProjectsPosted || 0,
        totalWorkersHired: currentUser?.totalWorkersHired || 0,
        rating: currentUser?.rating || 0,
        isVerified: currentUser?.isVerified || false,
        ...(isLabourSupplier ? {
          workerTypesSupplied: formData.workerTypesSupplied,
          supplyCapacity: formData.supplyCapacity,
          areasServed: formData.areasServed,
          advanceNotice: formData.advanceNotice,
        } : {
          workerTypesSupplied: [],
          areasServed: [],
        }),
      };
      await updateProfile(profile);
      toast.success('Contractor profile saved');
      navigate('/contractor/dashboard');
    } catch {
      toast.error('Failed to save profile');
    }
    setIsLoading(false);
  };

  return (
    <div className="page animate-fade-in" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="pt-4 mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Contractor Profile
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Set up your business details for site hiring
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <section className="card">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Business Info</h2>

          <div className="flex flex-col items-center mb-5">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden" style={{ border: '2px solid var(--color-border)', background: 'var(--color-bg-input)' }}>
              {formData.photoURL ? (
                <img src={formData.photoURL} alt="Company logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Camera size={24} style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-[10px] mt-1 font-semibold" style={{ color: 'var(--color-text-muted)' }}>LOGO</span>
                </div>
              )}
              {uploadingPhoto && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="spinner spinner-sm" /></div>}
            </div>
            <label className="mt-2 text-xs font-semibold cursor-pointer" style={{ color: 'var(--color-contractor-orange)' }}>
              Upload Logo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
            </label>
          </div>

          <div className="input-group">
            <label className="input-label">Company / Contractor Name *</label>
            <input className={`input-field ${errors.companyName ? 'input-error' : ''}`} value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
            {errors.companyName && <p className="error-text">{errors.companyName}</p>}
          </div>
          <div className="input-group">
            <label className="input-label">Owner Name *</label>
            <input className={`input-field ${errors.ownerName ? 'input-error' : ''}`} value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} />
            {errors.ownerName && <p className="error-text">{errors.ownerName}</p>}
          </div>
          <div className="input-group">
            <label className="input-label">Phone</label>
            <input className="input-field" value={formData.phone} readOnly style={{ opacity: 0.65 }} />
          </div>
          <div className="input-group">
            <label className="input-label">GST Number</label>
            <input className="input-field" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} placeholder="Optional" />
            {formData.gstNumber && <span className="badge badge-complete mt-2">GST Verified</span>}
          </div>
          <div className="input-group">
            <label className="input-label">Years in Business</label>
            <select className="input-field" value={formData.yearsInBusiness} onChange={(e) => setFormData({ ...formData, yearsInBusiness: e.target.value })}>
              {YEARS_IN_BUSINESS.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </section>

        <section className="card">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Contractor Type</h2>
          <div className="grid grid-cols-1 gap-2">
            {CONTRACTOR_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className="w-full text-left rounded-xl p-3.5 min-h-[48px]"
                style={{
                  background: formData.contractorType === type ? 'rgba(249, 115, 22, 0.14)' : 'var(--color-bg-input)',
                  border: `1.5px solid ${formData.contractorType === type ? 'rgba(249, 115, 22, 0.45)' : 'var(--color-border)'}`,
                  color: formData.contractorType === type ? 'var(--color-contractor-orange)' : 'var(--color-text-secondary)',
                }}
                onClick={() => setFormData({ ...formData, contractorType: type })}
              >
                <span className="font-semibold">{type}</span>
              </button>
            ))}
          </div>
        </section>

        {formData.contractorType === LABOUR_CONTRACTOR_TYPE && (
          <section className="card">
            <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Labour Supply</h2>
            <div className="input-group">
              <label className="input-label">Worker types you can supply</label>
              <ChipGroup options={LABOUR_SUPPLY_TYPES} selected={formData.workerTypesSupplied} multi orange onChange={(workerTypesSupplied) => setFormData({ ...formData, workerTypesSupplied })} />
            </div>
            <div className="input-group">
              <label className="input-label">Supply capacity</label>
              <ChipGroup options={LABOUR_SUPPLY_CAPACITIES} selected={formData.supplyCapacity} orange onChange={(supplyCapacity) => setFormData({ ...formData, supplyCapacity })} />
            </div>
            <div className="input-group">
              <label className="input-label">Areas you operate in</label>
              <ChipGroup options={LABOUR_AREAS} selected={formData.areasServed} multi orange onChange={(areasServed) => setFormData({ ...formData, areasServed })} />
            </div>
            <div className="input-group">
              <label className="input-label">Advance notice required</label>
              <ChipGroup options={ADVANCE_NOTICE_OPTIONS} selected={formData.advanceNotice} orange onChange={(advanceNotice) => setFormData({ ...formData, advanceNotice })} />
            </div>
          </section>
        )}

        <section className="card">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Base Location</h2>
          <div className="input-group">
            <label className="input-label">City / Area</label>
            <input className="input-field" value={formData.cityArea} onChange={(e) => setFormData({ ...formData, cityArea: e.target.value })} placeholder="e.g. Anna Nagar, Chennai" />
          </div>
          <button type="button" className="btn-secondary mb-4" onClick={detectLocation} disabled={detectingLocation}>
            {detectingLocation ? <span className="spinner spinner-sm" /> : <><MapPin size={18} /> Set Base Office Pin</>}
          </button>
          <div className="input-group">
            <label className="input-label">Service Radius</label>
            <ChipGroup options={SERVICE_RADII} selected={formData.serviceRadius} orange onChange={(serviceRadius) => setFormData({ ...formData, serviceRadius })} />
          </div>
        </section>

        <section className="card">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Project Scale</h2>
          <div className="input-group">
            <label className="input-label">Typical team size needed</label>
            <ChipGroup options={TEAM_SIZES} selected={formData.typicalTeamSize} orange onChange={(typicalTeamSize) => setFormData({ ...formData, typicalTeamSize })} />
          </div>
          <div className="input-group">
            <label className="input-label">Average project value</label>
            <ChipGroup options={PROJECT_SCALES} selected={formData.projectScale} orange onChange={(projectScale) => setFormData({ ...formData, projectScale })} />
          </div>
        </section>

        <section className="card">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Site Facilities Offered</h2>
          <div className="space-y-2">
            {FACILITY_OPTIONS.map((facility) => (
              <div key={facility.key} className="flex items-center justify-between min-h-[48px]">
                <span className="text-sm">{facility.label}</span>
                <button
                  type="button"
                  className={`toggle-switch ${formData.facilitiesOffered[facility.key] ? 'active' : ''}`}
                  onClick={() => setFormData({
                    ...formData,
                    facilitiesOffered: {
                      ...formData.facilitiesOffered,
                      [facility.key]: !formData.facilitiesOffered[facility.key],
                    },
                  })}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>About</h2>
          <textarea
            className={`input-field ${errors.description ? 'input-error' : ''}`}
            rows={4}
            maxLength={300}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Business description (optional)"
          />
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{formData.description.length}/300</p>
          {errors.description && <p className="error-text">{errors.description}</p>}
        </section>

        <button
          type="submit"
          className="btn-primary"
          style={{ background: 'var(--color-contractor-orange)', boxShadow: '0 4px 16px rgba(249, 115, 22, 0.25)' }}
          disabled={isLoading}
        >
          {isLoading ? <span className="spinner spinner-sm" /> : <><CheckCircle size={20} /> Save Profile</>}
        </button>
      </form>
    </div>
  );
};

export default ContractorProfileSetup;
