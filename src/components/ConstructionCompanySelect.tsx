import { useState } from 'react'
import { Search, ChevronDown, Check, Building2 } from 'lucide-react'

interface ConstructionCompanySelectProps {
  companies: any[]
  value: string
  onChange: (id: string) => void
}

export function ConstructionCompanySelect({
  companies,
  value,
  onChange,
}: ConstructionCompanySelectProps) {
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const filtered = companies.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.cnpj.includes(search),
  )

  const selectedCompanyObj = companies.find((c) => c.id === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <span className="truncate">
          {selectedCompanyObj
            ? `${selectedCompanyObj.name} (${selectedCompanyObj.cnpj})`
            : 'Selecione uma construtora...'}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      {dropdownOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-2 sticky top-0 bg-popover border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar construtora..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm"
              />
            </div>
          </div>
          <div className="p-1">
            {filtered.length === 0 && (
              <div className="py-2 px-2 text-sm text-muted-foreground">
                Nenhuma construtora encontrada.
              </div>
            )}
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  onChange(c.id)
                  setDropdownOpen(false)
                  setSearch('')
                }}
                className="relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              >
                <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{c.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{c.cnpj}</span>
                {value === c.id && <Check className="ml-2 h-4 w-4 text-primary" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
