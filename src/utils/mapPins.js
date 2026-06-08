/** Map pin colors per spec */
const SHOP_URGENCY_COLORS = {
  urgent: '#FF3B3B',
  'this-week': '#FFB800',
  flexible: '#00C851',
};

export const PIN_COLORS = {
  shopUrgent: '#FF3B3B',
  shopWeek: '#FFB800',
  shopFlex: '#00C851',
  homeTask: '#2B7FFF',
  homeUrgent: '#8B5CF6',
  site: '#EA6C00',
  siteFilled: '#6B7280',
};

export const getJobPinColor = (job) => {
  if (job?.isProjectPost || job?.postedBy === 'contractor') {
    if (job?.status === 'filled' || job?.status === 'complete') return PIN_COLORS.siteFilled;
    return PIN_COLORS.site;
  }
  if (job?.isTaskPost || job?.postedBy === 'resident') {
    if (job?.dateNeeded === 'today') return PIN_COLORS.homeUrgent;
    return PIN_COLORS.homeTask;
  }
  return SHOP_URGENCY_COLORS[job?.urgency] || PIN_COLORS.shopFlex;
};
