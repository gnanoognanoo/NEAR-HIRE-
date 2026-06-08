/**
 * Match workers to tasks/jobs by gender preference and age/worker-type preference.
 * All worker profile fields are optional — missing data does not block listings.
 */

export const AGE_GROUP_LABELS = {
  youngster: '18–25',
  adult: '26–40',
  senior: '40+',
};

export const GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  other: 'Any',
};

/** Task prefers this worker gender (or any). */
export const taskMatchesWorkerGender = (task, worker) => {
  const pref = task?.genderPreference || 'any';
  if (pref === 'any') return true;
  if (!worker?.gender || worker.gender === 'other') return true;
  return pref === worker.gender;
};

/** Task worker-type / age preferences (multi-select on resident tasks). */
export const taskMatchesWorkerAge = (task, worker) => {
  const prefs = task?.workerTypePreference;
  if (!prefs?.length) return true;

  const normalized = prefs.map((p) => String(p).toLowerCase());
  if (normalized.includes('any')) return true;

  const workerType = worker?.workerType;
  const ageGroup = worker?.ageGroup;

  if (workerType && normalized.includes(workerType)) return true;

  if (ageGroup === 'youngster' && normalized.includes('youngster')) return true;
  if (ageGroup === 'adult' && (normalized.includes('adult') || normalized.includes('homemaker') || normalized.includes('skilled'))) {
    return true;
  }
  if (ageGroup === 'senior' && (normalized.includes('senior') || normalized.includes('skilled'))) {
    return true;
  }

  return false;
};

export const isGoodMatchForWorker = (task, worker) =>
  taskMatchesWorkerGender(task, worker) && taskMatchesWorkerAge(task, worker);

export const getMatchLabel = (task, worker) => {
  const genderOk = taskMatchesWorkerGender(task, worker);
  const ageOk = taskMatchesWorkerAge(task, worker);
  if (genderOk && ageOk) return 'good';
  if (!genderOk && !ageOk) return 'none';
  return 'partial';
};

/** Filter key for map / task board chips */
export const CLASSIFICATION_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'matches-me', label: '✓ Matches Me' },
  { value: 'women', label: 'Women Preferred' },
  { value: 'men', label: 'Men Preferred' },
  { value: 'youngster', label: '👦 Youngster' },
  { value: 'adult', label: '🧑 Adult' },
  { value: 'senior', label: '👴 Senior' },
];

export const passesClassificationFilter = (task, filterKey, worker) => {
  if (!filterKey || filterKey === 'all') return true;

  if (filterKey === 'matches-me') {
    return worker ? isGoodMatchForWorker(task, worker) : true;
  }
  if (filterKey === 'women') return task.genderPreference === 'female';
  if (filterKey === 'men') return task.genderPreference === 'male';
  if (filterKey === 'youngster') {
    const prefs = task.workerTypePreference || [];
    return prefs.includes('youngster') || task.ageGroupPreference === 'youngster';
  }
  if (filterKey === 'adult') {
    const prefs = task.workerTypePreference || [];
    return (
      prefs.includes('adult') ||
      prefs.includes('homemaker') ||
      prefs.includes('skilled') ||
      task.ageGroupPreference === 'adult'
    );
  }
  if (filterKey === 'senior') {
    const prefs = task.workerTypePreference || [];
    return prefs.includes('senior') || task.ageGroupPreference === 'senior';
  }
  return true;
};
