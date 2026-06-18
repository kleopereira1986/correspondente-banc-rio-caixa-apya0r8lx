import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import {
  getHousingStages,
  getProcesses,
  updateProcess,
  createProcess,
  getUsers,
} from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, MoreVertical, Eye, FileText, Link as LinkIcon, User } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function HousingKanban() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [stages, setStages] = useState<any[]>([])
  const [processes, setProcesses] = useState<any[]>([])
  const [creditProcesses, setCreditProcesses] = useState<any[]>([])
  const [buyers, setBuyers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [pendencyDialogOpen, setPendencyDialogOpen] = useState(false)

  const [selectedProcess, setSelectedProcess] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [selectedBuyer, setSelectedBuyer] = useState('')
  const [selectedCredit, setSelectedCredit] = useState('')

  const loadData = async () => {
    try {
      const [stgs, procs, users] = await Promise.all([
        getHousingStages(),
        getProcesses(),
        getUsers('buyer'),
      ])
      setStages(stgs)
      setProcesses(procs.filter((p) => p.type === 'housing'))
      setCreditProcesses(procs.filter((p) => p.type === 'credit' && p.result === 'approved'))
      setBuyers(users)
    } catch (e) {
      toast({ title: 'Erro', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('housing_stages', () => loadData())
  useRealtime('processes', () => loadData())

  const moveProcess = async (processId: string, newStep: string) => {
    try {
      const payload: any = { current_step: newStep, status: 'Em Andamento' }
      if (newStep === stages[stages.length - 1]?.name) {
        payload.status = 'Finalizado'
        payload.housing_finalized_at = new Date().toISOString()
      } else if (newStep === 'Emissão de Boleto') {
        payload.boleto_sent_at = new Date().toISOString()
      }
      await updateProcess(processId, payload)
      toast({ title: 'Processo movido com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao mover processo', variant: 'destructive' })
    }
  }

  const handleCreate = async () => {
    if (!selectedBuyer) return
    try {
      const firstStep = stages[0]?.name || 'Montagem de Pasta'
      await createProcess({
        type: 'housing',
        buyer: selectedBuyer,
        current_step: firstStep,
        status: 'Nova Solicitação',
        observations: notes,
        assigned_analyst: user?.role === 'analyst' ? user.id : undefined,
      })
      toast({ title: 'Processo habitacional criado' })
      setCreateDialogOpen(false)
      setNotes('')
      setSelectedBuyer('')
    } catch (e) {
      toast({ title: 'Erro ao criar', variant: 'destructive' })
    }
  }

  const handleImport = async () => {
    if (!selectedCredit) return
    const credProc = creditProcesses.find((p) => p.id === selectedCredit)
    if (!credProc) return
    try {
      const firstStep = stages[0]?.name || 'Montagem de Pasta'

      const updatedObservations = notes
        ? `${credProc.observations ? credProc.observations + '\n\n' : ''}Nota da Importação: ${notes}`
        : credProc.observations

      await updateProcess(credProc.id, {
        type: 'housing',
        current_step: firstStep,
        status: 'Nova Solicitação',
        observations: updatedObservations,
        assigned_analyst: user?.role === 'analyst' ? user.id : credProc.assigned_analyst,
      })

      if (user?.id) {
        await pb.collection('process_logs').create({
          process: credProc.id,
          from_step: credProc.current_step || '',
          to_step: firstStep,
          from_status: credProc.status || '',
          to_status: 'Nova Solicitação',
          changed_by: user.id,
          note: 'Processo transferido da Análise de Crédito para Habitacional.',
        })
      }

      toast({ title: 'Processo habitacional importado com sucesso' })
      setImportDialogOpen(false)
      setNotes('')
      setSelectedCredit('')
    } catch (e) {
      toast({ title: 'Erro ao importar', variant: 'destructive' })
    }
  }

  const handlePendency = async () => {
    if (!selectedProcess || !notes) return
    try {
      await updateProcess(selectedProcess.id, {
        status: 'Pendência',
        observations: notes,
      })
      toast({ title: 'Pendência registrada' })
      setPendencyDialogOpen(false)
      setNotes('')
      setSelectedProcess(null)
    } catch (e) {
      toast({ title: 'Erro ao registrar pendência', variant: 'destructive' })
    }
  }

  if (user?.role !== 'master' && user?.role !== 'analyst')
    return <div className="p-8">Acesso Negado</div>

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kanban Habitacional</h1>
          <p className="text-muted-foreground">Acompanhe as fases da documentação e contratos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            Importar Cliente
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Novo Processo
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 min-h-[600px] h-full" style={{ minWidth: 'min-content' }}>
          {stages.map((stage) => {
            const colProcs = processes.filter((p) => p.current_step === stage.name)
            return (
              <div
                key={stage.id}
                className="w-[320px] shrink-0 flex flex-col bg-slate-100 rounded-lg border border-slate-200"
              >
                <div className="p-3 border-b border-slate-200 bg-white rounded-t-lg flex items-center justify-between">
                  <h3 className="font-semibold text-slate-700">{stage.name}</h3>
                  <Badge variant="secondary">{colProcs.length}</Badge>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {colProcs.map((proc) => (
                    <div
                      key={proc.id}
                      className="bg-white p-4 rounded-md shadow-sm border border-slate-200 group relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {proc.id.slice(0, 8)}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1">
                              <MoreVertical className="w-4 h-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/process/${proc.id}`)}>
                              <Eye className="w-4 h-4 mr-2" /> Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProcess(proc)
                                setNotes(proc.observations || '')
                                setPendencyDialogOpen(true)
                              }}
                            >
                              <FileText className="w-4 h-4 mr-2" /> Registrar Pendência
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/public/housing/${proc.id}`,
                                )
                                toast({ title: 'Link copiado!' })
                              }}
                            >
                              <LinkIcon className="w-4 h-4 mr-2" /> Copiar Link Público
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <h4 className="font-medium text-slate-800 text-sm mb-1">
                        {proc.expand?.buyer?.name || 'Sem nome'}
                      </h4>

                      <div className="flex items-center text-xs text-muted-foreground mt-3 mb-4">
                        <User className="w-3 h-3 mr-1" />
                        {proc.expand?.assigned_analyst ? (
                          <span className="flex items-center gap-1">
                            {proc.expand.assigned_analyst.name}{' '}
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                              Interno
                            </Badge>
                          </span>
                        ) : proc.expand?.broker ? (
                          <span>Corretor: {proc.expand.broker.name}</span>
                        ) : (
                          <span>Pendente de atribuição</span>
                        )}
                      </div>

                      {proc.status === 'Pendência' && (
                        <div className="bg-amber-50 text-amber-700 text-xs p-2 rounded mb-3 border border-amber-200">
                          Pendência: {proc.observations || 'Ação necessária'}
                        </div>
                      )}

                      <Select
                        onValueChange={(val) => moveProcess(proc.id, val)}
                        value={proc.current_step}
                      >
                        <SelectTrigger className="h-8 text-xs bg-slate-50">
                          <SelectValue placeholder="Mover para..." />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.map((s) => (
                            <SelectItem key={s.id} value={s.name} disabled={s.name === stage.name}>
                              Mover: {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  {colProcs.length === 0 && !isLoading && (
                    <div className="text-center p-4 text-xs text-slate-400">Nenhum processo</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Cliente Aprovado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Processo de Crédito Aprovado</Label>
              <Select value={selectedCredit} onValueChange={setSelectedCredit}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o processo de crédito..." />
                </SelectTrigger>
                <SelectContent>
                  {creditProcesses.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.expand?.buyer?.name} - {p.id}
                    </SelectItem>
                  ))}
                  {creditProcesses.length === 0 && (
                    <SelectItem value="none" disabled>
                      Nenhum cliente aprovado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações Iniciais</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes da pasta..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!selectedCredit}>
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Processo Habitacional</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Cliente (Comprador)</Label>
              <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {buyers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name || b.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações Iniciais</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes da pasta..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!selectedBuyer}>
              Criar Processo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendencyDialogOpen} onOpenChange={setPendencyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pendência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Motivo / Observação</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Descreva a pendência necessária..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendencyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePendency} disabled={!notes.trim()}>
              Salvar Pendência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
