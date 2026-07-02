import type { ReactNode } from 'react'
import type { RiskLevel, SensorStatus, PermitStatus } from '../../data/mockData'

const riskColors: Record<RiskLevel, string> = {
  low: 'bg-success/15 text-success border-success/30',
  medium: 'bg-warning/15 text-warning border-warning/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  critical: 'bg-critical/15 text-critical border-critical/30',
}

const statusColors: Record<SensorStatus, string> = {
  online: 'bg-success/15 text-success border-success/30',
  offline: 'bg-muted/15 text-muted border-muted/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  critical: 'bg-critical/15 text-critical border-critical/30',
}

const permitColors: Record<PermitStatus, string> = {
  active: 'bg-success/15 text-success border-success/30',
  expired: 'bg-critical/15 text-critical border-critical/30',
  pending: 'bg-warning/15 text-warning border-warning/30',
}

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'risk' | 'status' | 'permit' | 'primary'
  level?: RiskLevel | SensorStatus | PermitStatus
  className?: string
}

export function Badge({ children, variant = 'default', level, className = '' }: BadgeProps) {
  let colors = 'bg-primary/15 text-primary border-primary/30'
  if (variant === 'risk' && level) colors = riskColors[level as RiskLevel]
  if (variant === 'status' && level) colors = statusColors[level as SensorStatus]
  if (variant === 'permit' && level) colors = permitColors[level as PermitStatus]

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md border ${colors} ${className}`}>
      {children}
    </span>
  )
}

export function StatusDot({ status }: { status: RiskLevel | SensorStatus }) {
  const color = status === 'online' || status === 'low' ? 'bg-success'
    : status === 'warning' || status === 'medium' ? 'bg-warning'
    : status === 'offline' ? 'bg-muted'
    : 'bg-critical'

  return (
    <span className="relative flex h-2 w-2">
      {(status === 'critical' || status === 'high') && (
        <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-75 animate-ping`} />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  )
}
