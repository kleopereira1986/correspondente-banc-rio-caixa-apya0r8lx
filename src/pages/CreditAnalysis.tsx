import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Link, useNavigate } from 'react-router-dom'
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
  Search,
  Building2,
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
import { Label } from '@/components/ui/label'
import { ConstructionCompanySelect } from '@/components/ConstructionCompanySelect'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { startOfDay, endOfDay } from 'date-fns'

export default function CreditAnalysis() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [processes, setProcesses] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [brokerFilter, setBrokerFilter] = useState('all')
  const [agencyFilter, setAgencyFilter] = useState('all')
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined)
  const [toDate, setToDate] = useState<Date | undefined>(undefined)

  const [firstHousingStage, setFirstHousingStage] = useState<string>('TRIAGEM CCA')
  const [transitionProcess, setTransitionProcess] = useState<any>(null)

  const [deleteProcessId, setDeleteProcessId] = useState<string | null>(null)
  const [isDeletingProcess, setIsDeletingProcess] = useState(false)
  const [editBuyer, setEditBuyer] = useState<{ id: string; name: string } | null>(null)
  const [isEditingBuyer, setIsEditingBuyer] = useState(false)

  const [changeEvaluationProcess, setChangeEvaluationProcess] = useState<any>(null)
  const [changeEvaluationReason, setChangeEvaluationReason] = useState('')
  const [isSubmittingChangeEvaluation, setIsSubmittingChangeEvaluation] = useState(false)

  const [reevaluationProcess, setReevaluationProcess] = useState<any>(null)
  const [reevaluationReason, setReevaluationReason] = useState('')
  const [isSubmittingReevaluation, setIsSubmittingReevaluation] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const loadData = async () => {
    try {
      const data = await pb.collection('processes').getFullList({
        sort: '-created',
        expand:
          'buyer,buyer_2,assigned_analyst,broker,broker.real_estate_agency,real_estate_agency,credit_analysis_type,property_type,development_type,last_updated_by',
      })
      setProcesses(data)

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
        const triagem = stages.find((s) => s.name.toLowerCase().includes('triagem'))
        if (triagem) setFirstHousingStage(triagem.name)
        else if (stages.length > 0) setFirstHousingStage(stages[0].name)
      })
      .catch(console.error)
  }, [])

  useRealtime('processes', () => loadData())
  useRealtime('documents', () => loadData())

  const uniqueAgencies = Array.from(
    new Set(
      processes
        .filter((p) => p.type === 'credit')
        .map(
          (p) =>
            p.expand?.real_estate_agency?.name ||
            p.expand?.broker?.expand?.real_estate_agency?.name,
        )
        .filter(Boolean),
    ),
  ) as string[]

  const uniqueBrokers = Array.from(
    new Set(
      processes
        .filter((p) => p.type === 'credit')
        .map((p) => p.expand?.broker?.name)
        .filter(Boolean),
    ),
  ) as string[]

  const dateFilterActive = !!fromDate || !!toDate

  const filteredProcesses = processes.filter((p: any) => {
    if (p.type !== 'credit') return false

    if (dateFilterActive) {
      const created = new Date(p.created)
      if (fromDate && created < startOfDay(fromDate)) return false
      if (toDate && created > endOfDay(toDate)) return false
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const name1 = (p.expand?.buyer?.name || '').toLowerCase()
      const cpf1 = (p.expand?.buyer?.cpf || '').toLowerCase()
      const name2 = (p.expand?.buyer_2?.name || '').toLowerCase()
      const cpf2 = (p.expand?.buyer_2?.cpf || '').toLowerCase()
      if (!name1.includes(q) && !cpf1.includes(q) && !name2.includes(q) && !cpf2.includes(q))
        return false
    }

    if (brokerFilter !== 'all' && p.expand?.broker?.name !== brokerFilter) return false
    if (
      agencyFilter !== 'all' &&
      (p.expand?.real_estate_agency?.name || p.expand?.broker?.expand?.real_estate_agency?.name) !==
        agencyFilter
    )
      return false

    return true
  })

  const cadastramentoBase = filteredProcesses.filter(
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
    triagem: filteredProcesses.filter(
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
    aguardando_autorizacao: filteredProcesses.filter(
      (p) =>
        p.is_conformity_approved &&
        (p.status === 'Aguardando Solicitação de Reavaliação' ||
          p.status === 'Autorização Solicitada') &&
        p.status !== 'Concluído' &&
        p.result !== 'approved' &&
        p.result !== 'rejected' &&
        p.result !== 'conditioned',
    ),
    primeira_analise: filteredProcesses.filter(
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
    reavaliacao: filteredProcesses.filter(
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
    aprovados: filteredProcesses.filter((p) => p.result === 'approved'),
  }

  const toggleFilter = (filter: string) => {
    setActiveFilter(activeFilter === filter ? null : filter)
  }

  const handleAuthorization = async (procId: string) => {
    try {
      await pb.collection('processes').update(procId, { status: 'Autorização Concluída' })
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
      await pb.collection('processes').update(procId, { status: 'Em Cadastramento' })
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
      setIsSubmittingChangeEvaluation(false)
    }
  }

  const handleReevaluation = async () => {
    if (!reevaluationProcess) return
    if (!reevaluationReason.trim()) {
      toast({
        title: 'Aviso',
        description: 'Preencha o motivo da reavaliação.',
        variant: 'destructive',
      })
      return
    }
    setIsSubmittingReevaluation(true)
    try {
      const fromStep = reevaluationProcess.current_step || 'Decisão'
      const fromStatus = reevaluationProcess.status || 'Condicionado'
      await pb.collection('processes').update(reevaluationProcess.id, {
        analysis_type: 'reevaluation',
        is_conformity_approved: true,
        current_step: 'Análise',
        status: 'Aguardando Análise',
        result: 'pending',
      })
      if (user?.id) {
        await pb.collection('process_logs').create({
          process: reevaluationProcess.id,
          from_step: fromStep,
          to_step: 'Análise',
          from_status: fromStatus,
          to_status: 'Aguardando Análise',
          changed_by: user.id,
          note: `Reavaliação solicitada pelo corretor. Motivo: ${reevaluationReason.trim()}`,
        })
      }
      toast({ title: 'Reavaliação solicitada com sucesso!' })
      setReevaluationProcess(null)
      setReevaluationReason('')
      loadData()
    } catch (e: any) {
      console.error(e)
      toast({
        title: 'Erro ao solicitar reavaliação',
        description: 'Falha na comunicação com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingReevaluation(false)
    }
  }

  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [creditSearch, setCreditSearch] = useState('')
  const [brokers, setBrokers] = useState<any[]>([])
  const [agencies, setAgencies] = useState<any[]>([])

  useEffect(() => {
    pb.collection('construction_companies')
      .getFullList({ sort: 'name' })
      .then(setCompanies)
      .catch(console.error)
  }, [])

  useEffect(() => {
    pb.collection('users')
      .getFullList({ filter: 'role="broker"' })
      .then(setBrokers)
      .catch(console.error)
    pb.collection('real_estate_agencies')
      .getFullList({ sort: 'name' })
      .then(setAgencies)
      .catch(console.error)
  }, [])

  const submitTransition = async () => {
    if (!transitionProcess || isTransitioning) return
    if (!selectedCompanyId) {
      toast({
        title: 'Aviso',
        description: 'Selecione uma construtora para continuar.',
        variant: 'destructive',
      })
      return
    }
    setIsTransitioning(true)
    try {
      const targetStep = firstHousingStage || 'TRIAGEM CCA'
      const updateData: any = {
        type: 'housing',
        current_step: targetStep,
        status: 'Nova Solicitação',
        result: 'approved',
        construction_company: selectedCompanyId,
        last_updated_by: user?.id || '',
      }
      await pb.collection('processes').update(transitionProcess.id, updateData)
      try {
        await pb.send('/backend/v1/process-logs/manual', {
          method: 'POST',
          body: JSON.stringify({
            process: transitionProcess.id,
            from_step: transitionProcess.current_step || '',
            to_step: targetStep,
            from_status: transitionProcess.status || '',
            to_status: 'Nova Solicitação',
            note: 'Transição para fluxo habitacional com seleção de construtora',
          }),
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (logErr) {
        console.error('Erro ao registrar log manual', logErr)
      }
      toast({ title: 'Processo enviado com sucesso para a Triagem CCA!' })
      setTransitionProcess(null)
      setSelectedCompanyId('')
      navigate('/housing-kanban')
      loadData()
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao enviar para Kanban',
        description:
          err?.response?.message || err?.message || 'Falha na comunicação com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setIsTransitioning(false)
    }
  }

  const handleChangeEvaluation = async () => {
    if (!changeEvaluationProcess) return
    if (!changeEvaluationReason.trim()) {
      toast({
        title: 'Aviso',
        description: 'Preencha o motivo da solicitação.',
        variant: 'destructive',
      })
      return
    }
    setIsSubmittingChangeEvaluation(true)
    try {
      const fromStep = changeEvaluationProcess.current_step || 'Aprovado'
      await pb.collection('processes').update(changeEvaluationProcess.id, {
        current_step: 'triagem',
        result: 'pending',
        status: 'Aguardando Triagem',
        is_conformity_approved: false,
      })
      if (user?.id) {
        await pb.collection('process_logs').create({
          process: changeEvaluationProcess.id,
          from_step: fromStep,
          to_step: 'triagem',
          changed_by: user.id,
          note: changeEvaluationReason.trim(),
        })
      }
      toast({ title: 'Mudança na avaliação solicitada com sucesso!' })
      setChangeEvaluationProcess(null)
      setChangeEvaluationReason('')
      loadData()
    } catch (e: any) {
      console.error(e)
      toast({
        title: 'Erro ao solicitar mudança',
        description: 'Falha na comunicação com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingChangeEvaluation(false)
    }
  }

  let renderedFilterBar = false

  const applyCreditFilters = (list: any[]) => {
    return list.filter((p) => {
      if (creditSearch) {
        const q = creditSearch.toLowerCase()
        const buyerName = (p.expand?.buyer?.name || '').toLowerCase()
        const buyerCpf = (p.expand?.buyer?.cpf || '').toLowerCase()
        const buyer2Name = (p.expand?.buyer_2?.name || '').toLowerCase()
        const buyer2Cpf = (p.expand?.buyer_2?.cpf || '').toLowerCase()
        if (
          !buyerName.includes(q) &&
          !buyerCpf.includes(q) &&
          !buyer2Name.includes(q) &&
          !buyer2Cpf.includes(q)
        ) {
          return false
        }
      }
      if (brokerFilter !== 'all' && p.broker !== brokerFilter) return false
      if (agencyFilter !== 'all') {
        const buyerAgency = p.expand?.buyer?.real_estate_agency || ''
        if (buyerAgency !== agencyFilter) return false
      }
      return true
    })
  }

  const renderProcessList = (list: any[], emptyMessage: string) => {
    const filteredList = applyCreditFilters(list)
    const shouldRenderFilterBar = !renderedFilterBar
    if (shouldRenderFilterBar) renderedFilterBar = true
    const effectiveEmptyMessage = dateFilterActive
      ? 'Nenhum registro encontrado para este período.'
      : emptyMessage

    return (
      <div className="divide-y divide-border/50 relative">
        {shouldRenderFilterBar && (
          <div className="flex flex-col sm:flex-row gap-2 p-3 bg-muted/30 border-b border-border/50">
            <input
              type="search"
              placeholder="Buscar por nome ou CPF..."
              className="flex h-9 w-full sm:flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={creditSearch}
              onChange={(e) => setCreditSearch(e.target.value)}
            />
            <select
              className="flex h-9 w-full sm:w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={brokerFilter}
              onChange={(e) => setBrokerFilter(e.target.value)}
            >
              <option value="all">Todos os corretores</option>
              {brokers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              className="flex h-9 w-full sm:w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
            >
              <option value="all">Todas as imobiliárias</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {list.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <CheckCircle2 className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-sm">{effectiveEmptyMessage}</p>
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
                    {(proc.expand?.real_estate_agency?.name ||
                      proc.expand?.broker?.expand?.real_estate_agency?.name) && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Building2 className="w-3.5 h-3.5" />
                        Imobiliária:{' '}
                        {proc.expand?.real_estate_agency?.name ||
                          proc.expand?.broker?.expand?.real_estate_agency?.name}
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
                {proc.result === 'approved' &&
                  proc.type === 'credit' &&
                  ['master', 'analyst', 'broker'].includes(user?.role || '') && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-200 text-amber-700 hover:bg-amber-50 shadow-sm text-xs"
                        onClick={(e) => {
                          e.preventDefault()
                          setChangeEvaluationProcess(proc)
                        }}
                      >
                        SOLICITAR MUDANÇA NA AVALIAÇÃO
                      </Button>
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm text-xs"
                        onClick={(e) => {
                          e.preventDefault()
                          setSelectedCompanyId(proc.construction_company || '')
                          setTransitionProcess(proc)
                        }}
                      >
                        Enviar para processo habitacional
                      </Button>
                    </div>
                  )}
                {proc.result === 'conditioned' &&
                  proc.type === 'credit' &&
                  (user?.id === proc.broker ||
                    user?.role === 'master' ||
                    user?.role === 'analyst') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm text-xs mt-2"
                      onClick={(e) => {
                        e.preventDefault()
                        setReevaluationProcess(proc)
                      }}
                    >
                      SOLICITAR REAVALIAÇÃO
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg border shadow-sm mb-6">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Buscar</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Imobiliária</label>
          <Select value={agencyFilter} onValueChange={setAgencyFilter}>
            <SelectTrigger className="bg-slate-50">
              <SelectValue placeholder="Todas as Imobiliárias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Imobiliárias</SelectItem>
              {uniqueAgencies.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Corretor Parceiro</label>
          <Select value={brokerFilter} onValueChange={setBrokerFilter}>
            <SelectTrigger className="bg-slate-50">
              <SelectValue placeholder="Todos os Corretores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Corretores</SelectItem>
              {uniqueBrokers.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {user?.role === 'master' && (
          <div className="md:col-span-3 border-t border-slate-100 pt-4 mt-1">
            <DateRangeFilter
              fromDate={fromDate}
              toDate={toDate}
              onFromChange={setFromDate}
              onToChange={setToDate}
              onClear={() => {
                setFromDate(undefined)
                setToDate(undefined)
              }}
            />
          </div>
        )}
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
        open={!!changeEvaluationProcess}
        onOpenChange={(open) => !open && setChangeEvaluationProcess(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Mudança na Avaliação</DialogTitle>
            <DialogDescription>
              Ao confirmar, o processo voltará para a fila de Triagem para que as informações sejam
              reavaliadas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo da solicitação</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Descreva o que precisa ser alterado..."
                value={changeEvaluationReason}
                onChange={(e) => setChangeEvaluationReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangeEvaluationProcess(null)}
              disabled={isSubmittingChangeEvaluation}
            >
              Cancelar
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleChangeEvaluation}
              disabled={isSubmittingChangeEvaluation || !changeEvaluationReason.trim()}
            >
              {isSubmittingChangeEvaluation ? 'Enviando...' : 'Confirmar Solicitação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!reevaluationProcess}
        onOpenChange={(open) => !open && setReevaluationProcess(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Reavaliação</DialogTitle>
            <DialogDescription>
              Ao confirmar, o processo será enviado para a fila de Reavaliação para que seja
              reanalisado pela equipe de crédito.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo da reavaliação</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Descreva o motivo da reavaliação..."
                value={reevaluationReason}
                onChange={(e) => setReevaluationReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReevaluationProcess(null)}
              disabled={isSubmittingReevaluation}
            >
              Cancelar
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleReevaluation}
              disabled={isSubmittingReevaluation || !reevaluationReason.trim()}
            >
              {isSubmittingReevaluation ? 'Enviando...' : 'Confirmar Reavaliação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!transitionProcess}
        onOpenChange={(open) => {
          if (!open) {
            setTransitionProcess(null)
            setSelectedCompanyId('')
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar para Processo Habitacional</DialogTitle>
            <DialogDescription>
              Informe qual a Construtora responsável por este processo.
              <br />O processo será enviado para o fluxo habitacional na etapa TRIAGEM CCA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-sm font-medium">Construtora *</Label>
            <ConstructionCompanySelect
              companies={companies}
              value={selectedCompanyId}
              onChange={setSelectedCompanyId}
            />
            {!selectedCompanyId && (
              <p className="text-sm text-red-600 font-medium">
                É obrigatório selecionar uma construtora para continuar.
              </p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setTransitionProcess(null)
                setSelectedCompanyId('')
              }}
              disabled={isTransitioning}
            >
              Cancelar
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={submitTransition}
              disabled={isTransitioning || !selectedCompanyId}
            >
              {isTransitioning ? 'Enviando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
