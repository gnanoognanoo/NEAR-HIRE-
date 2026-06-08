/**
 * Push notification triggers — demo mode uses toast; wire to FCM when available.
 */
import toast from 'react-hot-toast';
import { calculateDistance } from './locationService';

const workerMatchesProject = (worker, project) => {
  if (!worker.openToSiteWork) return false;
  const reqSkills = (project.requirements || project.skillsRequired || []).map((r) =>
    typeof r === 'string' ? r : r.workerType
  );
  const workerSkills = [...(worker.constructionSkills || []), ...(worker.skills || [])];
  if (!reqSkills.length) return true;
  return reqSkills.some((skill) =>
    workerSkills.some((ws) => ws.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(ws.toLowerCase()))
  );
};

export const notificationService = {
  /** New site within 3km of worker with matching skills */
  notifyNewSiteNearWorkers: (project, workers = []) => {
    if (!project?.location?.lat) return;
    workers.forEach((worker) => {
      if (!worker.openToSiteWork || !worker.location?.lat) return;
      const distance = calculateDistance(
        worker.location.lat,
        worker.location.lng,
        project.location.lat,
        project.location.lng
      );
      if (distance > 3) return;
      if (!workerMatchesProject(worker, project)) return;
      const openCount = (project.requirements || []).reduce(
        (sum, r) => sum + Math.max(0, Number(r.numberNeeded || 0) - Number(r.numberFilled || 0)),
        project.totalWorkersNeeded || 0
      );
      const wage = project.salaryAmount || project.estimatedDailyBill || 500;
      const msg = `🏗️ New site hiring ${openCount} workers near you — ${Math.round(distance * 1000)}m away. ₹${wage}/day`;
      if (typeof window !== 'undefined') {
        toast(msg, { icon: '🏗️', duration: 5000 });
      }
    });
  },

  /** Urgent site alert broadcast */
  notifyUrgentSite: (project) => {
    if (project.urgency !== 'urgent' && !project.isUrgentSite) return;
    const workerType = project.requirements?.[0]?.workerType || 'workers';
    const wage = project.requirements?.[0]?.dailyWage || project.salaryAmount || 500;
    const area = project.locality || project.siteAddress || 'nearby';
    const name = project.companyName || 'A contractor';
    const msg = `🔴 URGENT: ${name} needs ${workerType} TODAY. ₹${wage}/day at ${area}`;
    if (typeof window !== 'undefined') {
      toast(msg, { icon: '🔴', duration: 6000 });
    }
  },

  /** Worker notified when contractor updates application status */
  notifyApplicationStatusUpdate: (application, contractorName) => {
    if (!['shortlisted', 'contacted', 'hired', 'selected'].includes(application.status)) return;
    const projectName = application.projectName || application.jobTitle || 'a project';
    const role = application.selectedRole || 'site role';
    const msg = `✅ ${contractorName} has shortlisted you for ${projectName}. Tap to contact them.`;
    if (typeof window !== 'undefined') {
      toast(`${msg} (${role})`, { icon: '✅', duration: 5000 });
    }
  },

  onProjectPosted: (project, workers = []) => {
    notificationService.notifyNewSiteNearWorkers(project, workers);
    notificationService.notifyUrgentSite(project);
  },
};
