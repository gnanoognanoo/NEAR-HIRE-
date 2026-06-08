import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  increment 
} from 'firebase/firestore';
import ngeohash from 'ngeohash';

export const firestoreService = {
  // ── Users ──────────────────────────────
  getUser: async (userId) => {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  },

  createUser: async (userId, userData) => {
    const docRef = doc(db, 'users', userId);
    const data = {
      ...userData,
      userId,
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, data);
    return data;
  },

  updateUser: async (userId, updates) => {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, updates);
    return { userId, ...updates };
  },

  getAvailableWorkers: async () => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'worker'),
      where('availableToday', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() }));
  },

  // ── Jobs ──────────────────────────────
  getJobs: async () => {
    const q = query(
      collection(db, 'jobs'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ jobId: doc.id, ...doc.data() }));
  },

  getJobById: async (jobId) => {
    const docRef = doc(db, 'jobs', jobId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { jobId: docSnap.id, ...docSnap.data() } : null;
  },

  getRequirements: async (jobId) => {
    const q = query(collection(db, 'jobs', jobId, 'requirements'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ reqId: doc.id, ...doc.data() }));
  },

  getJobsByEmployer: async (employerId) => {
    const q = query(
      collection(db, 'jobs'),
      where('employerId', '==', employerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ jobId: doc.id, ...doc.data() }));
  },

  getJobsByContractor: async (contractorId) => {
    const q = query(
      collection(db, 'jobs'),
      where('contractorId', '==', contractorId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ jobId: doc.id, ...doc.data() }));
  },

  getJobsByResident: async (residentId) => {
    const q = query(
      collection(db, 'jobs'),
      where('residentId', '==', residentId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ jobId: doc.id, ...doc.data() }));
  },

  getHomeTasks: async () => {
    const q = query(
      collection(db, 'jobs'),
      where('isTaskPost', '==', true),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ jobId: doc.id, ...doc.data() }));
  },

  getSiteJobs: async () => {
    const q = query(
      collection(db, 'jobs'),
      where('isProjectPost', '==', true),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ jobId: doc.id, ...doc.data() }));
  },

  getCachedHomeTasks: () => [],

  searchWorkers: async (filters = {}) => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'worker'),
      ...(filters.openToHomeTasks ? [where('openToHomeTasks', '==', true)] : []),
      ...(filters.openToSiteWork ? [where('openToSiteWork', '==', true)] : []),
      ...(filters.availableToday ? [where('availableToday', '==', true)] : [])
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() }));
  },

  getLabourContractors: async (filters = {}) => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'contractor'),
      where('contractorType', '==', 'Labour Contractor (Supplier)')
    );
    const querySnapshot = await getDocs(q);
    let contractors = querySnapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() }));
    if (filters.workerType && filters.workerType !== 'all') {
      contractors = contractors.filter((c) => (c.workerTypesSupplied || []).includes(filters.workerType));
    }
    if (filters.capacity && filters.capacity !== 'all') {
      contractors = contractors.filter((c) => c.supplyCapacity === filters.capacity);
    }
    if (filters.area && filters.area !== 'all') {
      contractors = contractors.filter((c) => (c.areasServed || []).includes(filters.area));
    }
    if (filters.advanceNotice && filters.advanceNotice !== 'all') {
      contractors = contractors.filter((c) => c.advanceNotice === filters.advanceNotice);
    }
    return contractors;
  },

  createJob: async (jobData) => {
    const jobsRef = collection(db, 'jobs');
    const { lat, lng } = jobData.location || {};
    let geohash = '';
    let geohash5 = '';
    if (lat && lng) {
      geohash = ngeohash.encode(lat, lng, 9);
      geohash5 = geohash.substring(0, 5);
    }
    
    const docData = {
      ...jobData,
      location: {
        ...jobData.location,
        geohash,
        geohash5,
      },
      applicantCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
    
    const docRef = await addDoc(jobsRef, docData);
    return { jobId: docRef.id, ...docData };
  },

  createProject: async (projectData) => {
    const jobsRef = collection(db, 'jobs');
    const { lat, lng } = projectData.location || {};
    let geohash = '';
    let geohash5 = '';
    if (lat && lng) {
      geohash = ngeohash.encode(lat, lng, 9);
      geohash5 = geohash.substring(0, 5);
    }

    const requirements = (projectData.requirements || []).map((req, index) => ({
      ...req,
      reqId: req.reqId || `req_${index + 1}`,
      numberNeeded: Number(req.numberNeeded || 1),
      numberFilled: Number(req.numberFilled || 0),
      dailyWage: Number(req.dailyWage || 0),
      status: req.status || 'open',
    }));
    const totalWorkersNeeded = requirements.reduce((sum, req) => sum + Number(req.numberNeeded || 0), 0);
    const estimatedDailyBill = requirements.reduce(
      (sum, req) => sum + Number(req.numberNeeded || 0) * Number(req.dailyWage || 0),
      0
    );

    const docData = {
      ...projectData,
      requirements,
      totalWorkersNeeded,
      totalWorkersFilled: 0,
      estimatedDailyBill,
      workersRequired: totalWorkersNeeded,
      title: projectData.projectName,
      salaryAmount: Math.max(...requirements.map((r) => Number(r.dailyWage || 0)), 0),
      salaryType: 'daily',
      type: 'temporary',
      skillsRequired: requirements.map((r) => r.workerType),
      location: {
        ...projectData.location,
        geohash,
        geohash5,
      },
      applicantCount: 0,
      totalApplicants: 0,
      status: 'active',
      postedBy: 'contractor',
      isProjectPost: true,
      isTaskPost: false,
      employerId: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    };

    const docRef = await addDoc(jobsRef, docData);
    await Promise.all(
      requirements.map((req) => setDoc(doc(collection(db, 'jobs', docRef.id, 'requirements')), req))
    );
    return { jobId: docRef.id, ...docData };
  },

  updateJobStatus: async (jobId, status) => {
    const docRef = doc(db, 'jobs', jobId);
    await updateDoc(docRef, { status });
    return { jobId, status };
  },

  seedJobsNear: async (lat, lng) => {
    const centerGeohash5 = ngeohash.encode(lat, lng, 5);
    const neighbors5 = ngeohash.neighbors(centerGeohash5);
    const targetPrefixes = [centerGeohash5, ...neighbors5];
    
    const q = query(
      collection(db, 'jobs'),
      where('status', '==', 'active'),
      where('location.geohash5', 'in', targetPrefixes)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ jobId: doc.id, ...doc.data() }));
  },

  // ── Applications ──────────────────────
  createApplication: async (appData) => {
    const appsRef = collection(db, 'applications');
    const newApp = {
      ...appData,
      status: 'applied',
      appliedAt: new Date().toISOString(),
    };
    const docRef = await addDoc(appsRef, newApp);
    
    const jobRef = doc(db, 'jobs', appData.jobId);
    await updateDoc(jobRef, {
      applicantCount: increment(1)
    });
    
    return { applicationId: docRef.id, ...newApp };
  },

  checkExistingApplication: async (jobId, workerId) => {
    const q = query(
      collection(db, 'applications'),
      where('jobId', '==', jobId),
      where('workerId', '==', workerId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  },

  getApplicationsByWorker: async (workerId) => {
    const q = query(
      collection(db, 'applications'),
      where('workerId', '==', workerId),
      orderBy('appliedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const apps = querySnapshot.docs.map(doc => ({ applicationId: doc.id, ...doc.data() }));
    
    const populatedApps = await Promise.all(
      apps.map(async (app) => {
        const jobDoc = await getDoc(doc(db, 'jobs', app.jobId));
        return {
          ...app,
          job: jobDoc.exists() ? { jobId: jobDoc.id, ...jobDoc.data() } : null
        };
      })
    );
    return populatedApps;
  },

  getApplicationsByJob: async (jobId) => {
    const q = query(
      collection(db, 'applications'),
      where('jobId', '==', jobId),
      orderBy('appliedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ applicationId: doc.id, ...doc.data() }));
  },

  getApplicationsByEmployer: async (employerId) => {
    const q = query(
      collection(db, 'applications'),
      where('employerId', '==', employerId),
      orderBy('appliedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ applicationId: doc.id, ...doc.data() }));
  },

  getApplicationsByContractor: async (contractorId) => {
    const q = query(
      collection(db, 'applications'),
      where('contractorId', '==', contractorId),
      orderBy('appliedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ applicationId: doc.id, ...doc.data() }));
  },

  getApplicationsByResident: async (residentId) => {
    const q = query(
      collection(db, 'applications'),
      where('residentId', '==', residentId),
      orderBy('appliedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ applicationId: doc.id, ...doc.data() }));
  },

  getApplicationsByJobWithWorkers: async (jobId) => {
    const q = query(
      collection(db, 'applications'),
      where('jobId', '==', jobId),
      orderBy('appliedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const apps = querySnapshot.docs.map((d) => ({ applicationId: d.id, ...d.data() }));
    return Promise.all(
      apps.map(async (app) => {
        const workerDoc = await getDoc(doc(db, 'users', app.workerId));
        return {
          ...app,
          worker: workerDoc.exists() ? { userId: workerDoc.id, ...workerDoc.data() } : null,
        };
      })
    );
  },

  updateApplicationStatus: async (applicationId, status) => {
    const docRef = doc(db, 'applications', applicationId);
    await updateDoc(docRef, { status });
    return { applicationId, status };
  },
};
