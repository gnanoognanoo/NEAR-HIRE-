/**
 * Data service — Unified API layer that delegates to either Firestore or mock DB
 * based on VITE_DEMO_MODE environment variable
 */
import { isDemoMode } from './firebase';
import { mockDbService } from './mockDb';
import { firestoreService } from './firestoreService';

const service = isDemoMode ? mockDbService : firestoreService;

// ── User Service ──────────────────────────
export const userService = {
  getUser: (userId) => service.getUser(userId),
  createUser: (userId, data) => service.createUser(userId, data),
  updateUser: (userId, data) => service.updateUser(userId, data),
  getAvailableWorkers: (lat, lng) => service.getAvailableWorkers(lat, lng),
  searchWorkers: (filters, lat, lng) =>
    service.searchWorkers?.(filters, lat, lng) ?? service.getAvailableWorkers(lat, lng),
  getLabourContractors: (filters, lat, lng) =>
    service.getLabourContractors?.(filters, lat, lng) ?? Promise.resolve([]),
  addTrustedWorker: (contractorId, workerData) =>
    service.addTrustedWorker?.(contractorId, workerData) ?? Promise.resolve(null),
  removeTrustedWorker: (contractorId, workerId) =>
    service.removeTrustedWorker?.(contractorId, workerId) ?? Promise.resolve(null),
};

// ── Job Service ───────────────────────────
export const jobService = {
  getJobs: () => service.getJobs(),
  getJobById: (jobId) => service.getJobById(jobId),
  getJobsByEmployer: (employerId) => service.getJobsByEmployer(employerId),
  getJobsByContractor: (contractorId) =>
    service.getJobsByContractor?.(contractorId) ?? Promise.resolve([]),
  getJobsByResident: (residentId) =>
    service.getJobsByResident?.(residentId) ?? Promise.resolve([]),
  getHomeTasks: () => service.getHomeTasks?.() ?? service.getJobs().then((j) => j.filter((x) => x.isTaskPost)),
  getSiteJobs: () => service.getSiteJobs?.() ?? service.getJobs().then((j) => j.filter((x) => x.isProjectPost)),
  getCachedHomeTasks: () => service.getCachedHomeTasks?.() ?? [],
  createJob: (jobData) => service.createJob(jobData),
  createProject: (projectData) => service.createProject?.(projectData) ?? service.createJob(projectData),
  getRequirements: (jobId) => service.getRequirements?.(jobId) ?? Promise.resolve([]),
  updateJobStatus: (jobId, status) => service.updateJobStatus(jobId, status),
  seedJobsNear: (lat, lng) => service.seedJobsNear(lat, lng),
};

// ── Application Service ───────────────────
export const applicationService = {
  createApplication: (data) => service.createApplication(data),
  checkExisting: (jobId, workerId) => service.checkExistingApplication(jobId, workerId),
  getByWorker: (workerId) => service.getApplicationsByWorker(workerId),
  getByJob: (jobId) => service.getApplicationsByJob(jobId),
  getByEmployer: (employerId) => service.getApplicationsByEmployer(employerId),
  getByContractor: (contractorId) =>
    service.getApplicationsByContractor?.(contractorId) ?? service.getApplicationsByEmployer(contractorId),
  getByResident: (residentId) =>
    service.getApplicationsByResident?.(residentId) ?? Promise.resolve([]),
  getByJobWithWorkers: (jobId) =>
    service.getApplicationsByJobWithWorkers?.(jobId) ?? service.getApplicationsByJob(jobId),
  updateStatus: (appId, status) => service.updateApplicationStatus(appId, status),
};
