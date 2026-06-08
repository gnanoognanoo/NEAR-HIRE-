/**
 * Multi-select chip component for skills selection
 */
const PREDEFINED_SKILLS = [
  'Cooking', 'Cleaning', 'Customer Service', 'Cashier',
  'Hair Styling', 'Driving', 'Security', 'Delivery',
  'Electrician', 'Plumbing', 'Carpentry', 'Tailoring', 'Other'
];

const SkillChips = ({ selected = [], onChange, skills = PREDEFINED_SKILLS }) => {
  const toggleSkill = (skill) => {
    if (selected.includes(skill)) {
      onChange(selected.filter(s => s !== skill));
    } else {
      onChange([...selected, skill]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <button
          key={skill}
          type="button"
          onClick={() => toggleSkill(skill)}
          className={`chip ${selected.includes(skill) ? 'selected' : ''}`}
        >
          {skill}
        </button>
      ))}
    </div>
  );
};

export { PREDEFINED_SKILLS };
export default SkillChips;
