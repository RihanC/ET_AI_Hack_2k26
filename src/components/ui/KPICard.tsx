import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from './Card'

interface KPICardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  accent?: string
  onClick?: () => void
}

export function KPICard({ label, value, icon: Icon, trend, trendValue, accent = 'text-primary', onClick }: KPICardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-critical' : trend === 'down' ? 'text-success' : 'text-muted'

  return (
    <Card hover={!!onClick} onClick={onClick} className="p-4 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-semibold text-text tracking-tight">{value}</p>
          {trendValue && (
            <div className={`flex items-center gap-1 mt-1.5 ${trendColor}`}>
              <TrendIcon size={12} />
              <span className="text-[11px] font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg bg-border/50 ${accent}`}>
          <Icon size={18} />
        </div>
      </div>
    </Card>
  )
}
