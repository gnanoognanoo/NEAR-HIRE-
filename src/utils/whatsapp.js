export const openWhatsApp = (phone, message) => {
  const digits = String(phone || '').replace(/\D/g, '') || '919999999999';
  const text = encodeURIComponent(message);
  window.open(`https://wa.me/${digits}?text=${text}`, '_blank', 'noopener,noreferrer');
};

export const buildShopJobApplicationMessage = ({ workerName, jobTitle, shopName, topSkills = [] }) => {
  const skills = topSkills.slice(0, 3).join(', ');
  return `Hi, I am ${workerName}. I am interested in the ${jobTitle} position at ${shopName}. I found your listing on NearHire.${skills ? ` My skills: ${skills}.` : ''}`;
};

export const buildTaskInterestMessage = ({
  workerName,
  taskTitle,
  locality,
  availability = 'today',
  relevantSkill = '',
}) =>
  `Hi, I saw your task posting on NearHire for ${taskTitle} in ${locality}. I am interested and available ${availability}. My name is ${workerName}${relevantSkill ? ` and I have experience in ${relevantSkill}` : ''}.`;

export const buildWorkerContactMessage = ({ searcherName, workerName }) =>
  `Hi ${workerName}, I'm ${searcherName} from NearHire. I'd like to discuss work opportunities with you.`;

export const buildSiteApplicationMessage = ({
  workerName,
  projectName,
  selectedRole,
  wage,
  availability = 'soon',
  skills = [],
}) => {
  const topSkills = skills.slice(0, 4).join(', ');
  return `Hi, I am ${workerName}. I saw your project "${projectName}" on NearHire. I am interested in the ${selectedRole} position. Daily wage expected: Rs ${wage}. I am available from ${availability}.${topSkills ? ` Skills: ${topSkills}.` : ''}`;
};

export const buildLabourContractorMessage = ({ contractorName, companyName, need = 'workers' }) =>
  `Hi ${companyName}, I am ${contractorName} from NearHire. I need help supplying ${need} for a site project. Please share availability and rates.`;
