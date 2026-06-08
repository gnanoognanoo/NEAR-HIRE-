import { Link, useLocation } from 'react-router-dom';
import {
  Map,
  Briefcase,
  User,
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Store,
  Search,
  HardHat,
  Users,
} from 'lucide-react';

/**
 * Bottom navigation — role-aware tabs
 * Worker:   Map | Jobs | Tasks | Sites | Profile
 * Employer: Post Job | My Jobs | Map | Find Workers | Profile | Dashboard
 * Resident: Post Task | My Tasks | Find Workers | Profile | Dashboard
 * Contractor: Post Project | My Projects | Find Workers | Labour Pool | Dashboard
 */
const BottomNav = ({ role }) => {
  const location = useLocation();

  const workerLinks = [
    { to: '/map', icon: <Map size={22} />, label: 'Map' },
    { to: '/jobs', icon: <Briefcase size={22} />, label: 'Jobs' },
    { to: '/tasks', icon: <ClipboardList size={22} />, label: 'Tasks' },
    { to: '/sites', icon: <HardHat size={22} />, label: 'Sites' },
    { to: '/profile', icon: <User size={22} />, label: 'Profile' },
  ];

  const employerLinks = [
    { to: '/employer/post-job', icon: <PlusCircle size={20} />, label: 'Post' },
    { to: '/employer/dashboard', icon: <ClipboardList size={20} />, label: 'Jobs' },
    { to: '/employer/workers-map', icon: <Map size={20} />, label: 'Map' },
    { to: '/find-workers', icon: <Search size={20} />, label: 'Find' },
    { to: '/profile', icon: <Store size={20} />, label: 'Profile' },
    { to: '/employer/stats', icon: <LayoutDashboard size={20} />, label: 'Stats' },
  ];

  const residentLinks = [
    { to: '/resident/post-task', icon: <PlusCircle size={22} />, label: 'Post Task' },
    { to: '/resident/dashboard', icon: <ClipboardList size={22} />, label: 'My Tasks' },
    { to: '/find-workers', icon: <Search size={22} />, label: 'Find Workers' },
    { to: '/profile', icon: <User size={22} />, label: 'Profile' },
    { to: '/resident/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard', matchAlso: '/resident/dashboard' },
  ];

  const contractorLinks = [
    { to: '/contractor/post-project', icon: <PlusCircle size={20} />, label: 'Post' },
    { to: '/contractor/projects', icon: <ClipboardList size={20} />, label: 'Projects' },
    { to: '/find-workers', icon: <Search size={20} />, label: 'Find' },
    { to: '/contractor/labour-pool', icon: <Users size={20} />, label: 'Pool' },
    { to: '/contractor/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  ];

  const links =
    role === 'employer' ? employerLinks : role === 'resident' ? residentLinks : role === 'contractor' ? contractorLinks : workerLinks;

  return (
    <nav className="bottom-nav">
      <div className="nav-items">
        {links.map((link) => {
          const isActive =
            location.pathname === link.to ||
            (link.to === '/map' && location.pathname === '/') ||
            (link.to === '/employer/dashboard' && location.pathname.startsWith('/employer/dashboard')) ||
            (link.to === '/resident/dashboard' && location.pathname.startsWith('/resident')) ||
            (link.to === '/find-workers' && location.pathname === '/find-workers') ||
            (link.to === '/employer/workers-map' && location.pathname === '/employer/workers-map') ||
            (link.to === '/employer/stats' && location.pathname === '/employer/stats') ||
            (link.to === '/contractor/projects' && location.pathname.startsWith('/contractor/projects')) ||
            (link.to === '/contractor/dashboard' && location.pathname === '/contractor/dashboard') ||
            (link.to === '/contractor/labour-pool' && (location.pathname === '/contractor/labour-pool' || location.pathname === '/contractor/find-labour')) ||
            (link.to === '/sites' && location.pathname === '/sites');

          return (
            <Link
              key={`${link.label}-${link.to}`}
              to={link.to}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="icon-wrapper">{link.icon}</div>
              <span className="nav-label">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
