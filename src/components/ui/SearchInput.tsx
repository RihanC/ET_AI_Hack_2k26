import { Search } from 'lucide-react'

interface SearchInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
}

export function SearchInput({ placeholder = 'Search...', value, onChange, className = '' }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="w-full bg-bg border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
      />
    </div>
  )
}
