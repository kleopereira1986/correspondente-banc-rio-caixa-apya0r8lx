import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import {
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  ClipboardCheck,
  RefreshCcw,
  Edit,
  ShieldAlert,
  CheckCircle,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'

export default function CreditAnalysis() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [processes, setProcesses] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const [firstHousingStage, setFirstHousingStage] = useState<string>('Montagem de Pasta')
  const [transitionProcess, setTransitionProcess] = useState<any>(null)

  const [deleteProcessId, setDeleteProcessId] = useState<string | null>(null)
  const [isDeletingProcess, setIsDeletingProcess] = useState(false)
  const [editBuyer, setEditBuyer] = useState<{ id: string; name: string } | null>(null)
  const [isEditingBuyer, setIsEditingBuyer] = useState(false)

  const loadData = async () => {
    try {
      const data = await pb.collection('processes').getFullList({
        sort: '-created',
        expand:
          'buyer,buyer_2,assigned_analyst,broker,credit_analysis_type,property_type,development_type,last_updated_by',
      })
      setProcesses(data.filter((p: any) => p.type === 'credit'))

      const docs = await pb.collection('documents').getFullList({
        fields: 'id,process,status,category,created',
        sort: '-created',
      })
      setDocuments(docs)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
    pb.collection('housing_stages')
      .getFullList({ sort: 'order' })
      .then((stages) => {
        if (stages.length > 0) setFirstHousingStage(stages[0].name)
      })
      .catch(console.error)
  }, [])

  useRealtime('processes', () => loadData())
  useRealtime('documents', () => loadData())

  const cadastramentoBase = processes.filter(
    (p) =>
      p.is_conformity_approved &&
      (p.current_step === 'Cadastramento' || p.status === 'Pendência Resolvida') &&
      p.status !== 'Concluído' &&
      p.result !== 'approved' &&
      p.result !== 'rejected' &&
      p.result !== 'conditioned',
  )

  const checkProcessPendency = (process: any) => {
    if (process.status === 'Aguardando Conferência' || process.status === 'Pendência Resolvida') {
      return false
    }

    const processDocs = documents.filter((d) => d.process === process.id)
    const latestDocsByCategory = new Map<string, any>()

    for (const doc of processDocs) {
      const key = doc.category || doc.id
      if (!latestDocsByCategory.has(key)) {
        latestDocsByCategory.set(key, doc)
      }
    }

    const hasPendingDocs = Array.from(latestDocsByCategory.values()).some(
      (d) => d.status === 'pending' || d.status === 'rejected',
    )

    return hasPendingDocs || process.status === 'Pendência'
  }

  const cadastramentoComPendencia = cadastramentoBase.filter((p) => checkProcessPendency(p))

  const cadastramentoSemPendencia = cadastramentoBase.filter((p) => !checkProcessPendency(p))

  const stats = {
    triagem: processes.filter(
      (p) =>
        !p.is_conformity_approved &&
        p.status !== 'Concluído' &&
        p.result !== 'approved' &&
        p.result !== 'rejected' &&
        p.result !== 'conditioned',
    ),
    cadastramento: cadastramentoBase,
    cadastramento_com_pendencia: cadastramentoComPendencia,
    cadastramento_sem_pendencia: cadastramentoSemPendencia,
    aguardando_autorizacao: processes.filter(
      (p) =>
        p.is_conformity_approved &&
        (p.status === 'Aguardando Solicitação de Reavaliação' ||
          p.status === 'Autorização Solicitada') &&
        p.status !== 'Concluído' &&
        p.result !== 'approved' &&
        p.result !== 'rejected' &&
        p.result !== 'conditioned',
    ),
    primeira_analise: processes.filter(
      (p) =>
        p.is_conformity_approved &&
        p.current_step !== 'Cadastramento' &&
        p.analysis_type === 'first_analysis' &&
        p.status !== 'Concluído' &&
        p.status !== 'Aguardando Solicitação de Reavaliação' &&
        p.result !== 'approved' &&
        p.result !== 'rejected' &&
        p.result !== 'conditioned',
    ),
    reavaliacao: processes.filter(
      (p) =>
        p.is_conformity_approved &&
        p.current_step !== 'Cadastramento' &&
        p.analysis_type === 'reevaluation' &&
        p.status !== 'Concluído' &&
        p.status !== 'Aguardando Solicitação de Reavaliação' &&
        p.result !== 'approved' &&
        p.result !== 'rejected' &&
        p.result !== 'conditioned',
    ),
    aprovados: processes.filter((p) => p.result === 'approved' && p.type === 'credit'),
  }

  const toggleFilter = (filter: string) => {
    setActiveFilter(activeFilter === filter ? null : filter)
  }

  const handleAuthorization = async (procId: string) => {
    try {
      await pb.collection('processes').update(procId, {
        status: 'Autorização Concluída',
      })
      if (user?.id) {
        await pb.collection('process_logs').create({
          process: procId,
          from_status: 'Autorização Solicitada',
          to_status: 'Autorização Concluída',
          changed_by: user.id,
          note: 'Autorização Gerencial confirmada pelo analista.',
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAcknowledgePendency = async (procId: string) => {
    try {
      await pb.collection('processes').update(procId, {
        status: 'Em Cadastramento',
      })
      if (user?.id) {
        await pb.collection('process_logs').create({
          process: procId,
          from_status: 'Pendência Resolvida',
          to_status: 'Em Cadastramento',
          changed_by: user.id,
          note: 'Pendência reconhecida como resolvida.',
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteProcess = async () => {
    if (!deleteProcessId) return
    setIsDeletingProcess(true)
    try {
      await pb.collection('processes').delete(deleteProcessId)
      toast({ title: 'Processo excluído com sucesso.' })
      setDeleteProcessId(null)
      loadData()
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro ao excluir processo.', variant: 'destructive' })
    } finally {
      setIsDeletingProcess(false)
    }
  }

  const handleEditBuyer = async () => {
    if (!editBuyer || !editBuyer.name.trim()) return
    setIsEditingBuyer(true)
    try {
      await pb.collection('users').update(editBuyer.id, { name: editBuyer.name.trim() })
      toast({ title: 'Nome do cliente atualizado com sucesso.' })
      setEditBuyer(null)
      loadData()
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro ao atualizar nome do cliente.', variant: 'destructive' })
    } finally {
      setIsEditingBuyer(false)
    }
  }

  const [companies, setCompanies] = useState<any[]>([])
  const [showCompanySelect, setShowCompanySelect] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('none')
  const [companySearch, setCompanySearch] = useState('')
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false)
  const [processToLink, setProcessToLink] = useState<any>(null)

  useEffect(() => {
    pb.collection('construction_companies')
      .getFullList({ sort: 'name' })
      .then(setCompanies)
      .catch(console.error)
  }, [])

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(companySearch.toLowerCase()) || c.cnpj.includes(companySearch),
  )

  let selectedCompanyName = 'Não vincular construtora'
  if (selectedCompanyId !== 'none') {
    const c = companies.find((c) => c.id === selectedCompanyId)
    if (c) selectedCompanyName = `${c.name} (${c.cnpj})`
  }

  const handleTransitionToHousing = async () => {
    if (!transitionProcess) return
    setProcessToLink(transitionProcess)
    setShowCompanySelect(true)
  }

  const submitTransition = async () => {
    if (!processToLink) return
    try {
      const updateData: any = {
        type: 'housing',
        current_step: firstHousingStage,
        status: 'Nova Solicitação',
      }
      if (selectedCompanyId && selectedCompanyId !== 'none') {
        updateData.construction_company = selectedCompanyId
      }

      await pb.collection('processes').update(processToLink.id, updateData)

      if (user?.id) {
        await pb.collection('process_logs').create({
          process: processToLink.id,
          from_step: processToLink.current_step || '',
          to_step: firstHousingStage,
          from_status: processToLink.status || '',
          to_status: 'Nova Solicitação',
          changed_by: user.id,
          note: `Processo transferido da Análise de Crédito para Habitacional.${selectedCompanyId !== 'none' ? ' Construtora vinculada.' : ''}`,
        })
      }

      toast({ title: 'Processo transferido para o fluxo Habitacional com sucesso.' })
      setTransitionProcess(null)
      setProcessToLink(null)
      setShowCompanySelect(false)
      setSelectedCompanyId('none')
      setCompanySearch('')
      loadData()
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro ao transferir processo.', variant: 'destructive' })
    }
  }

  let renderedCompanyModal = false

  const renderProcessList = (list: any[], emptyMessage: string) => {
    const shouldRenderModal = showCompanySelect && !renderedCompanyModal
    if (shouldRenderModal) renderedCompanyModal = true

    return (
      <div className="divide-y divide-border/50 relative">
        {shouldRenderModal && processToLink && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-md border flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 pb-4">
                <h2 className="text-lg font-semibold tracking-tight">
                  Deseja vincular uma construtora?
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Selecione uma construtora para vincular a este processo ou continue sem vincular.
                </p>
              </div>
              <div className="p-6 pt-0 flex-1">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <span className="truncate">{selectedCompanyName}</span>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 opacity-50"
                    >
                      <path
                        d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819L7.43179 8.56819C7.60753 8.74393 7.89245 8.74393 8.06819 8.56819L10.5682 6.06819C10.7439 5.89245 10.7439 5.60753 10.5682 5.43179C10.3925 5.25605 10.1075 5.25605 9.93179 5.43179L7.75 7.61358L5.56819 5.43179C5.39245 5.25605 5.10753 5.25605 4.93179 5.43179Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                  {isCompanyDropdownOpen && (
                    <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                      <div className="p-2 sticky top-0 bg-popover border-b">
                        <input
                          type="text"
                          placeholder="Buscar construtora..."
                          value={companySearch}
                          onChange={(e) => setCompanySearch(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="p-1">
                        <div
                          className="relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            setSelectedCompanyId('none')
                            setIsCompanyDropdownOpen(false)
                            setCompanySearch('')
                          }}
                        >
                          Não vincular construtora
                        </div>
                        {filteredCompanies.map((c) => (
                          <div
                            key={c.id}
                            className="relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                            onClick={() => {
                              setSelectedCompanyId(c.id)
                              setIsCompanyDropdownOpen(false)
                              setCompanySearch('')
                            }}
                          >
                            {c.name} ({c.cnpj})
                          </div>
                        ))}
                        {filteredCompanies.length === 0 && (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            Nenhuma construtora encontrada.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 pt-0 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompanySelect(false)
                    setProcessToLink(null)
                  }}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submitTransition}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                >
                  {selectedCompanyId === 'none' ? 'Continuar sem vincular' : 'Vincular e Continuar'}
                </button>
              </div>
            </div>
          </div>
        )}
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
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/process/${proc.id}`}
                      className="font-semibold text-slate-800 hover:text-primary transition-colors text-base flex items-center gap-2"
                    >
                      {proc.expand?.buyer?.name && proc.expand?.buyer_2?.name
                        ? `${proc.expand.buyer.name} / ${proc.expand.buyer_2.name}`
                        : proc.expand?.buyer?.name ||
                          proc.expand?.buyer_2?.name ||
                          'Sem proponente vinculado'}
                    </Link>
                    {proc.buyer &&
                      (user?.role === 'master' ||
                        user?.role === 'analyst' ||
                        user?.role === 'broker') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-primary"
                          onClick={(e) => {
                            e.preventDefault()
                            setEditBuyer({ id: proc.buyer, name: proc.expand?.buyer?.name || '' })
                          }}
                          title="Editar nome do cliente"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(proc.created).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {proc.expand?.assigned_analyst?.name || 'Não atribuído'}
                    </span>
                    {proc.expand?.broker && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <User className="w-3.5 h-3.5" />
                        Corretor: {proc.expand.broker.name}
                      </span>
                    )}
                    <Badge variant="outline" className="font-normal text-[10px] bg-slate-50">
                      {proc.expand?.credit_analysis_type?.name || 'Crédito'}
                    </Badge>
                    {proc.analysis_type && (
                      <Badge
                        variant="secondary"
                        className="font-normal text-[10px] bg-slate-100 text-slate-700"
                      >
                        {proc.analysis_type === 'first_analysis' ? '1ª Análise' : 'Reavaliação'}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-normal text-[10px]',
                        proc.status === 'Pendência'
                          ? 'bg-secondary text-white border-transparent'
                          : proc.status === 'Autorização Solicitada'
                            ? 'bg-amber-100 text-amber-800 border-transparent font-medium'
                            : 'bg-slate-50',
                      )}
                    >
                      {proc.status === 'Autorização Solicitada'
                        ? 'Aguardando Autorização Gerencial'
                        : proc.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0 items-end">
                {proc.status === 'Autorização Solicitada' && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    onClick={(e) => {
                      e.preventDefault()
                      handleAuthorization(proc.id)
                    }}
                  >
                    Informar Autorização Concluída
                  </Button>
                )}
                {proc.status === 'Pendência Resolvida' && (
                  <Button
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse shadow-md"
                    onClick={(e) => {
                      e.preventDefault()
                      handleAcknowledgePendency(proc.id)
                    }}
                  >
                    Pendência Resolvida
                  </Button>
                )}
                {proc.result === 'approved' && proc.type === 'credit' && (
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                    onClick={(e) => {
                      e.preventDefault()
                      setTransitionProcess(proc)
                    }}
                  >
                    Enviar para Habitacional
                  </Button>
                )}
                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  {user?.role === 'master' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 px-2"
                      onClick={(e) => {
                        e.preventDefault()
                        setDeleteProcessId(proc.id)
                      }}
                      title="Excluir processo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button asChild variant="outline" size="sm" className="group flex-1 sm:flex-none">
                    <Link to={`/process/${proc.id}`}>
                      Analisar{' '}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Filas de Análise</h1>
        <p className="text-muted-foreground">
          Gerencie os processos aguardando análise de crédito e reavaliação. Clique nos cards para
          filtrar as filas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <Card
          className={cn(
            'border-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md',
            activeFilter === 'triagem'
              ? 'border-slate-800 shadow-md bg-slate-50'
              : 'border-slate-200',
          )}
          onClick={() => toggleFilter('triagem')}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
            <div className="p-3 rounded-full bg-slate-100 text-slate-700">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-700 text-sm mt-1">Aguardando Triagem</p>
            <p className="text-2xl font-bold text-slate-900">{stats.triagem.length}</p>
          </CardContent>
        </Card>
        {user?.role === 'master' || user?.role === 'analyst' ? (
          <Card
            className={cn(
              'border-2 transition-all hover:-translate-y-1 hover:shadow-md bg-emerald-50/50 flex flex-col overflow-hidden',
              activeFilter === 'cadastramento' ||
                activeFilter === 'cadastramento_sem_pendencia' ||
                activeFilter === 'cadastramento_com_pendencia'
                ? 'border-emerald-600 shadow-md'
                : 'border-emerald-200',
            )}
          >
            <div
              className={cn(
                'flex-1 p-3 flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition-colors',
                activeFilter === 'cadastramento' ? 'bg-emerald-100/50' : 'hover:bg-emerald-100/30',
              )}
              onClick={() => toggleFilter('cadastramento')}
            >
              <div className="p-2 rounded-full bg-emerald-100 text-emerald-700">
                <Edit className="w-4 h-4" />
              </div>
              <p className="font-semibold text-emerald-800 text-sm">Cadastramento</p>
              {stats.cadastramento_com_pendencia.length === 0 && (
                <p className="text-2xl font-bold text-emerald-900 leading-none mt-1">
                  {stats.cadastramento.length}
                </p>
              )}
            </div>
            {stats.cadastramento_com_pendencia.length > 0 && (
              <div className="flex border-t border-emerald-200/50 mt-auto">
                <div
                  className={cn(
                    'flex-1 py-1.5 px-1 text-center cursor-pointer transition-colors hover:bg-emerald-100',
                    activeFilter === 'cadastramento_sem_pendencia' ? 'bg-emerald-200' : '',
                  )}
                  onClick={() => toggleFilter('cadastramento_sem_pendencia')}
                >
                  <p className="text-[10px] text-emerald-700 font-medium leading-tight">
                    Sem Pendência
                  </p>
                  <p className="text-base font-bold text-emerald-900 leading-tight">
                    {stats.cadastramento_sem_pendencia.length}
                  </p>
                </div>
                <div className="w-[1px] bg-emerald-200/50"></div>
                <div
                  className={cn(
                    'flex-1 py-1.5 px-1 text-center cursor-pointer transition-colors hover:bg-red-100',
                    activeFilter === 'cadastramento_com_pendencia' ? 'bg-red-200' : '',
                  )}
                  onClick={() => toggleFilter('cadastramento_com_pendencia')}
                >
                  <p className="text-[10px] text-red-700 font-medium leading-tight">
                    Com Pendência
                  </p>
                  <p className="text-base font-bold text-red-900 leading-tight">
                    {stats.cadastramento_com_pendencia.length}
                  </p>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <Card
            className={cn(
              'border-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md bg-emerald-50/50',
              activeFilter === 'cadastramento'
                ? 'border-emerald-600 shadow-md bg-emerald-100/50'
                : 'border-emerald-200',
            )}
            onClick={() => toggleFilter('cadastramento')}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-700">
                <Edit className="w-5 h-5" />
              </div>
              <p className="font-semibold text-emerald-800 text-sm mt-1">Cadastramento</p>
              <p className="text-2xl font-bold text-emerald-900">{stats.cadastramento.length}</p>
            </CardContent>
          </Card>
        )}
        <Card
          className={cn(
            'border-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md bg-amber-50/50',
            activeFilter === 'aguardando_autorizacao'
              ? 'border-amber-600 shadow-md bg-amber-100/50'
              : 'border-amber-200',
          )}
          onClick={() => toggleFilter('aguardando_autorizacao')}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
            <div className="p-3 rounded-full bg-amber-100 text-amber-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <p className="font-semibold text-amber-800 text-sm mt-1 leading-tight">
              Autorização Reavaliação
            </p>
            <p className="text-2xl font-bold text-amber-900">
              {stats.aguardando_autorizacao.length}
            </p>
          </CardContent>
        </Card>
        <Card
          className={cn(
            'border-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md bg-blue-50/50',
            activeFilter === 'primeira_analise'
              ? 'border-blue-600 shadow-md bg-blue-100/50'
              : 'border-blue-200',
          )}
          onClick={() => toggleFilter('primeira_analise')}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
            <div className="p-3 rounded-full bg-blue-100 text-blue-700">
              <Clock className="w-5 h-5" />
            </div>
            <p className="font-semibold text-blue-800 text-sm mt-1">1ª Análise</p>
            <p className="text-2xl font-bold text-blue-900">{stats.primeira_analise.length}</p>
          </CardContent>
        </Card>
        <Card
          className={cn(
            'border-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md bg-indigo-50/50',
            activeFilter === 'reavaliacao'
              ? 'border-indigo-600 shadow-md bg-indigo-100/50'
              : 'border-indigo-200',
          )}
          onClick={() => toggleFilter('reavaliacao')}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-700">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <p className="font-semibold text-indigo-800 text-sm mt-1">Reavaliação</p>
            <p className="text-2xl font-bold text-indigo-900">{stats.reavaliacao.length}</p>
          </CardContent>
        </Card>
        <Card
          className={cn(
            'border-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md bg-teal-50/50',
            activeFilter === 'aprovados'
              ? 'border-teal-600 shadow-md bg-teal-100/50'
              : 'border-teal-200',
          )}
          onClick={() => toggleFilter('aprovados')}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
            <div className="p-3 rounded-full bg-teal-100 text-teal-700">
              <CheckCircle className="w-5 h-5" />
            </div>
            <p className="font-semibold text-teal-800 text-sm mt-1">Aprovados</p>
            <p className="text-2xl font-bold text-teal-900">{stats.aprovados.length}</p>
          </CardContent>
        </Card>
      </div>

      <div
        className={cn(
          'grid gap-6 mt-8',
          activeFilter ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3',
        )}
      >
        {(!activeFilter || activeFilter === 'triagem') && (
          <Card className="shadow-sm border-slate-200 h-full flex flex-col">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" /> Fila: Triagem
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {renderProcessList(stats.triagem, 'Nenhum processo na fila de Triagem.')}
            </CardContent>
          </Card>
        )}

        {(!activeFilter ||
          activeFilter === 'cadastramento' ||
          activeFilter === 'cadastramento_sem_pendencia' ||
          activeFilter === 'cadastramento_com_pendencia') && (
          <Card className="shadow-sm border-emerald-200 h-full flex flex-col">
            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
              <CardTitle className="text-lg text-emerald-800 flex items-center gap-2">
                <Edit className="w-5 h-5" /> Fila: Cadastramento{' '}
                {activeFilter === 'cadastramento_sem_pendencia'
                  ? '(Sem Pendência)'
                  : activeFilter === 'cadastramento_com_pendencia'
                    ? '(Com Pendência)'
                    : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {renderProcessList(
                activeFilter === 'cadastramento_sem_pendencia'
                  ? stats.cadastramento_sem_pendencia
                  : activeFilter === 'cadastramento_com_pendencia'
                    ? stats.cadastramento_com_pendencia
                    : stats.cadastramento,
                'Nenhum processo na fila de Cadastramento.',
              )}
            </CardContent>
          </Card>
        )}

        {(!activeFilter || activeFilter === 'aguardando_autorizacao') && (
          <Card className="shadow-sm border-amber-200 h-full flex flex-col">
            <CardHeader className="bg-amber-50/50 border-b border-amber-100 pb-4">
              <CardTitle className="text-lg text-amber-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Fila: Aguardando Autorização
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {renderProcessList(
                stats.aguardando_autorizacao,
                'Nenhum processo aguardando autorização.',
              )}
            </CardContent>
          </Card>
        )}

        {(!activeFilter || activeFilter === 'primeira_analise') && (
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
        )}

        {(!activeFilter || activeFilter === 'reavaliacao') && (
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
        )}

        {(!activeFilter || activeFilter === 'aprovados') && (
          <Card className="shadow-sm border-teal-200 h-full flex flex-col">
            <CardHeader className="bg-teal-50/50 border-b border-teal-100 pb-4">
              <CardTitle className="text-lg text-teal-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Fila: Aprovados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {renderProcessList(stats.aprovados, 'Nenhum processo aprovado.')}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!editBuyer} onOpenChange={(open) => !open && setEditBuyer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nome do Cliente</DialogTitle>
            <DialogDescription>Altere o nome do 1º proponente deste processo.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editBuyer?.name || ''}
              onChange={(e) => editBuyer && setEditBuyer({ ...editBuyer, name: e.target.value })}
              placeholder="Nome completo"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBuyer(null)} disabled={isEditingBuyer}>
              Cancelar
            </Button>
            <Button onClick={handleEditBuyer} disabled={isEditingBuyer || !editBuyer?.name?.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteProcessId} onOpenChange={(open) => !open && setDeleteProcessId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Processo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este processo permanentemente? Esta ação não pode ser
              desfeita e removerá todos os dados e documentos vinculados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteProcessId(null)}
              disabled={isDeletingProcess}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProcess}
              disabled={isDeletingProcess}
            >
              Excluir Processo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!transitionProcess}
        onOpenChange={(open) => !open && setTransitionProcess(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir para Habitacional</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja enviar este processo aprovado para o fluxo Habitacional? Ele
              será movido para a etapa "<strong>{firstHousingStage}</strong>".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setTransitionProcess(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={handleTransitionToHousing}
            >
              Confirmar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
