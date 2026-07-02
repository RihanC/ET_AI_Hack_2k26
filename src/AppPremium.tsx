import { useMemo, useState } from 'react'
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Factory,
  History,
  LayoutDashboard,
  MapPinned,
  Radar,
  Siren,
  ShieldCheck,
  Users,
} from 'lucide-react'
import {
  alerts,
  complianceData,
  dailySummary,
  permits,
  PLANT_NAME,
  plantZones,
  riskFactors,
  riskPredictions,
  sensors,
  timelineEvents,
  trendData,
  violations,
  workers,
} from './data/mockData'
import { AppProvider, useApp } from './context/AppContext'
import { Badge, StatusDot } from './components/ui/Badge'
import { Button } from './components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card'
import { KPICard } from './components/ui/KPICard'
import { RiskGauge } from './components/ui/Gauge'
import { SearchInput } from './components/ui/SearchInput'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type NavItem = { to: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }

const navItems: NavItem[] = [
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

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  const location = useLocation()
  return (
    <div className="flex items-end justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
      <div className="text-xs text-muted">{location.pathname.replace('/', '').toUpperCase()} • LIVE</div>
    </div>
  )
}

function ActionRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-bg border border-border">
      <CheckCircle2 size={15} className="text-success" />
      <span className="text-sm">{text}</span>
    </div>
  )
}

function Copilot() {
  const { copilotOpen, setCopilotOpen } = useApp()
  return (
    <div className="fixed right-5 bottom-5 z-30">
      {copilotOpen && (
        <Card className="w-88 mb-3">
          <CardHeader>
            <CardTitle>AI Copilot</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              Ask about risks, permits, or sensors. This pilot UI is powered by mock intelligence for now.
            </p>
            <div className="mt-3 p-2 bg-bg border border-border rounded-lg text-xs">
              Priority: {riskPredictions.explosionProbability}% explosion probability in {riskPredictions.timeBeforeCritical}.
            </div>
          </CardContent>
        </Card>
      )}
      <button
        onClick={() => setCopilotOpen(!copilotOpen)}
        className="h-12 w-12 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center"
        aria-label="Toggle AI Copilot"
      >
        <Bot size={20} />
      </button>
    </div>
  )
}

function TopHeader() {
  const [search, setSearch] = useState('')
  const [now] = useState(() => new Date())
  const criticalCount = alerts.filter(a => a.severity === 'critical').length

  return (
    <header className="h-16 border-b border-border px-6 flex items-center gap-4 sticky top-0 z-20 glass">
      <div className="flex items-center gap-2 min-w-[270px]">
        <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
          <Factory size={16} className="text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted">Industrial Safety Intelligence Platform</p>
          <p className="text-sm font-semibold">{PLANT_NAME}</p>
        </div>
      </div>

      <div className="flex-1 max-w-xl">
        <SearchInput
          placeholder="Search zone, sensor, worker, permit..."
          value={search}
          onChange={setSearch}
        />
      </div>

      <div className="flex items-center gap-3 ml-auto text-xs">
        <Badge>Shift B</Badge>
        <Badge>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Badge>
        <Badge variant="risk" level="high">
          Plant Health 78/100
        </Badge>
        <div className="flex items-center gap-2">
          <div className="h-8 px-3 rounded-lg border border-border bg-card text-muted flex items-center text-xs gap-2">
            <Siren size={14} />
            {criticalCount}
          </div>
          <button className="h-8 px-3 rounded-lg border border-border bg-card text-muted hover:text-text text-xs flex items-center gap-2">
            <History size={14} />
            History
          </button>
        </div>
      </div>
    </header>
  )
}

