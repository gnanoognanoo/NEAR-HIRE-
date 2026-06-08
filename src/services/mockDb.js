/**
 * Mock Database Service — Used when VITE_DEMO_MODE=true
 * Simulates Firestore with localStorage for fully functional demo
 */

import {
  EMPTY_FACILITIES,
  LABOUR_CONTRACTOR_TYPE,
  getRequirementTotals,
  normalizeFacilities,
} from '../constants/contractor';
import { notificationService } from './notificationService';

const getStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage limit reached', e);
  }
};

const generateId = () => Math.random().toString(36).substr(2, 12);

// ── Predefined data ──────────────────────────────────────
const JOB_TITLES = [
  'Kitchen Helper', 'Tea Shop Assistant', 'Delivery Rider', 'Salon Helper',
  'Store Cashier', 'Restaurant Waiter', 'Night Security Guard', 'Cleaning Staff',
  'Electrician Helper', 'Tailor Assistant', 'Auto Driver', 'Warehouse Loader',
  'Car Washer', 'Cook — South Indian', 'Barista', 'Plumber Assistant',
  'Carpenter Helper', 'Painter', 'Gardener', 'Event Setup Worker'
];

const SHOP_NAMES = [
  'Anand Tea Stall', 'Sai Salon', 'Ravi Kirana Store', 'Udupi Restaurant',
  'QuickMart', 'Royal Sweets', 'Sharma Electronics', 'Fresh Basket',
  'City Dry Cleaners', 'Mahalakshmi Textiles', 'Green Leaf Cafe', 'Prakash Auto Works',
  'Sunrise Bakery', 'Kumar Hardware', 'Meera Fashion'
];

const SHOP_CATEGORIES = ['Tea Shop', 'Salon', 'Restaurant', 'Retail', 'Other'];
const JOB_TYPES = ['full-time', 'part-time', 'temporary'];
const URGENCIES = ['urgent', 'this-week', 'flexible'];
const SKILLS_LIST = [
  'Cooking', 'Cleaning', 'Customer Service', 'Cashier', 'Hair Styling',
  'Driving', 'Security', 'Delivery', 'Electrician', 'Plumbing',
  'Carpentry', 'Tailoring'
];

const WORKER_NAMES = [
  'Amit Kumar', 'Ravi Singh', 'Priya Sharma', 'Sunita Devi', 'Arjun Das',
  'Meena Kumari', 'Vikram Rao', 'Nisha Khan', 'Sanjay Patel', 'Kavita Nair',
  'Rahul Verma', 'Anita Roy', 'Deepak Yadav', 'Pooja Gupta', 'Manoj Kumar'
];

const DEMO_JOB_COUNT = 10000;
const DEMO_JOB_RADIUS_KM = 100;
const DEMO_WORKER_COUNT = 250;
const DEMO_WORKER_RADIUS_KM = 35;
const DEFAULT_DEMO_CENTER = { lat: 28.6139, lng: 77.2090 };

const getCenterKey = (lat, lng) => `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;

const getRandomPointAround = (centerLat, centerLng, radiusKm) => {
  const distanceKm = Math.sqrt(Math.random()) * radiusKm;
  const angle = Math.random() * Math.PI * 2;
  const latDelta = (distanceKm * Math.cos(angle)) / 111;
  const lngDelta = (distanceKm * Math.sin(angle)) / (111 * Math.cos(centerLat * Math.PI / 180));

  return {
    lat: centerLat + latDelta,
    lng: centerLng + lngDelta,
  };
};

// ── Generate mock jobs scattered around TN ───────────────────
const generateMockJobs = (count, centerLat = DEFAULT_DEMO_CENTER.lat, centerLng = DEFAULT_DEMO_CENTER.lng) => {
  const jobs = [];
  for (let i = 0; i < count; i++) {
    const title = JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)];
    const shopName = SHOP_NAMES[Math.floor(Math.random() * SHOP_NAMES.length)];
    const type = JOB_TYPES[Math.floor(Math.random() * JOB_TYPES.length)];
    const urgency = URGENCIES[Math.floor(Math.random() * URGENCIES.length)];
    const salaryType = Math.random() > 0.5 ? 'daily' : 'monthly';
    const salaryAmount = salaryType === 'daily'
      ? Math.floor(Math.random() * 400 + 300)
      : Math.floor(Math.random() * 12000 + 8000);

    const { lat, lng } = getRandomPointAround(centerLat, centerLng, DEMO_JOB_RADIUS_KM);

    const numSkills = Math.floor(Math.random() * 3) + 1;
    const skills = [];
    const shuffled = [...SKILLS_LIST].sort(() => Math.random() - 0.5);
    for (let j = 0; j < numSkills; j++) skills.push(shuffled[j]);

    const daysAgo = Math.floor(Math.random() * 7);
    const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

    jobs.push({
      jobId: `job_${generateId()}`,
      employerId: `emp_${Math.floor(Math.random() * 10) + 1}`,
      employerPhone: `91${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      title,
      shopName,
      shopCategory: SHOP_CATEGORIES[Math.floor(Math.random() * SHOP_CATEGORIES.length)],
      salary: salaryType === 'daily' ? `₹${salaryAmount}/day` : `₹${salaryAmount}/mo`,
      salaryType,
      salaryAmount,
      type,
      urgency,
      description: `Looking for an experienced ${title.toLowerCase()} for ${shopName}. Good working environment and timely payment guaranteed.`,
      location: {
        lat,
        lng,
        address: `Near ${shopName}`,
      },
      skillsRequired: skills,
      experienceRequired: Math.random() > 0.5 ? `${Math.floor(Math.random() * 3 + 1)} years` : 'Fresher',
      workersRequired: Math.floor(Math.random() * 4) + 1,
      applicantCount: Math.floor(Math.random() * 8),
      status: 'active',
      createdAt,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      postedBy: 'shop',
      isTaskPost: false,
    });
  }
  return jobs;
};

