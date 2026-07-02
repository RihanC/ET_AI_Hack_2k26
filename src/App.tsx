import React, { useState } from 'react';
import type { PageId } from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import AICopilot from './components/layout/AICopilot';
import { useLiveData } from './hooks/useLiveData';
import Login from './pages/Login';

// Pages
import Dashboard from './pages/Dashboard';
import PlantMap from './pages/PlantMap';
import AIRiskCenter from './pages/AIRiskCenter';
import SensorMonitor from './pages/SensorMonitor';
import WorkerMonitor from './pages/WorkerMonitor';
import ActivePermits from './pages/ActivePermits';
import Timeline from './pages/Timeline';
import ComplianceCenter from './pages/ComplianceCenter';
import ReportsAnalytics from './pages/ReportsAnalytics';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const data = useLiveData();

  const handleNavigate = (page: string) => {
    setActivePage(page as PageId);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActivePage('dashboard');
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="app-shell">
      <Sidebar 
        activePage={activePage} 
        onNavigate={handleNavigate} 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <div className="main-layout">
        <Header 
          currentTime={data.currentTime}
          criticalAlerts={data.liveAlerts.filter(a => a.severity === 'critical' && !a.acknowledged).length}
          warningAlerts={data.liveAlerts.filter(a => a.severity === 'warning' && !a.acknowledged).length}
          plantHealth={data.liveKPI.plantHealth}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
        <main className="page-content">
          {activePage === 'dashboard' && <Dashboard liveKPI={data.liveKPI} liveAlerts={data.liveAlerts} onNavigate={handleNavigate} />}
          {activePage === 'plant-map' && <PlantMap onNavigate={handleNavigate} />}
          {activePage === 'ai-risk' && <AIRiskCenter liveKPI={data.liveKPI} onNavigate={handleNavigate} />}
          {activePage === 'sensors' && <SensorMonitor liveSensors={data.liveSensors} onNavigate={handleNavigate} />}
          {activePage === 'workers' && <WorkerMonitor onNavigate={handleNavigate} />}
          {activePage === 'permits' && <ActivePermits onNavigate={handleNavigate} />}
          {activePage === 'timeline' && <Timeline onNavigate={handleNavigate} />}
          {activePage === 'compliance' && <ComplianceCenter />}
          {activePage === 'reports' && <ReportsAnalytics />}
        </main>
      </div>
      <AICopilot />
    </div>
  );
};

export default App;
