import React from 'react';
import {
  LayoutDashboard, Map, Brain, Cpu, Users, FileText,
  Clock, ShieldCheck, BarChart3, ChevronLeft, ChevronRight
} from 'lucide-react';
import './Sidebar.css';

export type PageId =
  | 'dashboard' | 'plant-map' | 'ai-risk' | 'sensors'
  | 'workers' | 'permits' | 'timeline' | 'compliance' | 'reports';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  badge?: { value: number; type: 'critical' | 'warning' | 'info' };
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'plant-map', label: 'Live Plant Map', icon: <Map size={16} />, badge: { value: 2, type: 'critical' } },
  { id: 'ai-risk', label: 'AI Risk Center', icon: <Brain size={16} />, badge: { value: 3, type: 'warning' } },
  { id: 'sensors', label: 'Sensor Monitor', icon: <Cpu size={16} />, badge: { value: 1, type: 'critical' } },
  { id: 'workers', label: 'Worker Monitor', icon: <Users size={16} />, badge: { value: 1, type: 'critical' } },
  { id: 'permits', label: 'Active Permits', icon: <FileText size={16} />, badge: { value: 5, type: 'info' } },
  { id: 'timeline', label: 'Timeline', icon: <Clock size={16} /> },
  { id: 'compliance', label: 'Compliance Center', icon: <ShieldCheck size={16} />, badge: { value: 2, type: 'warning' } },
  { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 size={16} /> },
];

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, collapsed, onToggle }) => {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && (
              <>
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge ${item.badge.type}`}>
                    {item.badge.value}
                  </span>
                )}
              </>
            )}
            {collapsed && item.badge && (
              <span className={`nav-badge-dot ${item.badge.type}`} />
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          {!collapsed && (
            <div className="status-row">
              <span className="pulse-dot success" />
              <span className="status-text">All Systems Nominal</span>
            </div>
          )}
          <div className="status-row">
            <span className="pulse-dot blue" />
            {!collapsed && <span className="status-text">AI Engine Active</span>}
          </div>
        </div>

        <button className="collapse-btn" onClick={onToggle} id="sidebar-toggle-btn">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