const CHENNAI_CENTER = { lat: 13.0827, lng: 80.2707 };

const SEED_RESIDENT_TASKS = [
  {
    title: 'Car Washing Needed',
    taskCategory: 'Vehicle Care',
    taskSubCategory: 'car-washing',
    payAmount: 150,
    payType: 'per-task',
    dateNeeded: 'today',
    duration: '1hr',
    genderPreference: 'any',
    locality: 'Anna Nagar',
    postedBy: 'resident',
    isTaskPost: true,
    status: 'active',
    workersRequired: 1,
    location: { lat: 13.085, lng: 80.248, address: 'Anna Nagar, Chennai' },
  },
  {
    title: 'Water Tank Cleaning',
    taskCategory: 'Home Maintenance',
    taskSubCategory: 'water-tank',
    payAmount: 500,
    payType: 'per-task',
    dateNeeded: 'tomorrow',
    duration: 'half-day',
    genderPreference: 'male',
    workerTypePreference: ['skilled'],
    ageGroupPreference: 'adult',
    locality: 'T. Nagar',
    postedBy: 'resident',
    isTaskPost: true,
    status: 'active',
    workersRequired: 1,
    location: { lat: 13.0418, lng: 80.2341, address: 'T. Nagar, Chennai' },
  },
  {
    title: 'Babysitter Needed — 3 Hours',
    taskCategory: 'Care Services',
    taskSubCategory: 'babysitting',
    payAmount: 200,
    payType: 'per-task',
    dateNeeded: 'this-week',
    duration: '2-3hrs',
    genderPreference: 'female',
    workerTypePreference: ['homemaker', 'youngster'],
    ageGroupPreference: 'adult',
    locality: 'Velachery',
    postedBy: 'resident',
    isTaskPost: true,
    status: 'active',
    workersRequired: 1,
    location: { lat: 12.9815, lng: 80.218, address: 'Velachery, Chennai' },
  },
  {
    title: 'Full House Deep Cleaning',
    taskCategory: 'Cleaning Services',
    taskSubCategory: 'deep-clean',
    payAmount: 800,
    payType: 'per-task',
    dateNeeded: 'this-week',
    duration: 'full-day',
    genderPreference: 'any',
    locality: 'Adyar',
    postedBy: 'resident',
    isTaskPost: true,
    status: 'active',
    workersRequired: 2,
    location: { lat: 13.0067, lng: 80.2572, address: 'Adyar, Chennai' },
  },
];

const SEED_WORKERS_PROFILES = [
  {
    userId: 'seed_worker_ravi',
    uid: 'seed_worker_ravi',
    role: 'worker',
    name: 'Ravi Kumar',
    phoneNumber: '+919876543210',
    ageGroup: 'youngster',
    gender: 'male',
    workerType: 'daily-wage',
    skills: ['Cleaning', 'Car Washing', 'Delivery'],
    languages: ['Tamil', 'Hindi'],
    availableToday: true,
    openToHomeTasks: true,
    hasVehicle: true,
    vehicleType: 'bike',
    preferredTiming: ['morning', 'afternoon'],
    canWorkWeekends: true,
    location: { lat: 13.09, lng: 80.25, address: 'Anna Nagar area' },
    rating: 4.5,
    completedJobs: 12,
  },
  {
    userId: 'seed_worker_lakshmi',
    uid: 'seed_worker_lakshmi',
    role: 'worker',
    name: 'Lakshmi S',
    phoneNumber: '+919876543211',
    ageGroup: 'adult',
    gender: 'female',
    workerType: 'homemaker',
    skills: ['Cooking', 'Cleaning', 'Babysitting', 'Elder Care'],
    languages: ['Tamil', 'Telugu'],
    availableToday: true,
    openToHomeTasks: true,
    hasVehicle: false,
    vehicleType: 'none',
    preferredTiming: ['morning', 'evening'],
    canWorkWeekends: true,
    location: { lat: 13.04, lng: 80.24, address: 'T. Nagar area' },
    rating: 4.8,
    completedJobs: 28,
  },
  {
    userId: 'seed_worker_murugan',
    uid: 'seed_worker_murugan',
    role: 'worker',
    name: 'Murugan R',
    phoneNumber: '+919876543212',
    ageGroup: 'senior',
    gender: 'male',
    workerType: 'skilled',
    skills: ['Plumbing', 'Electrical', 'Tank Cleaning'],
    languages: ['Tamil'],
    availableToday: false,
    openToHomeTasks: true,
    hasVehicle: false,
    vehicleType: 'none',
    preferredTiming: ['afternoon'],
    canWorkWeekends: false,
    location: { lat: 13.01, lng: 80.26, address: 'Adyar area' },
    rating: 4.2,
    completedJobs: 45,
  },
];

