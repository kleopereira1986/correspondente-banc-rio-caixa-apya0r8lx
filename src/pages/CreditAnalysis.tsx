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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function CreditAnalysis() {
  const [processes, setProcesses] = useState<any[]>([])
  const [filter, setFilter] = useState('fila_analise')

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
    fila_analise: processes.filter((p) => p.is_conformity_approved && !p.result),
    approved: processes.filter((p) => p.result === 'approved'),
    rejected: processes.filter((p) => p.result === 'rejected'),
    conditioned: processes.filter((p) => p.result === 'conditioned'),
    pending: processes.filter((p) => p.result === 'pending'),
    triagem: processes.filter((p) => !p.analysis_type),
    conf_primeira: processes.filter(
      (p) => p.analysis_type === 'first_analysis' && !p.is_conformity_approved,
    ),
    conf_reavaliacao: processes.filter(
      (p) => p.analysis_type === 'reevaluation' && !p.is_conformity_approved,
    ),
  }

  const cards = [
    {
      id: 'fila_analise',
      label: 'Fila para Análise',
      count: stats.fila_analise.length,
      color: 'bg-blue-100 text-blue-700',
      icon: Clock,
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                <c.icon className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-700 text-sm mt-1 leading-tight">{c.label}</p>
              <p className="text-2xl font-bold text-slate-900">{c.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="w-full mt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Listagem de Processos</h2>
          <TabsList className="bg-slate-100/50 flex-wrap h-auto py-1">
            <TabsTrigger value="triagem" className="text-xs sm:text-sm">
              Triagem ({stats.triagem.length})
            </TabsTrigger>
            <TabsTrigger value="conf_primeira" className="text-xs sm:text-sm">
              1ª Análise ({stats.conf_primeira.length})
            </TabsTrigger>
            <TabsTrigger value="conf_reavaliacao" className="text-xs sm:text-sm">
              Reavaliação ({stats.conf_reavaliacao.length})
            </TabsTrigger>
          </TabsList>
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
      </Tabs>
    </div>
  )
}
