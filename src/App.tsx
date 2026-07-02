// ISIP ? Industrial Safety Intelligence Platform
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, Bot, CalendarClock, CheckCircle2, ChevronRight,
  ClipboardCheck, FileText, Factory, History, LayoutDashboard, MapPinned,
  Radar, ShieldCheck, Siren, Users
} from 'lucide-react'
import {
  alerts, complianceData, dailySummary, permits, PLANT_NAME, plantZones,
  riskFactors, riskPredictions, sensors, timelineEvents, trendData, violations, workers
} from './data/mockData'
import { AppProvider, useApp } from './context/AppContext'
import { Badge, StatusDot } from './components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card'
import { KPICard } from './components/ui/KPICard'
import { SearchInput } from './components/ui/SearchInput'
import { RiskGauge } from './components/ui/Gauge'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/map', label: 'Live Plant Map', icon: MapPinned },
  { to: '/risk', label: 'AI Risk Center', icon: Radar },
  { to: '/sensors', label: 'Sensor Monitor', icon: Activity },
  { to: '/workers', label: 'Worker Monitor', icon: Users },
  { to: '/permits', label: 'Active Permits', icon: ClipboardCheck },
  { to: '/timeline', label: 'Timeline', icon: CalendarClock },
  { to: '/compliance', label: 'Compliance Center', icon: ShieldCheck },
  { to: '/reports', label: 'Reports & Analytics', icon: FileText },
]

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <PlatformLayout />
      </AppProvider>
    </BrowserRouter>
  )
}

function PlatformLayout() {
  const [search, setSearch] = useState('')
  const [time] = useState(new Date())

  return (
    <div className="h-full bg-bg text-text">
      <header className="h-16 border-b border-border px-6 flex items-center gap-4 sticky top-0 z-20 glass">
        <div className="flex items-center gap-2 min-w-[250px]">
          <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center"><Factory size={16} className="text-primary"/></div>
          <div>
            <p className="text-xs text-muted">Industrial Safety Intelligence Platform</p>
            <p className="text-sm font-semibold">{PLANT_NAME}</p>
          </div>
        </div>
        <div className="flex-1 max-w-xl"><SearchInput placeholder="Search zone, sensor, worker, permit..." value={search} onChange={setSearch} /></div>
        <div className="flex items-center gap-3 ml-auto text-xs">
          <Badge>Shift B</Badge>
          <Badge>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Badge>
          <Badge variant="risk" level="high">Plant Health 78/100</Badge>
          <button className="h-8 px-3 rounded-lg border border-border bg-card text-muted hover:text-text text-xs flex items-center gap-1"><Siren size={14} />5</button>
          <button className="h-8 px-3 rounded-lg border border-border bg-card text-muted hover:text-text text-xs flex items-center gap-1"><History size={14} />History</button>
        </div>
      </header>
      <div className="flex h-[calc(100%-64px)]">
        <aside className="w-64 border-r border-border p-3 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted hover:text-text hover:bg-card'}`}>
              <item.icon size={16} /> {item.label}
            </NavLink>
          ))}
        </aside>
        <main className="flex-1 overflow-auto p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/risk" element={<RiskPage />} />
            <Route path="/sensors" element={<SensorsPage />} />
            <Route path="/workers" element={<WorkersPage />} />
            <Route path="/permits" element={<PermitsPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </main>
      </div>
      <Copilot />
    </div>
  )
}