const SEED_CONTRACTOR_PROJECTS = [
  {
    jobId: 'site_project_g3_building',
    contractorId: 'seed_contractor_murugan',
    contractorPhone: '919876543220',
    projectName: 'G+3 Residential Building',
    title: 'G+3 Residential Building',
    projectType: 'New Construction',
    contractorType: 'Building Contractor',
    companyName: 'Sri Murugan Constructions',
    urgency: 'urgent',
    startOffsetDays: 0,
    projectDuration: '3-6 months',
    locality: 'Anna Nagar, Chennai',
    siteAddress: 'Anna Nagar, Chennai',
    siteLandmark: 'Near Tower Park',
    location: { lat: 13.085, lng: 80.248, address: 'Anna Nagar, Chennai' },
    requirements: [
      { workerType: 'Mason', numberNeeded: 4, dailyWage: 800, experienceRequired: '2+ years', skillLevel: 'skilled' },
      { workerType: 'Construction Helper', numberNeeded: 8, dailyWage: 500, experienceRequired: 'Fresher OK', skillLevel: 'unskilled' },
      { workerType: 'Bar Bender', numberNeeded: 2, dailyWage: 700, experienceRequired: '1+ years', skillLevel: 'skilled' },
      { workerType: 'Carpenter', numberNeeded: 2, dailyWage: 750, experienceRequired: '1+ years', skillLevel: 'skilled' },
    ],
    facilitiesOffered: { accommodation: false, food: true, advancePayment: true, safetyEquipment: true, transport: false },
  },
  {
    jobId: 'site_project_office_renovation',
    contractorId: 'seed_contractor_modern_interiors',
    contractorPhone: '919876543221',
    projectName: 'Commercial Office Renovation',
    title: 'Commercial Office Renovation',
    projectType: 'Interior Work',
    contractorType: 'Interior Contractor',
    companyName: 'Modern Interiors Pvt Ltd',
    urgency: 'this-week',
    startOffsetDays: 3,
    projectDuration: '2-4 weeks',
    locality: 'T. Nagar, Chennai',
    siteAddress: 'T. Nagar, Chennai',
    siteLandmark: 'Near Pondy Bazaar',
    location: { lat: 13.0418, lng: 80.2341, address: 'T. Nagar, Chennai' },
    requirements: [
      { workerType: 'Tile Fixer', numberNeeded: 3, dailyWage: 850, experienceRequired: '2+ years', skillLevel: 'skilled' },
      { workerType: 'Painter', numberNeeded: 4, dailyWage: 700, experienceRequired: '1+ years', skillLevel: 'skilled' },
      { workerType: 'False Ceiling Worker', numberNeeded: 2, dailyWage: 800, experienceRequired: '1+ years', skillLevel: 'skilled' },
      { workerType: 'Construction Helper', numberNeeded: 4, dailyWage: 500, experienceRequired: 'Fresher OK', skillLevel: 'unskilled' },
    ],
    facilitiesOffered: { accommodation: false, food: false, advancePayment: false, safetyEquipment: true, transport: true },
  },
  {
    jobId: 'site_project_apartment_painting',
    contractorId: 'seed_contractor_colour_king',
    contractorPhone: '919876543222',
    projectName: 'Apartment Complex Painting',
    title: 'Apartment Complex Painting',
    projectType: 'Painting / Finishing',
    contractorType: 'Painting Contractor',
    companyName: 'Colour King Painters',
    urgency: 'flexible',
    startOffsetDays: 7,
    projectDuration: '1-3 months',
    locality: 'Velachery, Chennai',
    siteAddress: 'Velachery, Chennai',
    siteLandmark: 'Near Phoenix Marketcity',
    location: { lat: 12.9815, lng: 80.218, address: 'Velachery, Chennai' },
    requirements: [
      { workerType: 'Painter', numberNeeded: 10, dailyWage: 750, experienceRequired: '1+ years', skillLevel: 'skilled' },
      { workerType: 'Construction Helper', numberNeeded: 5, dailyWage: 450, experienceRequired: 'Fresher OK', skillLevel: 'unskilled' },
    ],
    facilitiesOffered: { accommodation: true, food: true, advancePayment: true, safetyEquipment: true, transport: true },
  },
];