function LeftSidebar() {
  return (
    <aside className="w-64 border-r border-border p-3 space-y-1">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'text-muted hover:text-text hover:bg-card'
            }`
          }
        >
          <item.icon size={16} />
          {item.label}
        </NavLink>
      ))}
    </aside>
  )
}

function Shell() {
  return (
    <div className="h-full bg-bg text-text">
      <TopHeader />
      <div className="flex h-[calc(100%-64px)]">
        <LeftSidebar />
        <main className="flex-1 overflow-auto p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/map" element={<LivePlantMapPage />} />
            <Route path="/risk" element={<AIRiskCenterPage />} />
            <Route path="/sensors" element={<SensorMonitorPage />} />
            <Route path="/workers" element={<WorkerMonitorPage />} />
            <Route path="/permits" element={<ActivePermitsPage />} />
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

function MiniPlantSnapshot() {
  const { navigateToMap, navigateToRisk } = useApp()
  const topZones = plantZones.slice(0, 6)
  return (
    <div className="grid grid-cols-2 gap-2">
      {topZones.map(z => (
        <button
          key={z.id}
          onClick={() => navigateToMap(z.id)}
          className="rounded-lg p-2 border border-border bg-bg hover:border-primary/40 transition-colors text-left"
        >
          <div className="text-xs font-medium">{z.name}</div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-[11px] text-muted">
              {z.workers}W • {z.sensors}S
            </div>
            <Badge variant="risk" level={z.risk}>
              {z.risk.toUpperCase()}
            </Badge>
          </div>
        </button>
      ))}
      <div className="col-span-2 mt-1">
        <Button variant="primary" className="w-full" onClick={() => navigateToRisk(topZones[0]?.id ?? 'z1')}>
          Open AI Risk Center
        </Button>
      </div>
    </div>
  )
}

function DashboardPage() {
  const { navigateToMap, navigateToRisk } = useApp()
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length

  const sensorsOnline = sensors.filter(s => s.status === 'online' || s.status === 'warning').length
  const activePermits = permits.filter(p => p.status === 'active').length
  const activeWorkers = workers.length

  return (
    <div className="space-y-4 animate-fade-in">
      <PageTitle title="Dashboard" subtitle="Is my plant safe right now?" />

      <div className="grid-12">
        <div className="col-span-12 lg:col-span-3">
          <KPICard label="Plant Health" value="78/100" icon={ShieldCheck} trend="up" trendValue="+12" onClick={() => navigateToRisk('z1')} />
        </div>
        <div className="col-span-12 lg:col-span-3">
          <KPICard label="Current Risk" value="High" icon={AlertTriangle} trend="up" trendValue="Escalating" onClick={() => navigateToRisk('z1')} />
        </div>
        <div className="col-span-12 lg:col-span-3">
          <KPICard label="Active Workers" value={activeWorkers} icon={Users} onClick={() => navigateToMap('z1')} />
        </div>
        <div className="col-span-12 lg:col-span-3">
          <KPICard
            label="Sensors Online"
            value={`${sensorsOnline}/${sensors.length}`}
            icon={Activity}
          />
        </div>

        <div className="col-span-12 lg:col-span-3">
          <KPICard label="Active Permits" value={activePermits} icon={ClipboardCheck} />
        </div>
        <div className="col-span-12 lg:col-span-3">
          <KPICard
            label="Critical Alerts"
            value={criticalAlerts}
            icon={Siren}
            accent="text-critical"
            onClick={() => navigateToMap('z1')}
          />
        </div>

        <Card className="col-span-12 lg:col-span-5" hover onClick={() => navigateToMap('z1')}>
          <CardHeader>
            <CardTitle>Mini Plant Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniPlantSnapshot />
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-3" hover onClick={() => navigateToRisk('z1')}>
          <CardHeader>
            <CardTitle>AI Risk Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskGauge value={riskPredictions.score} label="Risk Score" size={220} />
            <div className="mt-3 text-xs text-muted">
              Explosion probability <span className="text-critical">{riskPredictions.explosionProbability}%</span> in{' '}
              {riskPredictions.timeBeforeCritical}.
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Incident Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {timelineEvents.slice(0, 5).map(e => (
              <button
                key={e.id}
                onClick={() => navigateToMap(e.targetId)}
                className="w-full text-left p-2 rounded-lg bg-bg border border-border hover:border-primary/40 transition-colors"
              >
                <div className="text-xs font-medium">{e.title}</div>
                <div className="text-[11px] text-muted">
                  {e.time} • {e.description}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-7">
          <CardHeader>
            <CardTitle>Trend Analysis</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="risk" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-12 lg:col-span-5">
          <CardHeader>
            <CardTitle>AI Daily Safety Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted leading-relaxed">{dailySummary}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LivePlantMapPage() {
  const {
    selectedZoneId,
    selectedSensorId,
    selectedWorkerId,
    selectedPermitId,
    setSelectedZone,
    setSelectedSensor,
    setSelectedWorker,
    setSelectedPermit,
    mapLayers,
    toggleMapLayer,
    navigateToRisk,
    navigateToSensor,
    navigateToWorker,
    navigateToPermit,
  } = useApp()

  const selectedZone = plantZones.find(z => z.id === selectedZoneId) ?? plantZones[0]

  const zoneSensors = sensors.filter(s => s.zoneId === selectedZone.id)
  const zoneWorkers = workers.filter(w => w.zoneId === selectedZone.id)
  const zonePermits = permits.filter(p => p.zoneId === selectedZone.id)

  const selectedSensor = selectedSensorId ? sensors.find(s => s.id === selectedSensorId) : undefined
  const selectedWorker = selectedWorkerId ? workers.find(w => w.id === selectedWorkerId) : undefined
  const selectedPermit = selectedPermitId ? permits.find(p => p.id === selectedPermitId) : undefined

  const showAllSensorTypes = mapLayers.sensors && !mapLayers.temperature && !mapLayers.gas && !mapLayers.pressure

  const selectZone = (zoneId: string) => {
    setSelectedZone(zoneId)
    setSelectedSensor(null)
    setSelectedWorker(null)
    setSelectedPermit(null)
  }

  const selectSensor = (sensorId: string) => {
    const s = sensors.find(x => x.id === sensorId)
    if (!s) return
    setSelectedZone(s.zoneId)
    setSelectedSensor(sensorId)
    setSelectedWorker(null)
    setSelectedPermit(null)
  }

  const selectWorker = (workerId: string) => {
    const w = workers.find(x => x.id === workerId)
    if (!w) return
    setSelectedZone(w.zoneId)
    setSelectedWorker(workerId)
    setSelectedSensor(null)
    setSelectedPermit(null)
  }

  const selectPermit = (permitId: string) => {
    const p = permits.find(x => x.id === permitId)
    if (!p) return
    setSelectedZone(p.zoneId)
    setSelectedPermit(permitId)
    setSelectedSensor(null)
    setSelectedWorker(null)
  }

  const layers = [
    { key: 'workers', label: 'Workers' },
    { key: 'sensors', label: 'Sensors' },
    { key: 'temperature', label: 'Temperature' },
    { key: 'gas', label: 'Gas' },
    { key: 'pressure', label: 'Pressure' },
    { key: 'permits', label: 'Permits' },
    { key: 'equipment', label: 'Equipment' },
    { key: 'cctv', label: 'CCTV' },
  ] as const

  return (
    <div className="space-y-4 animate-fade-in">
      <PageTitle title="Live Plant Map" subtitle="Where exactly is the danger?" />

      <div className="grid-12">
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Interactive Digital Twin</CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="inline-flex items-center gap-2">
                <StatusDot status={selectedZone.risk} />
                Risk: <span className="text-text">{selectedZone.risk.toUpperCase()}</span>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-[520px] overflow-hidden rounded-lg border border-border bg-bg">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(31,41,55,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(31,41,55,0.35) 1px, transparent 1px)',
                  backgroundSize: '36px 36px',
                }}
              />

              <div className="relative w-[720px] h-[520px] mx-auto">
                {plantZones.map(z => {
                  const riskStyle =
                    z.risk === 'critical'
                      ? 'border-critical bg-critical/10'
                      : z.risk === 'high'
                        ? 'border-orange-500/60 bg-orange-500/10'
                        : z.risk === 'medium'
                          ? 'border-warning/60 bg-warning/10'
                          : 'border-success/50 bg-success/10'

                  const isSelected = selectedZone.id === z.id

                  return (
                    <button
                      key={z.id}
                      onClick={() => {
                        selectZone(z.id)
                        navigateToRisk(z.id)
                      }}
                      className={`absolute rounded-lg border p-2 text-left transition-colors ${
                        isSelected ? 'border-primary/60 bg-primary/10' : riskStyle
                      } hover:border-primary/60`}
                      style={{ left: z.x, top: z.y, width: z.width, height: z.height }}
                      aria-label={`Open AI risk center for ${z.name}`}
                    >
                      <div className="text-xs font-medium truncate">{z.name}</div>
                      <div className="text-[11px] text-muted mt-1 flex items-center gap-1">
                        <StatusDot status={z.risk} />
                        {z.workers}W • {z.sensors}S
                      </div>
                    </button>
                  )
                })}

                {mapLayers.workers &&
                  zoneWorkers.map((w, i) => {
                    const z = selectedZone
                    const col = i % 4
                    const row = Math.floor(i / 4)
                    const left = z.x + 14 + col * 34
                    const top = z.y + 34 + row * 26
                    return (
                      <button
                        key={w.id}
                        onClick={() => selectWorker(w.id)}
                        className="absolute rounded-md p-1.5 border border-border bg-card/60 hover:border-primary/50 transition-colors"
                        style={{ left, top }}
                        aria-label={`Select worker ${w.name}`}
                      >
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-primary" />
                        </div>
                      </button>
                    )
                  })}

                {mapLayers.permits &&
                  zonePermits.map((p, i) => {
                    const col = i % 3
                    const left = selectedZone.x + 16 + col * 60
                    const top = selectedZone.y + 16 + (i >= 3 ? 44 : 0)
                    return (
                      <button
                        key={p.id}
                        onClick={() => selectPermit(p.id)}
                        className="absolute rounded-md p-1.5 border border-border bg-card/70 hover:border-primary/50 transition-colors"
                        style={{ left, top }}
                        aria-label={`Select permit ${p.title}`}
                      >
                        <ClipboardCheck size={14} className="text-warning" />
                      </button>
                    )
                  })}

                {mapLayers.sensors && (
                  <>
                    {zoneSensors
                      .filter(s => {
                        if (showAllSensorTypes) return true
                        if (mapLayers.temperature && s.type === 'temperature') return true
                        if (mapLayers.gas && s.type === 'gas') return true
                        if (mapLayers.pressure && s.type === 'pressure') return true
                        return false
                      })
                      .map((s, i) => {
                        const col = i % 4
                        const row = Math.floor(i / 4)
                        const left = selectedZone.x + 18 + col * 28
                        const top = selectedZone.y + 48 + row * 22
                        return (
                          <button
                            key={s.id}
                            onClick={() => selectSensor(s.id)}
                            className="absolute rounded-full border border-border bg-bg/70 hover:border-primary/50 transition-colors"
                            style={{ left, top }}
                            aria-label={`Select sensor ${s.name}`}
                          >
                            <span
                              className={`block w-4 h-4 rounded-full ${
                                s.status === 'critical'
                                  ? 'bg-critical'
                                  : s.status === 'warning'
                                    ? 'bg-warning'
                                    : s.status === 'offline'
                                      ? 'bg-muted'
                                      : 'bg-success'
                              }`}
                            />
                          </button>
                        )
                      })}
                  </>
                )}

                {mapLayers.equipment &&
                  plantZones
                    .filter(z => z.type !== 'exit')
                    .map(z => {
                      const left = z.x + Math.max(6, Math.floor(z.width / 2) - 7)
                      const top = z.y + Math.max(6, Math.floor(z.height / 2) - 8)
                      return (
                        <button
                          key={`${z.id}-equip`}
                          onClick={() => selectZone(z.id)}
                          className="absolute rounded-md p-1.5 border border-border bg-card/50 hover:border-primary/50 transition-colors"
                          style={{ left, top }}
                          aria-label={`Select equipment in ${z.name}`}
                        >
                          <Factory size={14} className="text-muted" />
                        </button>
                      )
                    })}

                {mapLayers.cctv &&
                  plantZones
                    .filter(z => z.type === 'exit')
                    .map(z => {
                      const left = z.x + z.width / 2 - 8
                      const top = z.y + 8
                      return (
                        <button
                          key={`${z.id}-cctv`}
                          onClick={() => selectZone(z.id)}
                          className="absolute rounded-md p-1.5 border border-border bg-card/50 hover:border-primary/50 transition-colors"
                          style={{ left, top }}
                          aria-label="Select emergency exit"
                        >
                          <MapPinned size={14} className="text-primary" />
                        </button>
                      )
                    })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>{selectedSensor ? 'Sensor Details' : selectedWorker ? 'Worker Details' : selectedPermit ? 'Permit Details' : 'Zone Details'}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            {!selectedSensor && !selectedWorker && !selectedPermit && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{selectedZone.name}</div>
                    <div className="text-xs text-muted mt-1">
                      {zoneWorkers.length} workers • {zoneSensors.length} sensors • {zonePermits.length} permits
                    </div>
                  </div>
                  <Badge variant="risk" level={selectedZone.risk}>
                    {selectedZone.risk.toUpperCase()}
                  </Badge>
                </div>

                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="text-xs text-muted mb-2">Current Sensor Values</div>
                  <div className="space-y-2">
                    {zoneSensors.slice(0, 4).map(s => (
                      <div key={s.id} className="flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{s.name}</div>
                          <div className="text-muted">{s.value} {s.unit}</div>
                        </div>
                        <Badge variant="status" level={s.status}>
                          {s.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="text-xs text-muted mb-2">AI Explanation (Condensed)</div>
                  <div className="text-sm leading-relaxed">
                    Compound risk signals detected in <span className="text-text font-medium">{selectedZone.name}</span>. AI estimates a{' '}
                    <span className="text-critical font-medium">{riskPredictions.explosionProbability}%</span> probability of escalation within{' '}
                    <span className="text-text font-medium">{riskPredictions.timeBeforeCritical}</span> given current sensor drift and permit activity.
                  </div>
                </div>
              </>
            )}

            {selectedSensor && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{selectedSensor.name}</div>
                    <div className="text-xs text-muted mt-1">
                      {selectedSensor.zone} • {selectedSensor.equipment}
                    </div>
                  </div>
                  <Badge variant="status" level={selectedSensor.status}>
                    {selectedSensor.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="text-xs text-muted">Current reading</div>
                  <div className="text-2xl font-semibold mt-1">
                    {selectedSensor.value} {selectedSensor.unit}
                  </div>
                  <div className="text-xs text-muted mt-2">
                    Threshold: {selectedSensor.threshold} {selectedSensor.unit}
                  </div>
                </div>

                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="text-xs text-muted mb-2">AI Interpretation</div>
                  <div className="text-sm leading-relaxed">
                    This sensor indicates{" "}
                    <span className="text-warning font-medium">{selectedSensor.type.toUpperCase()}</span>{" "}
                    movement beyond normal bands. Combined with nearby workers and active permits, the AI raises the zone risk score.
                  </div>
                </div>
              </>
            )}

            {selectedWorker && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{selectedWorker.name}</div>
                    <div className="text-xs text-muted mt-1">{selectedWorker.role}</div>
                  </div>
                  <Badge variant="risk" level={selectedWorker.risk}>
                    {selectedWorker.risk.toUpperCase()}
                  </Badge>
                </div>

                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="text-xs text-muted">Current task</div>
                  <div className="text-sm mt-1 font-medium">{selectedWorker.task}</div>
                  <div className="text-xs text-muted mt-2">PPE: {selectedWorker.ppeStatus}</div>
                  <div className="text-xs text-muted mt-1">
                    Assigned permit: {selectedWorker.permitId ?? '-'}
                  </div>
                </div>

                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="text-xs text-muted mb-2">Nearby hazard (AI)</div>
                  <div className="text-sm leading-relaxed">{selectedWorker.nearbyHazard}</div>
                </div>
              </>
            )}

            {selectedPermit && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{selectedPermit.title}</div>
                    <div className="text-xs text-muted mt-1">{selectedPermit.id} • {selectedPermit.type}</div>
                  </div>
                  <Badge variant="permit" level={selectedPermit.status}>
                    {selectedPermit.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="text-xs text-muted">Risk & compliance</div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Badge variant="risk" level={selectedPermit.risk}>
                      {selectedPermit.risk.toUpperCase()}
                    </Badge>
                    <div className="text-sm font-semibold">{selectedPermit.compliance}%</div>
                  </div>
                </div>

                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="text-xs text-muted mb-2">AI Recommendation</div>
                  <div className="text-sm leading-relaxed">{selectedPermit.aiRecommendation}</div>
                </div>
              </>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <Button variant="primary" onClick={() => navigateToRisk(selectedZone.id)}>
                Open AI Risk Center
              </Button>
              {selectedSensor && (
                <Button variant="secondary" onClick={() => navigateToSensor(selectedSensor.id)}>
                  Open Sensor Monitor
                </Button>
              )}
              {selectedWorker && (
                <Button variant="secondary" onClick={() => navigateToWorker(selectedWorker.id)}>
                  Open Worker Monitor
                </Button>
              )}
              {selectedPermit && (
                <Button variant="secondary" onClick={() => navigateToPermit(selectedPermit.id)}>
                  Open Permit Details
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-8">
          <CardHeader>
            <CardTitle>Live Event Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timelineEvents.slice(0, 8).map(e => (
                <div
                  key={e.id}
                  className="p-2 border border-border rounded-lg bg-bg/60 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{e.title}</div>
                    <div className="text-[11px] text-muted mt-1 truncate">
                      {e.time} • {e.description}
                    </div>
                  </div>
                  <Badge variant="risk" level={e.severity}>
                    {e.severity.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Layer Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {layers.map(l => (
              <button
                key={l.key}
                onClick={() => toggleMapLayer(l.key)}
                className={`w-full h-10 rounded-lg border transition-colors text-left px-3 flex items-center justify-between ${
                  mapLayers[l.key] ? 'border-primary/50 bg-primary/10' : 'border-border bg-bg hover:border-primary/30'
                }`}
              >
                <span className="text-sm">{l.label}</span>
                <Badge>{mapLayers[l.key] ? 'ON' : 'OFF'}</Badge>
              </button>
            ))}

            <div className="pt-2 text-xs text-muted leading-relaxed">
              Tip: click sensors, workers, or permits for side-panel details. Clicking risk zones routes you directly into AI risk reasoning.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AIRiskCenterPage() {
  const { navigateToSensor, navigateToWorker, navigateToPermit } = useApp()
  const [ventilationBoost, setVentilationBoost] = useState(20)
  const [evacuationLevel, setEvacuationLevel] = useState(30)

  const simulatedProbability = Math.max(
    5,
    Math.round(
      riskPredictions.explosionProbability -
        ventilationBoost * 0.35 -
        evacuationLevel * 0.18 +
        0
    )
  )

  const timeBeforeCriticalMinutes = Math.max(3, Math.round((riskPredictions.timeBeforeCritical.includes('min')
    ? parseInt(riskPredictions.timeBeforeCritical, 10)
    : 18) +
    ventilationBoost * 0.12 +
    evacuationLevel * 0.08))

  return (
    <div className="space-y-4 animate-fade-in">
      <PageTitle title="AI Risk Center" subtitle="Why is this happening?" />

      <div className="grid-12">
        <Card className="col-span-12 lg:col-span-3">
          <CardHeader>
            <CardTitle>Current Risk Gauge</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskGauge
              value={riskPredictions.score}
              label={`Confidence ${riskPredictions.confidence}%`}
              size={220}
            />
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Prediction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-2 border border-border rounded-lg bg-bg/60">
              <div className="text-xs text-muted">Explosion Probability</div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <div className="text-4xl font-semibold tracking-tight">{simulatedProbability}%</div>
                <Badge variant="risk" level={simulatedProbability >= 60 ? 'critical' : simulatedProbability >= 35 ? 'high' : 'medium'}>
                  {simulatedProbability >= 60 ? 'CRITICAL' : simulatedProbability >= 35 ? 'ELEVATED' : 'WATCH'}
                </Badge>
              </div>
              <div className="text-xs text-muted mt-2">Time before critical escalation (simulated): {timeBeforeCriticalMinutes} min</div>
            </div>

            <div className="p-2 border border-border rounded-lg bg-bg/60">
              <div className="text-xs text-muted mb-2">What-if Simulation</div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted mb-1">
                    <span>Ventilation increase</span>
                    <span className="text-text font-medium">{ventilationBoost}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    value={ventilationBoost}
                    onChange={e => setVentilationBoost(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-muted mb-1">
                    <span>Non-essential evacuation</span>
                    <span className="text-text font-medium">{evacuationLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    value={evacuationLevel}
                    onChange={e => setEvacuationLevel(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="text-[11px] text-muted mt-1">
                Simulation is simplified for this prototype UI.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-5">
          <CardHeader>
            <CardTitle>Risk Breakdown + AI Explanation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {riskFactors.map(f => (
                <div key={f.factor} className="flex items-center justify-between gap-3 p-2 rounded-lg border border-border bg-bg/60">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{f.factor}</div>
                    <div className="text-xs text-muted mt-1">{f.value}</div>
                  </div>
                  <Badge variant="risk" level={f.impact === 'critical' ? 'critical' : f.impact === 'high' ? 'high' : f.impact === 'medium' ? 'medium' : 'low'}>
                    {f.impact.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="p-2 border border-border rounded-lg bg-bg/60">
              <div className="text-xs text-muted mb-2">AI Explanation</div>
              <div className="text-sm leading-relaxed">
                AI detects a compound pattern: <span className="text-text font-medium">high hazard signals</span> +{' '}
                <span className="text-text font-medium">active personnel exposure</span> + <span className="text-text font-medium">permit-to-work activity</span>. The model weighs sensor drift, spatial proximity, and operational time windows to determine whether escalation is likely.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-7">
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ActionRow text="Increase ventilation to 80% (prioritize gas dilution)" />
            <ActionRow text="Evacuate non-essential personnel from high-risk zones" />
            <ActionRow text="Pause hot work / high-energy operations until risk stabilizes" />
            <ActionRow text="Deploy emergency response team with ready rescue procedures" />
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-5">
          <CardHeader>
            <CardTitle>Affected Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => navigateToSensor('s2')}
              className="w-full text-left p-3 border border-border rounded-lg hover:border-primary/40 transition-colors flex items-center justify-between"
            >
              <span className="text-sm font-medium">Sensor • G-102</span>
              <ChevronRight size={16} className="text-muted" />
            </button>
            <button
              onClick={() => navigateToWorker('w2')}
              className="w-full text-left p-3 border border-border rounded-lg hover:border-primary/40 transition-colors flex items-center justify-between"
            >
              <span className="text-sm font-medium">Worker • Suresh Patel</span>
              <ChevronRight size={16} className="text-muted" />
            </button>
            <button
              onClick={() => navigateToPermit('ptw-001')}
              className="w-full text-left p-3 border border-border rounded-lg hover:border-primary/40 transition-colors flex items-center justify-between"
            >
              <span className="text-sm font-medium">Permit • PTW-001</span>
              <ChevronRight size={16} className="text-muted" />
            </button>
            <div className="pt-2 text-xs text-muted leading-relaxed">
              Click any resource to deep-dive: sensors show history, workers show movement context, permits show compliance and operational risk.
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12">
          <CardHeader>
            <CardTitle>Timeline (AI + Operational Context)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {timelineEvents
              .filter(e => e.type === 'ai' || e.type === 'sensor')
              .slice(0, 7)
              .map(e => (
                <div key={e.id} className="p-2 rounded-lg border border-border bg-bg/60 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{e.title}</div>
                    <div className="text-[11px] text-muted mt-1 truncate">
                      {e.time} • {e.description}
                    </div>
                  </div>
                  <Badge variant="risk" level={e.severity}>
                    {e.severity.toUpperCase()}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SensorMonitorPage() {
  const { selectedSensorId } = useApp()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'warning' | 'critical' | 'offline'>('all')

  const selected = selectedSensorId ? sensors.find(s => s.id === selectedSensorId) : undefined

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return sensors
      .filter(s => (query ? s.name.toLowerCase().includes(query) || s.zone.toLowerCase().includes(query) : true))
      .filter(s => (statusFilter === 'all' ? true : s.status === statusFilter))
  }, [q, statusFilter])

  const sensorCounts = {
    online: sensors.filter(s => s.status === 'online').length,
    warning: sensors.filter(s => s.status === 'warning').length,
    critical: sensors.filter(s => s.status === 'critical').length,
    offline: sensors.filter(s => s.status === 'offline').length,
  }

  const equipmentSummary = useMemo(() => {
    const byEq = new Map<string, { equipment: string; online: number; warning: number; critical: number }>()
    sensors.forEach(s => {
      const existing = byEq.get(s.equipment) ?? { equipment: s.equipment, online: 0, warning: 0, critical: 0 }
      if (s.status === 'online') existing.online++
      if (s.status === 'warning') existing.warning++
      if (s.status === 'critical') existing.critical++
      byEq.set(s.equipment, existing)
    })
    return Array.from(byEq.values()).sort((a, b) => b.critical - a.critical).slice(0, 6)
  }, [])

  return (
    <div className="space-y-4 animate-fade-in">
      <PageTitle title="Sensor Monitor" subtitle="What are my sensors telling me?" />

      <div className="grid-12">
        <Card className="col-span-12 lg:col-span-7">
          <CardHeader>
            <CardTitle>Sensor Table</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SearchInput placeholder="Search sensors by name or zone..." value={q} onChange={setQ} />

            <div className="flex gap-2 flex-wrap">
              {(
                [
                  ['all', 'All'],
                  ['online', 'Online'],
                  ['warning', 'Warning'],
                  ['critical', 'Critical'],
                  ['offline', 'Offline'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`h-9 px-3 rounded-lg border text-xs transition-colors ${
                    statusFilter === key
                      ? 'border-primary/50 bg-primary/10 text-text'
                      : 'border-border bg-bg/60 text-muted hover:border-primary/30 hover:text-text'
                  }`}
                >
                  {label}
                  {key !== 'all' && (
                    <span className="ml-2 text-[10px] text-muted">
                      {key === 'online'
                        ? sensorCounts.online
                        : key === 'warning'
                          ? sensorCounts.warning
                          : key === 'critical'
                            ? sensorCounts.critical
                            : sensorCounts.offline}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filtered.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    // Selecting happens via AI Risk Center navigation in this prototype.
                    // Keeping this row click for future wiring.
                  }}
                  className="w-full text-left p-2 rounded-lg border border-border bg-bg/60 hover:border-primary/40 transition-colors"
                >
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4 min-w-0">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="text-[11px] text-muted truncate">{s.zone}</div>
                    </div>
                    <div className="col-span-2 text-sm font-semibold">
                      {s.value} {s.unit}
                    </div>
                    <div className="col-span-2">
                      <Badge variant="status" level={s.status}>
                        {s.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="col-span-3 text-[11px] text-muted truncate">
                      {s.equipment}
                    </div>
                    <div className="col-span-1 text-[11px] text-muted">{s.threshold}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-5">
          <CardHeader>
            <CardTitle>{selected ? `Complete History • ${selected.name}` : 'Equipment Health'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <>
                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-muted">{selected.zone}</div>
                      <div className="text-sm font-medium mt-1">{selected.equipment}</div>
                    </div>
                    <Badge variant="status" level={selected.status}>
                      {selected.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-2xl font-semibold mt-3">
                    {selected.value} {selected.unit}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Threshold: {selected.threshold} {selected.unit}
                  </div>
                </div>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selected.history}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F655" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-xs text-muted leading-relaxed">
                  Related equipment and risk context come from the AI Risk Center selection.
                </div>
              </>
            ) : (
              <>
                {equipmentSummary.map(eq => (
                  <div key={eq.equipment} className="p-2 border border-border rounded-lg bg-bg/60 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{eq.equipment}</div>
                      <div className="text-[11px] text-muted mt-1">
                        Online: {eq.online} • Warning: {eq.warning}
                      </div>
                    </div>
                    <Badge variant="risk" level={eq.critical > 0 ? 'critical' : eq.warning > 0 ? 'high' : 'low'}>
                      Critical: {eq.critical}
                    </Badge>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function WorkerMonitorPage() {
  const { selectedWorkerId } = useApp()
  const selected = selectedWorkerId ? workers.find(w => w.id === selectedWorkerId) : undefined

  const selectedSensors = selected ? sensors.filter(s => s.zoneId === selected.zoneId) : []

  return (
    <div className="space-y-4 animate-fade-in">
      <PageTitle title="Worker Monitor" subtitle="Which workers are currently at risk?" />

      <div className="grid-12">
        <Card className="col-span-12 lg:col-span-7">
          <CardHeader>
            <CardTitle>Worker Table</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted mb-1">Click a worker from AI Risk Center to open movement and hazard context.</div>
            {workers.map(w => (
              <div key={w.id} className="p-2 border border-border rounded-lg bg-bg/60 grid grid-cols-12 gap-2 text-[11px] items-center">
                <div className="col-span-2 font-medium text-sm">{w.name}</div>
                <div className="col-span-2 text-muted">{w.zone}</div>
                <div className="col-span-2 truncate">{w.task}</div>
                <div className="col-span-2">{w.ppeStatus}</div>
                <div className="col-span-2">{w.permitId ?? '-'}</div>
                <div className="col-span-2 truncate">{w.nearbyHazard}</div>
                <div className="col-span-1">
                  <Badge variant="risk" level={w.risk}>
                    {w.risk.toUpperCase()}
                  </Badge>
                </div>
                <div className="col-span-1 text-muted">{w.lastSeen}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-5">
          <CardHeader>
            <CardTitle>{selected ? 'Worker Details' : 'Select a Worker'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <>
                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{selected.name}</div>
                      <div className="text-xs text-muted mt-1">{selected.role}</div>
                    </div>
                    <Badge variant="risk" level={selected.risk}>
                      {selected.risk.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted mt-3">
                    Current Zone: <span className="text-text font-medium">{selected.zone}</span>
                  </div>
                </div>

                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="text-xs text-muted mb-2">Movement History</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="text-text font-medium">•</span> {selected.zone} observation window
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="text-text font-medium">•</span> Assigned permit active time window
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="text-text font-medium">•</span> Nearby hazard exposure correlation
                    </div>
                  </div>
                </div>

                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="text-xs text-muted mb-2">Nearby Sensors</div>
                  <div className="space-y-2">
                    {selectedSensors.slice(0, 4).map(s => (
                      <div key={s.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">{s.name}</div>
                          <div className="text-[11px] text-muted">
                            {s.value} {s.unit}
                          </div>
                        </div>
                        <Badge variant="status" level={s.status}>
                          {s.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="text-xs text-muted mb-2">AI Risk</div>
                  <div className="text-sm leading-relaxed">{selected.nearbyHazard}. AI prioritizes containment and PPE correction before re-entry.</div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted leading-relaxed">
                Use AI Risk Center to select a worker. This view will populate movement context, nearby sensors, and AI risk explanation.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ActivePermitsPage() {
  const { selectedPermitId } = useApp()
  const [tab, setTab] = useState<'active' | 'pending' | 'expired'>('active')

  const selected = selectedPermitId ? permits.find(p => p.id === selectedPermitId) : undefined

  const filtered = permits.filter(p => p.status === tab)

  return (
    <div className="space-y-4 animate-fade-in">
      <PageTitle title="Active Permits" subtitle="Are permits creating additional risk?" />

      <div className="grid-12">
        <Card className="col-span-12 lg:col-span-7">
          <CardHeader>
            <CardTitle>Permit-to-Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {(
                [
                  ['active', 'Active'],
                  ['pending', 'Pending Approval'],
                  ['expired', 'Expired'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`h-9 px-3 rounded-lg border text-xs transition-colors ${
                    tab === key ? 'border-primary/50 bg-primary/10 text-text' : 'border-border bg-bg/60 text-muted hover:border-primary/30 hover:text-text'
                  }`}
                >
                  {label}
                  <span className="ml-2 text-[10px] text-muted">{permits.filter(p => p.status === key).length}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filtered.map(p => (
                <div
                  key={p.id}
                  className="p-2 border border-border rounded-lg bg-bg/60 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.title}</div>
                    <div className="text-[11px] text-muted mt-1 truncate">
                      {p.id} • {p.zone} • {p.type}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="permit" level={p.status}>
                      {p.status.toUpperCase()}
                    </Badge>
                    <Badge variant="risk" level={p.risk}>
                      {p.risk.toUpperCase()}
                    </Badge>
                    <div className="text-sm font-semibold">{p.compliance}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-5">
          <CardHeader>
            <CardTitle>{selected ? 'Permit Details' : 'Select a Permit from AI Risk Center'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <>
                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="text-sm font-semibold">{selected.title}</div>
                  <div className="text-xs text-muted mt-1">
                    Zone: {selected.zone} • Equipment: {selected.equipment.join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="permit" level={selected.status}>
                    {selected.status.toUpperCase()}
                  </Badge>
                  <Badge variant="risk" level={selected.risk}>
                    {selected.risk.toUpperCase()}
                  </Badge>
                  <Badge>Compliance {selected.compliance}%</Badge>
                </div>

                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="text-xs text-muted mb-2">Assigned Workers</div>
                  <div className="text-sm">{selected.workers.join(', ')}</div>
                </div>

                <div className="p-2 border border-border rounded-lg bg-bg/60">
                  <div className="text-xs text-muted mb-2">AI Recommendation</div>
                  <div className="text-sm leading-relaxed">{selected.aiRecommendation}</div>
                </div>

                <div className="text-xs text-muted leading-relaxed">
                  Time window: {selected.startTime} - {selected.endTime}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted leading-relaxed">
                AI Risk Center selections will populate permit compliance, assigned workers, equipment, and AI recommendations here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TimelinePage() {
  const navigate = useNavigate()
  const { navigateToMap, navigateToRisk, navigateToSensor, navigateToWorker, navigateToPermit } = useApp()

  const [typeFilter, setTypeFilter] = useState<'all' | 'sensor' | 'worker' | 'permit' | 'equipment' | 'ai'>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return timelineEvents
      .filter(e => (typeFilter === 'all' ? true : e.type === typeFilter))
      .filter(e => (q ? e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) : true))
  }, [typeFilter, query])

  return (
    <div className="space-y-4 animate-fade-in">
      <PageTitle title="Timeline" subtitle="What happened?" />

      <div className="grid-12">
        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SearchInput placeholder="Search events..." value={query} onChange={setQuery} />

            <div className="space-y-2">
              {(
                [
                  ['all', 'All'],
                  ['sensor', 'Sensor Events'],
                  ['worker', 'Worker Events'],
                  ['permit', 'Permit Events'],
                  ['equipment', 'Equipment Events'],
                  ['ai', 'AI Events'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={`w-full h-10 rounded-lg border text-sm transition-colors text-left px-3 ${
                    typeFilter === key ? 'border-primary/50 bg-primary/10 text-text' : 'border-border bg-bg/60 text-muted hover:border-primary/30 hover:text-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-8">
          <CardHeader>
            <CardTitle>24-hour Operational Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.map(e => (
              <button
                key={e.id}
                onClick={() => {
                  if (e.targetPage === '/map') navigateToMap(e.targetId)
                  else if (e.targetPage === '/risk') navigateToRisk(e.targetId ?? 'z1')
                  else if (e.targetPage === '/sensors') navigateToSensor(e.targetId ?? 's1')
                  else if (e.targetPage === '/workers') navigateToWorker(e.targetId ?? 'w1')
                  else if (e.targetPage === '/permits') navigateToPermit(e.targetId ?? 'ptw-001')
                  else navigate(e.targetPage)
                }}
                className="w-full text-left p-3 rounded-lg border border-border bg-bg/60 hover:border-primary/40 transition-colors flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{e.title}</div>
                  <div className="text-[11px] text-muted mt-1 truncate">
                    {e.time} • {e.description}
                  </div>
                </div>
                <Badge variant="risk" level={e.severity}>
                  {e.severity.toUpperCase()}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CompliancePage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <PageTitle title="Compliance Center" subtitle="Are we operating within safety regulations?" />

      <div className="grid-12">
        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold tracking-tight">{complianceData.score}</div>
            <div className="mt-2">
              <Badge variant="risk" level="high">
                {complianceData.status}
              </Badge>
            </div>
            <p className="text-xs text-muted mt-3">Next Audit: {complianceData.nextAudit}</p>
            <div className="mt-3 text-xs text-muted leading-relaxed">
              AI Compliance Summary: The model flags procedural gaps where sensor monitoring, permit validity, and pressure vessel actions are not fully documented.
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Safety Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {complianceData.checklist.map(c => (
              <div key={c.item} className="flex items-center gap-2 text-sm">
                <StatusDot status={c.done ? 'online' : 'warning'} />
                <span className={c.done ? '' : 'text-warning/80'}>{c.item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Active Violations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {violations.map(v => (
              <div key={v.id} className="p-2 border border-border rounded-lg bg-bg/60">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold">{v.rule}</div>
                  <Badge variant="risk" level={v.severity}>
                    {v.severity.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-[11px] text-muted mt-2">Evidence: {v.evidence}</div>
                <div className="text-[11px] text-muted mt-2">Recommendation: {v.recommendation}</div>
                <div className="text-[11px] text-muted mt-2">Zone: {v.zone}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ReportsPage() {
  const [active, setActive] = useState<'daily' | 'incident' | 'risk' | 'compliance' | 'workers' | 'equipment'>('daily')

  const distribution = useMemo(() => {
    const base = [
      { name: 'Daily Safety', value: 24 },
      { name: 'Incident', value: 8 },
      { name: 'Risk Analysis', value: 14 },
      { name: 'Compliance', value: 11 },
      { name: 'Worker', value: 16 },
      { name: 'Equipment', value: 12 },
    ]
    return base
  }, [])

  const chartColor = active === 'risk' ? '#3B82F6' : active === 'incident' ? '#EF4444' : '#22C55E'

  return (
    <div className="space-y-4 animate-fade-in">
      <PageTitle title="Reports & Analytics" subtitle="What reports can I export?" />

      <div className="grid-12">
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader>
            <CardTitle>Historical Analysis</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="risk" fill={chartColor} />
                <Bar dataKey="incidents" fill="#EF4444" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1">
                PDF
              </Button>
              <Button variant="secondary" className="flex-1">
                Excel
              </Button>
              <Button variant="secondary" className="flex-1">
                CSV
              </Button>
            </div>
            <div className="text-xs text-muted leading-relaxed">
              Exports are permissioned and audited in a real deployment. This prototype focuses on enterprise UX and UI density.
            </div>

            <div className="p-2 border border-border rounded-lg bg-bg/60">
              <div className="text-xs text-muted mb-2">Report Distribution</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribution} dataKey="value" outerRadius={90} label>
                      {distribution.map((_, i) => (
                        <Cell
                          key={i}
                          fill={['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#64748B', '#38BDF8'][i % 6]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12">
          <CardHeader>
            <CardTitle>Report Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                ['daily', 'Daily Safety Report', 'Risk overview and quick actions.'],
                ['incident', 'Incident Report', 'Event chain, evidence, and response timeline.'],
                ['risk', 'Risk Analysis Report', 'Model outputs, explanations, and what-if scenarios.'],
                ['compliance', 'Compliance Report', 'Checklist status and regulatory evidence mapping.'],
                ['workers', 'Worker Report', 'Workforce exposure, PPE gaps, and movement context.'],
                ['equipment', 'Equipment Report', 'Equipment health, sensor drift, and maintenance alerts.'],
              ].map(([key, title, desc]) => (
                <button
                  key={key}
                  onClick={() => setActive(key as any)}
                  className={`rounded-lg p-3 border transition-colors text-left ${
                    active === key ? 'border-primary/50 bg-primary/10' : 'border-border bg-bg/60 hover:border-primary/30'
                  }`}
                >
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="text-xs text-muted mt-1">{desc}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AppPremium() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  )
}

