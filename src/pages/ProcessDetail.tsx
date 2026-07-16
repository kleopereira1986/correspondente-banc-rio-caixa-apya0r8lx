import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  ArrowRight,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  UploadCloud,
  File as FileIcon,
  Link as LinkIcon,
  Loader2,
  FileText,
  RefreshCcw,
  FileSignature,
  Edit,
  Trash2,
  Building2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import {
  getProcess,
  getDocuments,
  updateProcess,
  createDocument,
  updateDocument,
  getUsers,
  getCreditDocumentTypes,
  getProcessLogs,
  createProcessLog,
  deleteDocument,
} from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'

export default function ProcessDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isNewSubmission = new URLSearchParams(location.search).get('success') === 'true'
  const { toast } = useToast()
  const { user } = useAuth()
  const [process, setProcess] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [creditDocumentTypes, setCreditDocumentTypes] = useState<any[]>([])
  const [pendencyReason, setPendencyReason] = useState('')
  const [isPendencyDialogOpen, setIsPendencyDialogOpen] = useState(false)
  const [isSubmittingPendency, setIsSubmittingPendency] = useState(false)

  const [resolvePendencyDialog, setResolvePendencyDialog] = useState(false)
  const [resolvePendencyNote, setResolvePendencyNote] = useState('')
  const [isResolvingPendency, setIsResolvingPendency] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [analysts, setAnalysts] = useState<any[]>([])
  const [transferAnalyst, setTransferAnalyst] = useState('')
  const [logs, setLogs] = useState<any[]>([])
  const [constructionCompanies, setConstructionCompanies] = useState<any[]>([])

  const [approveDialog, setApproveDialog] = useState(false)
  const [conditionDialog, setConditionDialog] = useState(false)
  const [rejectDialog, setRejectDialog] = useState(false)
  const [editResultDialog, setEditResultDialog] = useState(false)
  const [editResultForm, setEditResultForm] = useState({
    result: 'approved',
    approved_financing_value: '',
    approved_installment_value: '',
    federal_subsidy: '',
    amortization_system: '',
    evaluation_expiry_date: '',
    conditioning_reason_type: '',
    rejection_reason_type: '',
  })
  const [conditioningReasons, setConditioningReasons] = useState<any[]>([])
  const [rejectionReasons, setRejectionReasons] = useState<any[]>([])
  const [decisionForm, setDecisionForm] = useState({
    approved_financing_value: '',
    approved_installment_value: '',
    evaluation_expiry_date: '',
    additional_details: '',
    conditioning_reason_type: '',
    conditioned_installment_value: '',
    rejection_reason_type: '',
    rejection_reason: '',
    federal_subsidy: '',
    amortization_system: '',
  })
  const [approvalFile, setApprovalFile] = useState<File | null>(null)

  const [uploadingSlots, setUploadingSlots] = useState<Record<string, boolean>>({})
  const [manualNote, setManualNote] = useState('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)
  const [triageDialog, setTriageDialog] = useState(false)
  const [analysisType, setAnalysisType] = useState('')
  const [isLoadingConformity, setIsLoadingConformity] = useState(false)

  const [editBuyer, setEditBuyer] = useState<{ id: string; name: string } | null>(null)
  const [isEditingBuyer, setIsEditingBuyer] = useState(false)

  const [editBroker, setEditBroker] = useState<boolean>(false)
  const [selectedBroker, setSelectedBroker] = useState<string>('')
  const [agencyBrokers, setAgencyBrokers] = useState<any[]>([])

  const [editAgency, setEditAgency] = useState<boolean>(false)
  const [selectedAgency, setSelectedAgency] = useState<string>('')
  const [agencies, setAgencies] = useState<any[]>([])

  const loadBrokers = async () => {
    if (user?.role === 'real_estate_agency') {
      const data = await pb.collection('users').getFullList({
        filter: `role = 'broker' && real_estate_agency = '${user.real_estate_agency}'`,
      })
      setAgencyBrokers(data)
    } else if (user?.role === 'master') {
      const data = await pb.collection('users').getFullList({
        filter: `role = 'broker'`,
      })
      setAgencyBrokers(data)
    }
  }

  useEffect(() => {
    if (user?.role === 'real_estate_agency' || user?.role === 'master') {
      loadBrokers()
    }
  }, [user])

  const handleEditBrokerSubmit = async () => {
    if (!process) return
    try {
      await updateProcess(process.id, { broker: selectedBroker === 'none' ? '' : selectedBroker })
      toast({ title: 'Corretor atualizado com sucesso.' })
      setEditBroker(false)
      loadData()
    } catch (e) {
      toast({ title: 'Erro ao atualizar corretor.', variant: 'destructive' })
    }
  }

  const handleEditAgencySubmit = async () => {
    if (!process) return
    try {
      await updateProcess(process.id, {
        real_estate_agency: selectedAgency === 'none' ? '' : selectedAgency,
      })
      toast({ title: 'Imobiliária atualizada com sucesso.' })
      setEditAgency(false)
      loadData()
    } catch (e) {
      toast({ title: 'Erro ao atualizar imobiliária.', variant: 'destructive' })
    }
  }

  const [changeEvaluationDialog, setChangeEvaluationDialog] = useState(false)
  const [changeEvaluationReason, setChangeEvaluationReason] = useState('')
  const [isSubmittingChangeEvaluation, setIsSubmittingChangeEvaluation] = useState(false)

  const [reevaluationDialog, setReevaluationDialog] = useState(false)
  const [reevaluationReason, setReevaluationReason] = useState('')
  const [isSubmittingReevaluation, setIsSubmittingReevaluation] = useState(false)

  const isAnalyst = user?.role === 'master' || user?.role === 'analyst'

  const loadData = async () => {
    if (!id) return
    try {
      const p = await pb.collection('processes').getOne(id, {
        expand:
          'buyer,buyer_2,assigned_analyst,broker,real_estate_agency,credit_analysis_type,property_type,development_type,construction_company',
      })
      setProcess(p)

      // Carregar dependências separadamente para evitar falha geral
      try {
        const [docs, docTypes, processLogs, condReasons, rejReasons, ccList, agencyList] =
          await Promise.all([
            getDocuments(id).catch(() => []),
            getCreditDocumentTypes().catch(() => []),
            getProcessLogs(id).catch(() => []),
            pb
              .collection('conditioning_reasons')
              .getFullList({ sort: 'name' })
              .catch(() => []),
            pb
              .collection('rejection_reasons')
              .getFullList({ sort: 'name' })
              .catch(() => []),
            pb
              .collection('construction_companies')
              .getFullList({ sort: 'name' })
              .catch(() => []),
            pb
              .collection('real_estate_agencies')
              .getFullList({ sort: 'name' })
              .catch(() => []),
          ])
        setDocuments(docs)
        setCreditDocumentTypes(docTypes)
        setLogs(processLogs)
        setConditioningReasons(condReasons)
        setRejectionReasons(rejReasons)
        setConstructionCompanies(ccList)
        setAgencies(agencyList)
      } catch (err) {
        console.error('Erro ao carregar dependências', err)
      }
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro', description: 'Processo não encontrado.', variant: 'destructive' })
      navigate('/dashboard')
    }
  }

  const loadAnalysts = async () => {
    if (isAnalyst) {
      const users = await getUsers('analyst')
      setAnalysts(users)
    }
  }

  useEffect(() => {
    loadData()
    loadAnalysts()
  }, [id])

  useRealtime('processes', () => loadData())
  useRealtime('documents', () => loadData())
  useRealtime('credit_document_types', () => loadData())
  useRealtime('process_logs', () => loadData())
  useRealtime('conditioning_reasons', () => loadData())
  useRealtime('rejection_reasons', () => loadData())
  useRealtime('users', () => loadData())

  const handleAction = async (
    action:
      | 'pendency'
      | 'transfer'
      | 'claim'
      | 'start'
      | 'resolve_pendency'
      | 'send_to_analysis'
      | 'solicitar_autorizacao_reavaliacao'
      | 'marcar_autorizacao_solicitada',
  ) => {
    if (!process) return
    try {
      if (action === 'pendency') {
        if (!pendencyReason.trim()) {
          toast({
            title: 'Aviso',
            description: 'A descrição da pendência é obrigatória.',
            variant: 'destructive',
          })
          return
        }
        setIsSubmittingPendency(true)
        try {
          const fromStatus = process.status || 'Início'
          const fromStep = process.current_step || 'Análise'

          await pb.send('/backend/v1/process-logs/manual', {
            method: 'POST',
            body: JSON.stringify({
              process: process.id,
              from_step: fromStep,
              to_step: 'Análise',
              from_status: fromStatus,
              to_status: 'Pendência',
              note: pendencyReason.trim(),
            }),
            headers: { 'Content-Type': 'application/json' },
          })

          await updateProcess(process.id, {
            result: 'pending',
            status: 'Pendência',
            observations: pendencyReason.trim(),
            last_updated_by: user?.id || '',
          })

          toast({ title: 'Pendência registrada com sucesso!' })
          setPendencyReason('')
          setIsPendencyDialogOpen(false)
          loadData()
        } catch (e: any) {
          toast({
            title: 'Erro ao registrar pendência',
            description: e.message || 'Não foi possível atualizar.',
            variant: 'destructive',
          })
        } finally {
          setIsSubmittingPendency(false)
        }
        return
      } else if (action === 'resolve_pendency') {
        // Handled by handleResolvePendency
      } else if (action === 'start') {
        await updateProcess(process.id, {
          status: 'Processo Iniciado',
        })
        toast({ title: 'Processo Iniciado' })
      } else if (action === 'claim') {
        const newStatus =
          process.current_step === 'Cadastramento' || process.status === 'Aguardando Cadastramento'
            ? 'Em Cadastramento'
            : 'Em Análise'
        const newStep = process.current_step || 'Análise'
        await updateProcess(process.id, {
          assigned_analyst: user?.id,
          status: newStatus,
          current_step: newStep,
        })
        toast({ title: 'Processo Assumido' })
      } else if (action === 'transfer') {
        if (!transferAnalyst) return
        const newStatus =
          process.current_step === 'Cadastramento' || process.status === 'Aguardando Cadastramento'
            ? 'Em Cadastramento'
            : 'Em Análise'
        const newStep = process.current_step || 'Análise'
        await updateProcess(process.id, {
          assigned_analyst: transferAnalyst,
          status: newStatus,
          current_step: newStep,
        })
        toast({ title: 'Processo Transferido' })
      } else if (action === 'send_to_analysis') {
        await updateProcess(process.id, {
          status: 'Aguardando Análise',
          current_step: 'Análise',
        })
        toast({ title: 'Enviado para Análise' })
      } else if (action === 'solicitar_autorizacao_reavaliacao') {
        await updateProcess(process.id, {
          status: 'Aguardando Solicitação de Reavaliação',
          current_step: 'Análise',
        })
        toast({ title: 'Autorização de Reavaliação Solicitada' })
      } else if (action === 'marcar_autorizacao_solicitada') {
        await updateProcess(process.id, {
          status: 'Autorização Solicitada',
          current_step: 'Análise',
        })
        toast({ title: 'Autorização Solicitada Registrada' })
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar.', variant: 'destructive' })
    }
  }

  const handleTriageApproval = async () => {
    if (!process) return
    if (!analysisType) {
      toast({ title: 'Selecione a classificação da análise', variant: 'destructive' })
      return
    }

    setIsLoadingConformity(true)
    try {
      const fromStatus = process.status || 'Início'
      const fromStep = process.current_step || 'Recepção'

      const payload: any = {
        is_conformity_approved: true,
        analysis_type: analysisType,
        current_step: 'Cadastramento',
        status: 'Aguardando Cadastramento',
        observations: `Triagem concluída como ${analysisType === 'first_analysis' ? 'Primeira Análise' : 'Reavaliação'}`,
      }

      if (process.assigned_analyst) {
        payload.assigned_analyst = ''
      }

      await updateProcess(process.id, payload)

      setTriageDialog(false)
      toast({ title: 'Triagem aprovada. Processo enviado para Fila de Cadastramento.' })
    } catch (e) {
      toast({ title: 'Erro ao aprovar triagem', variant: 'destructive' })
    } finally {
      setIsLoadingConformity(false)
    }
  }

  const handleChangeEvaluation = async () => {
    if (!process) return
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
      const fromStep = process.current_step || 'Aprovado'

      await createProcessLog({
        process: process.id,
        from_step: fromStep,
        to_step: 'triagem',
        from_status: process.status || 'Aprovado',
        to_status: 'Aguardando Triagem',
        changed_by: user?.id || '',
        note: changeEvaluationReason.trim(),
      })

      await updateProcess(process.id, {
        current_step: 'triagem',
        result: 'pending',
        status: 'Aguardando Triagem',
        is_conformity_approved: false,
        last_updated_by: user?.id || '',
      })

      toast({ title: 'Mudança na avaliação solicitada com sucesso!' })
      setChangeEvaluationDialog(false)
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

  const handleReevaluation = async () => {
    if (!process) return
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
      const fromStep = process.current_step || 'Decisão'
      const fromStatus = process.status || 'Condicionado'

      await createProcessLog({
        process: process.id,
        from_step: fromStep,
        to_step: 'Análise',
        from_status: fromStatus,
        to_status: 'Aguardando Análise',
        changed_by: user?.id || '',
        note: `Reavaliação solicitada pelo corretor. Motivo: ${reevaluationReason.trim()}`,
      })

      await updateProcess(process.id, {
        analysis_type: 'reevaluation',
        is_conformity_approved: true,
        current_step: 'Análise',
        status: 'Aguardando Análise',
        result: 'pending',
        last_updated_by: user?.id || '',
      })

      toast({ title: 'Reavaliação solicitada com sucesso!' })
      setReevaluationDialog(false)
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
      toast({ title: 'Erro ao atualizar nome.', variant: 'destructive' })
    } finally {
      setIsEditingBuyer(false)
    }
  }

  const handleResolvePendency = async () => {
    if (!process) return
    if (!resolvePendencyNote.trim()) {
      toast({
        title: 'Aviso',
        description: 'Preencha a descrição da resolução.',
        variant: 'destructive',
      })
      return
    }

    setIsResolvingPendency(true)
    try {
      await pb.send(`/backend/v1/processes/${process.id}/resolve-pendency`, {
        method: 'POST',
        body: JSON.stringify({ note: resolvePendencyNote }),
        headers: { 'Content-Type': 'application/json' },
      })

      toast({ title: 'Pendência resolvida com sucesso!' })
      setResolvePendencyDialog(false)
      setResolvePendencyNote('')
      loadData()
    } catch (e: any) {
      console.error(e)
      toast({
        title: 'Erro ao salvar resolução. Por favor, tente novamente.',
        description: e.message || 'Falha na comunicação com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setIsResolvingPendency(false)
    }
  }

  const openEditResult = () => {
    setEditResultForm({
      result: process.result || 'approved',
      approved_financing_value: process.approved_financing_value?.toString() || '',
      approved_installment_value: process.approved_installment_value?.toString() || '',
      federal_subsidy: process.federal_subsidy?.toString() || '',
      amortization_system: process.amortization_system || '',
      evaluation_expiry_date: process.evaluation_expiry_date
        ? String(process.evaluation_expiry_date).substring(0, 10)
        : '',
      conditioning_reason_type: process.conditioning_reason_type || '',
      rejection_reason_type: process.rejection_reason_type || '',
    })
    setEditResultDialog(true)
  }

  const handleEditResult = async () => {
    if (!process) return
    try {
      const from_status = process.status || ''
      let to_status = process.status || ''
      let to_current_step = process.current_step || ''

      if (editResultForm.result === 'approved') {
        to_status = 'Concluído'
        to_current_step = 'Aprovado'
      } else if (editResultForm.result === 'conditioned') {
        to_status = 'Condicionado'
        to_current_step = 'Decisão'
      } else if (editResultForm.result === 'rejected') {
        to_status = 'Concluído'
        to_current_step = 'Decisão'
      } else if (editResultForm.result === 'pending') {
        to_status = 'Pendência'
        to_current_step = 'Análise'
      }

      const payload: any = {
        result: editResultForm.result,
        status: to_status,
        current_step: to_current_step,
        approved_financing_value: editResultForm.approved_financing_value || null,
        approved_installment_value: editResultForm.approved_installment_value || null,
        federal_subsidy: editResultForm.federal_subsidy || null,
        amortization_system: editResultForm.amortization_system || '',
        evaluation_expiry_date: editResultForm.evaluation_expiry_date || null,
        conditioning_reason_type: editResultForm.conditioning_reason_type || '',
        rejection_reason_type: editResultForm.rejection_reason_type || '',
      }

      await createProcessLog({
        process: process.id,
        from_status,
        to_status,
        from_step: process.current_step || '',
        to_step: to_current_step,
        changed_by: user?.id || '',
        note: `Result manually edited by user ${user?.name || 'Unknown'}`,
      })

      await updateProcess(process.id, { ...payload, last_updated_by: user?.id || '' })

      toast({ title: 'Resultado editado com sucesso!' })
      setEditResultDialog(false)
      loadData()
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o resultado.',
        variant: 'destructive',
      })
    }
  }

  const handleDecision = async (action: 'approve' | 'condition' | 'reject') => {
    if (!process) return
    try {
      const basePayload: any = {
        status: action === 'condition' ? 'Condicionado' : 'Concluído',
        current_step: action === 'approve' ? 'Aprovado' : 'Decisão',
      }

      if (action === 'approve') {
        const formData = new FormData()
        formData.append('status', basePayload.status)
        formData.append('current_step', basePayload.current_step)
        formData.append('result', 'approved')
        formData.append('approved_financing_value', decisionForm.approved_financing_value)
        formData.append('approved_installment_value', decisionForm.approved_installment_value)
        formData.append('evaluation_expiry_date', decisionForm.evaluation_expiry_date)
        formData.append('additional_details', decisionForm.additional_details)
        if (decisionForm.federal_subsidy) {
          formData.append('federal_subsidy', decisionForm.federal_subsidy)
        }
        if (decisionForm.amortization_system) {
          formData.append('amortization_system', decisionForm.amortization_system)
        }
        if (approvalFile) {
          formData.append('approval_file', approvalFile)
        }

        await updateProcess(process.id, formData)
        setApproveDialog(false)
        toast({ title: 'Processo Aprovado' })
      } else if (action === 'condition') {
        if (!decisionForm.conditioning_reason_type) {
          toast({
            title: 'Erro',
            description: 'Selecione um motivo de condicionamento.',
            variant: 'destructive',
          })
          return
        }
        await updateProcess(process.id, {
          ...basePayload,
          result: 'conditioned',
          conditioning_reason_type: decisionForm.conditioning_reason_type,
          conditioned_installment_value: Number(decisionForm.conditioned_installment_value),
        })
        setConditionDialog(false)
        toast({ title: 'Aprovação Condicionada Registrada' })
      } else if (action === 'reject') {
        if (!decisionForm.rejection_reason_type) {
          toast({
            title: 'Erro',
            description: 'Selecione um motivo de reprovação.',
            variant: 'destructive',
          })
          return
        }
        await updateProcess(process.id, {
          ...basePayload,
          result: 'rejected',
          rejection_reason_type: decisionForm.rejection_reason_type,
          rejection_reason: decisionForm.rejection_reason,
        })
        setRejectDialog(false)
        toast({ title: 'Processo Reprovado' })
      }
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a decisão.',
        variant: 'destructive',
      })
    }
  }

  const handleUploadSlot = async (
    e: React.ChangeEvent<HTMLInputElement>,
    cat: string,
    slotName: string,
    uploadKey?: string,
  ) => {
    const file = e.target.files?.[0]
    if (!file || !process) return

    const key = uploadKey || `${cat}-${slotName}`
    const formData = new FormData()
    formData.append('process', process.id)
    formData.append('file', file)
    formData.append('name', slotName)
    formData.append('uploaded_by', user?.id || '')
    formData.append('category', cat)
    formData.append('status', 'review')

    try {
      setUploadingSlots((prev) => ({ ...prev, [key]: true }))
      await createDocument(formData as any)
      toast({ title: 'Documento enviado com sucesso!' })
      e.target.value = ''
      loadData()
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar o documento.',
        variant: 'destructive',
      })
    } finally {
      setUploadingSlots((prev) => ({ ...prev, [key]: false }))
    }
  }

  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o documento "${docName}"?`)) return
    try {
      setDeletingDocId(docId)
      await deleteDocument(docId)
      toast({ title: 'Documento excluído com sucesso!' })
      loadData()
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o documento.',
        variant: 'destructive',
      })
    } finally {
      setDeletingDocId(null)
    }
  }

  const handleUpdateDocStatus = async (docId: string, status: string) => {
    try {
      setUploadingSlots((prev) => ({ ...prev, [docId + '-status']: true }))
      await updateDocument(docId, { status })
      toast({ title: 'Status do documento atualizado' })
      loadData()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      })
    } finally {
      setUploadingSlots((prev) => ({ ...prev, [docId + '-status']: false }))
    }
  }

  const handleManualNoteSubmit = async () => {
    if (!manualNote.trim() || !process) return
    setIsSubmittingNote(true)
    try {
      await pb.send('/backend/v1/process-logs/manual', {
        method: 'POST',
        body: JSON.stringify({ process: process.id, note: manualNote.trim() }),
        headers: { 'Content-Type': 'application/json' },
      })
      setManualNote('')
      toast({ title: 'Observação registrada com sucesso!' })
      loadData()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao registrar',
        description: 'Ocorreu um erro ao salvar sua observação.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingNote(false)
    }
  }

  const handleReplaceSlot = async (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('status', 'review')

    try {
      setUploadingSlots((prev) => ({ ...prev, [docId]: true }))
      await updateDocument(docId, formData as any)
      toast({ title: 'Documento substituído com sucesso!' })
      e.target.value = ''
      loadData()
    } catch (error) {
      toast({
        title: 'Erro ao substituir',
        description: 'Não foi possível substituir o documento.',
        variant: 'destructive',
      })
    } finally {
      setUploadingSlots((prev) => ({ ...prev, [docId]: false }))
    }
  }

  const handleCopyLink = () => {
    if (!process) return
    const url = `${window.location.origin}/public/onboarding/${process.id}`
    navigator.clipboard.writeText(url)
    toast({
      title: 'Link copiado!',
      description: 'Envie este link para o comprador acessar a página de cadastro.',
    })
  }

  const generatePDF = () => {
    if (!process) return
    const buyer = process.expand?.buyer || {}
    const creditType = process.expand?.credit_analysis_type?.name || '-'
    const devType = process.expand?.development_type?.name || '-'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Ficha de Avaliação - ${process.id}</title>
          <style>
            @media print { body { -webkit-print-color-adjust: exact; } }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.5; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #0f172a; margin-bottom: 8px; }
            .title { font-size: 18px; color: #64748b; font-weight: 500; text-transform: uppercase; }
            .meta { margin-top: 12px; color: #94a3b8; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 15px; }
            th, td { text-align: left; padding: 14px 12px; border-bottom: 1px solid #e2e8f0; }
            th { width: 35%; color: #64748b; font-weight: 500; }
            td { font-weight: 600; color: #0f172a; }
            .section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; margin-top: 40px; background: #f8fafc; padding: 10px 16px; border-radius: 6px; border-left: 4px solid #0f172a; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">CCA Digital</div>
            <div class="title">Ficha de Avaliação de Crédito</div>
            <div class="meta">Processo: ${process.id} &bull; Data de Solicitação: ${new Date(process.created).toLocaleDateString('pt-BR')}</div>
          </div>
          <div class="section-title">Dados do Cliente</div>
          <table>
            <tr><th>Nome Completo</th><td>${buyer.name || '-'}</td></tr>
            <tr><th>CPF</th><td>${buyer.cpf || '-'}</td></tr>
            <tr><th>E-mail</th><td>${buyer.email || '-'}</td></tr>
            <tr><th>Telefone</th><td>${buyer.phone || '-'}</td></tr>
          </table>
          <div class="section-title">Dados da Operação</div>
          <table>
            <tr><th>Tipo de Avaliação</th><td>${creditType}</td></tr>
            <tr><th>Tipo de Empreendimento</th><td>${devType}</td></tr>
            <tr><th>Possui 36 meses FGTS?</th><td>${buyer.work_history_36_months ? 'Sim' : 'Não'}</td></tr>
            <tr><th>Possui Dependente?</th><td>${buyer.has_dependents ? 'Sim' : 'Não'}</td></tr>
            ${buyer.has_dependents && buyer.dependents_info ? `<tr><th>Observação Dependente</th><td><div style="white-space: pre-wrap;">${buyer.dependents_info}</div></td></tr>` : ''}
          </table>
          <div class="footer">Documento gerado em ${new Date().toLocaleString('pt-BR')} via CCA Digital.</div>
        </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => printWindow.print(), 500)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  }

  if (!process)
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando...</div>

  const isDocPendente =
    process.current_step?.toUpperCase() === 'DOC PENDENTE' ||
    process.status?.toUpperCase() === 'DOC PENDENTE' ||
    process.status === 'Pendência'
  const canUploadDocs =
    (process.result !== 'approved' && process.result !== 'rejected') ||
    (isDocPendente &&
      (user?.role === 'master' ||
        user?.role === 'real_estate_agency' ||
        user?.role === 'analyst' ||
        user?.role === 'broker'))

  const creditSteps = [
    {
      id: 1,
      name: 'Recepção',
      active: true,
      completed: !!process.analysis_type || process.is_conformity_approved,
    },
    {
      id: 2,
      name: 'Triagem',
      active: true,
      completed: process.is_conformity_approved,
    },
    {
      id: 3,
      name: 'Cadastramento',
      active: process.is_conformity_approved,
      completed:
        process.current_step === 'Análise' ||
        process.current_step === 'Decisão' ||
        process.current_step === 'Aprovado' ||
        process.result === 'approved' ||
        process.result === 'rejected' ||
        process.result === 'conditioned',
    },
    {
      id: 4,
      name: 'Análise',
      active:
        process.current_step === 'Análise' ||
        process.current_step === 'Decisão' ||
        process.current_step === 'Aprovado' ||
        process.result === 'approved' ||
        process.result === 'rejected' ||
        process.result === 'conditioned',
      completed:
        process.result === 'approved' ||
        process.result === 'rejected' ||
        process.result === 'conditioned',
    },
    {
      id: 5,
      name: 'Decisão',
      active:
        process.result === 'approved' ||
        process.result === 'rejected' ||
        process.result === 'conditioned',
      completed:
        process.result === 'approved' ||
        process.result === 'rejected' ||
        process.result === 'conditioned',
    },
  ]
  const housingSteps = [
    {
      id: 1,
      name: 'Documentação',
      active: true,
      completed: process.current_step !== 'Documentação',
    },
    {
      id: 2,
      name: 'Formulários',
      active: true,
      completed: process.current_step !== 'Documentação' && process.current_step !== 'Assinatura',
    },
    {
      id: 3,
      name: 'Triagem',
      active: process.current_step === 'Triagem' || process.status === 'Concluído',
      completed: process.status === 'Concluído',
    },
  ]
  const steps = process.type === 'credit' ? creditSteps : housingSteps

  return (
    <div className="space-y-6 animate-slide-up max-w-6xl mx-auto pb-12">
      {isNewSubmission && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md flex items-start gap-3 animate-fade-in-down mb-6">
          <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-emerald-800">Solicitação Enviada com Sucesso!</h4>
            <p className="text-sm text-emerald-700 mt-1">
              A avaliação de crédito foi registrada. Revise o resumo da operação abaixo.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generatePDF}
            className="shrink-0 bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          >
            <Download className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">
                {process.type === 'credit' ? 'Análise de Crédito' : 'Habitacional'}
              </h1>
              {process.result === 'approved' ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-none">Aprovado</Badge>
              ) : process.result === 'rejected' ? (
                <Badge variant="destructive" className="border-none">
                  Reprovado
                </Badge>
              ) : process.result === 'conditioned' ? (
                <Badge className="bg-amber-100 text-amber-800 border-none">Condicionado</Badge>
              ) : process.result === 'pending' && process.status === 'Pendência' ? (
                <Badge className="bg-secondary/10 text-secondary border-none animate-pulse-status">
                  Pendência Cliente
                </Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-800 border-none">{process.status}</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              ID: {process.id} • {new Date(process.created).toLocaleDateString('pt-BR')}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-sm font-medium border border-slate-200">
                <User className="w-4 h-4 text-slate-500" />
                <span>Cliente:</span>
                <span className="text-slate-900 flex items-center gap-1.5">
                  {process.expand?.buyer?.name && process.expand?.buyer_2?.name
                    ? `${process.expand.buyer.name} / ${process.expand.buyer_2.name}`
                    : process.expand?.buyer?.name ||
                      process.expand?.buyer_2?.name ||
                      'Sem proponente vinculado'}
                  {process.buyer &&
                    (user?.role === 'master' ||
                      user?.role === 'analyst' ||
                      user?.role === 'broker') && (
                      <button
                        onClick={() =>
                          setEditBuyer({
                            id: process.buyer,
                            name: process.expand?.buyer?.name || '',
                          })
                        }
                        className="text-slate-400 hover:text-primary transition-colors"
                        title="Editar nome"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-sm font-medium border border-slate-200">
                <User className="w-4 h-4 text-slate-500" />
                <span>Corretor:</span>
                <span className="text-slate-900 flex items-center gap-1.5">
                  {process.expand?.broker?.name || 'Não atribuído'}
                  {(user?.role === 'real_estate_agency' || user?.role === 'master') && (
                    <button
                      onClick={() => {
                        setSelectedBroker(process.broker || 'none')
                        setEditBroker(true)
                      }}
                      className="text-slate-400 hover:text-primary transition-colors ml-1"
                      title="Editar corretor"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-sm font-medium border border-slate-200">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>Imobiliária:</span>
                <span className="text-slate-900 flex items-center gap-1.5">
                  {process.expand?.real_estate_agency?.name ||
                    process.expand?.broker?.expand?.real_estate_agency?.name ||
                    'Não vinculada'}
                  {isAnalyst && (
                    <button
                      onClick={() => {
                        setSelectedAgency(process.real_estate_agency || 'none')
                        setEditAgency(true)
                      }}
                      className="text-slate-400 hover:text-primary transition-colors ml-1"
                      title="Editar imobiliária"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCopyLink} className="shrink-0 shadow-sm">
            <LinkIcon className="w-4 h-4 mr-2" /> Link Comprador
          </Button>
          <Button variant="default" onClick={generatePDF} className="shrink-0 shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Gerar PDF
          </Button>
        </div>
      </div>

      {(process.status === 'Pendência' || process.current_step === 'Cadastramento') &&
        !isAnalyst && (
          <div className="bg-secondary/10 border-l-4 border-secondary p-4 rounded-md flex items-start gap-3 justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-secondary w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-secondary">Ação Necessária</h4>
                <p className="text-sm text-slate-700 mt-1">
                  {process.observations ||
                    'Por favor, complete as ações necessárias ou resolva as pendências do processo.'}
                </p>
              </div>
            </div>
            <Dialog open={resolvePendencyDialog} onOpenChange={setResolvePendencyDialog}>
              <DialogTrigger asChild>
                <Button variant="default" className="shrink-0 bg-secondary hover:bg-secondary/90">
                  Resolver Pendência
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Resolver Pendência</DialogTitle>
                  <DialogDescription className="sr-only">
                    Informe os detalhes da resolução da pendência.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>O que foi feito para resolver? (Descrição da Resolução)</Label>
                    <Textarea
                      placeholder="Descreva as ações realizadas..."
                      value={resolvePendencyNote}
                      onChange={(e) => setResolvePendencyNote(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setResolvePendencyDialog(false)}
                    disabled={isResolvingPendency}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleResolvePendency}
                    disabled={!resolvePendencyNote.trim() || isResolvingPendency}
                  >
                    {isResolvingPendency ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

      <Card className="shadow-sm border-border/50 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-border/50">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-500 rounded-full"
              style={{
                width:
                  process.result === 'approved' ||
                  process.result === 'rejected' ||
                  process.result === 'conditioned'
                    ? '100%'
                    : '50%',
              }}
            ></div>
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center gap-3 px-2">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors',
                    step.completed
                      ? 'bg-primary border-primary text-white'
                      : step.active
                        ? 'bg-white border-primary text-primary'
                        : 'bg-white border-slate-300 text-slate-400',
                  )}
                >
                  {step.completed ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <span
                  className={cn(
                    'text-xs sm:text-sm font-medium text-center',
                    step.active ? 'text-slate-800' : 'text-slate-400',
                  )}
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          {isAnalyst &&
            process.result !== 'approved' &&
            process.result !== 'rejected' &&
            (() => {
              const isCredit = process.type === 'credit'
              const needsTriage = isCredit && !process.is_conformity_approved
              const inCadastramento =
                isCredit &&
                process.is_conformity_approved &&
                (process.current_step === 'Cadastramento' ||
                  process.status === 'Aguardando Cadastramento' ||
                  process.status === 'Em Cadastramento')
              const inAnalysis =
                isCredit &&
                process.is_conformity_approved &&
                (process.current_step === 'Análise' ||
                  process.status === 'Aguardando Análise' ||
                  process.status === 'Em Análise' ||
                  process.status === 'Aguardando Solicitação de Reavaliação' ||
                  process.status === 'Autorização Solicitada') &&
                (!process.result || process.result === 'pending')

              const isWaitingAuthorization =
                process.status === 'Aguardando Solicitação de Reavaliação'
              const canAproveReject = (inAnalysis || !isCredit) && !isWaitingAuthorization

              return (
                <Card className="shadow-sm border-border/50 border-t-4 border-t-primary">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Ações do Analista</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {needsTriage ? (
                      <Dialog open={triageDialog} onOpenChange={setTriageDialog}>
                        <DialogTrigger asChild>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovar Triagem
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Aprovar Triagem</DialogTitle>
                            <DialogDescription className="sr-only">
                              Selecione a classificação da análise para aprovar a triagem.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-3">
                              <Label>Classificação da Análise</Label>
                              <div className="grid grid-cols-2 gap-4">
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'h-24 flex flex-col gap-2 border-2 transition-all',
                                    analysisType === 'first_analysis'
                                      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                                      : 'bg-white hover:bg-slate-50 text-slate-800',
                                  )}
                                  onClick={() => setAnalysisType('first_analysis')}
                                >
                                  <FileText className="w-6 h-6" />
                                  Primeira Análise
                                </Button>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'h-24 flex flex-col gap-2 border-2 transition-all',
                                    analysisType === 'reevaluation'
                                      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                                      : 'bg-white hover:bg-slate-50 text-slate-800',
                                  )}
                                  onClick={() => setAnalysisType('reevaluation')}
                                >
                                  <RefreshCcw className="w-6 h-6" />
                                  Reavaliação
                                </Button>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setTriageDialog(false)}
                              disabled={isLoadingConformity}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={handleTriageApproval}
                              disabled={isLoadingConformity || !analysisType}
                            >
                              {isLoadingConformity ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : null}
                              Confirmar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    ) : !process.assigned_analyst ? (
                      inCadastramento || inAnalysis || !isCredit ? (
                        <Button className="w-full" onClick={() => handleAction('claim')}>
                          Assumir Processo
                        </Button>
                      ) : null
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Select value={transferAnalyst} onValueChange={setTransferAnalyst}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Transferir para..." />
                            </SelectTrigger>
                            <SelectContent>
                              {analysts.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                  {a.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="outline" onClick={() => handleAction('transfer')}>
                            Enviar
                          </Button>
                        </div>
                        <hr className="my-2" />

                        {inCadastramento && (
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleAction('send_to_analysis')}
                          >
                            <ArrowRight className="w-4 h-4 mr-2" /> Enviar para Análise
                          </Button>
                        )}

                        {canAproveReject && (
                          <>
                            <Button
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => setApproveDialog(true)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovar
                            </Button>

                            <Button
                              variant="outline"
                              className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-50"
                              onClick={() => setConditionDialog(true)}
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" /> Aprovação Condicionada
                            </Button>
                          </>
                        )}

                        {inAnalysis && isCredit && !isWaitingAuthorization && (
                          <Button
                            variant="outline"
                            className="w-full border-indigo-500/50 text-indigo-600 hover:bg-indigo-50 mt-2"
                            onClick={() => handleAction('solicitar_autorizacao_reavaliacao')}
                          >
                            <FileSignature className="w-4 h-4 mr-2" /> Solicitar Autorização de
                            Reavaliação
                          </Button>
                        )}

                        {isWaitingAuthorization && (
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                            onClick={() => handleAction('marcar_autorizacao_solicitada')}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar como Autorização
                            Solicitada
                          </Button>
                        )}

                        {(inCadastramento || inAnalysis || !isCredit) &&
                          !isWaitingAuthorization && (
                            <Dialog
                              open={isPendencyDialogOpen}
                              onOpenChange={setIsPendencyDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full border-secondary/50 text-secondary hover:bg-secondary/10"
                                >
                                  <AlertTriangle className="w-4 h-4 mr-2" /> Solicitar Pendência
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Registrar Pendência</DialogTitle>
                                  <DialogDescription className="sr-only">
                                    Descreva a pendência que o cliente precisa resolver.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 py-2">
                                  <Label>
                                    Observações/Motivo <span className="text-red-500">*</span>
                                  </Label>
                                  <Textarea
                                    placeholder="Descreva a pendência..."
                                    value={pendencyReason}
                                    onChange={(e) => setPendencyReason(e.target.value)}
                                    className="min-h-[100px]"
                                  />
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsPendencyDialogOpen(false)}
                                    disabled={isSubmittingPendency}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    onClick={() => handleAction('pendency')}
                                    disabled={!pendencyReason.trim() || isSubmittingPendency}
                                  >
                                    {isSubmittingPendency ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : null}
                                    Salvar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}

                        {canAproveReject && (
                          <Button
                            variant="ghost"
                            className="w-full text-destructive hover:bg-destructive/10 mt-2"
                            onClick={() => setRejectDialog(true)}
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Reprovar
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          className="w-full text-blue-600 hover:bg-blue-50 mt-2"
                          onClick={() => handleAction('start')}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar como Iniciado
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })()}

          {process.result === 'approved' &&
            process.type === 'credit' &&
            ['master', 'analyst', 'broker'].includes(user?.role || '') && (
              <Card className="shadow-sm border-amber-200 border-t-4 border-t-amber-500 mb-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Ações Adicionais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold tracking-wide"
                    onClick={() => setChangeEvaluationDialog(true)}
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" /> SOLICITAR MUDANÇA NA AVALIAÇÃO
                  </Button>
                  {['master', 'analyst'].includes(user?.role || '') && (
                    <Button
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold tracking-wide"
                      onClick={() => navigate(`/housing-transition/${process.id}`)}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" /> Enviar para processo habitacional
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

          {process.result === 'conditioned' &&
            process.type === 'credit' &&
            (user?.id === process.broker ||
              user?.role === 'master' ||
              user?.role === 'analyst') && (
              <Card className="shadow-sm border-indigo-200 border-t-4 border-t-indigo-500 mb-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Reavaliação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold tracking-wide"
                    onClick={() => setReevaluationDialog(true)}
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" /> SOLICITAR REAVALIAÇÃO
                  </Button>
                </CardContent>
              </Card>
            )}

          <Card className="shadow-sm border-border/50 bg-slate-50">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                Histórico de Alterações
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-3 border-b border-border/50 pb-4">
                <Textarea
                  placeholder="Adicione uma observação manual ao histórico..."
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="min-h-[80px]"
                  disabled={isSubmittingNote}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleManualNoteSubmit}
                    disabled={!manualNote.trim() || isSubmittingNote}
                  >
                    {isSubmittingNote ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Registrar Observação
                  </Button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
                {logs.map((log, index) => {
                  let durationStr = ''
                  if (log.from_status === 'Pendência' && index > 0) {
                    const prevLog = logs.findLast(
                      (l, i) => i < index && l.to_status === 'Pendência',
                    )
                    if (prevLog) {
                      const diffHours = Math.round(
                        (new Date(log.created).getTime() - new Date(prevLog.created).getTime()) /
                          (1000 * 60 * 60),
                      )
                      durationStr =
                        diffHours > 24
                          ? `(Resolvido em ${Math.floor(diffHours / 24)} dias)`
                          : `(Resolvido em ${diffHours}h)`
                    }
                  }

                  const isPureNote =
                    !log.from_status && !log.to_status && !log.from_step && !log.to_step

                  return (
                    <div
                      key={log.id}
                      className="text-sm border-l-2 border-primary pl-4 pb-4 relative last:pb-0"
                    >
                      <div className="absolute -left-[5px] top-1 w-2 h-2 bg-primary rounded-full ring-4 ring-white"></div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {new Date(log.created).toLocaleString('pt-BR')}{' '}
                        {durationStr && <span className="text-amber-600 ml-1">{durationStr}</span>}
                      </p>

                      {!isPureNote && (
                        <p className="font-medium text-slate-800 mt-1">
                          {log.from_status !== log.to_status
                            ? `${log.from_status || 'Início'} ➔ ${log.to_status}`
                            : `${log.from_step || 'Início'} ➔ ${log.to_step}`}
                        </p>
                      )}

                      {log.note && (
                        <p
                          className={cn(
                            'text-slate-600 mt-1 bg-slate-100 p-2 rounded whitespace-pre-wrap',
                            isPureNote ? 'text-sm not-italic' : 'text-xs italic',
                          )}
                        >
                          {isPureNote ? log.note : `"${log.note}"`}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Por:{' '}
                        <span className="font-medium">
                          {log.expand?.changed_by?.name || 'Sistema'}
                        </span>
                      </p>
                    </div>
                  )
                })}
                {logs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Nenhum histórico registrado.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {process.result && process.result !== 'pending' && (
            <Card className="shadow-sm border-border/50 bg-slate-50">
              <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Resultado da Análise</CardTitle>
                {isAnalyst && process.result === 'approved' && (
                  <Button variant="outline" size="sm" onClick={openEditResult}>
                    Editar Resultado
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {process.result === 'approved' && (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <span className="text-muted-foreground block text-xs">
                        Valor Aprovado (Financiamento)
                      </span>
                      <span className="font-medium text-emerald-600">
                        {formatCurrency(process.approved_financing_value)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Valor da Parcela</span>
                      <span className="font-medium text-emerald-600">
                        {formatCurrency(process.approved_installment_value)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">
                        Validade da Avaliação
                      </span>
                      <span className="font-medium text-slate-800">
                        {formatDate(process.evaluation_expiry_date)}
                      </span>
                    </div>
                    {process.federal_subsidy > 0 && (
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          Subsídio Federal
                        </span>
                        <span className="font-medium text-emerald-600">
                          {formatCurrency(process.federal_subsidy)}
                        </span>
                      </div>
                    )}
                    {process.amortization_system && (
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          Sistema de Amortização
                        </span>
                        <span className="font-medium text-slate-800">
                          {process.amortization_system}
                        </span>
                      </div>
                    )}
                    {process.approval_file && (
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          Arquivo de Aprovação
                        </span>
                        <a
                          href={pb.files.getURL(process, process.approval_file)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center text-sm font-medium mt-1"
                        >
                          <FileIcon className="w-4 h-4 mr-1" /> Baixar Documento
                        </a>
                      </div>
                    )}
                    {process.additional_details && (
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          Detalhes Adicionais
                        </span>
                        <span className="font-medium text-slate-800">
                          {process.additional_details}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {process.result === 'conditioned' && (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <span className="text-muted-foreground block text-xs">
                        Motivo do Condicionamento
                      </span>
                      <span className="font-medium text-amber-600">
                        {conditioningReasons.find((r) => r.id === process.conditioning_reason_type)
                          ?.name ||
                          process.conditioning_reason ||
                          '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">
                        Valor da Possível Parcela
                      </span>
                      <span className="font-medium text-slate-800">
                        {formatCurrency(process.conditioned_installment_value)}
                      </span>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-md border border-amber-200 mt-2">
                      <p className="text-sm text-amber-800 font-medium">
                        Atenção após solução do condicionamento deve ser feita uma nova analise onde
                        os valores podem mudar.
                      </p>
                    </div>
                  </div>
                )}
                {process.result === 'rejected' && (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <span className="text-muted-foreground block text-xs">
                        Motivo da Reprovação
                      </span>
                      <span className="font-medium text-red-600">
                        {rejectionReasons.find((r) => r.id === process.rejection_reason_type)
                          ?.name ||
                          process.rejection_reason ||
                          '-'}
                      </span>
                    </div>
                    {process.rejection_reason && (
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          Observações Adicionais
                        </span>
                        <span className="font-medium text-slate-800">
                          {process.rejection_reason}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4 border-b border-border/50 bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Resumo da Operação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-sm">
              <div className="divide-y divide-border/50">
                <div className="p-4 bg-white">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Dados da Operação
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <span className="text-muted-foreground block text-xs mb-1">
                        Status / Resultado
                      </span>
                      {process.result === 'approved' ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-none hover:bg-emerald-100">
                          Aprovado
                        </Badge>
                      ) : process.result === 'rejected' ? (
                        <Badge variant="destructive" className="border-none hover:bg-destructive">
                          Reprovado
                        </Badge>
                      ) : process.result === 'conditioned' ? (
                        <Badge className="bg-amber-100 text-amber-800 border-none hover:bg-amber-100">
                          Condicionado
                        </Badge>
                      ) : process.result === 'pending' && process.status === 'Pendência' ? (
                        <Badge className="bg-secondary/10 text-secondary border-none hover:bg-secondary/10">
                          Pendência Cliente
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 border-none hover:bg-blue-100">
                          {process.status}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">E-mail do Cliente</span>
                      <span className="font-medium text-slate-800 break-all block">
                        {process.expand?.buyer?.email || 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Tipo de Avaliação</span>
                      <span className="font-medium text-slate-800">
                        {process.expand?.credit_analysis_type?.name || 'Não informado'}
                      </span>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3 border-t border-border/50 pt-4 mt-2">
                      <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Imóvel e Financiamento
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            Opção de compra é um imóvel
                          </span>
                          <span className="font-medium text-slate-800">
                            {process.expand?.property_type?.name || 'Não informado'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            Possui imóvel definido?
                          </span>
                          <span className="font-medium text-slate-800">
                            {typeof process.has_defined_property === 'boolean'
                              ? process.has_defined_property
                                ? 'Sim'
                                : 'Não'
                              : 'Não informado'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            Valor de compra do imóvel
                          </span>
                          <span className="font-medium text-slate-800">
                            {process.property_purchase_value
                              ? formatCurrency(process.property_purchase_value)
                              : 'Não informado'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            Empreendimento
                          </span>
                          <span className="font-medium text-slate-800">
                            {process.expand?.development_type?.name || 'Não informado'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            Valor do Financiamento Solicitado
                          </span>
                          <span className="font-medium text-slate-800">
                            {process.value ? formatCurrency(process.value) : 'Não informado'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            Prazo desejado (meses)
                          </span>
                          <span className="font-medium text-slate-800">
                            {process.desired_term || 'Não informado'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            Financiar custas/despesas?
                          </span>
                          <span className="font-medium text-slate-800">
                            {typeof process.finance_costs === 'boolean'
                              ? process.finance_costs
                                ? 'Sim'
                                : 'Não'
                              : 'Não informado'}
                          </span>
                        </div>
                      </div>

                      {process.property_observations && (
                        <div className="mt-4">
                          <span className="text-muted-foreground block text-xs">
                            Observação do imóvel
                          </span>
                          <span className="font-medium text-slate-800 break-words block p-2 bg-slate-50 rounded-md border mt-1">
                            {process.property_observations}
                          </span>
                        </div>
                      )}
                    </div>

                    {(process.approved_financing_value ||
                      process.approved_installment_value ||
                      process.evaluation_expiry_date ||
                      process.federal_subsidy ||
                      process.amortization_system ||
                      process.expand?.assigned_analyst?.name) && (
                      <div className="sm:col-span-2 lg:col-span-3 border-t border-border/50 pt-4 mt-2">
                        <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                          Resultado e Condições
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {process.approved_financing_value ? (
                            <div>
                              <span className="text-muted-foreground block text-xs">
                                Valor Aprovado (Financiamento)
                              </span>
                              <span className="font-semibold text-emerald-600">
                                {formatCurrency(process.approved_financing_value)}
                              </span>
                            </div>
                          ) : null}
                          {process.approved_installment_value ? (
                            <div>
                              <span className="text-muted-foreground block text-xs">
                                Valor da Parcela
                              </span>
                              <span className="font-semibold text-emerald-600">
                                {formatCurrency(process.approved_installment_value)}
                              </span>
                            </div>
                          ) : null}
                          {process.evaluation_expiry_date && (
                            <div>
                              <span className="text-muted-foreground block text-xs">
                                Validade da Avaliação
                              </span>
                              <span className="font-medium text-slate-800">
                                {formatDate(process.evaluation_expiry_date)}
                              </span>
                            </div>
                          )}
                          {process.federal_subsidy ? (
                            <div>
                              <span className="text-muted-foreground block text-xs">
                                Subsídio Federal
                              </span>
                              <span className="font-medium text-slate-800">
                                {formatCurrency(process.federal_subsidy)}
                              </span>
                            </div>
                          ) : null}
                          {process.amortization_system && (
                            <div>
                              <span className="text-muted-foreground block text-xs">
                                Sistema de Amortização
                              </span>
                              <span className="font-medium text-slate-800">
                                {process.amortization_system}
                              </span>
                            </div>
                          )}
                          {process.expand?.assigned_analyst?.name && (
                            <div>
                              <span className="text-muted-foreground block text-xs">
                                Analista Atribuído
                              </span>
                              <span className="font-medium text-slate-800">
                                {process.expand.assigned_analyst.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50/50">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    1º Proponente
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <span className="text-muted-foreground block text-xs">Nome</span>
                      <span className="font-medium text-slate-800">
                        {process.expand?.buyer?.name || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">CPF</span>
                      <span className="font-medium text-slate-800">
                        {process.expand?.buyer?.cpf || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">E-mail</span>
                      <span className="font-medium text-slate-800 break-all block">
                        {process.expand?.buyer?.email || 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">
                        Data de Nascimento
                      </span>
                      <span className="font-medium text-slate-800">
                        {formatDate(process.expand?.buyer?.birth_date)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Telefone</span>
                      <span className="font-medium text-slate-800">
                        {process.expand?.buyer?.phone || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Estado Civil</span>
                      <span className="font-medium text-slate-800">
                        {process.expand?.buyer?.marital_status || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Renda Bruta</span>
                      <span className="font-medium text-slate-800">
                        {formatCurrency(process.expand?.buyer?.income)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Escolaridade</span>
                      <span className="font-medium text-slate-800">
                        {process.expand?.buyer?.education || '-'}
                      </span>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                      <div className="flex flex-col gap-1 bg-white p-2 rounded border">
                        <span className="text-muted-foreground text-[10px] uppercase leading-tight">
                          36 meses FGTS
                        </span>
                        <span className="font-semibold text-xs text-slate-800">
                          {process.expand?.buyer?.work_history_36_months ? 'Sim' : 'Não'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 bg-white p-2 rounded border">
                        <span className="text-muted-foreground text-[10px] uppercase leading-tight">
                          Possui Dependente
                        </span>
                        <span className="font-semibold text-xs text-slate-800">
                          {process.expand?.buyer?.has_dependents ? 'Sim' : 'Não'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 bg-white p-2 rounded border">
                        <span className="text-muted-foreground text-[10px] uppercase leading-tight">
                          Primeiro Imóvel
                        </span>
                        <span className="font-semibold text-xs text-slate-800">
                          {process.expand?.buyer?.is_first_property ? 'Sim' : 'Não'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 bg-white p-2 rounded border">
                        <span className="text-muted-foreground text-[10px] uppercase leading-tight">
                          Declara IR
                        </span>
                        <span className="font-semibold text-xs text-slate-800">
                          {process.expand?.buyer?.declared_tax ? 'Sim' : 'Não'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {process.expand?.buyer_2 && (
                  <div className="p-4 bg-white">
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      2º Proponente
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <span className="text-muted-foreground block text-xs">Nome</span>
                        <span className="font-medium text-slate-800">
                          {process.expand?.buyer_2?.name || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">CPF</span>
                        <span className="font-medium text-slate-800">
                          {process.expand?.buyer_2?.cpf || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          Data de Nascimento
                        </span>
                        <span className="font-medium text-slate-800">
                          {formatDate(process.expand?.buyer_2?.birth_date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">E-mail</span>
                        <span className="font-medium text-slate-800 break-all block">
                          {process.expand?.buyer_2?.email || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Telefone</span>
                        <span className="font-medium text-slate-800">
                          {process.expand?.buyer_2?.phone || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Estado Civil</span>
                        <span className="font-medium text-slate-800">
                          {process.expand?.buyer_2?.marital_status || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Renda Bruta</span>
                        <span className="font-medium text-slate-800">
                          {formatCurrency(process.expand?.buyer_2?.income)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Escolaridade</span>
                        <span className="font-medium text-slate-800">
                          {process.expand?.buyer_2?.education || '-'}
                        </span>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                        <div className="flex flex-col gap-1 bg-slate-50 p-2 rounded border">
                          <span className="text-muted-foreground text-[10px] uppercase leading-tight">
                            36 meses FGTS
                          </span>
                          <span className="font-semibold text-xs text-slate-800">
                            {process.expand?.buyer_2?.work_history_36_months ? 'Sim' : 'Não'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 bg-slate-50 p-2 rounded border">
                          <span className="text-muted-foreground text-[10px] uppercase leading-tight">
                            Possui Dependente
                          </span>
                          <span className="font-semibold text-xs text-slate-800">
                            {process.expand?.buyer_2?.has_dependents ? 'Sim' : 'Não'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 bg-slate-50 p-2 rounded border">
                          <span className="text-muted-foreground text-[10px] uppercase leading-tight">
                            Primeiro Imóvel
                          </span>
                          <span className="font-semibold text-xs text-slate-800">
                            {process.expand?.buyer_2?.is_first_property ? 'Sim' : 'Não'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 bg-slate-50 p-2 rounded border">
                          <span className="text-muted-foreground text-[10px] uppercase leading-tight">
                            Declara IR
                          </span>
                          <span className="font-semibold text-xs text-slate-800">
                            {process.expand?.buyer_2?.declared_tax ? 'Sim' : 'Não'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Documentos</h2>
            {canUploadDocs &&
              (uploadingSlots['Geral-Extra'] ? (
                <Button variant="outline" size="sm" className="shadow-sm" disabled>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
                </Button>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadSlot(e, 'Geral', file.name, 'Geral-Extra')
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <Button variant="outline" size="sm" className="shadow-sm">
                    <UploadCloud className="w-4 h-4 mr-2" /> Arquivo Extra
                  </Button>
                </div>
              ))}
          </div>

          {['1º Proponente', '2º Proponente / Conjuge'].map((cat) => {
            const configuredSlots = creditDocumentTypes
              .filter((t) => t.category === cat)
              .map((t) => t.name)
            const DEFAULT_SLOTS = [
              'CNH/RG',
              'Comprovante de Endereço',
              'Certidão estado civil',
              'Holerite 01',
              'Holerite 02',
              'Holerite 03',
              'Carteira de trabalho',
              'IRPF',
            ]
            const slotsToRender = configuredSlots.length > 0 ? configuredSlots : DEFAULT_SLOTS

            return (
              <Card key={cat} className="shadow-sm border-border/50">
                <CardHeader className="pb-3 border-b border-border/50 bg-slate-50/50">
                  <CardTitle className="text-base text-slate-700">{cat}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {slotsToRender.map((slotName) => {
                      const doc = documents.find(
                        (d) =>
                          (d.category === cat && d.name === slotName) ||
                          d.category === `${cat}:::${slotName}`,
                      )
                      return (
                        <div
                          key={slotName}
                          className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50 shadow-sm transition-colors hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div
                              className={cn(
                                'p-2 rounded-lg shrink-0',
                                doc
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-slate-200 text-slate-500',
                              )}
                            >
                              {doc ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <FileIcon className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-slate-800 truncate">
                                {slotName}
                              </p>
                              {doc && (
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-[10px] px-1.5 py-0 border-none font-medium',
                                      doc.status === 'approved'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : doc.status === 'rejected'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-amber-100 text-amber-700',
                                    )}
                                  >
                                    {doc.status === 'approved'
                                      ? 'Aprovado'
                                      : doc.status === 'rejected'
                                        ? 'Reprovado'
                                        : 'Em Análise'}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 ml-2 flex items-center gap-1">
                            {doc ? (
                              <>
                                {isAnalyst && doc.status !== 'approved' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-emerald-600 h-8 w-8"
                                    onClick={() => handleUpdateDocStatus(doc.id, 'approved')}
                                    disabled={uploadingSlots[doc.id + '-status']}
                                    title="Aprovar documento"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                )}
                                {isAnalyst && doc.status !== 'rejected' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 h-8 w-8"
                                    onClick={() => handleUpdateDocStatus(doc.id, 'rejected')}
                                    disabled={uploadingSlots[doc.id + '-status']}
                                    title="Reprovar documento"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                <a
                                  href={pb.files.getURL(doc, doc.file)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-blue-600 h-8 w-8"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </a>
                                {isAnalyst && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:bg-red-50 h-8 w-8"
                                    onClick={() => handleDeleteDocument(doc.id, doc.name)}
                                    disabled={deletingDocId === doc.id}
                                    title="Excluir documento"
                                  >
                                    {deletingDocId === doc.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                                {canUploadDocs &&
                                  (uploadingSlots[doc.id] ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-amber-600 h-8 w-8"
                                      disabled
                                    >
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    </Button>
                                  ) : (
                                    <div className="relative">
                                      <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                        onChange={(e) => handleReplaceSlot(e, doc.id)}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-amber-600 h-8 w-8"
                                        title="Substituir arquivo"
                                      >
                                        <UploadCloud className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                              </>
                            ) : (
                              canUploadDocs &&
                              (uploadingSlots[`${cat}-${slotName}`] ? (
                                <Button variant="outline" size="sm" className="h-8" disabled>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
                                </Button>
                              ) : (
                                <div className="relative">
                                  <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    onChange={(e) => handleUploadSlot(e, cat, slotName)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                  <Button variant="outline" size="sm" className="h-8">
                                    <UploadCloud className="w-4 h-4 mr-2" /> Enviar
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {documents.filter(
            (d) =>
              d.category === 'Geral' ||
              (!d.category?.includes('1º Proponente') && !d.category?.includes('2º Proponente')),
          ).length > 0 && (
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-3 border-b border-border/50 bg-slate-50/50">
                <CardTitle className="text-base text-slate-700">Outros Documentos</CardTitle>
              </CardHeader>
              <CardContent className="p-0 bg-white">
                <div className="divide-y divide-border/50">
                  {documents
                    .filter(
                      (d) =>
                        d.category === 'Geral' ||
                        (!d.category?.includes('1º Proponente') &&
                          !d.category?.includes('2º Proponente')),
                    )
                    .map((doc) => {
                      const url = pb.files.getURL(doc, doc.file)
                      return (
                        <div
                          key={doc.id}
                          className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                              <FileIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm text-slate-800">{doc.name}</p>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[10px] px-1.5 py-0 border-none font-medium',
                                    doc.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : doc.status === 'rejected'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-amber-100 text-amber-700',
                                  )}
                                >
                                  {doc.status === 'approved'
                                    ? 'Aprovado'
                                    : doc.status === 'rejected'
                                      ? 'Reprovado'
                                      : 'Em Análise'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Enviado por {doc.expand?.uploaded_by?.name || '-'} em{' '}
                                {new Date(doc.created).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {isAnalyst && doc.status !== 'approved' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-emerald-600 h-8 w-8"
                                onClick={() => handleUpdateDocStatus(doc.id, 'approved')}
                                disabled={uploadingSlots[doc.id + '-status']}
                                title="Aprovar documento"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                            {isAnalyst && doc.status !== 'rejected' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 h-8 w-8"
                                onClick={() => handleUpdateDocStatus(doc.id, 'rejected')}
                                disabled={uploadingSlots[doc.id + '-status']}
                                title="Reprovar documento"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <a href={url} target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="icon">
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
                            {isAnalyst && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteDocument(doc.id, doc.name)}
                                disabled={deletingDocId === doc.id}
                                title="Excluir documento"
                              >
                                {deletingDocId === doc.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Processo</DialogTitle>
            <DialogDescription className="sr-only">
              Preencha os valores para aprovar o processo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Valor Aprovado de Financiamento</Label>
              <Input
                type="number"
                placeholder="Ex: 250000"
                value={decisionForm.approved_financing_value}
                onChange={(e) =>
                  setDecisionForm({ ...decisionForm, approved_financing_value: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Aprovado de Parcela</Label>
              <Input
                type="number"
                placeholder="Ex: 2500"
                value={decisionForm.approved_installment_value}
                onChange={(e) =>
                  setDecisionForm({ ...decisionForm, approved_installment_value: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Data de vencimento da Avaliação</Label>
              <Input
                type="date"
                value={decisionForm.evaluation_expiry_date}
                onChange={(e) =>
                  setDecisionForm({ ...decisionForm, evaluation_expiry_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Subsídio Federal (Opcional)</Label>
              <Input
                type="number"
                placeholder="Ex: 15000"
                value={decisionForm.federal_subsidy}
                onChange={(e) =>
                  setDecisionForm({ ...decisionForm, federal_subsidy: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Sistema de Amortização (Opcional)</Label>
              <Select
                value={decisionForm.amortization_system}
                onValueChange={(val) =>
                  setDecisionForm({ ...decisionForm, amortization_system: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRICE">PRICE</SelectItem>
                  <SelectItem value="SAC">SAC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Arquivo de Aprovação (Opcional)</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setApprovalFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Dados adicionais (Opcional)</Label>
              <Textarea
                placeholder="Informações extras..."
                value={decisionForm.additional_details}
                onChange={(e) =>
                  setDecisionForm({ ...decisionForm, additional_details: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleDecision('approve')}>Aprovar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={conditionDialog} onOpenChange={setConditionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovação Condicionada</DialogTitle>
            <DialogDescription className="sr-only">
              Preencha os motivos para o condicionamento da aprovação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Motivo do condicionamento</Label>
              <Select
                value={decisionForm.conditioning_reason_type}
                onValueChange={(val) =>
                  setDecisionForm({ ...decisionForm, conditioning_reason_type: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {conditioningReasons.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor da possível parcela Condicionada</Label>
              <Input
                type="number"
                placeholder="Ex: 2800"
                value={decisionForm.conditioned_installment_value}
                onChange={(e) =>
                  setDecisionForm({
                    ...decisionForm,
                    conditioned_installment_value: e.target.value,
                  })
                }
              />
            </div>
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-sm text-amber-800">
              Atenção após solução do condicionamento deve ser feita uma nova analise onde os
              valores podem mudar.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConditionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleDecision('condition')}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editResultDialog} onOpenChange={setEditResultDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Resultado da Análise</DialogTitle>
            <DialogDescription className="sr-only">
              Atualize os detalhes do resultado da análise do processo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Resultado</Label>
              <Select
                value={editResultForm.result}
                onValueChange={(val) => setEditResultForm({ ...editResultForm, result: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o resultado..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="conditioned">Condicionado</SelectItem>
                  <SelectItem value="rejected">Reprovado</SelectItem>
                  <SelectItem value="pending">Pendência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editResultForm.result === 'approved' && (
              <>
                <div className="space-y-2">
                  <Label>Valor Aprovado de Financiamento</Label>
                  <Input
                    type="number"
                    value={editResultForm.approved_financing_value}
                    onChange={(e) =>
                      setEditResultForm({
                        ...editResultForm,
                        approved_financing_value: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Aprovado de Parcela</Label>
                  <Input
                    type="number"
                    value={editResultForm.approved_installment_value}
                    onChange={(e) =>
                      setEditResultForm({
                        ...editResultForm,
                        approved_installment_value: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de vencimento da Avaliação</Label>
                  <Input
                    type="date"
                    value={editResultForm.evaluation_expiry_date}
                    onChange={(e) =>
                      setEditResultForm({
                        ...editResultForm,
                        evaluation_expiry_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subsídio Federal (Opcional)</Label>
                  <Input
                    type="number"
                    value={editResultForm.federal_subsidy}
                    onChange={(e) =>
                      setEditResultForm({ ...editResultForm, federal_subsidy: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sistema de Amortização (Opcional)</Label>
                  <Select
                    value={editResultForm.amortization_system}
                    onValueChange={(val) =>
                      setEditResultForm({ ...editResultForm, amortization_system: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRICE">PRICE</SelectItem>
                      <SelectItem value="SAC">SAC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {editResultForm.result === 'conditioned' && (
              <div className="space-y-2">
                <Label>Motivo do condicionamento</Label>
                <Select
                  value={editResultForm.conditioning_reason_type}
                  onValueChange={(val) =>
                    setEditResultForm({ ...editResultForm, conditioning_reason_type: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {conditioningReasons.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editResultForm.result === 'rejected' && (
              <div className="space-y-2">
                <Label>Motivo da reprovação</Label>
                <Select
                  value={editResultForm.rejection_reason_type}
                  onValueChange={(val) =>
                    setEditResultForm({ ...editResultForm, rejection_reason_type: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {rejectionReasons.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditResultDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditResult}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprovar Processo</DialogTitle>
            <DialogDescription className="sr-only">
              Selecione o motivo da reprovação do processo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Motivo da reprovação</Label>
              <Select
                value={decisionForm.rejection_reason_type}
                onValueChange={(val) =>
                  setDecisionForm({ ...decisionForm, rejection_reason_type: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {rejectionReasons.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações adicionais (Opcional)</Label>
              <Textarea
                placeholder="Detalhes adicionais da reprovação..."
                value={decisionForm.rejection_reason}
                onChange={(e) =>
                  setDecisionForm({ ...decisionForm, rejection_reason: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => handleDecision('reject')}>
              Reprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editBuyer} onOpenChange={(open) => !open && setEditBuyer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nome do Cliente</DialogTitle>
            <DialogDescription className="sr-only">Edite o nome do cliente.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editBuyer?.name || ''}
              onChange={(e) => editBuyer && setEditBuyer({ ...editBuyer, name: e.target.value })}
              placeholder="Nome completo do 1º proponente"
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

      <Dialog open={changeEvaluationDialog} onOpenChange={setChangeEvaluationDialog}>
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
              <Label>Motivo da solicitação</Label>
              <Textarea
                placeholder="Descreva o que precisa ser alterado..."
                value={changeEvaluationReason}
                onChange={(e) => setChangeEvaluationReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangeEvaluationDialog(false)}
              disabled={isSubmittingChangeEvaluation}
            >
              Cancelar
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleChangeEvaluation}
              disabled={isSubmittingChangeEvaluation || !changeEvaluationReason.trim()}
            >
              {isSubmittingChangeEvaluation ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Confirmar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={reevaluationDialog} onOpenChange={setReevaluationDialog}>
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
              <Label>Motivo da reavaliação</Label>
              <Textarea
                placeholder="Descreva o motivo da reavaliação..."
                value={reevaluationReason}
                onChange={(e) => setReevaluationReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReevaluationDialog(false)}
              disabled={isSubmittingReevaluation}
            >
              Cancelar
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleReevaluation}
              disabled={isSubmittingReevaluation || !reevaluationReason.trim()}
            >
              {isSubmittingReevaluation ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirmar Reavaliação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={editBroker} onOpenChange={setEditBroker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Corretor Responsável</DialogTitle>
            <DialogDescription className="sr-only">
              Selecione um novo corretor para este processo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedBroker} onValueChange={setSelectedBroker}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um corretor..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum corretor</SelectItem>
                {agencyBrokers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name || b.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBroker(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditBrokerSubmit} disabled={!selectedBroker}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={editAgency} onOpenChange={setEditAgency}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Imobiliária</DialogTitle>
            <DialogDescription className="sr-only">
              Selecione uma imobiliária para este processo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedAgency} onValueChange={setSelectedAgency}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma imobiliária..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma imobiliária</SelectItem>
                {agencies.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAgency(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditAgencySubmit} disabled={!selectedAgency}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