const SEED_CONSTRUCTION_WORKERS = [
  {
    userId: 'seed_worker_selvam',
    uid: 'seed_worker_selvam',
    role: 'worker',
    name: 'Selvam K',
    phoneNumber: '+919876543230',
    ageGroup: 'adult',
    gender: 'male',
    workerType: 'skilled',
    skills: ['Mason', 'Plastering', 'Tile Fixing'],
    constructionSkills: ['Mason', 'Plasterer', 'Tile Fixer'],
    openToSiteWork: true,
    willingToRelocate: false,
    maxTravelDistance: '10km',
    needsAccommodation: 'No',
    needsFood: 'Preferred',
    physicalWorkLevel: 'Heavy work OK',
    languages: ['Tamil', 'Telugu'],
    availableToday: true,
    experience: 'Mason - 8 years',
    location: { lat: 13.08, lng: 80.25, address: 'Anna Nagar area' },
    rating: 4.7,
    completedJobs: 31,
  },
  {
    userId: 'seed_worker_arjun_site',
    uid: 'seed_worker_arjun_site',
    role: 'worker',
    name: 'Arjun M',
    phoneNumber: '+919876543231',
    ageGroup: 'youngster',
    gender: 'male',
    workerType: 'fresher',
    skills: ['Construction Helper', 'Material Loading'],
    constructionSkills: ['Construction Helper'],
    openToSiteWork: true,
    willingToRelocate: true,
    maxTravelDistance: '25km',
    needsAccommodation: 'Yes',
    needsFood: 'Yes',
    physicalWorkLevel: 'Heavy work OK',
    languages: ['Tamil', 'Hindi'],
    availableToday: true,
    experience: 'Helper - 6 months',
    location: { lat: 13.047, lng: 80.232, address: 'T. Nagar area' },
    rating: 4.2,
    completedJobs: 6,
  },
  {
    userId: 'seed_worker_ramesh_site',
    uid: 'seed_worker_ramesh_site',
    role: 'worker',
    name: 'Ramesh B',
    phoneNumber: '+919876543232',
    ageGroup: 'adult',
    gender: 'male',
    workerType: 'skilled',
    skills: ['Electrician', 'CCTV Installation', 'AC Technician'],
    constructionSkills: ['Electrician', 'CCTV Technician', 'AC Technician'],
    openToSiteWork: true,
    willingToRelocate: false,
    maxTravelDistance: '10km',
    needsAccommodation: 'No',
    needsFood: 'No',
    physicalWorkLevel: 'Moderate',
    languages: ['Tamil', 'English'],
    availableToday: false,
    experience: 'Electrician - 5 years',
    location: { lat: 12.985, lng: 80.22, address: 'Velachery area' },
    rating: 4.6,
    completedJobs: 19,
  },
];

const SEED_CONTRACTOR_USERS = [
  {
    userId: 'seed_contractor_murugan',
    uid: 'seed_contractor_murugan',
    role: 'contractor',
    companyName: 'Sri Murugan Constructions',
    ownerName: 'Murugan S',
    phone: '+919876543220',
    phoneNumber: '+919876543220',
    contractorType: 'Building Contractor',
    yearsInBusiness: '5-10 years',
    gstNumber: '33ABCDE1234F1Z5',
    isGSTVerified: true,
    isVerified: true,
    rating: 4.6,
    totalProjectsPosted: 12,
    totalWorkersHired: 96,
    facilitiesOffered: { accommodation: false, food: true, advancePayment: true, safetyEquipment: true, transport: false },
    baseLocation: { lat: 13.085, lng: 80.248, address: 'Anna Nagar, Chennai' },
    location: { lat: 13.085, lng: 80.248, address: 'Anna Nagar, Chennai' },
    serviceRadius: '25km',
  },
  {
    userId: 'seed_contractor_labour_senthil',
    uid: 'seed_contractor_labour_senthil',
    role: 'contractor',
    companyName: 'Senthil Labour Suppliers',
    ownerName: 'Senthil K',
    phone: '+919876543210',
    phoneNumber: '+919876543210',
    contractorType: LABOUR_CONTRACTOR_TYPE,
    workerTypesSupplied: ['Mason', 'Helper', 'General Labour'],
    supplyCapacity: '25-50 workers',
    areasServed: ['Chennai', 'Kanchipuram', 'Chengalpattu'],
    advanceNotice: '1 day',
    gstNumber: '33LMNOP9876Q1Z7',
    isGSTVerified: true,
    isVerified: true,
    rating: 4.5,
    totalProjectsPosted: 0,
    totalWorkersHired: 180,
    baseLocation: { lat: 13.05, lng: 80.23, address: 'Chennai' },
    location: { lat: 13.05, lng: 80.23, address: 'Chennai' },
  },
];

