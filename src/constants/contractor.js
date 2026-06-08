export const CONTRACTOR_COLORS = {
  orange: '#F97316',
  sitePin: '#EA6C00',
  skilled: '#0EA5E9',
  semiSkilled: '#8B5CF6',
  unskilled: '#6B7280',
  facilityGreen: '#10B981',
  facilityGrey: '#374151',
};

export const LABOUR_CONTRACTOR_TYPE = 'Labour Contractor (Supplier)';

export const CONTRACTOR_TYPES = [
  'Building Contractor',
  'Civil / Road Contractor',
  'Electrical Contractor',
  'Plumbing Contractor',
  'Painting Contractor',
  'Interior / Fit-out Contractor',
  LABOUR_CONTRACTOR_TYPE,
  'Event / Pandal Contractor',
  'Industrial Contractor',
  'Steel / Fabrication Contractor',
  'Waterproofing Contractor',
  'Demolition Contractor',
  'Other',
];

export const YEARS_IN_BUSINESS = [
  'Less than 1 year',
  '1-3 years',
  '3-5 years',
  '5-10 years',
  '10+ years',
];

export const SERVICE_RADII = ['5km', '10km', '25km', '50km', 'Anywhere in city'];

export const TEAM_SIZES = [
  '1-5 workers',
  '5-20 workers',
  '20-50 workers',
  '50-100 workers',
  '100+ workers',
];

export const PROJECT_SCALES = [
  'Small (under Rs 10 lakh)',
  'Medium (Rs 10 lakh - Rs 1 crore)',
  'Large (above Rs 1 crore)',
];

export const PROJECT_TYPES = [
  'New Construction',
  'Renovation / Repair',
  'Interior Work',
  'Electrical Work',
  'Plumbing Work',
  'Painting / Finishing',
  'Road / Civil Work',
  'Industrial Work',
  'Event Setup',
  'Demolition',
  'Other',
];

export const PROJECT_DURATIONS = [
  '1-3 days',
  '1 week',
  '2-4 weeks',
  '1-3 months',
  '3-6 months',
  '6+ months',
];

export const URGENCY_OPTIONS = [
  { value: 'urgent', label: 'Urgent - Need Today/Tomorrow' },
  { value: 'this-week', label: 'This Week' },
  { value: 'flexible', label: 'Flexible' },
];

export const FACILITY_OPTIONS = [
  { key: 'accommodation', label: 'Accommodation provided' },
  { key: 'food', label: 'Food / meals provided' },
  { key: 'advancePayment', label: 'Advance payment available' },
  { key: 'safetyEquipment', label: 'Safety equipment provided' },
  { key: 'transport', label: 'Transport to site available' },
];

export const EMPTY_FACILITIES = {
  accommodation: false,
  food: false,
  advancePayment: false,
  safetyEquipment: false,
  transport: false,
};

export const WORKER_REQUIREMENT_GROUPS = [
  {
    label: 'Skilled',
    skillLevel: 'skilled',
    options: [
      'Mason / Bricklayer',
      'Carpenter',
      'Bar Bender / Rod Man',
      'Electrician',
      'Plumber',
      'Welder',
      'Tile Fixer',
      'Painter',
      'Plasterer',
      'Scaffolder',
      'Crane Operator',
      'JCB / Excavator Operator',
      'Glass Fixer',
      'Waterproofing Worker',
      'False Ceiling Worker',
      'AC Technician',
      'CCTV Technician',
    ],
  },
  {
    label: 'Semi-skilled',
    skillLevel: 'semi-skilled',
    options: [
      'Shuttering Carpenter',
      'Helper / Assistant Mason',
      'Steel Fixer Helper',
      'Concrete Mixer Operator',
      'Compactor Operator',
    ],
  },
  {
    label: 'Unskilled',
    skillLevel: 'unskilled',
    options: [
      'Construction Helper / Coolie',
      'Material Loader / Unloader',
      'Site Cleaner',
      'Watchman / Night Guard',
      'Water Boy',
      'Debris Removal Worker',
      'General Labour',
    ],
  },
];

export const ALL_WORKER_REQUIREMENTS = WORKER_REQUIREMENT_GROUPS.flatMap((group) =>
  group.options.map((workerType) => ({
    workerType,
    skillLevel: group.skillLevel,
  }))
);

export const EXPERIENCE_OPTIONS = ['Fresher OK', '1+ years', '3+ years', '5+ years'];

export const LANGUAGE_OPTIONS = ['Tamil', 'Hindi', 'Telugu', 'Kannada', 'Any'];

export const CONSTRUCTION_SKILLS = [
  'Mason',
  'Carpenter',
  'Bar Bender',
  'Welder',
  'Tile Fixer',
  'Plasterer',
  'Scaffolder',
  'JCB Operator',
  'Crane Operator',
  'Electrician',
  'CCTV Technician',
  'AC Technician',
  'Construction Helper',
  'Other',
];

export const LABOUR_SUPPLY_TYPES = [
  'Mason',
  'Carpenter',
  'Helper',
  'Electrician',
  'Plumber',
  'Painter',
  'General Labour',
  'Mixed/Any',
];

export const LABOUR_SUPPLY_CAPACITIES = [
  '5-10 workers',
  '10-25 workers',
  '25-50 workers',
  '50-100 workers',
  '100+ workers',
];

export const ADVANCE_NOTICE_OPTIONS = ['Same day', '1 day', '2-3 days', '1 week'];

export const LABOUR_AREAS = ['Chennai', 'Kanchipuram', 'Chengalpattu', 'Anna Nagar', 'T. Nagar', 'Velachery', 'Adyar'];

export const createDefaultRequirement = () => ({
  reqId: `req_${Math.random().toString(36).slice(2, 10)}`,
  workerType: 'Mason / Bricklayer',
  skillLevel: 'skilled',
  numberNeeded: 1,
  numberFilled: 0,
  dailyWage: '',
  experienceRequired: 'Fresher OK',
  status: 'open',
});

export const getSkillLevelForWorkerType = (workerType) =>
  ALL_WORKER_REQUIREMENTS.find((item) => item.workerType === workerType)?.skillLevel || 'skilled';

export const getRequirementTotals = (requirements = []) => {
  const totalWorkersNeeded = requirements.reduce((sum, req) => sum + Number(req.numberNeeded || 0), 0);
  const totalWorkersFilled = requirements.reduce((sum, req) => sum + Number(req.numberFilled || 0), 0);
  const estimatedDailyBill = requirements.reduce(
    (sum, req) => sum + Number(req.numberNeeded || 0) * Number(req.dailyWage || 0),
    0
  );
  return { totalWorkersNeeded, totalWorkersFilled, estimatedDailyBill };
};

export const getWageRange = (requirements = []) => {
  const wages = requirements.map((req) => Number(req.dailyWage || 0)).filter(Boolean);
  if (!wages.length) return 'Rs 0/day';
  const min = Math.min(...wages);
  const max = Math.max(...wages);
  return min === max ? `Rs ${min}/day` : `Rs ${min} - Rs ${max}/day`;
};

export const getOpenWorkerCount = (job) =>
  Math.max(0, Number(job?.totalWorkersNeeded || 0) - Number(job?.totalWorkersFilled || 0));

export const normalizeFacilities = (facilities = {}) => ({
  ...EMPTY_FACILITIES,
  ...facilities,
  advancePayment: facilities.advancePayment ?? facilities.advance ?? false,
  safetyEquipment: facilities.safetyEquipment ?? facilities.safety ?? false,
});
