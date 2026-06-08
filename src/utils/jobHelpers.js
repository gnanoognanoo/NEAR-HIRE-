/** Whether a job document is a resident home task */
export const isHomeTask = (job) =>
  job?.isTaskPost === true || job?.postedBy === 'resident';

/** Whether a job is a contractor construction/site project */
export const isSiteJob = (job) =>
  job?.isProjectPost === true || job?.postedBy === 'contractor';

/** Whether a job is a shop/employer listing */
export const isShopJob = (job) =>
  !isHomeTask(job) && !isSiteJob(job) && (job?.postedBy === 'shop' || job?.postedBy === 'employer' || !!job?.employerId);

export const formatPay = (job) => {
  if (job?.salary) return job.salary;
  const amount = job?.payAmount ?? job?.salaryAmount;
  if (!amount) return '—';
  const type = job?.payType || job?.salaryType || 'per-task';
  const labels = {
    'per-task': '/task',
    hourly: '/hr',
    daily: '/day',
    monthly: '/mo',
  };
  return `₹${amount}${labels[type] || ''}`;
};

export const timeAgo = (isoDate) => {
  if (!isoDate) return 'Recently';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Posted ${mins || 1} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Posted ${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `Posted ${days} day${days > 1 ? 's' : ''} ago`;
};

export const formatDateShort = (dateValue) => {
  if (!dateValue) return 'Flexible';
  const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Flexible';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