const buildResidentTaskJob = (task, residentId, index) => {
  const payLabels = { 'per-task': '/task', hourly: '/hr', daily: '/day' };
  return {
    ...task,
    jobId: `resident_task_${index}`,
    residentId,
    employerId: null,
    employerPhone: '919999999999',
    salary: `₹${task.payAmount}${payLabels[task.payType] || '/task'}`,
    salaryAmount: task.payAmount,
    salaryType: task.payType,
    type: 'temporary',
    urgency: task.dateNeeded === 'today' ? 'urgent' : task.dateNeeded === 'tomorrow' ? 'this-week' : 'flexible',
    description: `${task.title} in ${task.locality}. Home task posted by a resident.`,
    skillsRequired: [],
    applicantCount: 0,
    createdAt: new Date(Date.now() - index * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    showAreaPublicly: true,
    hideExactAddressUntilAccepted: true,
  };
};

const buildContractorProjectJob = (project, index) => {
  const requirements = project.requirements.map((req, reqIndex) => ({
    reqId: `${project.jobId}_req_${reqIndex + 1}`,
    workerType: req.workerType,
    skillLevel: req.skillLevel,
    numberNeeded: req.numberNeeded,
    numberFilled: req.numberFilled || 0,
    dailyWage: req.dailyWage,
    experienceRequired: req.experienceRequired,
    status: req.numberFilled >= req.numberNeeded ? 'filled' : req.numberFilled > 0 ? 'partial' : 'open',
  }));
  const totals = getRequirementTotals(requirements);
  const startDate = new Date(Date.now() + (project.startOffsetDays || 0) * 86400000).toISOString();
  const facilitiesOffered = normalizeFacilities(project.facilitiesOffered || EMPTY_FACILITIES);

  return {
    ...project,
    requirements,
    ...totals,
    totalWorkersFilled: totals.totalWorkersFilled || 0,
    jobId: project.jobId,
    title: project.projectName,
    description: `${project.projectName} in ${project.locality}. ${project.projectType} project posted by ${project.companyName}.`,
    salary: requirements.length
      ? `Rs ${Math.min(...requirements.map((r) => r.dailyWage))} - Rs ${Math.max(...requirements.map((r) => r.dailyWage))}/day`
      : 'Rs 0/day',
    salaryAmount: Math.max(...requirements.map((r) => r.dailyWage), 0),
    salaryType: 'daily',
    type: 'temporary',
    skillsRequired: requirements.map((r) => r.workerType),
    workersRequired: totals.totalWorkersNeeded,
    totalApplicants: 0,
    applicantCount: 0,
    totalWorkersHired: 0,
    status: 'active',
    postedBy: 'contractor',
    isProjectPost: true,
    isTaskPost: false,
    employerId: null,
    contractorId: project.contractorId,
    employerPhone: project.contractorPhone,
    facilitiesOffered,
    physicalFitnessRequired: index === 0,
    nightShiftInvolved: false,
    weekendWorkRequired: index !== 2,
    preferredLanguages: ['Tamil', 'Hindi'],
    genderPreference: 'Any',
    isUrgentSite: project.urgency === 'urgent',
    startDate,
    createdAt: new Date(Date.now() - index * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    hideExactAddressUntilAccepted: true,
  };
};

const seedResidentTasksIfNeeded = () => {
  const flag = localStorage.getItem('nearhire_resident_tasks_seeded');
  if (flag === 'v1') return;
  const jobs = getStorage('mockJobs') || [];
  const residentId = 'seed_resident_demo';
  const newTasks = SEED_RESIDENT_TASKS.map((t, i) => buildResidentTaskJob(t, residentId, i));
  const existingIds = new Set(jobs.map((j) => j.jobId));
  const toAdd = newTasks.filter((j) => !existingIds.has(j.jobId));
  setStorage('mockJobs', [...toAdd, ...jobs]);
  localStorage.setItem('nearhire_resident_tasks_seeded', 'v1');
};

const seedWorkerProfilesIfNeeded = () => {
  const users = getStorage('mockUsers') || {};
  let changed = false;
  [...SEED_WORKERS_PROFILES, ...SEED_CONSTRUCTION_WORKERS].forEach((w) => {
    if (!users[w.userId]) {
      users[w.userId] = { ...w, createdAt: new Date().toISOString() };
      changed = true;
    }
  });
  if (changed) setStorage('mockUsers', users);
};

const seedContractorDataIfNeeded = () => {
  const flag = localStorage.getItem('nearhire_contractor_seeded');
  const jobs = getStorage('mockJobs') || [];
  const users = getStorage('mockUsers') || {};
  const existingIds = new Set(jobs.map((j) => j.jobId));
  const projects = SEED_CONTRACTOR_PROJECTS
    .map((project, index) => buildContractorProjectJob(project, index))
    .filter((project) => !existingIds.has(project.jobId));

  let usersChanged = false;
  SEED_CONTRACTOR_USERS.forEach((contractor) => {
    if (!users[contractor.userId]) {
      users[contractor.userId] = { ...contractor, createdAt: new Date().toISOString() };
      usersChanged = true;
    }
  });

  if (projects.length) setStorage('mockJobs', [...projects, ...jobs]);
  if (usersChanged) setStorage('mockUsers', users);
  if (flag !== 'v1') localStorage.setItem('nearhire_contractor_seeded', 'v1');
};

// In-memory jobs to avoid localStorage quota issues with 10k sample items
let inMemoryJobs = null;
let inMemoryJobsCenterKey = null;
let inMemoryWorkers = null;
let inMemoryWorkersCenterKey = null;

// ── Initialize storage ───────────────────────────────────
const initializeIfNeeded = () => {
  if (!getStorage('mockJobs')) {
    setStorage('mockJobs', []); // User-created mock jobs
  }
  if (!getStorage('mockApplications')) {
    setStorage('mockApplications', []);
  }
  if (!getStorage('mockUsers')) {
    setStorage('mockUsers', {});
  }
};

const ensureJobsAround = (lat = DEFAULT_DEMO_CENTER.lat, lng = DEFAULT_DEMO_CENTER.lng) => {
  const centerKey = getCenterKey(lat, lng);
  if (!inMemoryJobs || inMemoryJobsCenterKey !== centerKey) {
    inMemoryJobs = generateMockJobs(DEMO_JOB_COUNT, lat, lng);
    inMemoryJobsCenterKey = centerKey;
  }
};

const generateMockWorkers = (count, centerLat = DEFAULT_DEMO_CENTER.lat, centerLng = DEFAULT_DEMO_CENTER.lng) => {
  const workers = [];
  for (let i = 0; i < count; i++) {
    const workerId = `worker_${generateId()}`;
    const name = WORKER_NAMES[Math.floor(Math.random() * WORKER_NAMES.length)];
    const availability = JOB_TYPES[Math.floor(Math.random() * JOB_TYPES.length)];
    const numSkills = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...SKILLS_LIST].sort(() => Math.random() - 0.5);
    const skills = shuffled.slice(0, numSkills);
    const { lat, lng } = getRandomPointAround(centerLat, centerLng, DEMO_WORKER_RADIUS_KM);

    workers.push({
      userId: workerId,
      uid: workerId,
      role: 'worker',
      name,
      phoneNumber: `+91${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      skills,
      experience: Math.random() > 0.45 ? `${Math.floor(Math.random() * 5 + 1)} years` : 'Fresher',
      availability,
      availableToday: true,
      location: {
        lat,
        lng,
        address: `Near ${name.split(' ')[0]}'s area`,
      },
      rating: (Math.random() * 1.6 + 3.4).toFixed(1),
      completedJobs: Math.floor(Math.random() * 45),
    });
  }
  return workers;
};

