import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface AppContextType {
  selectedZoneId: string | null
  selectedSensorId: string | null
  selectedWorkerId: string | null
  selectedPermitId: string | null
  copilotOpen: boolean
  mapLayers: Record<string, boolean>
  setSelectedZone: (id: string | null) => void
  setSelectedSensor: (id: string | null) => void
  setSelectedWorker: (id: string | null) => void
  setSelectedPermit: (id: string | null) => void
  setCopilotOpen: (open: boolean) => void
  toggleMapLayer: (layer: string) => void
  navigateToZone: (zoneId: string) => void
  navigateToSensor: (sensorId: string) => void
  navigateToWorker: (workerId: string) => void
  navigateToPermit: (permitId: string) => void
  navigateToRisk: (zoneId: string) => void
  navigateToMap: (zoneId?: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

const defaultLayers: Record<string, boolean> = {
  workers: true,
  sensors: true,
  temperature: true,
  gas: true,
  pressure: false,
  permits: true,
  equipment: true,
  cctv: false,
}

export function AppProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null)
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null)
  const [selectedPermitId, setSelectedPermitId] = useState<string | null>(null)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [mapLayers, setMapLayers] = useState(defaultLayers)

  const toggleMapLayer = useCallback((layer: string) => {
    setMapLayers(prev => ({ ...prev, [layer]: !prev[layer] }))
  }, [])

  const navigateToZone = useCallback((zoneId: string) => {
    setSelectedZoneId(zoneId)
    navigate('/map')
  }, [navigate])

  const navigateToSensor = useCallback((sensorId: string) => {
    setSelectedSensorId(sensorId)
    navigate('/sensors')
  }, [navigate])

  const navigateToWorker = useCallback((workerId: string) => {
    setSelectedWorkerId(workerId)
    navigate('/workers')
  }, [navigate])

  const navigateToPermit = useCallback((permitId: string) => {
    setSelectedPermitId(permitId)
    navigate('/permits')
  }, [navigate])

  const navigateToRisk = useCallback((zoneId: string) => {
    setSelectedZoneId(zoneId)
    navigate('/risk')
  }, [navigate])

  const navigateToMap = useCallback((zoneId?: string) => {
    if (zoneId) setSelectedZoneId(zoneId)
    navigate('/map')
  }, [navigate])

  return (
    <AppContext.Provider value={{
      selectedZoneId, selectedSensorId, selectedWorkerId, selectedPermitId,
      copilotOpen, mapLayers,
      setSelectedZone: setSelectedZoneId,
      setSelectedSensor: setSelectedSensorId,
      setSelectedWorker: setSelectedWorkerId,
      setSelectedPermit: setSelectedPermitId,
      setCopilotOpen, toggleMapLayer,
      navigateToZone, navigateToSensor, navigateToWorker, navigateToPermit,
      navigateToRisk, navigateToMap,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
