import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Building2, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent } from '@/components/ui/card'

export default function PublicConstructionDashboard() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [data, setData] = useState<{
    company: { id: string; name: string }
    stages: { id: string; name: string; order: number }[]
    processes: {
      id: string
      current_step: string
      status: string
      buyerName: string
      observations: string
      created: string
    }[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const [selectedProcess, setSelectedProcess] = useState<any>(null)

  const loadData = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/public/construction-companies/${id}/dashboard`,
      )
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(true)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o dashboard.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadData()
  }, [id])

  useRealtime('public_construction_updates', (e) => {
    if (e.record.construction_company === id) {
      loadData()
    }
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-muted-foreground animate-pulse">Carregando dashboard...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-red-500">Dashboard não encontrado ou indisponível.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3 shadow-sm z-10">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{data.company.name}</h1>
          <p className="text-xs text-muted-foreground">Acompanhamento de Processos Habitacionais</p>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 h-full items-start" style={{ minWidth: 'min-content' }}>
          {data.stages.map((stage) => {
            const colProcs = data.processes.filter((p) => p.current_step === stage.name)
            return (
              <div
                key={stage.id}
                className="w-[320px] shrink-0 flex flex-col bg-slate-100 rounded-lg border border-slate-200 max-h-full"
              >
                <div className="p-3 border-b border-slate-200 bg-white rounded-t-lg flex items-center justify-between">
                  <h3 className="font-semibold text-slate-700">{stage.name}</h3>
                  <Badge variant="secondary">{colProcs.length}</Badge>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {colProcs.map((proc) => (
                    <Card
                      key={proc.id}
                      className="cursor-pointer hover:shadow-md transition-shadow border-slate-200"
                      onClick={() => setSelectedProcess(proc)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-semibold text-slate-500"
                          >
                            {proc.id.slice(0, 8)}
                          </Badge>
                          {proc.status === 'Pendência' && (
                            <Badge
                              variant="destructive"
                              className="text-[10px] bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
                            >
                              Pendência
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-slate-800 text-sm mb-1 line-clamp-2 leading-snug">
                          {proc.buyerName || 'Cliente não identificado'}
                        </h4>
                        <div className="flex items-center text-xs text-muted-foreground mt-3">
                          <User className="w-3.5 h-3.5 mr-1" />
                          <span>Cliente Habitacional</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {colProcs.length === 0 && (
                    <div className="text-center p-6 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                      Nenhum processo nesta etapa
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <Dialog open={!!selectedProcess} onOpenChange={(open) => !open && setSelectedProcess(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Processo</DialogTitle>
          </DialogHeader>
          {selectedProcess && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nome do Cliente</p>
                  <p className="font-semibold text-lg text-slate-900">
                    {selectedProcess.buyerName || 'Sem nome'}
                  </p>
                </div>
                <Badge variant="outline" className="uppercase text-xs">
                  {selectedProcess.id.slice(0, 8)}
                </Badge>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-sm text-muted-foreground mb-2">Etapa Atual</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-sm px-3 py-1">
                    {selectedProcess.current_step}
                  </Badge>
                  {selectedProcess.status === 'Pendência' && (
                    <Badge variant="destructive" className="text-sm px-3 py-1">
                      Com Pendência
                    </Badge>
                  )}
                </div>
              </div>

              {selectedProcess.status === 'Pendência' && selectedProcess.observations && (
                <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm border border-red-100 shadow-sm">
                  <p className="font-semibold mb-2 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    Motivo da Pendência
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed opacity-90">
                    {selectedProcess.observations}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
