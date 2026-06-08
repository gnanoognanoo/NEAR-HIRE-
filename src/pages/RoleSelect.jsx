import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, User, ArrowRight, Home, HardHat } from 'lucide-react';

const RoleSelect = () => {
  const { updateUserRole } = useAuth();
  const navigate = useNavigate();

  const selectRole = async (role) => {
    await updateUserRole(role);
    if (role === 'worker') navigate('/setup/worker');
    else if (role === 'resident') navigate('/setup/resident');
    else if (role === 'contractor') navigate('/setup/contractor');
    else navigate('/setup/employer');
  };

  return (
    <div className="min-h-screen flex flex-col px-5 py-6">
      {/* Header */}
      <div className="mt-[8vh] mb-8 text-center animate-fade-in">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          How will you use NearHire?
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Choose your role to get started
        </p>
      </div>

      {/* Role Cards */}
      <div className="space-y-4 stagger-children">
        {/* Worker Card */}
        <button
          className="card card-interactive w-full text-left"
          onClick={() => selectRole('worker')}
          id="role-worker"
          style={{ padding: '28px 20px' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
              }}
            >
              <User size={26} color="white" />
            </div>
            <div className="flex-1">
              <h3
                className="text-lg font-semibold mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
              >
                I'm a Worker
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Find daily wage jobs near you. Get hired instantly by local shops and businesses.
              </p>
              <div
                className="inline-flex items-center gap-1 mt-3 text-sm font-medium"
                style={{ color: '#6366f1' }}
              >
                Get started <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </button>

        {/* Employer Card */}
        <button
          className="card card-interactive w-full text-left"
          onClick={() => selectRole('employer')}
          id="role-employer"
          style={{ padding: '28px 20px' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), #ff8f5c)',
                boxShadow: '0 4px 16px var(--color-primary-glow)',
              }}
            >
              <Briefcase size={26} color="white" />
            </div>
            <div className="flex-1">
              <h3
                className="text-lg font-semibold mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
              >
                I'm an Employer
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Post jobs and find reliable workers near your shop. Hire within minutes.
              </p>
              <div
                className="inline-flex items-center gap-1 mt-3 text-sm font-medium"
                style={{ color: 'var(--color-primary)' }}
              >
                Get started <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </button>

        {/* Resident Card */}
        <button
          className="card card-interactive w-full text-left"
          onClick={() => selectRole('resident')}
          id="role-resident"
          style={{ padding: '28px 20px' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #2B7FFF, #6366f1)',
                boxShadow: '0 4px 16px rgba(43, 127, 255, 0.35)',
              }}
            >
              <Home size={26} color="white" />
            </div>
            <div className="flex-1">
              <h3
                className="text-lg font-semibold mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
              >
                I'm a Resident
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Post home tasks — cleaning, care, errands — and find trusted workers nearby.
              </p>
              <div
                className="inline-flex items-center gap-1 mt-3 text-sm font-medium"
                style={{ color: '#2B7FFF' }}
              >
                Get started <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </button>

        {/* Contractor Card */}
        <button
          className="card card-interactive w-full text-left"
          onClick={() => selectRole('contractor')}
          id="role-contractor"
          style={{ padding: '28px 20px' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #F97316, #EA6C00)',
                boxShadow: '0 4px 16px rgba(249, 115, 22, 0.32)',
              }}
            >
              <HardHat size={26} color="white" />
            </div>
            <div className="flex-1">
              <h3
                className="text-lg font-semibold mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
              >
                I'm a Contractor
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Post site jobs & hire skilled workers for construction projects.
              </p>
              <div
                className="inline-flex items-center gap-1 mt-3 text-sm font-medium"
                style={{ color: 'var(--color-contractor-orange)' }}
              >
                Get started <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default RoleSelect;
