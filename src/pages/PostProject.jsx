import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle, MapPin, Minus, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { jobService } from '../services/dataService';
import { getLocationWithFallback } from '../services/locationService';
import {
  createDefaultRequirement,
  EMPTY_FACILITIES,
  EXPERIENCE_OPTIONS,
  FACILITY_OPTIONS,
  getRequirementTotals,
  getSkillLevelForWorkerType,
  LANGUAGE_OPTIONS,
  PROJECT_DURATIONS,
  PROJECT_TYPES,
  URGENCY_OPTIONS,
  WORKER_REQUIREMENT_GROUPS,
  normalizeFacilities,
} from '../constants/contractor';

const todayInput = (offsetDays = 0) => {
  const date = new Date(Date.now() + offsetDays * 86400000);
  return date.toISOString().slice(0, 10);
};

const ChipSelect = ({ options, selected, onChange, multi = false }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => {
      const value = typeof option === 'string' ? option : option.value;
      const label = typeof option === 'string' ? option : option.label;
      const active = multi ? selected.includes(value) : selected === value;
      return (
        <button
          key={value}
          type="button"
          className={`chip ${active ? 'selected' : ''}`}
          style={active ? { background: 'var(--color-contractor-orange)', borderColor: 'var(--color-contractor-orange)' } : undefined}
          onClick={() => {
            if (multi) onChange(active ? selected.filter((item) => item !== value) : [...selected, value]);
            else onChange(value);
          }}
        >
          {label}
        </button>
      );
    })}
  </div>
);

