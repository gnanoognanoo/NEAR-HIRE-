import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CalendarDays, MessageCircle, Navigation, Users, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import UrgencyBadge from './UrgencyBadge';
import { applicationService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { formatDistance } from '../services/locationService';
import { formatDateShort } from '../utils/jobHelpers';
import { buildSiteApplicationMessage, openWhatsApp } from '../utils/whatsapp';
import {
  FACILITY_OPTIONS,
  getOpenWorkerCount,
  getWageRange,
  normalizeFacilities,
} from '../constants/contractor';

const skillBadgeClass = {
  skilled: 'badge-skilled',
  'semi-skilled': 'badge-semi-skilled',
  unskilled: 'badge-unskilled',
};

const SiteJobDetail = ({ job, currentUser, onApplied }) => {
  const { currentUser: authUser } = useAuth();
  const navigate = useNavigate();
  const viewer = currentUser || authUser;
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [applyingReqId, setApplyingReqId] = useState(null);
  const facilities = normalizeFacilities(job.facilitiesOffered);
  const requirements = job.requirements || [];
  const wageRange = getWageRange(requirements);
  const openWorkers = getOpenWorkerCount(job);

  const openDirections = () => {
    const lat = job.location?.lat;
    const lng = job.location?.lng;
    const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(job.locality || job.siteAddress || '');
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  const applyForRequirement = async (req) => {
    if (!currentUser?.uid) return;
    setApplyingReqId(req.reqId);
    try {
      const exists = await applicationService.checkExisting(job.jobId, currentUser.uid);
      if (exists) {
        toast.error('You already applied to this project');
        setApplyingReqId(null);
        return;
      }

      await applicationService.createApplication({
        jobId: job.jobId,
        workerId: currentUser.uid,
        contractorId: job.contractorId,
        employerId: job.contractorId,
        applicationType: 'site-application',
        posterType: 'contractor',
        requirementId: req.reqId,
        selectedRole: req.workerType,
        selectedWage: req.dailyWage,
        workerAgeGroup: currentUser.ageGroup,
        workerGender: currentUser.gender,
        workerType: currentUser.workerType,
        workerName: currentUser.name || 'Worker',
        workerPhone: currentUser.phoneNumber || '',
        workerSkills: [...(currentUser.skills || []), ...(currentUser.constructionSkills || [])],
        jobTitle: job.projectName || job.title,
        projectName: job.projectName || job.title,
      });

      const phone = job.contractorPhone || job.employerPhone || '919999999999';
      openWhatsApp(phone, buildSiteApplicationMessage({
        workerName: currentUser.name || 'Worker',
        projectName: job.projectName || job.title,
        selectedRole: req.workerType,
        wage: req.dailyWage,
        availability: currentUser.availableToday ? 'today' : 'soon',
        skills: [...(currentUser.constructionSkills || []), ...(currentUser.skills || [])],
      }));
      toast.success('Application sent');
      setRolePickerOpen(false);
      onApplied?.(job.jobId);
    } catch {
      toast.error('Failed to apply');
    }
    setApplyingReqId(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', lineHeight: 1.25 }}>
            {job.projectName || job.title}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <span className="badge badge-contractor">{job.contractorType || 'Contractor'}</span>
            {job.isGSTVerified && <span className="badge badge-complete">GST Verified</span>}
          </div>
        </div>
        <UrgencyBadge urgency={job.urgency} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1rem', color: 'var(--color-contractor-orange)' }}>{openWorkers}</div>
          <div className="stat-label">Needed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '0.9rem', color: 'var(--color-contractor-orange)' }}>{wageRange}</div>
          <div className="stat-label">Wage</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>
            {job.distance != null ? formatDistance(job.distance) : 'Near'}
          </div>
          <div className="stat-label">Distance</div>
        </div>
      </div>

      <section className="mb-5">
        <h4 className="input-label">About Project</h4>
        <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <p>{job.description || `${job.projectType || 'Site'} project by ${job.companyName || 'contractor'}.`}</p>
          <p className="flex items-center gap-2"><MapPin size={15} /> {job.locality || job.location?.address || 'Nearby site'} <span style={{ color: 'var(--color-text-muted)' }}>(exact address after selection)</span></p>
          <p className="flex items-center gap-2"><CalendarDays size={15} /> Starts {formatDateShort(job.startDate)} - {job.projectDuration || 'Duration flexible'}</p>
        </div>
        <button type="button" className="btn-secondary mt-3" onClick={openDirections}>
          <Navigation size={18} /> Get Directions
        </button>
      </section>

      <section className="mb-5">
        <h4 className="input-label">Workers Needed</h4>
        <div className="space-y-3">
          {requirements.map((req) => {
            const filled = Number(req.numberFilled || 0);
            const needed = Number(req.numberNeeded || 1);
            const pct = Math.min(100, Math.round((filled / needed) * 100));
            return (
              <div key={req.reqId || req.workerType} className="card" style={{ padding: 14 }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h5 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{req.workerType}</h5>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className={`badge ${skillBadgeClass[req.skillLevel] || 'badge-skilled'}`}>{req.skillLevel || 'skilled'}</span>
                      <span className="badge" style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)' }}>
                        {needed - filled} of {needed} still needed
                      </span>
                    </div>
                  </div>
                  <span className="text-lg font-bold" style={{ color: 'var(--color-contractor-orange)', fontFamily: 'var(--font-display)' }}>
                    Rs {req.dailyWage}
                  </span>
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Experience: {req.experienceRequired || 'Fresher OK'}
                </p>
                <div className="site-progress-track mb-3">
                  <div className={`site-progress-fill ${pct === 100 ? 'complete' : ''}`} style={{ width: `${pct}%` }} />
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: 'var(--color-contractor-orange)', boxShadow: '0 4px 16px rgba(249, 115, 22, 0.25)' }}
                  disabled={applyingReqId === req.reqId || filled >= needed}
                  onClick={() => applyForRequirement(req)}
                >
                  {applyingReqId === req.reqId ? <span className="spinner spinner-sm" /> : <>Apply for This Role</>}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-5">
        <h4 className="input-label">Site Facilities</h4>
        <div className="grid grid-cols-2 gap-2">
          {FACILITY_OPTIONS.map((facility) => (
            <span key={facility.key} className={`facility-badge ${facilities[facility.key] ? '' : 'disabled'}`}>
              {facility.label}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-5">
        <h4 className="input-label">Additional Info</h4>
        <div className="flex flex-wrap gap-2">
          {job.physicalFitnessRequired && <span className="badge badge-contractor">Physical fitness required</span>}
          {job.nightShiftInvolved && <span className="badge badge-week">Night shift</span>}
          {job.weekendWorkRequired && <span className="badge badge-week">Weekend work</span>}
          {(job.preferredLanguages || []).map((language) => <span key={language} className="badge">{language}</span>)}
        </div>
      </section>

      <section className="mb-5">
        <h4 className="input-label">About Contractor</h4>
        <div className="card" style={{ padding: 14 }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h5 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{job.companyName || 'Contractor'}</h5>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {job.contractorType || 'Contractor'} - {job.yearsInBusiness || 'Verified locally'}
              </p>
            </div>
            <span className="badge badge-complete"><Star size={12} /> {job.rating || 0}</span>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="badge"><Users size={12} /> {job.totalProjectsPosted || 0} projects</span>
            {job.isVerified && <span className="badge badge-complete">Verified</span>}
          </div>
        </div>
      </section>

      {viewer?.role === 'contractor' && (
        <section className="mb-5">
          <button
            type="button"
            className="card w-full text-left"
            style={{ borderColor: 'rgba(16, 185, 129, 0.25)' }}
            onClick={() => navigate('/contractor/find-labour')}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--color-facility-green)' }}>
              Can't find enough workers? Contact a Labour Contractor
            </p>
          </button>
        </section>
      )}

      {rolePickerOpen && (
        <div className="card mb-3" style={{ borderColor: 'rgba(249, 115, 22, 0.35)' }}>
          <h4 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>Which role are you applying for?</h4>
          <div className="space-y-2">
            {requirements.filter((req) => Number(req.numberFilled || 0) < Number(req.numberNeeded || 1)).map((req) => (
              <button
                key={req.reqId}
                type="button"
                className="w-full flex items-center justify-between rounded-xl p-3 text-left"
                style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }}
                onClick={() => applyForRequirement(req)}
              >
                <span className="text-sm">{req.workerType}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-contractor-orange)' }}>Rs {req.dailyWage}/day</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <button
          type="button"
          className="btn-primary"
          style={{ background: 'var(--color-contractor-orange)', boxShadow: '0 4px 16px rgba(249, 115, 22, 0.25)' }}
          onClick={() => setRolePickerOpen(true)}
        >
          Apply Now
        </button>
        <button
          type="button"
          className="btn-whatsapp w-full"
          onClick={() => openWhatsApp(job.contractorPhone || job.employerPhone, `Hi, I saw your project "${job.projectName || job.title}" on NearHire and want to know more.`)}
        >
          <MessageCircle size={18} /> Contact on WhatsApp
        </button>
      </div>
    </div>
  );
};

export default SiteJobDetail;