function DashboardPage() {
  const { navigateToMap, navigateToRisk } = useApp()
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length
  return <div className="space-y-4">
    <PageTitle title="Dashboard" subtitle="Is my plant safe right now?" />
    <div className="grid-12">
      <div className="col-span-12 lg:col-span-2"><KPICard label="Plant Health" value="78/100" icon={ShieldCheck} trend="up" trendValue="+12 risk" onClick={() => navigateToRisk('z1')} /></div>
      <div className="col-span-12 lg:col-span-2"><KPICard label="Current Risk" value="High" icon={AlertTriangle} trend="up" trendValue="Escalating" onClick={() => navigateToRisk('z1')} /></div>
      <div className="col-span-12 lg:col-span-2"><KPICard label="Active Workers" value={workers.length} icon={Users} onClick={() => navigateToMap('z1')} /></div>
      <div className="col-span-12 lg:col-span-2"><KPICard label="Sensors Online" value={`${sensors.filter(s => s.status === 'online').length}/${sensors.length}`} icon={Activity} /></div>
      <div className="col-span-12 lg:col-span-2"><KPICard label="Active Permits" value={permits.filter(p => p.status === 'active').length} icon={ClipboardCheck} /></div>
      <div className="col-span-12 lg:col-span-2"><KPICard label="Critical Alerts" value={criticalAlerts} icon={Siren} accent="text-critical" onClick={() => navigateToMap('z1')} /></div>
      <Card className="col-span-12 lg:col-span-5" hover onClick={() => navigateToMap('z1')}><CardHeader><CardTitle>Mini Plant Snapshot</CardTitle></CardHeader><CardContent><PlantMiniMap/></CardContent></Card>
      <Card className="col-span-12 lg:col-span-3" hover onClick={() => navigateToRisk('z1')}><CardHeader><CardTitle>AI Risk Summary</CardTitle></CardHeader><CardContent><RiskGauge value={riskPredictions.score} label="Risk Score" size={220}/><div className="mt-3 text-xs text-muted">Explosion probability <span className="text-critical">{riskPredictions.explosionProbability}%</span> in {riskPredictions.timeBeforeCritical}.</div></CardContent></Card>
      <Card className="col-span-12 lg:col-span-4"><CardHeader><CardTitle>Incident Timeline</CardTitle></CardHeader><CardContent className="space-y-2">{timelineEvents.slice(0,5).map(e => <button key={e.id} onClick={() => navigateToMap(e.targetId)} className="w-full text-left p-2 rounded-lg bg-bg border border-border hover:border-primary/40"><div className="text-xs font-medium">{e.title}</div><div className="text-[11px] text-muted">{e.time} ? {e.description}</div></button>)}</CardContent></Card>
      <Card className="col-span-12 lg:col-span-7"><CardHeader><CardTitle>Trend Analysis</CardTitle></CardHeader><CardContent className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time"/><YAxis/><Tooltip/><Line type="monotone" dataKey="risk" stroke="#3B82F6" strokeWidth={2}/><Line type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={2}/></LineChart></ResponsiveContainer></CardContent></Card>
      <Card className="col-span-12 lg:col-span-5"><CardHeader><CardTitle>AI Daily Safety Summary</CardTitle></CardHeader><CardContent><p className="text-sm text-muted leading-relaxed">{dailySummary}</p></CardContent></Card>
    </div>
  </div>
}

function MapPage() {
  const { selectedZoneId, setSelectedZone, navigateToRisk } = useApp()
  const selected = plantZones.find(z => z.id === selectedZoneId) ?? plantZones[0]
  return <div className="space-y-4"><PageTitle title="Live Plant Map" subtitle="Where exactly is the danger?"/><div className="grid-12">
    <Card className="col-span-12 lg:col-span-9"><CardHeader><CardTitle>Interactive Digital Twin</CardTitle></CardHeader><CardContent><div className="relative h-[520px] bg-bg border border-border rounded-lg">{plantZones.map(z => <button key={z.id} onClick={() => setSelectedZone(z.id)} className={`absolute rounded-lg border p-2 text-left ${selected.id===z.id?'border-primary bg-primary/10':'border-border bg-card/40 hover:border-primary/40'}`} style={{left:z.x, top:z.y, width:z.width, height:z.height}}><div className="text-xs font-medium">{z.name}</div><div className="text-[11px] text-muted mt-1 flex items-center gap-1"><StatusDot status={z.risk}/>{z.workers} workers ? {z.sensors} sensors</div></button>)}</div></CardContent></Card>
    <Card className="col-span-12 lg:col-span-3"><CardHeader><CardTitle>Zone Details</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p className="font-medium">{selected.name}</p><Badge variant="risk" level={selected.risk}>{selected.risk.toUpperCase()}</Badge><p className="text-muted text-xs">Current Sensor Values and AI Explanation available. Click to investigate risk.</p><button onClick={() => navigateToRisk(selected.id)} className="w-full h-9 rounded-lg bg-primary text-white text-xs font-medium">Open AI Risk Center</button></CardContent></Card>
    <Card className="col-span-12"><CardHeader><CardTitle>Live Event Feed</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-3 gap-2">{timelineEvents.slice(0,6).map(e => <div key={e.id} className="p-2 border border-border rounded-lg bg-bg"><div className="text-xs">{e.title}</div><div className="text-[11px] text-muted">{e.time}</div></div>)}</CardContent></Card>
  </div></div>
}