const RequirementRow = ({ req, index, onChange, onDelete, canDelete }) => {
  const changeWorkerType = (workerType) => {
    onChange({
      ...req,
      workerType,
      skillLevel: getSkillLevelForWorkerType(workerType),
    });
  };

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Worker Type {index + 1}</h4>
        {canDelete && (
          <button type="button" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-bg-input)', color: 'var(--color-urgent)' }} onClick={onDelete}>
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="input-group">
        <label className="input-label">Worker Type</label>
        <select className="input-field" value={req.workerType} onChange={(e) => changeWorkerType(e.target.value)}>
          {WORKER_REQUIREMENT_GROUPS.map((group) => (
            <optgroup key={group.skillLevel} label={group.label}>
              {group.options.map((workerType) => <option key={workerType} value={workerType}>{workerType}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="input-group">
          <label className="input-label">Number Needed</label>
          <div className="number-stepper" style={{ gap: 10 }}>
            <button type="button" className="stepper-btn" onClick={() => onChange({ ...req, numberNeeded: Math.max(1, Number(req.numberNeeded) - 1) })}><Minus size={16} /></button>
            <span className="stepper-value">{req.numberNeeded}</span>
            <button type="button" className="stepper-btn" onClick={() => onChange({ ...req, numberNeeded: Math.min(100, Number(req.numberNeeded) + 1) })}><Plus size={16} /></button>
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Daily Wage Rs</label>
          <input className="input-field" type="number" min="1" value={req.dailyWage} onChange={(e) => onChange({ ...req, dailyWage: e.target.value })} />
        </div>
      </div>

      <div className="input-group mb-0">
        <label className="input-label">Experience Required</label>
        <ChipSelect options={EXPERIENCE_OPTIONS} selected={req.experienceRequired} onChange={(experienceRequired) => onChange({ ...req, experienceRequired })} />
      </div>
    </div>
  );
};

const PostProject = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [errors, setErrors] = useState({});
  const [successProject, setSuccessProject] = useState(null);

  const [formData, setFormData] = useState({
    projectName: '',
    projectType: PROJECT_TYPES[0],
    description: '',
    siteAddress: currentUser?.baseLocation?.address || currentUser?.location?.address || '',
    siteLandmark: '',
    location: currentUser?.baseLocation || currentUser?.location || null,
    startDate: todayInput(0),
    projectDuration: PROJECT_DURATIONS[2],
    urgency: 'this-week',
    requirements: [createDefaultRequirement()],
    facilitiesOffered: normalizeFacilities(currentUser?.facilitiesOffered || EMPTY_FACILITIES),
    physicalFitnessRequired: false,
    nightShiftInvolved: false,
    weekendWorkRequired: false,
    preferredLanguages: ['Tamil'],
    genderPreference: 'Any',
    specialNotes: '',
  });

  const totals = useMemo(() => getRequirementTotals(formData.requirements), [formData.requirements]);

  const validate = () => {
    const next = {};
    if (!formData.projectName.trim()) next.projectName = 'Project name is required';
    if (!formData.siteAddress.trim()) next.siteAddress = 'Site address is required';
    if (!formData.location?.lat) next.location = 'Site location pin is required';
    if (!formData.startDate) next.startDate = 'Start date is required';
    formData.requirements.forEach((req, index) => {
      if (!req.dailyWage || Number(req.dailyWage) <= 0) next[`wage_${index}`] = 'Enter wage for every worker type';
    });
    return next;
  };

  const updateRequirement = (index, nextReq) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.map((req, reqIndex) => reqIndex === index ? nextReq : req),
    }));
  };

  const addRequirement = () => {
    setFormData((prev) => ({ ...prev, requirements: [...prev.requirements, createDefaultRequirement()] }));
  };

  const detectLocation = async () => {
    setDetectingLocation(true);
    try {
      const coords = await getLocationWithFallback();
      setFormData((prev) => ({
        ...prev,
        location: { lat: coords.lat, lng: coords.lng, address: prev.siteAddress || 'Current site location' },
      }));
      toast.success('Site pin updated');
    } catch {
      toast.error('Could not detect location');
    }
    setDetectingLocation(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      toast.error('Please fill required fields');
      return;
    }

    setIsLoading(true);
    try {
      const requirements = formData.requirements.map((req) => ({
        ...req,
        numberNeeded: Number(req.numberNeeded || 1),
        numberFilled: 0,
        dailyWage: Number(req.dailyWage || 0),
        status: 'open',
      }));
      const project = await jobService.createProject({
        contractorId: currentUser.uid,
        contractorPhone: currentUser.phoneNumber?.replace(/\D/g, '') || currentUser.phone?.replace(/\D/g, '') || '919999999999',
        companyName: currentUser.companyName || 'My Contracting Company',
        contractorType: currentUser.contractorType || 'Contractor',
        yearsInBusiness: currentUser.yearsInBusiness,
        isGSTVerified: currentUser.isGSTVerified,
        isVerified: currentUser.isVerified,
        rating: currentUser.rating || 0,
        totalProjectsPosted: currentUser.totalProjectsPosted || 0,
        projectName: formData.projectName,
        projectType: formData.projectType,
        description: formData.description,
        siteAddress: formData.siteAddress,
        locality: formData.siteAddress,
        siteLandmark: formData.siteLandmark,
        location: { ...formData.location, address: formData.siteAddress },
        startDate: new Date(formData.startDate).toISOString(),
        projectDuration: formData.projectDuration,
        urgency: formData.urgency,
        requirements,
        facilitiesOffered: formData.facilitiesOffered,
        physicalFitnessRequired: formData.physicalFitnessRequired,
        nightShiftInvolved: formData.nightShiftInvolved,
        weekendWorkRequired: formData.weekendWorkRequired,
        preferredLanguages: formData.preferredLanguages,
        genderPreference: formData.genderPreference,
        specialNotes: formData.specialNotes,
        isUrgentSite: formData.urgency === 'urgent',
      });
      setSuccessProject(project);
      toast.success('Project posted');
    } catch {
      toast.error('Failed to post project');
    }
    setIsLoading(false);
  };

  if (successProject) {
    return (
      <div className="page animate-fade-in">
        <div className="card text-center py-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(249, 115, 22, 0.16)', color: 'var(--color-contractor-orange)' }}>
            <CheckCircle size={32} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Project Posted</h1>
          <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
            {successProject.projectName} is live with {successProject.totalWorkersNeeded} worker openings.
          </p>
          <button className="btn-primary" style={{ background: 'var(--color-contractor-orange)' }} onClick={() => navigate('/contractor/dashboard')}>
            Go to Contractor Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="pt-4 mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Post Project</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Hire multiple worker types for a site</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <section className="card">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Project Details</h2>
          <div className="input-group">
            <label className="input-label">Project Name *</label>
            <input className={`input-field ${errors.projectName ? 'input-error' : ''}`} value={formData.projectName} onChange={(e) => setFormData({ ...formData, projectName: e.target.value })} placeholder="G+3 Building, Anna Nagar" />
            {errors.projectName && <p className="error-text">{errors.projectName}</p>}
          </div>
          <div className="input-group">
            <label className="input-label">Project Type</label>
            <select className="input-field" value={formData.projectType} onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}>
              {PROJECT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="input-group mb-0">
            <label className="input-label">Project Description</label>
            <textarea className="input-field" rows={4} maxLength={400} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{formData.description.length}/400</p>
          </div>
        </section>

        <section className="card">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Location</h2>
          <div className="input-group">
            <label className="input-label">Site Address *</label>
            <input className={`input-field ${errors.siteAddress ? 'input-error' : ''}`} value={formData.siteAddress} onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })} />
            {errors.siteAddress && <p className="error-text">{errors.siteAddress}</p>}
          </div>
          <button type="button" className="btn-secondary mb-3" onClick={detectLocation} disabled={detectingLocation}>
            {detectingLocation ? <span className="spinner spinner-sm" /> : <><MapPin size={18} /> Pick Site Location</>}
          </button>
          {errors.location && <p className="error-text mb-3">{errors.location}</p>}
          <div className="input-group mb-0">
            <label className="input-label">Landmark</label>
            <input className="input-field" value={formData.siteLandmark} onChange={(e) => setFormData({ ...formData, siteLandmark: e.target.value })} placeholder="Optional" />
          </div>
        </section>

        <section className="card">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Timeline</h2>
          <div className="input-group">
            <label className="input-label">Start Date *</label>
            <div className="map-filter-chips mb-2">
              <button type="button" className="map-filter-chip" onClick={() => setFormData({ ...formData, startDate: todayInput(0) })}>Today</button>
              <button type="button" className="map-filter-chip" onClick={() => setFormData({ ...formData, startDate: todayInput(1) })}>Tomorrow</button>
              <button type="button" className="map-filter-chip" onClick={() => setFormData({ ...formData, startDate: todayInput(7) })}>This Week</button>
            </div>
            <input className={`input-field ${errors.startDate ? 'input-error' : ''}`} type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Project Duration</label>
            <ChipSelect options={PROJECT_DURATIONS} selected={formData.projectDuration} onChange={(projectDuration) => setFormData({ ...formData, projectDuration })} />
          </div>
          <div className="input-group mb-0">
            <label className="input-label">Urgency Level</label>
            <ChipSelect options={URGENCY_OPTIONS} selected={formData.urgency} onChange={(urgency) => setFormData({ ...formData, urgency })} />
          </div>
        </section>

        <section className="card">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Workers Required</h2>
          <div className="space-y-3">
            {formData.requirements.map((req, index) => (
              <div key={req.reqId}>
                <RequirementRow
                  req={req}
                  index={index}
                  canDelete={formData.requirements.length > 1}
                  onChange={(nextReq) => updateRequirement(index, nextReq)}
                  onDelete={() => setFormData((prev) => ({ ...prev, requirements: prev.requirements.filter((_, reqIndex) => reqIndex !== index) }))}
                />
                {errors[`wage_${index}`] && <p className="error-text mt-1">{errors[`wage_${index}`]}</p>}
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary mt-3" onClick={addRequirement}>
            <Plus size={18} /> Add Another Worker Type
          </button>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--color-contractor-orange)' }}>{totals.totalWorkersNeeded}</div>
              <div className="stat-label">Workers Needed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--color-contractor-orange)', fontSize: '1.1rem' }}>Rs {totals.estimatedDailyBill}</div>
              <div className="stat-label">Daily Bill</div>
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Site Facilities</h2>
          <div className="space-y-2">
            {FACILITY_OPTIONS.map((facility) => (
              <div key={facility.key} className="flex items-center justify-between min-h-[48px]">
                <span className="text-sm">{facility.label}</span>
                <button type="button" className={`toggle-switch ${formData.facilitiesOffered[facility.key] ? 'active' : ''}`} onClick={() => setFormData({ ...formData, facilitiesOffered: { ...formData.facilitiesOffered, [facility.key]: !formData.facilitiesOffered[facility.key] } })} />
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Additional Requirements</h2>
          {[
            ['physicalFitnessRequired', 'Physical fitness required'],
            ['nightShiftInvolved', 'Night shift work involved'],
            ['weekendWorkRequired', 'Weekend work required'],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between min-h-[48px]">
              <span className="text-sm">{label}</span>
              <button type="button" className={`toggle-switch ${formData[key] ? 'active' : ''}`} onClick={() => setFormData({ ...formData, [key]: !formData[key] })} />
            </div>
          ))}
          <div className="input-group mt-3">
            <label className="input-label">Preferred Languages</label>
            <ChipSelect options={LANGUAGE_OPTIONS} selected={formData.preferredLanguages} multi onChange={(preferredLanguages) => setFormData({ ...formData, preferredLanguages })} />
          </div>
          <div className="input-group">
            <label className="input-label">Gender Preference</label>
            <ChipSelect options={['Any', 'Male Only', 'Female OK for some roles']} selected={formData.genderPreference} onChange={(genderPreference) => setFormData({ ...formData, genderPreference })} />
          </div>
          <div className="input-group mb-0">
            <label className="input-label">Special Notes</label>
            <textarea className="input-field" rows={3} value={formData.specialNotes} onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })} />
          </div>
        </section>

        <button
          type="submit"
          className="btn-primary"
          style={{ background: 'var(--color-contractor-orange)', boxShadow: '0 4px 16px rgba(249, 115, 22, 0.25)' }}
          disabled={isLoading}
        >
          {isLoading ? <span className="spinner spinner-sm" /> : <><CalendarDays size={20} /> Post Project</>}
        </button>
      </form>
    </div>
  );
};

export default PostProject;
