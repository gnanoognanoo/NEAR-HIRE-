import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Search, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/dataService';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/SkeletonLoader';
import { openWhatsApp } from '../utils/whatsapp';

const ContractorLabourPool = () => {
  const { currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPool(currentUser?.trustedWorkers || []);
    setLoading(false);
  }, [currentUser?.trustedWorkers]);

  const removeWorker = async (workerId) => {
    try {
      const next = pool.filter((w) => w.workerId !== workerId);
      await userService.removeTrustedWorker?.(currentUser.uid, workerId);
      await updateProfile({ trustedWorkers: next });
      setPool(next);
      toast.success('Removed from labour pool');
    } catch {
      toast.error('Failed to remove worker');
    }
  };

  const rehireWorker = (worker) => {
    openWhatsApp(
      worker.phone || worker.phoneNumber,
      `Hi ${worker.name}, this is ${currentUser.companyName || currentUser.ownerName} from NearHire. We need a ${worker.role || worker.selectedRole || 'worker'} again for an upcoming site. Are you available?`
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>My Labour Pool</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Trusted workers you can rehire quickly</p>
        </div>
      </div>

      <button
        type="button"
        className="card w-full text-left mb-5"
        style={{ borderColor: 'rgba(16, 185, 129, 0.25)' }}
        onClick={() => navigate('/contractor/find-labour')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-facility-green)' }}>Need more workers? Find Labour Contractors</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Browse suppliers who can supply labour at short notice</p>
          </div>
          <Search size={18} style={{ color: 'var(--color-facility-green)' }} />
        </div>
      </button>

      <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
        <Star size={16} style={{ color: 'var(--color-contractor-orange)' }} /> My Trusted Workers
      </h2>

      {loading ? (
        <SkeletonList count={2} />
      ) : pool.length === 0 ? (
        <EmptyState
          icon="users"
          title="No Workers in Your Pool Yet"
          description="Add workers from applicant management after you hire or shortlist them."
          actionLabel="View Projects"
          onAction={() => navigate('/contractor/projects')}
        />
      ) : (
        <div className="space-y-3 stagger-children">
          {pool.map((worker) => (
            <div key={worker.workerId} className="card">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{worker.name}</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{worker.role || worker.selectedRole || 'Worker'}</p>
                </div>
                {worker.rating != null && (
                  <span className="badge badge-complete">★ {worker.rating}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn-whatsapp"
                  style={{ minHeight: 42, padding: '8px 10px', fontSize: '0.8rem' }}
                  onClick={() => rehireWorker(worker)}
                >
                  <MessageCircle size={16} /> Rehire
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ minHeight: 42, padding: '8px 10px', fontSize: '0.8rem', color: 'var(--color-urgent)' }}
                  onClick={() => removeWorker(worker.workerId)}
                >
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractorLabourPool;