const ensureWorkersAround = (lat = DEFAULT_DEMO_CENTER.lat, lng = DEFAULT_DEMO_CENTER.lng) => {
  const centerKey = getCenterKey(lat, lng);
  if (!inMemoryWorkers || inMemoryWorkersCenterKey !== centerKey) {
    inMemoryWorkers = generateMockWorkers(DEMO_WORKER_COUNT, lat, lng);
    inMemoryWorkersCenterKey = centerKey;
  }
};

// Initialize with defaults
initializeIfNeeded();
seedResidentTasksIfNeeded();
seedWorkerProfilesIfNeeded();
seedContractorDataIfNeeded();

// ── Delay helper ─────────────────────────────────────────
const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

// ══════════════════════════════════════════════════════════
// EXPORTED SERVICE
// ══════════════════════════════════════════════════════════

export const mockDbService = {
  // ── Users ──────────────────────────────
  getUser: async (userId) => {
    await delay(200);
    const users = getStorage('mockUsers') || {};
    return users[userId] || null;
  },

  createUser: async (userId, userData) => {
    await delay(300);
    const users = getStorage('mockUsers') || {};
    users[userId] = { ...userData, userId, createdAt: new Date().toISOString() };
    setStorage('mockUsers', users);
    return users[userId];
  },

  updateUser: async (userId, updates) => {
    await delay(200);
    const users = getStorage('mockUsers') || {};
    users[userId] = { ...users[userId], ...updates };
    setStorage('mockUsers', users);
    return users[userId];
  },

  getAvailableWorkers: async (lat, lng) => {
    ensureWorkersAround(lat, lng);
    await delay(250);
    const users = getStorage('mockUsers') || {};
    const savedWorkers = Object.values(users)
      .filter((user) => user.role === 'worker')
      .filter((user) => user.availableToday !== false)
      .filter((user) => user.location?.lat && user.location?.lng);

    return [...savedWorkers, ...inMemoryWorkers];
  },

  getLabourContractors: async (filters = {}) => {
    await delay(250);
    const users = getStorage('mockUsers') || {};
    let contractors = Object.values(users).filter(
      (user) => user.role === 'contractor' && user.contractorType === LABOUR_CONTRACTOR_TYPE
    );

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

  // ── Jobs ──────────────────────────────
  getJobs: async () => {
    ensureJobsAround();
    await delay(300);
    const userJobs = getStorage('mockJobs') || [];
    return [...userJobs, ...inMemoryJobs];
  },

  getJobById: async (jobId) => {
    ensureJobsAround();
    await delay(200);
    const userJobs = getStorage('mockJobs') || [];
    const allJobs = [...userJobs, ...inMemoryJobs];
    return allJobs.find(j => j.jobId === jobId) || null;
  },

  getRequirements: async (jobId) => {
    ensureJobsAround();
    await delay(150);
    const userJobs = getStorage('mockJobs') || [];
    const allJobs = [...userJobs, ...inMemoryJobs];
    const job = allJobs.find(j => j.jobId === jobId);
    return job?.requirements || [];
  },

  getJobsByEmployer: async (employerId) => {
    ensureJobsAround();
    await delay(300);
    const userJobs = getStorage('mockJobs') || [];
    const allJobs = [...userJobs, ...inMemoryJobs];
    return allJobs.filter(j => j.employerId === employerId);
  },

  getJobsByContractor: async (contractorId) => {
    await delay(300);
    const userJobs = getStorage('mockJobs') || [];
    return userJobs.filter(
      (j) => j.contractorId === contractorId || (j.postedBy === 'contractor' && j.contractorId === contractorId)
    );
  },

  getJobsByResident: async (residentId) => {
    await delay(300);
    const userJobs = getStorage('mockJobs') || [];
    return userJobs.filter(
      (j) => j.residentId === residentId || (j.postedBy === 'resident' && j.residentId === residentId)
    );
  },

  getHomeTasks: async () => {
    ensureJobsAround(CHENNAI_CENTER.lat, CHENNAI_CENTER.lng);
    await delay(300);
    const userJobs = getStorage('mockJobs') || [];
    const all = [...userJobs, ...inMemoryJobs];
    const tasks = all.filter((j) => j.isTaskPost || j.postedBy === 'resident');
    try {
      localStorage.setItem('nearhire_cached_tasks', JSON.stringify(tasks.slice(0, 200)));
    } catch { /* quota */ }
    return tasks;
  },

  getSiteJobs: async () => {
    ensureJobsAround(CHENNAI_CENTER.lat, CHENNAI_CENTER.lng);
    await delay(300);
    const userJobs = getStorage('mockJobs') || [];
    const all = [...userJobs, ...inMemoryJobs];
    return all.filter((j) => j.isProjectPost || j.postedBy === 'contractor');
  },

  getCachedHomeTasks: () => {
    try {
      const cached = localStorage.getItem('nearhire_cached_tasks');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  },

  searchWorkers: async (filters = {}, centerLat, centerLng) => {
    ensureWorkersAround(centerLat || CHENNAI_CENTER.lat, centerLng || CHENNAI_CENTER.lng);
    await delay(300);
    const users = getStorage('mockUsers') || {};
    const saved = Object.values(users).filter((u) => u.role === 'worker');
    let list = [...saved, ...inMemoryWorkers];

    if (filters.openToHomeTasks) {
      list = list.filter((w) => w.openToHomeTasks !== false);
    }
    if (filters.openToSiteWork) {
      list = list.filter((w) => w.openToSiteWork === true);
    }
    if (filters.gender && filters.gender !== 'any') {
      list = list.filter((w) => w.gender === filters.gender);
    }
    if (filters.ageGroup && filters.ageGroup !== 'all') {
      list = list.filter((w) => w.ageGroup === filters.ageGroup);
    }
    if (filters.workerType && filters.workerType !== 'any') {
      list = list.filter((w) => w.workerType === filters.workerType);
    }
    if (filters.availableToday) {
      list = list.filter((w) => w.availableToday);
    }
    if (filters.hasVehicle) {
      list = list.filter((w) => w.hasVehicle);
    }
    if (filters.language && filters.language !== 'any') {
      list = list.filter((w) => (w.languages || []).includes(filters.language));
    }
    if (filters.skills?.length) {
      list = list.filter((w) =>
        filters.skills.some((s) => [...(w.skills || []), ...(w.constructionSkills || [])].includes(s))
      );
    }
    if (filters.constructionSkill && filters.constructionSkill !== 'all') {
      list = list.filter((w) =>
        [...(w.skills || []), ...(w.constructionSkills || [])].includes(filters.constructionSkill)
      );
    }

    const seen = new Set();
    return list.filter((w) => {
      const id = w.userId || w.uid;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  },

  createJob: async (jobData) => {
    await delay(400);
    const jobs = getStorage('mockJobs') || [];
    const newJob = {
      ...jobData,
      jobId: `job_${generateId()}`,
      applicantCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
    jobs.unshift(newJob);
    setStorage('mockJobs', jobs);
    return newJob;
  },

  createProject: async (projectData) => {
    await delay(500);
    const jobs = getStorage('mockJobs') || [];
    const jobId = `job_${generateId()}`;
    const requirements = (projectData.requirements || []).map((req, index) => ({
      ...req,
      reqId: req.reqId || `${jobId}_req_${index + 1}`,
      numberNeeded: Number(req.numberNeeded || 1),
      numberFilled: Number(req.numberFilled || 0),
      dailyWage: Number(req.dailyWage || 0),
      status: req.status || 'open',
    }));
    const totals = getRequirementTotals(requirements);
    const newJob = {
      ...projectData,
      ...totals,
      jobId,
      requirements,
      title: projectData.projectName,
      workersRequired: totals.totalWorkersNeeded,
      salary: requirements.length
        ? `Rs ${Math.min(...requirements.map((r) => r.dailyWage))} - Rs ${Math.max(...requirements.map((r) => r.dailyWage))}/day`
        : 'Rs 0/day',
      salaryAmount: Math.max(...requirements.map((r) => r.dailyWage), 0),
      salaryType: 'daily',
      type: 'temporary',
      skillsRequired: requirements.map((r) => r.workerType),
      employerId: null,
      employerPhone: projectData.contractorPhone,
      postedBy: 'contractor',
      isProjectPost: true,
      isTaskPost: false,
      facilitiesOffered: normalizeFacilities(projectData.facilitiesOffered),
      totalWorkersFilled: 0,
      applicantCount: 0,
      totalApplicants: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    jobs.unshift(newJob);
    setStorage('mockJobs', jobs);

    const users = getStorage('mockUsers') || {};
    if (newJob.contractorId && users[newJob.contractorId]) {
      users[newJob.contractorId].totalProjectsPosted = (users[newJob.contractorId].totalProjectsPosted || 0) + 1;
      setStorage('mockUsers', users);
    }

    const allWorkers = Object.values(users).filter((u) => u.role === 'worker');
    notificationService.onProjectPosted(newJob, allWorkers);

    return newJob;
  },

  updateJobStatus: async (jobId, status) => {
    ensureJobsAround();
    await delay(200);
    const userJobs = getStorage('mockJobs') || [];
    const idx = userJobs.findIndex(j => j.jobId === jobId);
    if (idx !== -1) {
      userJobs[idx].status = status;
      setStorage('mockJobs', userJobs);
      return userJobs[idx];
    }
    
    // Check in-memory
    const memIdx = inMemoryJobs.findIndex(j => j.jobId === jobId);
    if (memIdx !== -1) {
      inMemoryJobs[memIdx].status = status;
      return inMemoryJobs[memIdx];
    }
    return null;
  },

  seedJobsNear: async (lat, lng) => {
    initializeIfNeeded();
    ensureJobsAround(lat, lng);
    await delay(300);
    const userJobs = getStorage('mockJobs') || [];
    return [...userJobs, ...inMemoryJobs];
  },

  // ── Applications ──────────────────────
  createApplication: async (appData) => {
    ensureJobsAround();
    await delay(400);
    const apps = getStorage('mockApplications') || [];
    const newApp = {
      ...appData,
      applicationId: `app_${generateId()}`,
      status: 'applied',
      appliedAt: new Date().toISOString(),
    };
    apps.unshift(newApp);
    setStorage('mockApplications', apps);

    // Increment applicant count
    const userJobs = getStorage('mockJobs') || [];
    const jobIdx = userJobs.findIndex(j => j.jobId === appData.jobId);
    if (jobIdx !== -1) {
      userJobs[jobIdx].applicantCount = (userJobs[jobIdx].applicantCount || 0) + 1;
      setStorage('mockJobs', userJobs);
    } else {
      const memIdx = inMemoryJobs.findIndex(j => j.jobId === appData.jobId);
      if (memIdx !== -1) {
        inMemoryJobs[memIdx].applicantCount = (inMemoryJobs[memIdx].applicantCount || 0) + 1;
      }
    }

    return newApp;
  },

  checkExistingApplication: async (jobId, workerId) => {
    await delay(100);
    const apps = getStorage('mockApplications') || [];
    return apps.some(a => a.jobId === jobId && a.workerId === workerId);
  },

  getApplicationsByWorker: async (workerId) => {
    ensureJobsAround();
    await delay(300);
    const apps = getStorage('mockApplications') || [];
    const userJobs = getStorage('mockJobs') || [];
    const allJobs = [...userJobs, ...inMemoryJobs];
    return apps
      .filter(a => a.workerId === workerId)
      .map(a => ({
        ...a,
        job: allJobs.find(j => j.jobId === a.jobId) || null,
      }));
  },

  getApplicationsByJob: async (jobId) => {
    await delay(300);
    const apps = getStorage('mockApplications') || [];
    return apps.filter(a => a.jobId === jobId);
  },

  getApplicationsByEmployer: async (employerId) => {
    await delay(300);
    const apps = getStorage('mockApplications') || [];
    return apps.filter(a => a.employerId === employerId);
  },

  getApplicationsByContractor: async (contractorId) => {
    await delay(300);
    const apps = getStorage('mockApplications') || [];
    return apps.filter(a => a.contractorId === contractorId || a.employerId === contractorId);
  },

  getApplicationsByResident: async (residentId) => {
    await delay(300);
    const apps = getStorage('mockApplications') || [];
    return apps.filter((a) => a.residentId === residentId || a.posterType === 'resident');
  },

  getApplicationsByJobWithWorkers: async (jobId) => {
    await delay(300);
    const apps = getStorage('mockApplications') || [];
    const users = getStorage('mockUsers') || {};
    return apps
      .filter((a) => a.jobId === jobId)
      .map((a) => ({
        ...a,
        worker: users[a.workerId] || inMemoryWorkers?.find((w) => w.userId === a.workerId) || null,
      }));
  },

  updateApplicationStatus: async (applicationId, status) => {
    await delay(200);
    const apps = getStorage('mockApplications') || [];
    const idx = apps.findIndex(a => a.applicationId === applicationId);
    if (idx !== -1) {
      apps[idx].status = status;
      setStorage('mockApplications', apps);
      const users = getStorage('mockUsers') || {};
      const app = apps[idx];
      const contractor = users[app.contractorId || app.employerId];
      if (contractor && app.applicationType === 'site-application') {
        notificationService.notifyApplicationStatusUpdate(app, contractor.companyName || contractor.ownerName || 'Contractor');
      }
    }
    return apps[idx];
  },

  addTrustedWorker: async (contractorId, workerData) => {
    await delay(200);
    const users = getStorage('mockUsers') || {};
    const contractor = users[contractorId];
    if (!contractor) return null;
    const pool = contractor.trustedWorkers || [];
    if (pool.some((w) => w.workerId === workerData.workerId)) return contractor;
    contractor.trustedWorkers = [...pool, { ...workerData, addedAt: new Date().toISOString() }];
    users[contractorId] = contractor;
    setStorage('mockUsers', users);
    return contractor;
  },

  removeTrustedWorker: async (contractorId, workerId) => {
    await delay(200);
    const users = getStorage('mockUsers') || {};
    const contractor = users[contractorId];
    if (!contractor) return null;
    contractor.trustedWorkers = (contractor.trustedWorkers || []).filter((w) => w.workerId !== workerId);
    users[contractorId] = contractor;
    setStorage('mockUsers', users);
    return contractor;
  },
};
