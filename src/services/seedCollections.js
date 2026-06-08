import { db, isDemoMode } from './firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

/**
 * Utility to seed initial future-ready collections in Firestore
 * (Plans, rating structure templates, etc.)
 */
export const seedCollections = async () => {
  if (isDemoMode || !db) {
    console.log('Demo mode is active; skipping Firestore collection seeding.');
    return true;
  }

  try {
    const batch = writeBatch(db);

    // 1. Seed subscription plans
    const subscriptionPlans = [
      {
        planId: 'plan_basic',
        name: 'Basic Free',
        price: 0,
        activeJobsLimit: 2,
        durationDays: 30,
        features: [
          'Up to 2 active jobs',
          'Standard 3km distance search',
          'WhatsApp click-to-chat connections'
        ],
        createdAt: new Date().toISOString()
      },
      {
        planId: 'plan_premium',
        name: 'Premium Hires',
        price: 499,
        activeJobsLimit: 10,
        durationDays: 30,
        features: [
          'Up to 10 active jobs',
          'Priority listing search boost',
          'Featured Orange Badge',
          'WhatsApp business click-to-connect',
          'Access to highly rated workers first'
        ],
        createdAt: new Date().toISOString()
      }
    ];

    const plansRef = collection(db, 'subscriptionPlans');
    subscriptionPlans.forEach((plan) => {
      const planDoc = doc(plansRef, plan.planId);
      batch.set(planDoc, plan);
    });

    const jobsRef = collection(db, 'jobs');
    const residentTasks = [
      { title: 'Car Washing Needed', taskCategory: 'Vehicle Care', payAmount: 150, payType: 'per-task', dateNeeded: 'today', duration: '1hr', genderPreference: 'any', locality: 'Anna Nagar', postedBy: 'resident', isTaskPost: true, status: 'active', location: { lat: 13.085, lng: 80.248, address: 'Anna Nagar' } },
      { title: 'Water Tank Cleaning', taskCategory: 'Home Maintenance', payAmount: 500, payType: 'per-task', dateNeeded: 'tomorrow', duration: 'half-day', genderPreference: 'male', locality: 'T. Nagar', postedBy: 'resident', isTaskPost: true, status: 'active', location: { lat: 13.0418, lng: 80.2341, address: 'T. Nagar' } },
      { title: 'Babysitter Needed — 3 Hours', taskCategory: 'Care Services', payAmount: 200, payType: 'per-task', dateNeeded: 'this-week', duration: '2-3hrs', genderPreference: 'female', locality: 'Velachery', postedBy: 'resident', isTaskPost: true, status: 'active', location: { lat: 12.9815, lng: 80.218, address: 'Velachery' } },
      { title: 'Full House Deep Cleaning', taskCategory: 'Cleaning Services', payAmount: 800, payType: 'per-task', dateNeeded: 'this-week', duration: 'full-day', genderPreference: 'any', locality: 'Adyar', postedBy: 'resident', isTaskPost: true, status: 'active', location: { lat: 13.0067, lng: 80.2572, address: 'Adyar' } },
    ];
    residentTasks.forEach((task, i) => {
      batch.set(doc(jobsRef, `seed_resident_task_${i}`), {
        ...task,
        residentId: 'seed_resident_demo',
        createdAt: new Date().toISOString(),
        applicantCount: 0,
      });
    });

    const usersRef = collection(db, 'users');
    const seedWorkers = [
      { userId: 'seed_worker_ravi', role: 'worker', name: 'Ravi Kumar', ageGroup: 'youngster', gender: 'male', workerType: 'daily-wage', skills: ['Cleaning', 'Car Washing', 'Delivery'], languages: ['Tamil', 'Hindi'], availableToday: true, openToHomeTasks: true, hasVehicle: true, vehicleType: 'bike', location: { lat: 13.09, lng: 80.25 } },
      { userId: 'seed_worker_lakshmi', role: 'worker', name: 'Lakshmi S', ageGroup: 'adult', gender: 'female', workerType: 'homemaker', skills: ['Cooking', 'Cleaning', 'Babysitting'], languages: ['Tamil', 'Telugu'], availableToday: true, openToHomeTasks: true, hasVehicle: false },
      { userId: 'seed_worker_murugan', role: 'worker', name: 'Murugan R', ageGroup: 'senior', gender: 'male', workerType: 'skilled', skills: ['Plumbing', 'Electrical'], languages: ['Tamil'], availableToday: false, openToHomeTasks: true, hasVehicle: false },
    ];
    seedWorkers.forEach((w) => batch.set(doc(usersRef, w.userId), { ...w, createdAt: new Date().toISOString() }));

    await batch.commit();
    console.log('Future-ready database collections seeded successfully!');
    return true;
  } catch (error) {
    console.error('Failed to seed database collections:', error);
    return false;
  }
};
