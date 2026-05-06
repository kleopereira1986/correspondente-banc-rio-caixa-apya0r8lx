import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRealtime } from '@/hooks/use-realtime'
import { getProcesses } from '@/services/api'
import { Link } from 'react-router-dom'
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  User,
  ClipboardCheck,
  RefreshCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CreditAnalysis() {
  const [processes, setProcesses] = useState<any[]>([])
  const [filter, setFilter] = useState('aguardando_conformidade')

  const loadData = async () => {
    try {
      const data = await getProcesses()
      setProcesses(data.filter((p: any) => p.type === 'credit'))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('processes', () => loadData())

  const stats = {
    aguardando_conformidade: processes.filter((p) => !p.is_conformity_approved),
    primeira_analise: processes.filter(
      (p) => p.is_conformity_approved && !p.result && p.analysis_type === 'first_analysis',
    ),
    reavaliacao: processes.filter(
      (p) => p.is_conformity_approved && !p.result && p.analysis_type === 'reevaluation',
    ),
    approved: processes.filter((p) => p.result === 'approved'),
    rejected: processes.filter((p) => p.result === 'rejected'),
    conditioned: processes.filter((p) => p.result === 'conditioned'),
    pending: processes.filter((p) => p.result === 'pending'),
  }

  const cards = [
    {
      id: 'aguardando_conformidade',
      label: 'Aguardar Conformidade',
      count: stats.aguardando_conformidade.length,
      color: 'bg-slate-100 text-slate-700',
      icon: ClipboardCheck,
    },
    {
      id: 'primeira_analise',
      label: '1ª Análise',
      count: stats.primeira_analise.length,
      color: 'bg-blue-100 text-blue-700',
      icon: Clock,
    },
    {
      id: 'reavaliacao',
      label: 'Reavaliação',
      count: stats.reavaliacao.length,
      color: 'bg-indigo-100 text-indigo-700',
      icon: RefreshCcw,
    },
    {
      id: 'approved',
      label: 'Aprovado',
      count: stats.approved.length,
      color: 'bg-emerald-100 text-emerald-700',
      icon: CheckCircle2,
    },
    {
      id: 'rejected',
      label: 'Reprovado',
      count: stats.rejected.length,
      color: 'bg-red-100 text-red-700',
      icon: XCircle,
    },
    {
      id: 'conditioned',
      label: 'Condicionado',
      count: stats.conditioned.length,
      color: 'bg-amber-100 text-amber-700',
      icon: AlertTriangle,
    },
    {
      id: 'pending',
      label: 'Com Pendência',
      count: stats.pending.length,
      color: 'bg-secondary/20 text-secondary',
      icon: FileText,
    },
  ]

  const displayList = stats[filter as keyof typeof stats] || []

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Análise de Créditos</h1>
        <p className="text-muted-foreground">
          Gerencie o fluxo de aprovação e conformidade de crédito.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {cards.map((c) => (
          <Card
            key={c.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md border-2',
              filter === c.id ? 'border-primary shadow-sm' : 'border-transparent',
            )}
            onClick={() => setFilter(c.id)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className={cn('p-3 rounded-full', c.color)}>
                <c.icon className="w-5 h-5" />
              </div>
              <p className="font-semibold text-slate-700 text-xs mt-1 leading-tight">{c.label}</p>
              <p className="text-xl font-bold text-slate-900">{c.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {cards.find((c) => c.id === filter)?.label || 'Listagem de Processos'}
          </h2>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardContent className="p-0">
            {displayList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <CheckCircle2 className="w-12 h-12 text-slate-300 mb-3" />
                <p>Nenhum processo nesta fila.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {displayList.map((proc: any) => (
                  <div
                    key={proc.id}
                    className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0 mt-1">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <Link
                          to={`/process/${proc.id}`}
                          className="font-semibold text-slate-800 hover:text-primary transition-colors text-base flex items-center gap-2"
                        >
                          {proc.expand?.buyer?.name || 'Cliente não informado'}
                          {proc.result === 'approved' && (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 ml-2">
                              Aprovado
                            </Badge>
                          )}
                          {proc.result === 'rejected' && (
                            <Badge variant="destructive" className="ml-2">
                              Reprovado
                            </Badge>
                          )}
                          {proc.result === 'conditioned' && (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 ml-2">
                              Condicionado
                            </Badge>
                          )}
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(proc.created).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {proc.expand?.assigned_analyst?.name || 'Não atribuído'}
                          </span>
                          <Badge variant="outline" className="font-normal text-xs bg-slate-50">
                            {proc.expand?.credit_analysis_type?.name || 'Crédito'}
                          </Badge>
                          {proc.analysis_type && (
                            <Badge
                              variant="secondary"
                              className="font-normal text-xs bg-blue-50 text-blue-700"
                            >
                              {proc.analysis_type === 'first_analysis'
                                ? 'Primeira Análise'
                                : 'Reavaliação'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0 group">
                      <Link to={`/process/${proc.id}`}>
                        Analisar{' '}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
