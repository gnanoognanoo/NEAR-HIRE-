/** Resident task categories — used in Post Task & Task Board filters */
export const TASK_CATEGORIES = [
  {
    id: 'vehicle-care',
    label: 'Vehicle Care',
    icon: '🚗',
    subcategories: [
      { id: 'car-washing', label: 'Car Washing' },
      { id: 'bike-cleaning', label: 'Bike Cleaning' },
      { id: 'vehicle-polishing', label: 'Vehicle Polishing' },
      { id: 'puncture-repair', label: 'Puncture Repair Help' },
    ],
  },
  {
    id: 'home-maintenance',
    label: 'Home Maintenance',
    icon: '🏠',
    subcategories: [
      { id: 'water-tank', label: 'Water Tank Cleaning' },
      { id: 'terrace-cleaning', label: 'Terrace Cleaning' },
      { id: 'drain-pipe', label: 'Drain/Pipe Cleaning' },
      { id: 'wall-painting', label: 'Wall Painting' },
      { id: 'minor-repairs', label: 'Minor Repairs' },
      { id: 'plumbing', label: 'Plumbing Help' },
      { id: 'electrical', label: 'Electrical Help' },
    ],
  },
  {
    id: 'outdoor-garden',
    label: 'Outdoor & Garden',
    icon: '🌿',
    subcategories: [
      { id: 'garden-watering', label: 'Garden Watering' },
      { id: 'compound-sweeping', label: 'Compound Sweeping' },
      { id: 'garbage-disposal', label: 'Garbage Disposal Help' },
      { id: 'plant-care', label: 'Plant Care' },
    ],
  },
  {
    id: 'care-services',
    label: 'Care Services',
    icon: '👶',
    subcategories: [
      { id: 'babysitting', label: 'Babysitting / Childcare' },
      { id: 'elder-care', label: 'Elder Care / Sitting' },
      { id: 'pet-care', label: 'Pet Care / Dog Walking' },
      { id: 'special-needs', label: 'Special Needs Assistance' },
    ],
  },
  {
    id: 'errand-delivery',
    label: 'Errand & Delivery',
    icon: '🛒',
    subcategories: [
      { id: 'grocery-pickup', label: 'Grocery Pickup' },
      { id: 'medicine-pickup', label: 'Medicine Pickup' },
      { id: 'parcel', label: 'Parcel Drop/Pickup' },
      { id: 'general-errands', label: 'General Errands' },
    ],
  },
  {
    id: 'kitchen-cooking',
    label: 'Kitchen & Cooking',
    icon: '🍳',
    subcategories: [
      { id: 'cooking-daily', label: 'Cooking Help (daily)' },
      { id: 'cooking-events', label: 'Cooking for Events/Parties' },
      { id: 'dishwashing-events', label: 'Dishwashing for Events' },
      { id: 'catering-assistant', label: 'Catering Assistant' },
    ],
  },
  {
    id: 'cleaning-services',
    label: 'Cleaning Services',
    icon: '🧹',
    subcategories: [
      { id: 'deep-clean', label: 'Full House Deep Clean' },
      { id: 'post-construction', label: 'Post-Construction Clean' },
      { id: 'move-clean', label: 'Move-In/Move-Out Clean' },
      { id: 'bathroom-clean', label: 'Bathroom Deep Clean' },
      { id: 'kitchen-clean', label: 'Kitchen Deep Clean' },
    ],
  },
];

export const findSubcategoryLabel = (categoryId, subId) => {
  const cat = TASK_CATEGORIES.find((c) => c.id === categoryId);
  const sub = cat?.subcategories.find((s) => s.id === subId);
  return sub?.label || subId;
};

export const findCategoryBySub = (subId) => {
  for (const cat of TASK_CATEGORIES) {
    if (cat.subcategories.some((s) => s.id === subId)) return cat;
  }
  return null;
};

export const TASK_BOARD_FILTER_CHIPS = [
  { value: 'all', label: 'All Tasks' },
  { value: 'cleaning-services', label: 'Cleaning' },
  { value: 'vehicle-care', label: 'Vehicle' },
  { value: 'care-services', label: 'Care' },
  { value: 'kitchen-cooking', label: 'Cooking' },
  { value: 'errand-delivery', label: 'Errands' },
  { value: 'home-maintenance', label: 'Maintenance' },
];
