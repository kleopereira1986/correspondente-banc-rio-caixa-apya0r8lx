import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DateRangeFilterProps {
  fromDate: Date | undefined
  toDate: Date | undefined
  onFromChange: (date: Date | undefined) => void
  onToChange: (date: Date | undefined) => void
  onClear: () => void
}

export function DateRangeFilter({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onClear,
}: DateRangeFilterProps) {
  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)
  const hasFilter = !!fromDate || !!toDate

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 w-full">
      <div className="space-y-1.5 flex-1 w-full">
        <label className="text-sm font-medium text-slate-700">Data inicial (criação)</label>
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal bg-slate-50',
                !fromDate && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fromDate
                ? format(fromDate, 'dd/MM/yyyy', { locale: ptBR })
                : 'Selecione a data inicial'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={(d) => {
                onFromChange(d)
                setFromOpen(false)
              }}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-1.5 flex-1 w-full">
        <label className="text-sm font-medium text-slate-700">Data final (criação)</label>
        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal bg-slate-50',
                !toDate && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {toDate ? format(toDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data final'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={(d) => {
                onToChange(d)
                setToOpen(false)
              }}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-slate-500 hover:text-slate-700 shrink-0"
        >
          <X className="w-4 h-4 mr-1" /> Limpar
        </Button>
      )}
    </div>
  )
}
