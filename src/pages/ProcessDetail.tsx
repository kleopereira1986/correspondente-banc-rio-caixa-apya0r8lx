import { useParams, useNavigate } from 'react-router-dom'
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
import { getProcess, getDocuments, updateProcess, createDocument, getUsers } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import pb from '@/lib/pocketbase/client'

export default function ProcessDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const [process, setProcess] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [pendencyReason, setPendencyReason] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [analysts, setAnalysts] = useState<any[]>([])
  const [transferAnalyst, setTransferAnalyst] = useState('')

  const isAnalyst = user?.role === 'master' || user?.role === 'analyst'

  const loadData = async () => {
    if (!id) return
    try {
      const p = await getProcess(id)
      setProcess(p)
      const docs = await getDocuments(id)
      setDocuments(docs)
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

  const handleAction = async (action: 'approve' | 'reject' | 'pendency' | 'transfer' | 'claim') => {
    if (!process) return
    try {
      if (action === 'approve') {
        await updateProcess(process.id, { result: 'approved', status: 'Completed' })
        toast({ title: 'Processo Aprovado' })
      } else if (action === 'reject') {
        await updateProcess(process.id, { result: 'rejected', status: 'Completed' })
        toast({ title: 'Processo Reprovado', variant: 'destructive' })
      } else if (action === 'pendency') {
        await updateProcess(process.id, {
          result: 'pending',
          status: 'Pendência',
          observations: pendencyReason,
        })
        toast({ title: 'Pendência Solicitada' })
        setIsDialogOpen(false)
      } else if (action === 'claim') {
        await updateProcess(process.id, {
          assigned_analyst: user?.id,
          status: 'Registration',
          current_step: 'Registration',
        })
        toast({ title: 'Processo Assumido' })
      } else if (action === 'transfer') {
        if (!transferAnalyst) return
        await updateProcess(process.id, {
          assigned_analyst: transferAnalyst,
          status: 'Conferral and Analysis',
          current_step: 'Conferral and Analysis',
        })
        toast({ title: 'Processo Transferido' })
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar.', variant: 'destructive' })
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !process) return

    const formData = new FormData()
    formData.append('process', process.id)
    formData.append('file', file)
    formData.append('name', file.name)
    formData.append('uploaded_by', user?.id || '')
    formData.append('category', 'Geral')
    formData.append('status', 'review')

    try {
      await createDocument(formData as any)
      toast({ title: 'Documento enviado' })
      if (fileInputRef.current) fileInputRef.current.value = ''
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

  if (!process)
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando...</div>

  const creditSteps = [
    {
      id: 1,
      name: 'Registro',
      active: true,
      completed: process.status !== 'Awaiting Registration',
    },
    {
      id: 2,
      name: 'Análise',
      active: process.current_step === 'Conferral and Analysis' || process.result !== 'pending',
      completed: process.result === 'approved' || process.result === 'rejected',
    },
    {
      id: 3,
      name: 'Decisão',
      active: process.result === 'approved' || process.result === 'rejected',
      completed: process.result === 'approved' || process.result === 'rejected',
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
      completed:
        process.current_step !== 'Documentação' &&
        process.current_step !== 'Assinatura de Formulários',
    },
    {
      id: 3,
      name: 'Conformidade',
      active: process.current_step === 'Conformidade Caixa' || process.status === 'Completed',
      completed: process.status === 'Completed',
    },
  ]

  const steps = process.type === 'credit' ? creditSteps : housingSteps

  return (
    <div className="space-y-6 animate-slide-up max-w-6xl mx-auto">
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

        <Button variant="outline" onClick={handleCopyLink} className="shrink-0 shadow-sm">
          <LinkIcon className="w-4 h-4 mr-2" /> Gerar Link para Comprador
        </Button>
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
                  process.result === 'approved' || process.result === 'rejected' ? '100%' : '50%',
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
                      onClick={() => handleAction('approve')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovar
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                          <DialogTitle>Informar Pendência</DialogTitle>
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
                      onClick={() => handleAction('reject')}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reprovar
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Detalhes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-sm">
              <div className="divide-y divide-border/50">
                <div className="p-4 grid grid-cols-3">
                  <span className="text-muted-foreground">Comprador</span>
                  <span className="font-medium text-slate-800 col-span-2">
                    {process.expand?.buyer?.name || '-'}
                  </span>
                </div>
                {process.expand?.seller && (
                  <div className="p-4 grid grid-cols-3">
                    <span className="text-muted-foreground">Vendedor</span>
                    <span className="font-medium text-slate-800 col-span-2">
                      {process.expand?.seller?.name}
                    </span>
                  </div>
                )}
                <div className="p-4 grid grid-cols-3">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-medium text-emerald-600 col-span-2">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      process.value || 0,
                    )}
                  </span>
                </div>
                <div className="p-4 grid grid-cols-3">
                  <span className="text-muted-foreground">Analista</span>
                  <span className="font-medium text-slate-800 col-span-2">
                    {process.expand?.assigned_analyst?.name || 'Não atribuído'}
                  </span>
                </div>
                {process.expand?.credit_analysis_type && (
                  <div className="p-4 grid grid-cols-3">
                    <span className="text-muted-foreground">Tipo de Análise</span>
                    <span className="font-medium text-slate-800 col-span-2">
                      {process.expand.credit_analysis_type.name}
                    </span>
                  </div>
                )}
                {process.expand?.property_type && (
                  <div className="p-4 grid grid-cols-3">
                    <span className="text-muted-foreground">Tipo de Imóvel</span>
                    <span className="font-medium text-slate-800 col-span-2">
                      {process.expand.property_type.name}
                    </span>
                  </div>
                )}
                <div className="p-4 grid grid-cols-3">
                  <span className="text-muted-foreground">Observações</span>
                  <span className="font-medium text-slate-800 col-span-2">
                    {process.observations || '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border/50">
              <div>
                <CardTitle className="text-lg">Documentos</CardTitle>
              </div>
              {process.result !== 'approved' && process.result !== 'rejected' && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleUpload}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud className="w-4 h-4 mr-2" /> Enviar Arquivo
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {documents.map((doc) => {
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
                            Enviado por {doc.expand?.uploaded_by?.name || 'Desconhecido'} em{' '}
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
                {documents.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhum documento anexado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
