import { useEffect, useState } from 'react';
import { MessageCircle, ShieldCheck, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/dataService';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/SkeletonLoader';
import { buildLabourContractorMessage, openWhatsApp } from '../utils/whatsapp';
import {
  ADVANCE_NOTICE_OPTIONS,
  LABOUR_AREAS,
  LABOUR_SUPPLY_CAPACITIES,
  LABOUR_SUPPLY_TYPES,
} from '../constants/contractor';

const filterOptions = (items) => ['all', ...items];

const LabourContractorDirectory = () => {
  const { currentUser } = useAuth();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    workerType: 'all',
    capacity: 'all',
    area: 'all',
    advanceNotice: 'all',
  });

  const loadContractors = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const data = await userService.getLabourContractors(nextFilters);
      setContractors(data);
    } catch {
      toast.error('Failed to load labour contractors');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadContractors(filters);
  }, []);

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    loadContractors(next);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Find Labour Contractors</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Suppliers who can provide workers at short notice</p>
        </div>
        <span className="badge badge-contractor">Read-only</span>
      </div>

      <div className="card mb-4">
        <div className="grid grid-cols-2 gap-3">
          <FilterSelect label="Worker type" value={filters.workerType} options={filterOptions(LABOUR_SUPPLY_TYPES)} onChange={(value) => updateFilter('workerType', value)} />
          <FilterSelect label="Capacity" value={filters.capacity} options={filterOptions(LABOUR_SUPPLY_CAPACITIES)} onChange={(value) => updateFilter('capacity', value)} />
          <FilterSelect label="Area" value={filters.area} options={filterOptions(LABOUR_AREAS)} onChange={(value) => updateFilter('area', value)} />
          <FilterSelect label="Notice" value={filters.advanceNotice} options={filterOptions(ADVANCE_NOTICE_OPTIONS)} onChange={(value) => updateFilter('advanceNotice', value)} />
        </div>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : contractors.length === 0 ? (
        <EmptyState icon="search" title="No Labour Contractors" description="Try widening the filters or checking another area." />
      ) : (
        <div className="space-y-3 stagger-children">
          {contractors.map((contractor) => (
            <div key={contractor.userId || contractor.uid} className="card">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{contractor.companyName}</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{contractor.contractorType}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="badge badge-complete"><Star size={12} /> {contractor.rating || 0}</span>
                  {contractor.isGSTVerified && <span className="badge badge-complete"><ShieldCheck size={12} /> Verified</span>}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {(contractor.workerTypesSupplied || []).map((type) => <span key={type} className="badge badge-contractor">{type}</span>)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                <span>Capacity: {contractor.supplyCapacity || 'Not set'}</span>
                <span>Notice: {contractor.advanceNotice || 'Not set'}</span>
                <span className="col-span-2">Areas: {(contractor.areasServed || []).join(', ') || 'Not set'}</span>
              </div>

              <button
                type="button"
                className="btn-whatsapp w-full"
                onClick={() => openWhatsApp(contractor.phone || contractor.phoneNumber, buildLabourContractorMessage({
                  contractorName: currentUser.companyName || currentUser.ownerName || 'Contractor',
                  companyName: contractor.companyName,
                  need: filters.workerType === 'all' ? 'workers' : filters.workerType,
                }))}
              >
                <MessageCircle size={18} /> Contact on WhatsApp
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FilterSelect = ({ label, value, options, onChange }) => (
  <div>
    <label className="input-label">{label}</label>
    <select className="input-field" value={value} onChange={(e) => onChange(e.target.value)} style={{ fontSize: '0.85rem' }}>
      {options.map((option) => <option key={option} value={option}>{option === 'all' ? 'All' : option}</option>)}
    </select>
  </div>
);

export default LabourContractorDirectory;
