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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  UploadCloud,
  File as FileIcon,
  Link as LinkIcon,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import {
  getProcess,
  getDocuments,
  updateProcess,
  createDocument,
  getUsers,
  getCreditDocumentTypes,
} from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [analysts, setAnalysts] = useState<any[]>([])
  const [transferAnalyst, setTransferAnalyst] = useState('')
  const [logs, setLogs] = useState<any[]>([])

  const [approveDialog, setApproveDialog] = useState(false)
  const [conditionDialog, setConditionDialog] = useState(false)
  const [rejectDialog, setRejectDialog] = useState(false)
  const [decisionForm, setDecisionForm] = useState({
    approved_financing_value: '',
    approved_installment_value: '',
    evaluation_expiry_date: '',
    additional_details: '',
    conditioning_reason: '',
    conditioned_installment_value: '',
    rejection_reason: '',
  })

  const isAnalyst = user?.role === 'master' || user?.role === 'analyst'

  const loadData = async () => {
    if (!id) return
    try {
      const [p, docs, docTypes, processLogs] = await Promise.all([
        getProcess(id),
        getDocuments(id),
        getCreditDocumentTypes(),
        getProcessLogs(id),
      ])
      setProcess(p)
      setDocuments(docs)
      setCreditDocumentTypes(docTypes)
      setLogs(processLogs)
    } catch (e) {
      toast({ title: 'Erro', description: 'Processo não encontrado.', variant: 'destructive' })
      navigate(-1)
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

  const handleAction = async (action: 'pendency' | 'transfer' | 'claim' | 'start') => {
    if (!process) return
    try {
      if (action === 'pendency') {
        await updateProcess(process.id, {
          result: 'pending',
          status: 'Pendência',
          observations: pendencyReason,
        })
        toast({ title: 'Pendência Solicitada' })
        setIsPendencyDialogOpen(false)
      } else if (action === 'start') {
        await updateProcess(process.id, {
          status: 'Processo Iniciado',
        })
        toast({ title: 'Processo Iniciado' })
      } else if (action === 'claim') {
        await updateProcess(process.id, {
          assigned_analyst: user?.id,
          status: 'Em Análise',
          current_step: 'Análise',
        })
        toast({ title: 'Processo Assumido' })
      } else if (action === 'transfer') {
        if (!transferAnalyst) return
        await updateProcess(process.id, {
          assigned_analyst: transferAnalyst,
          status: 'Em Análise',
          current_step: 'Análise',
        })
        toast({ title: 'Processo Transferido' })
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar.', variant: 'destructive' })
    }
  }

  const handleDecision = async (action: 'approve' | 'condition' | 'reject') => {
    if (!process) return
    try {
      const basePayload = {
        status: action === 'condition' ? 'Condicionado' : 'Concluído',
        current_step: 'Decisão',
      }

      if (action === 'approve') {
        await updateProcess(process.id, {
          ...basePayload,
          result: 'approved',
          approved_financing_value: Number(decisionForm.approved_financing_value),
          approved_installment_value: Number(decisionForm.approved_installment_value),
          evaluation_expiry_date: decisionForm.evaluation_expiry_date,
          additional_details: decisionForm.additional_details,
        })
        setApproveDialog(false)
        toast({ title: 'Processo Aprovado' })
      } else if (action === 'condition') {
        await updateProcess(process.id, {
          ...basePayload,
          result: 'conditioned',
          conditioning_reason: decisionForm.conditioning_reason,
          conditioned_installment_value: Number(decisionForm.conditioned_installment_value),
        })
        setConditionDialog(false)
        toast({ title: 'Aprovação Condicionada Registrada' })
      } else if (action === 'reject') {
        await updateProcess(process.id, {
          ...basePayload,
          result: 'rejected',
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
    expectedCategory: string,
  ) => {
    const file = e.target.files?.[0]
    if (!file || !process) return

    const formData = new FormData()
    formData.append('process', process.id)
    formData.append('file', file)
    formData.append('name', file.name)
    formData.append('uploaded_by', user?.id || '')
    formData.append('category', expectedCategory)
    formData.append('status', 'review')

    try {
      await createDocument(formData as any)
      toast({ title: 'Documento enviado' })
      if (fileInputRef.current) fileInputRef.current.value = ''
      e.target.value = ''
    } catch (error) {
      toast({ title: 'Erro ao enviar', variant: 'destructive' })
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

  const creditSteps = [
    { id: 1, name: 'Registro', active: true, completed: process.status !== 'Nova Solicitação' },
    {
      id: 2,
      name: 'Análise',
      active: process.current_step === 'Análise' || process.result !== 'pending',
      completed:
        process.result === 'approved' ||
        process.result === 'rejected' ||
        process.result === 'conditioned',
    },
    {
      id: 3,
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
      name: 'Conformidade',
      active: process.current_step === 'Conformidade' || process.status === 'Concluído',
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

      {process.status === 'Pendência' && !isAnalyst && (
        <div className="bg-secondary/10 border-l-4 border-secondary p-4 rounded-md flex items-start gap-3">
          <AlertTriangle className="text-secondary w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-secondary">Ação Necessária</h4>
            <p className="text-sm text-slate-700 mt-1">{process.observations}</p>
          </div>
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
          {isAnalyst && process.result !== 'approved' && process.result !== 'rejected' && (
            <Card className="shadow-sm border-border/50 border-t-4 border-t-primary">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Ações do Analista</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!process.assigned_analyst ? (
                  <Button className="w-full" onClick={() => handleAction('claim')}>
                    Assumir Processo
                  </Button>
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

                    <Dialog open={isPendencyDialogOpen} onOpenChange={setIsPendencyDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full border-secondary/50 text-secondary hover:bg-secondary/10"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" /> Solicitar Pendência
                        </Button>
                      </DialogTrigger>{' '}
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Informar Pendência ao Cliente</DialogTitle>
                        </DialogHeader>
                        <Textarea
                          placeholder="Descreva a pendência..."
                          value={pendencyReason}
                          onChange={(e) => setPendencyReason(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <DialogFooter>
                          <Button onClick={() => handleAction('pendency')}>Enviar</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:bg-destructive/10"
                      onClick={() => setRejectDialog(true)}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reprovar
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-blue-600 hover:bg-blue-50"
                      onClick={() => handleAction('start')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar como Iniciado
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm border-border/50 bg-slate-50">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                Histórico de Alterações
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 max-h-64 overflow-y-auto">
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="text-sm border-l-2 border-primary pl-3 pb-2 relative"
                  >
                    <div className="absolute -left-[5px] top-1 w-2 h-2 bg-primary rounded-full"></div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created).toLocaleString('pt-BR')}
                    </p>
                    <p className="font-medium text-slate-800">
                      {log.from_step || 'Início'} ➔ {log.to_step}
                    </p>
                    {log.note && <p className="text-xs text-slate-600 mt-1 italic">"{log.note}"</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      Por: {log.expand?.changed_by?.name || 'Sistema'}
                    </p>
                  </div>
                ))}
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
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-lg">Resultado da Análise</CardTitle>
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
                        {process.conditioning_reason}
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
                      <span className="font-medium text-red-600">{process.rejection_reason}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Resumo da Operação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-sm">
              <div className="divide-y divide-border/50">
                <div className="p-4 bg-slate-50/50">
                  <h4 className="font-semibold text-slate-700 mb-3">Dados do Cliente</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block text-xs">E-mail</span>
                      <span className="font-medium text-slate-800">
                        {process.expand?.buyer?.email || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Telefone</span>
                      <span className="font-medium text-slate-800">
                        {process.expand?.buyer?.phone || '-'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <h4 className="font-semibold text-slate-700 mb-3">Dados da Operação</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <span className="text-muted-foreground block text-xs">Tipo de Avaliação</span>
                      <span className="font-medium text-slate-800">
                        {process.expand?.credit_analysis_type?.name || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Empreendimento</span>
                      <span className="font-medium text-slate-800">
                        {process.expand?.development_type?.name || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">
                        Possui 36 meses FGTS?
                      </span>
                      <span className="font-medium text-slate-800">
                        {process.expand?.buyer?.work_history_36_months ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">
                        Possui Dependente?
                      </span>
                      <span className="font-medium text-slate-800">
                        {process.expand?.buyer?.has_dependents ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    {process.expand?.buyer?.has_dependents && (
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          Observação Dependente
                        </span>
                        <span className="font-medium text-slate-800">
                          {process.expand?.buyer?.dependents_info || '-'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-slate-50/50">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <span className="text-muted-foreground block text-xs">Analista</span>
                      <span className="font-medium text-slate-800">
                        {process.expand?.assigned_analyst?.name || 'Não atribuído'}
                      </span>
                    </div>
                    {process.value > 0 && (
                      <div>
                        <span className="text-muted-foreground block text-xs">Valor do Imóvel</span>
                        <span className="font-medium text-emerald-600">
                          {formatCurrency(process.value)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-0 border-b border-border/50">
              <CardTitle className="text-lg pb-4">Documentos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="1º Proponente" className="w-full">
                <div className="px-4 pt-4 border-b border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 gap-4">
                  <TabsList className="bg-transparent space-x-1 h-auto flex-wrap border-b-0 pb-0">
                    <TabsTrigger
                      value="1º Proponente"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-transparent border border-transparent border-b-0 rounded-b-none py-2"
                    >
                      1º Proponente
                    </TabsTrigger>
                    <TabsTrigger
                      value="2º Proponente / Conjuge"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-transparent border border-transparent border-b-0 rounded-b-none py-2"
                    >
                      2º Proponente
                    </TabsTrigger>
                    <TabsTrigger
                      value="Geral"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-transparent border border-transparent border-b-0 rounded-b-none py-2"
                    >
                      Geral
                    </TabsTrigger>
                  </TabsList>
                  {process.result !== 'approved' && process.result !== 'rejected' && (
                    <div className="pb-2 self-end sm:self-auto">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => handleUploadSlot(e, 'Geral')}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <Button
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                      >
                        <UploadCloud className="w-4 h-4 mr-2" /> Arquivo Geral
                      </Button>
                    </div>
                  )}
                </div>

                {['1º Proponente', '2º Proponente / Conjuge'].map((cat) => (
                  <TabsContent key={cat} value={cat} className="p-4 m-0 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {creditDocumentTypes
                        .filter((t) => t.category === cat)
                        .map((type) => {
                          const expectedCategory = `${cat}:::${type.name}`
                          const doc = documents.find((d) => d.category === expectedCategory)
                          return (
                            <div
                              key={type.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50 shadow-sm"
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
                                  <FileIcon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm text-slate-800 truncate">
                                    {type.name}
                                  </p>
                                  {doc && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {doc.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0 ml-2">
                                {doc ? (
                                  <a
                                    href={pb.files.getURL(doc, doc.file)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Button variant="ghost" size="sm" className="text-blue-600">
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </a>
                                ) : (
                                  process.result !== 'approved' &&
                                  process.result !== 'rejected' && (
                                    <div className="relative">
                                      <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => handleUploadSlot(e, expectedCategory)}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                      />
                                      <Button variant="outline" size="sm">
                                        <UploadCloud className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )
                        })}
                      {creditDocumentTypes.filter((t) => t.category === cat).length === 0 && (
                        <div className="col-span-full p-4 text-center text-sm text-muted-foreground">
                          Nenhum documento configurado para este perfil.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}

                <TabsContent value="Geral" className="p-0 m-0 bg-white">
                  <div className="divide-y divide-border/50">
                    {documents
                      .filter((d) => d.category === 'Geral' || !d.category?.includes(':::'))
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
                                <p className="font-medium text-sm text-slate-800">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Enviado por {doc.expand?.uploaded_by?.name || '-'} em{' '}
                                  {new Date(doc.created).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            <a href={url} target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="icon">
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
                          </div>
                        )
                      })}
                    {documents.filter((d) => d.category === 'Geral' || !d.category?.includes(':::'))
                      .length === 0 && (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        Nenhum documento geral anexado. Recomendamos anexar a Matrícula do Imóvel
                        nesta aba.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Processo</DialogTitle>
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
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Motivo do condicionamento</Label>
              <Textarea
                placeholder="Descreva as condições exigidas..."
                value={decisionForm.conditioning_reason}
                onChange={(e) =>
                  setDecisionForm({ ...decisionForm, conditioning_reason: e.target.value })
                }
              />
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

      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprovar Processo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Motivo da reprovação</Label>
              <Textarea
                placeholder="Justificativa da reprovação..."
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
    </div>
  )
}