function RiskPage() {
  const { navigateToPermit, navigateToSensor, navigateToWorker } = useApp()
  return <div className="space-y-4"><PageTitle title="AI Risk Center" subtitle="Why is this happening?"/>
    <div className="grid-12">
      <Card className="col-span-12 lg:col-span-3"><CardHeader><CardTitle>Current Risk Gauge</CardTitle></CardHeader><CardContent><RiskGauge value={riskPredictions.score} label={`Confidence ${riskPredictions.confidence}%`} size={220}/></CardContent></Card>
      <Card className="col-span-12 lg:col-span-5"><CardHeader><CardTitle>Compound Risk Detection</CardTitle></CardHeader><CardContent className="space-y-2">{riskFactors.map(f => <div key={f.factor} className="p-2 rounded-lg border border-border bg-bg flex justify-between"><span className="text-sm">{f.factor}</span><Badge variant="risk" level={f.impact as any}>{f.value}</Badge></div>)}<div className="pt-2 text-xs text-muted">Gas ? + Workers Present + Permit Active + Ventilation Low ? Explosion Probability {riskPredictions.explosionProbability}% ? Time before critical {riskPredictions.timeBeforeCritical}.</div></CardContent></Card>
      <Card className="col-span-12 lg:col-span-4"><CardHeader><CardTitle>Recommended Actions</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><Action text="Increase ventilation to 80%"/><Action text="Evacuate non-essential workers"/><Action text="Suspend hot work permit PTW-001"/><Action text="Deploy emergency response team"/></CardContent></Card>
      <Card className="col-span-12"><CardHeader><CardTitle>Affected Resources</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-3 gap-2"><button onClick={() => navigateToSensor('s2')} className="p-3 border border-border rounded-lg text-left hover:border-primary/40">Sensor G-102<ChevronRight className="inline float-right" size={14}/></button><button onClick={() => navigateToWorker('w2')} className="p-3 border border-border rounded-lg text-left hover:border-primary/40">Worker Suresh Patel<ChevronRight className="inline float-right" size={14}/></button><button onClick={() => navigateToPermit('ptw-001')} className="p-3 border border-border rounded-lg text-left hover:border-primary/40">Permit PTW-001<ChevronRight className="inline float-right" size={14}/></button></CardContent></Card>
    </div>
  </div>
}

function SensorsPage() {
  const { selectedSensorId } = useApp()
  const [q, setQ] = useState('')
  const selected = sensors.find(s => s.id === selectedSensorId)
  const list = useMemo(() => sensors.filter(s => s.name.toLowerCase().includes(q.toLowerCase())), [q])
  return <div className="space-y-4"><PageTitle title="Sensor Monitor" subtitle="What are my sensors telling me?"/>
    <Card><CardContent className="pt-4"><SearchInput placeholder="Search sensors" value={q} onChange={setQ}/></CardContent></Card>
    <div className="grid-12">
      <Card className="col-span-12 lg:col-span-7"><CardHeader><CardTitle>Sensor Table</CardTitle></CardHeader><CardContent className="space-y-2">{list.map(s => <div key={s.id} className="p-2 border border-border rounded-lg bg-bg grid grid-cols-7 gap-2 text-xs"><span className="col-span-2">{s.name}</span><span>{s.zone}</span><span>{s.value} {s.unit}</span><span><Badge variant="status" level={s.status}>{s.status}</Badge></span><span>{s.equipment}</span><span>{s.threshold}</span></div>)}</CardContent></Card>
      <Card className="col-span-12 lg:col-span-5"><CardHeader><CardTitle>{selected ? `Sensor Detail ? ${selected.name}` : 'Equipment Health'}</CardTitle></CardHeader><CardContent className="h-72">{selected ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={selected.history}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time"/><YAxis/><Tooltip/><Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F655"/></AreaChart></ResponsiveContainer> : <p className="text-muted text-sm">Select a sensor from AI Risk Center for complete history and live trend.</p>}</CardContent></Card>
    </div></div>
}

