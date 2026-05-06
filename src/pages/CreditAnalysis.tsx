import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRealtime } from '@/hooks/use-realtime'
import { getProcesses } from '@/services/api'
import { Link } from 'react-router-dom'
import {
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  ClipboardCheck,
  RefreshCcw,
} from 'lucide-react'

export default function CreditAnalysis() {
  const [processes, setProcesses] = useState<any[]>([])

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
    triagem: processes.filter(
      (p) =>
        !p.is_conformity_approved &&
        p.status !== 'Concluído' &&
        p.result !== 'approved' &&
        p.result !== 'rejected',
    ),
    primeira_analise: processes.filter(
      (p) => p.is_conformity_approved && !p.result && p.analysis_type === 'first_analysis',
    ),
    reavaliacao: processes.filter(
      (p) => p.is_conformity_approved && !p.result && p.analysis_type === 'reevaluation',
    ),
  }

  const renderProcessList = (list: any[], emptyMessage: string) => (
    <div className="divide-y divide-border/50">
      {list.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
          <CheckCircle2 className="w-10 h-10 text-slate-200 mb-3" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        list.map((proc: any) => (
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
                </Link>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(proc.created).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {proc.expand?.assigned_analyst?.name || 'Não atribuído'}
                  </span>
                  <Badge variant="outline" className="font-normal text-[10px] bg-slate-50">
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
        ))
      )}
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Filas de Análise</h1>
        <p className="text-muted-foreground">
          Gerencie os processos aguardando análise de crédito e reavaliação.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-2 border-slate-200">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
            <div className="p-3 rounded-full bg-slate-100 text-slate-700">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-700 text-sm mt-1">Aguardando Triagem</p>
            <p className="text-2xl font-bold text-slate-900">{stats.triagem.length}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
            <div className="p-3 rounded-full bg-blue-100 text-blue-700">
              <Clock className="w-5 h-5" />
            </div>
            <p className="font-semibold text-blue-800 text-sm mt-1">1ª Análise</p>
            <p className="text-2xl font-bold text-blue-900">{stats.primeira_analise.length}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-indigo-200 bg-indigo-50/50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-700">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <p className="font-semibold text-indigo-800 text-sm mt-1">Reavaliação</p>
            <p className="text-2xl font-bold text-indigo-900">{stats.reavaliacao.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        <Card className="shadow-sm border-blue-200 h-full flex flex-col">
          <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
            <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Fila: 1ª Análise
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {renderProcessList(stats.primeira_analise, 'Nenhum processo na fila de 1ª Análise.')}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-indigo-200 h-full flex flex-col">
          <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 pb-4">
            <CardTitle className="text-lg text-indigo-800 flex items-center gap-2">
              <RefreshCcw className="w-5 h-5" /> Fila: Reavaliação
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {renderProcessList(stats.reavaliacao, 'Nenhum processo na fila de Reavaliação.')}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
