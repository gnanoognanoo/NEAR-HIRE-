import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../services/dataService';
import { TASK_CATEGORIES } from '../constants/taskCategories';
import { ArrowLeft, Minus, Plus, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DateNeededBadge from '../components/DateNeededBadge';

const PAY_TYPES = [
  { value: 'per-task', label: 'Per Task' },
  { value: 'hourly', label: 'Per Hour' },
  { value: 'daily', label: 'Per Day' },
];

const DATE_OPTIONS = [
  { value: 'today', label: 'Today', urgent: true },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this-week', label: 'This Week' },
  { value: 'flexible', label: 'Flexible' },
];

const DURATION_OPTIONS = [
  { value: '1hr', label: '1 Hour' },
  { value: '2-3hrs', label: '2–3 Hours' },
  { value: 'half-day', label: 'Half Day' },
  { value: 'full-day', label: 'Full Day' },
  { value: 'ongoing', label: 'Ongoing / Regular' },
];

const WORKER_TYPE_PREFS = [
  { value: 'any', label: 'Any' },
  { value: 'youngster', label: 'Youngster (18–25)' },
  { value: 'adult', label: 'Experienced Adult' },
  { value: 'homemaker', label: 'Homemaker' },
  { value: 'skilled', label: 'Skilled Tradesman' },
];

const PostTask = () => {
  const { currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [successTask, setSuccessTask] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    categoryId: TASK_CATEGORIES[0].id,
    subCategoryId: TASK_CATEGORIES[0].subcategories[0].id,
    title: TASK_CATEGORIES[0].subcategories[0].label,
    payAmount: '',
    payType: 'per-task',
    dateNeeded: 'today',
    duration: '1hr',
    workersRequired: 1,
    genderPreference: 'any',
    workerTypePreference: [],
    ageGroupPreference: '',
    specialInstructions: '',
    useProfileLocation: true,
    customAddress: '',
    showAreaPublicly: true,
    hideExactAddressUntilAccepted: true,
  });

  const selectedCategory = useMemo(
    () => TASK_CATEGORIES.find((c) => c.id === form.categoryId),
    [form.categoryId]
  );

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Task title is required';
    if (!form.payAmount || Number(form.payAmount) <= 0) e.payAmount = 'Enter a valid amount';
    if (form.specialInstructions.length > 200) e.specialInstructions = 'Max 200 characters';
    if (!form.useProfileLocation && !form.customAddress.trim()) e.location = 'Enter address or use profile location';
    if (!currentUser?.location?.lat && form.useProfileLocation) e.location = 'Complete your profile location first';
    return e;
  };

  const handleCategoryChange = (catId, subId) => {
    const cat = TASK_CATEGORIES.find((c) => c.id === catId);
    const sub = cat?.subcategories.find((s) => s.id === subId);
    setForm((f) => ({
      ...f,
      categoryId: catId,
      subCategoryId: subId,
      title: sub?.label || f.title,
    }));
  };

  const toggleWorkerTypePref = (value) => {
    if (value === 'any') {
      setForm((f) => ({ ...f, workerTypePreference: [] }));
      return;
    }
    setForm((f) => {
      const next = f.workerTypePreference.includes(value)
        ? f.workerTypePreference.filter((v) => v !== value)
        : [...f.workerTypePreference, value];
      return { ...f, workerTypePreference: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the form');
      return;
    }

    setIsLoading(true);
    try {
      const location = form.useProfileLocation
        ? currentUser.location
        : { ...currentUser.location, address: form.customAddress };

      const payLabels = { 'per-task': '/task', hourly: '/hr', daily: '/day' };
      const task = await jobService.createJob({
        title: form.title.trim(),
        taskCategory: selectedCategory?.label || form.categoryId,
        taskSubCategory: form.subCategoryId,
        payAmount: Number(form.payAmount),
        payType: form.payType,
        salary: `₹${form.payAmount}${payLabels[form.payType]}`,
        salaryAmount: Number(form.payAmount),
        salaryType: form.payType,
        dateNeeded: form.dateNeeded,
        duration: form.duration,
        genderPreference: form.genderPreference,
        workerTypePreference: form.workerTypePreference,
        ageGroupPreference: form.ageGroupPreference || undefined,
        workersRequired: form.workersRequired,
        description: form.specialInstructions || `${form.title} in ${currentUser.locality}`,
        locality: currentUser.locality,
        apartmentName: currentUser.apartmentName,
        location,
        postedBy: 'resident',
        residentId: currentUser.uid,
        isTaskPost: true,
        employerId: null,
        employerPhone: currentUser.phoneNumber?.replace(/\D/g, '') || '919999999999',
        type: 'temporary',
        urgency: form.dateNeeded === 'today' ? 'urgent' : form.dateNeeded === 'tomorrow' ? 'this-week' : 'flexible',
        showAreaPublicly: form.showAreaPublicly,
        hideExactAddressUntilAccepted: form.hideExactAddressUntilAccepted,
        status: 'active',
        skillsRequired: [],
      });

      await updateProfile({
        totalTasksPosted: (currentUser.totalTasksPosted || 0) + 1,
      });

      setSuccessTask(task);
      toast.success('Task posted!');
    } catch {
      toast.error('Failed to post task');
    }
    setIsLoading(false);
  };

  if (successTask) {
    return (
      <div className="page animate-fade-in text-center px-5 py-10">
        <CheckCircle size={56} style={{ color: 'var(--color-flexible)', margin: '0 auto' }} />
        <h1 className="text-2xl font-bold mt-4 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Task Posted!
        </h1>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          {successTask.title} · {successTask.locality}
        </p>
        <p className="text-lg font-semibold mb-2">{successTask.salary}</p>
        <DateNeededBadge dateNeeded={successTask.dateNeeded} />
        <p className="text-xs mt-4 mb-6" style={{ color: 'var(--color-text-muted)' }}>
          Workers will see this as a blue pin on the map.
        </p>
        <button className="btn-primary" onClick={() => navigate('/resident/dashboard')}>
          Go to My Tasks
        </button>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in pb-8">
      <button type="button" className="flex items-center gap-2 text-sm mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Post Task</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>Home help for your neighbourhood</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="input-group">
          <label className="input-label">Category</label>
          <select
            className="input-field"
            value={form.categoryId}
            onChange={(e) => {
              const cat = TASK_CATEGORIES.find((c) => c.id === e.target.value);
              handleCategoryChange(e.target.value, cat?.subcategories[0]?.id);
            }}
          >
            {TASK_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Task type</label>
          <select
            className="input-field"
            value={form.subCategoryId}
            onChange={(e) => handleCategoryChange(form.categoryId, e.target.value)}
          >
            {selectedCategory?.subcategories.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Task title *</label>
          <input
            className={`input-field ${errors.title ? 'input-error' : ''}`}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          {errors.title && <p className="error-text">{errors.title}</p>}
        </div>

        <div className="input-group">
          <label className="input-label">Pay amount (₹) *</label>
          <input
            type="number"
            className={`input-field ${errors.payAmount ? 'input-error' : ''}`}
            value={form.payAmount}
            onChange={(e) => setForm({ ...form, payAmount: e.target.value })}
          />
          {errors.payAmount && <p className="error-text">{errors.payAmount}</p>}
          <div className="filter-toggle-group mt-2">
            {PAY_TYPES.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`filter-toggle ${form.payType === p.value ? 'active' : ''}`}
                onClick={() => setForm({ ...form, payType: p.value })}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Date needed</label>
          <div className="filter-toggle-group flex-wrap">
            {DATE_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                className={`filter-toggle ${form.dateNeeded === d.value ? 'active' : ''}`}
                style={d.urgent && form.dateNeeded === d.value ? { background: 'var(--color-today-red)' } : {}}
                onClick={() => setForm({ ...form, dateNeeded: d.value })}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Duration</label>
          <div className="filter-toggle-group flex-wrap">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                className={`filter-toggle ${form.duration === d.value ? 'active' : ''}`}
                onClick={() => setForm({ ...form, duration: d.value })}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Workers needed</label>
          <div className="flex items-center gap-4">
            <button type="button" className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-bg-input)' }} onClick={() => setForm((f) => ({ ...f, workersRequired: Math.max(1, f.workersRequired - 1) }))}>
              <Minus size={18} />
            </button>
            <span className="text-xl font-bold">{form.workersRequired}</span>
            <button type="button" className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-bg-input)' }} onClick={() => setForm((f) => ({ ...f, workersRequired: Math.min(5, f.workersRequired + 1) }))}>
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Gender preference (optional)</label>
          <div className="filter-toggle-group">
            {['any', 'male', 'female'].map((g) => (
              <button key={g} type="button" className={`filter-toggle ${form.genderPreference === g ? 'active' : ''}`} onClick={() => setForm({ ...form, genderPreference: g })}>
                {g === 'any' ? 'Any' : g === 'male' ? 'Male Only' : 'Female Only'}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Preferred age group (optional)</label>
          <div className="filter-toggle-group flex-wrap">
            {[
              { value: '', label: 'Any' },
              { value: 'youngster', label: '👦 18–25' },
              { value: 'adult', label: '🧑 26–40' },
              { value: 'senior', label: '👴 40+' },
            ].map((a) => (
              <button
                key={a.value || 'any'}
                type="button"
                className={`filter-toggle ${form.ageGroupPreference === a.value ? 'active' : ''}`}
                onClick={() => setForm({ ...form, ageGroupPreference: a.value })}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Worker type (optional)</label>
          <div className="flex flex-wrap gap-2">
            {WORKER_TYPE_PREFS.map((w) => (
              <button
                key={w.value}
                type="button"
                className={`chip ${(w.value === 'any' && !form.workerTypePreference.length) || form.workerTypePreference.includes(w.value) ? 'chip-selected' : ''}`}
                onClick={() => toggleWorkerTypePref(w.value)}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Special instructions (optional)</label>
          <textarea
            className="input-field"
            rows={3}
            maxLength={200}
            value={form.specialInstructions}
            onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{form.specialInstructions.length}/200</p>
        </div>

        <div className="input-group">
          <label className="input-label">Location</label>
          <label className="flex items-center gap-2 text-sm mb-2">
            <input type="checkbox" checked={form.useProfileLocation} onChange={(e) => setForm({ ...form, useProfileLocation: e.target.checked })} />
            Use profile location ({currentUser?.locality || 'set in profile'})
          </label>
          {!form.useProfileLocation && (
            <input className="input-field" placeholder="Different address" value={form.customAddress} onChange={(e) => setForm({ ...form, customAddress: e.target.value })} />
          )}
          {errors.location && <p className="error-text">{errors.location}</p>}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.showAreaPublicly} onChange={(e) => setForm({ ...form, showAreaPublicly: e.target.checked })} />
            Show area name publicly
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.hideExactAddressUntilAccepted} onChange={(e) => setForm({ ...form, hideExactAddressUntilAccepted: e.target.checked })} />
            Show exact address only after worker is accepted
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? <span className="spinner spinner-sm" /> : 'Post Task'}
        </button>
      </form>
    </div>
  );
};

export default PostTask;
