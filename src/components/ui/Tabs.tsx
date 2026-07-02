interface TabsProps {
  tabs: { id: string; label: string; count?: number }[]
  active: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-xs font-medium transition-colors relative ${
            active === tab.id ? 'text-text' : 'text-muted hover:text-text/80'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-[10px] text-muted">({tab.count})</span>
          )}
          {active === tab.id && (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  )
}