function WorkersPage() {
  const { selectedWorkerId } = useApp()
  const selected = workers.find(w => w.id === selectedWorkerId)
  return <div className="space-y-4"><PageTitle title="Worker Monitor" subtitle="Which workers are currently at risk?"/>
    <div className="grid-12"><Card className="col-span-12 lg:col-span-7"><CardHeader><CardTitle>Worker Table</CardTitle></CardHeader><CardContent className="space-y-2">{workers.map(w => <div key={w.id} className="p-2 border border-border rounded-lg bg-bg grid grid-cols-8 gap-2 text-xs"><span>{w.name}</span><span>{w.zone}</span><span>{w.task}</span><span>{w.ppeStatus}</span><span>{w.permitId || '-'}</span><span>{w.nearbyHazard}</span><span><Badge variant="risk" level={w.risk}>{w.risk}</Badge></span><span>{w.lastSeen}</span></div>)}</CardContent></Card>
    <Card className="col-span-12 lg:col-span-5"><CardHeader><CardTitle>{selected ? `${selected.name} Details` : 'Worker Details'}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{selected ? <><p>Movement History: Blast Furnace ? Valve Bay ? Zone A1</p><p>Nearby Sensors: G-102, T-401</p><p>Nearby Equipment: Valve Assembly V-12</p><p>AI Risk: <Badge variant="risk" level={selected.risk}>{selected.risk}</Badge></p></> : <p className="text-muted">Click worker from AI Risk Center to inspect details.</p>}</CardContent></Card></div></div>
}

function PermitsPage() {
  const { selectedPermitId } = useApp()
  const selected = permits.find(p => p.id === selectedPermitId)
  return <div className="space-y-4"><PageTitle title="Active Permits" subtitle="Are permits creating additional risk?"/>
  <div className="grid-12"><Card className="col-span-12 lg:col-span-7"><CardHeader><CardTitle>Permit-to-Work</CardTitle></CardHeader><CardContent className="space-y-2">{permits.map(p => <div key={p.id} className="p-2 border border-border rounded-lg bg-bg text-xs grid grid-cols-7 gap-2"><span>{p.id}</span><span>{p.title}</span><span>{p.zone}</span><span><Badge variant="permit" level={p.status}>{p.status}</Badge></span><span>{p.compliance}%</span><span><Badge variant="risk" level={p.risk}>{p.risk}</Badge></span><span>{p.endTime}</span></div>)}</CardContent></Card>
  <Card className="col-span-12 lg:col-span-5"><CardHeader><CardTitle>{selected ? selected.id : 'Permit Details'}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{selected ? <><p>Assigned Workers: {selected.workers.join(', ')}</p><p>Equipment: {selected.equipment.join(', ')}</p><p>Compliance: {selected.compliance}%</p><p className="text-muted">AI Recommendation: {selected.aiRecommendation}</p></> : <p className="text-muted">Select permit from AI Risk Center.</p>}</CardContent></Card></div></div>
}

function TimelinePage() {
  const navigate = useNavigate()
  return <div className="space-y-4"><PageTitle title="Timeline" subtitle="What happened?"/>
    <Card><CardHeader><CardTitle>24-hour Operational Timeline</CardTitle></CardHeader><CardContent className="space-y-2">{timelineEvents.map(e => <button key={e.id} onClick={() => navigate(e.targetPage)} className="w-full p-2 rounded-lg border border-border bg-bg hover:border-primary/40 text-left"><div className="text-sm">{e.title}</div><div className="text-xs text-muted">{e.time} ? {e.description}</div></button>)}</CardContent></Card>
  </div>
}

