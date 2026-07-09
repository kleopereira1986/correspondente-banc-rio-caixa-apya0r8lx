import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/auth-context'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export default function AgencyProcesses() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [processes, setProcesses] = useState<any[]>([])
  const [brokers, setBrokers] = useState<any[]>([])

  const [filterMinValor, setFilterMinValor] = useState('')
  const [filterMaxValor, setFilterMaxValor] = useState('')
  const [filterData, setFilterData] = useState('')
  const [filterBroker, setFilterBroker] = useState('all')
  const [filterResult, setFilterResult] = useState('all')

  const [housingModalOpen, setHousingModalOpen] = useState(false)
  const [housingProcessId, setHousingProcessId] = useState<string | null>(null)
  const [selectedCompanyForHousing, setSelectedCompanyForHousing] = useState('none')
  const [constructionCompanies, setConstructionCompanies] = useState<any[]>([])

  const [reevaluationDialog, setReevaluationDialog] = useState(false)
  const [reevaluationReason, setReevaluationReason] = useState('')
  const [reevaluationProcessId, setReevaluationProcessId] = useState<string | null>(null)

  const fetchProcesses = useCallback(async () => {
    if (!user?.real_estate_agency) return
    try {
      const data = await pb.collection('processes').getFullList({
        filter: `broker.real_estate_agency = '${user.real_estate_agency}'`,
        expand: 'buyer,broker',
        sort: '-created',
      })
      setProcesses(data)
    } catch (err) {
      console.error(err)
    }
  }, [user?.real_estate_agency])

  useEffect(() => {
    fetchProcesses()
  }, [fetchProcesses])

  useEffect(() => {
    if (!user?.real_estate_agency) return
    const fetchBrokers = async () => {
      try {
        const data = await pb.collection('users').getFullList({
          filter: `role = 'broker' && real_estate_agency = '${user.real_estate_agency}'`,
        })
        setBrokers(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchBrokers()
  }, [user?.real_estate_agency])

  useEffect(() => {
    if (user?.role === 'real_estate_agency') {
      pb.collection('construction_companies')
        .getFullList({ sort: 'name' })
        .then(setConstructionCompanies)
        .catch(console.error)
    }
  }, [user?.role])

  useRealtime('processes', () => {
    fetchProcesses()
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
  }

  const openHousingModal = (processId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (user?.role !== 'real_estate_agency') {
      toast({
        title: 'Acesso negado',
        description: 'Apenas a agência pode enviar para habitacional.',
        variant: 'destructive',
      })
      return
    }
    setHousingProcessId(processId)
    setSelectedCompanyForHousing('none')
    setHousingModalOpen(true)
  }

  const confirmSendToHousing = async () => {
    if (!housingProcessId) return
    try {
      const newStep = 'Triagem CCA'

      const payload: any = {
        type: 'housing',
        status: 'Nova Solicitação',
        current_step: newStep,
        result: 'pending',
      }
      if (selectedCompanyForHousing !== 'none') {
        payload.construction_company = selectedCompanyForHousing
      }
      await pb.collection('processes').update(housingProcessId, payload)
      await pb.collection('process_logs').create({
        process: housingProcessId,
        to_step: newStep,
        to_status: 'Nova Solicitação',
        changed_by: user?.id,
        note:
          'Processo enviado para o Kanban Habitacional' +
          (selectedCompanyForHousing !== 'none' ? ' e vinculado à construtora' : ''),
      })
      toast({
        title: 'Sucesso',
        description: 'Processo enviado para o Kanban Habitacional.',
      })
      setHousingModalOpen(false)
      setHousingProcessId(null)
      fetchProcesses()
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao enviar para habitacional.',
        variant: 'destructive',
      })
    }
  }

  const handleRequestReevaluationClick = (processId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setReevaluationProcessId(processId)
    setReevaluationReason('')
    setReevaluationDialog(true)
  }

  const confirmRequestReevaluation = async () => {
    if (!reevaluationProcessId) return
    if (!reevaluationReason.trim()) {
      toast({
        title: 'Aviso',
        description: 'Preencha o motivo da reavaliação.',
        variant: 'destructive',
      })
      return
    }
    try {
      await pb.collection('processes').update(reevaluationProcessId, {
        type: 'credit',
        analysis_type: 'reevaluation',
        is_conformity_approved: true,
        status: 'Aguardando Análise',
        current_step: 'Análise',
        result: 'pending',
      })

      if (user?.id) {
        try {
          await pb.send('/backend/v1/process-logs/manual', {
            method: 'POST',
            body: JSON.stringify({
              process: reevaluationProcessId,
              note: `Reavaliação solicitada pela agência. Motivo: ${reevaluationReason.trim()}`,
            }),
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (logErr) {
          console.error('Erro ao registrar log', logErr)
        }
      }

      toast({
        title: 'Sucesso',
        description: 'Processo enviado para reavaliação.',
      })
      setReevaluationDialog(false)
      setReevaluationProcessId(null)
      fetchProcesses()
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao solicitar reavaliação.',
        variant: 'destructive',
      })
    }
  }

  const filteredProcesses = processes.filter((p) => {
    let match = true
    if (filterMinValor && (p.approved_financing_value || 0) < Number(filterMinValor)) match = false
    if (filterMaxValor && (p.approved_financing_value || 0) > Number(filterMaxValor)) match = false
    if (filterData) {
      const pDate = p.evaluation_expiry_date ? p.evaluation_expiry_date.split(' ')[0] : ''
      if (!pDate || pDate !== filterData) match = false
    }
    if (filterBroker !== 'all' && p.broker !== filterBroker) match = false
    if (filterResult !== 'all') {
      const r = p.result || 'pending'
      if (r !== filterResult) match = false
    }
    return match
  })

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Processos da Agência</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe todos os processos conduzidos pelos corretores da sua agência.
        </p>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Filtros</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Valor Min (R$)</label>
              <Input
                type="number"
                placeholder="Ex: 100000"
                value={filterMinValor}
                onChange={(e) => setFilterMinValor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Valor Max (R$)</label>
              <Input
                type="number"
                placeholder="Ex: 500000"
                value={filterMaxValor}
                onChange={(e) => setFilterMaxValor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Validade</label>
              <Input
                type="date"
                value={filterData}
                onChange={(e) => setFilterData(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Corretor</label>
              <Select value={filterBroker} onValueChange={setFilterBroker}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {brokers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name || 'Sem nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Situação</label>
              <Select value={filterResult} onValueChange={setFilterResult}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Reprovado</SelectItem>
                  <SelectItem value="conditioned">Condicionado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto border-t">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead>ID / Cliente</TableHead>
                <TableHead>Corretor</TableHead>
                <TableHead>Resultado da Análise</TableHead>
                <TableHead>Status / Tipo</TableHead>
                <TableHead>Valor Financiado</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProcesses.map((process) => {
                const processResult = process.result || 'pending'
                return (
                  <TableRow
                    key={process.id}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => navigate(`/process/${process.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium text-slate-800 group-hover:text-primary">
                        {process.expand?.buyer?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">{process.id}</div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700 whitespace-nowrap">
                      {process.expand?.broker?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          processResult === 'approved'
                            ? 'default'
                            : processResult === 'rejected'
                              ? 'destructive'
                              : processResult === 'conditioned'
                                ? 'secondary'
                                : 'outline'
                        }
                        className={
                          processResult === 'approved'
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : processResult === 'conditioned'
                              ? 'bg-amber-500 text-white hover:bg-amber-600'
                              : ''
                        }
                      >
                        {processResult === 'approved'
                          ? 'Aprovado'
                          : processResult === 'rejected'
                            ? 'Reprovado'
                            : processResult === 'conditioned'
                              ? 'Condicionado'
                              : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="secondary" className="font-medium">
                          {process.status}
                        </Badge>
                        {process.type === 'credit' ? (
                          <Badge
                            variant="outline"
                            className="text-blue-600 bg-blue-50 border-blue-200 text-[10px] h-5 px-1.5 py-0"
                          >
                            Crédito
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-purple-600 bg-purple-50 border-purple-200 text-[10px] h-5 px-1.5 py-0"
                          >
                            Habitacional
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600 whitespace-nowrap">
                      {process.approved_financing_value
                        ? formatCurrency(process.approved_financing_value)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-slate-700 text-sm whitespace-nowrap">
                      {process.evaluation_expiry_date
                        ? format(new Date(process.evaluation_expiry_date), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {user?.role === 'real_estate_agency' && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs whitespace-nowrap uppercase tracking-wider"
                            onClick={(e) => handleRequestReevaluationClick(process.id, e)}
                          >
                            SOLICITAR NOVA AVALIAÇÃO
                          </Button>
                        )}
                        {user?.role === 'real_estate_agency' &&
                          process.type === 'credit' &&
                          processResult === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50 whitespace-nowrap"
                              onClick={(e) => openHousingModal(process.id, e)}
                            >
                              Enviar para Habitacional
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredProcesses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum processo encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={housingModalOpen} onOpenChange={setHousingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deseja vincular uma construtora?</DialogTitle>
            <DialogDescription>
              Selecione uma construtora para vincular a este processo ou continue sem vincular.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedCompanyForHousing} onValueChange={setSelectedCompanyForHousing}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma construtora..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não vincular construtora</SelectItem>
                {constructionCompanies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHousingModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmSendToHousing}>
              {selectedCompanyForHousing === 'none' ? 'Continuar sem vincular' : 'Continuar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reevaluationDialog} onOpenChange={setReevaluationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Nova Avaliação</DialogTitle>
            <DialogDescription>
              O processo será enviado para a fila de reavaliação de crédito. Informe o motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Motivo / Observações</label>
              <textarea
                className="w-full min-h-[100px] flex rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Descreva o motivo da reavaliação..."
                value={reevaluationReason}
                onChange={(e) => setReevaluationReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReevaluationDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmRequestReevaluation}>Confirmar Reavaliação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