function CompliancePage() {
  return <div className="space-y-4"><PageTitle title="Compliance Center" subtitle="Are we operating within safety regulations?"/>
    <div className="grid-12">
      <Card className="col-span-12 lg:col-span-3"><CardHeader><CardTitle>Compliance Score</CardTitle></CardHeader><CardContent><div className="text-4xl font-semibold">{complianceData.score}</div><Badge variant="risk" level="high">{complianceData.status}</Badge><p className="text-xs text-muted mt-2">Next Audit: {complianceData.nextAudit}</p></CardContent></Card>
      <Card className="col-span-12 lg:col-span-4"><CardHeader><CardTitle>Safety Checklist</CardTitle></CardHeader><CardContent className="space-y-1">{complianceData.checklist.map(c => <div key={c.item} className="flex items-center gap-2 text-sm"><StatusDot status={c.done ? 'online' : 'warning'}/>{c.item}</div>)}</CardContent></Card>
      <Card className="col-span-12 lg:col-span-5"><CardHeader><CardTitle>Active Violations</CardTitle></CardHeader><CardContent className="space-y-2">{violations.map(v => <div key={v.id} className="p-2 border border-border rounded-lg bg-bg"><div className="text-xs font-medium">{v.rule}</div><div className="text-[11px] text-muted">Evidence: {v.evidence}</div><div className="text-[11px] text-muted">Recommendation: {v.recommendation}</div></div>)}</CardContent></Card>
    </div>
  </div>
}

function ReportsPage() {
  const data = [
    { name: 'Daily Safety', value: 24 }, { name: 'Incident', value: 8 }, { name: 'Risk Analysis', value: 14 },
    { name: 'Compliance', value: 11 }, { name: 'Worker', value: 16 }, { name: 'Equipment', value: 12 },
  ]
  return <div className="space-y-4"><PageTitle title="Reports & Analytics" subtitle="What reports can I export?"/>
    <div className="grid-12">
      <Card className="col-span-12 lg:col-span-8"><CardHeader><CardTitle>Historical Analysis</CardTitle></CardHeader><CardContent className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={trendData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time"/><YAxis/><Tooltip/><Bar dataKey="risk" fill="#3B82F6"/><Bar dataKey="incidents" fill="#EF4444"/></BarChart></ResponsiveContainer></CardContent></Card>
      <Card className="col-span-12 lg:col-span-4"><CardHeader><CardTitle>Report Distribution</CardTitle></CardHeader><CardContent className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" outerRadius={90} label>{data.map((_,i)=><Cell key={i} fill={['#3B82F6','#22C55E','#F59E0B','#EF4444','#64748B','#38BDF8'][i%6]} />)}</Pie></PieChart></ResponsiveContainer><div className="grid grid-cols-3 gap-2 mt-2"><button className="h-8 rounded-lg bg-card border border-border text-xs">PDF</button><button className="h-8 rounded-lg bg-card border border-border text-xs">Excel</button><button className="h-8 rounded-lg bg-card border border-border text-xs">CSV</button></div></CardContent></Card>
    </div>
  </div>
}

function Copilot() {
  const { copilotOpen, setCopilotOpen } = useApp()
  return (
    <div className="fixed right-5 bottom-5 z-30">
      {copilotOpen && <Card className="w-80 mb-3"><CardHeader><CardTitle>AI Copilot</CardTitle></CardHeader><CardContent><p className="text-sm text-muted">I can summarize risks, recommend actions, and generate safety reports.</p><div className="mt-3 p-2 bg-bg border border-border rounded-lg text-xs">Top suggestion: Suspend PTW-001 and evacuate Blast Furnace non-essential workers.</div></CardContent></Card>}
      <button onClick={() => setCopilotOpen(!copilotOpen)} className="h-12 w-12 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center"><Bot size={20}/></button>
    </div>
  )
}

function PlantMiniMap() {
  return <div className="h-44 rounded-lg bg-bg border border-border p-2 grid grid-cols-4 gap-2">{plantZones.slice(0,8).map(z => <div key={z.id} className="rounded-md p-2 text-[10px] border border-border bg-card/50"><div className="font-medium">{z.name}</div><div className="text-muted">{z.workers}W ? {z.sensors}S</div><Badge variant="risk" level={z.risk} className="mt-1">{z.risk}</Badge></div>)}</div>
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  const location = useLocation()
  return <div className="flex items-end justify-between"><div><h1 className="text-xl font-semibold tracking-tight">{title}</h1><p className="text-sm text-muted">{subtitle}</p></div><div className="text-xs text-muted">{location.pathname.replace('/', '').toUpperCase()} ? LIVE</div></div>
}

function Action({ text }: { text: string }) {
  return <div className="flex items-center gap-2 p-2 rounded-lg bg-bg border border-border"><CheckCircle2 size={15} className="text-success"/><span>{text}</span></div>
}

export default App
