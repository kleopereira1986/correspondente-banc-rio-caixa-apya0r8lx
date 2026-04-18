import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { mockProcesses, mockDocuments } from '@/lib/data'
import {
  ArrowLeft,
  User,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ProcessDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [pendencyReason, setPendencyReason] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Use mock data for demo
  const process = mockProcesses.find((p) => p.id === id) || mockProcesses[0]

  const handleAction = (action: 'approve' | 'reject' | 'pendency') => {
    let title,
      description,
      variant: 'default' | 'destructive' = 'default'

    if (action === 'approve') {
      title = 'Processo Aprovado'
      description = 'Crédito aprovado com sucesso. O cliente será notificado.'
    } else if (action === 'reject') {
      title = 'Processo Reprovado'
      description = 'A avaliação foi encerrada e reprovada.'
      variant = 'destructive'
    } else {
      title = 'Pendência Solicitada'
      description = 'O cliente foi notificado para corrigir os documentos.'
      setIsDialogOpen(false)
    }

    toast({ title, description, variant })
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="hover:bg-white rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">Avaliação: {process.id}</h1>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
              Em Análise
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {process.type} • Enviado em {new Date(process.date).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Data & Actions */}
        <div className="space-y-6 lg:col-span-1">
          {/* Action Panel */}
          <Card className="shadow-sm border-border/50 border-t-4 border-t-primary">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Decisão da Avaliação</CardTitle>
              <CardDescription>Determine o próximo passo deste processo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                onClick={() => handleAction('approve')}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovar Crédito
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-secondary/50 text-secondary hover:bg-secondary/10 font-semibold"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" /> Solicitar Pendência
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Informar Pendência</DialogTitle>
                    <DialogDescription>
                      Descreva detalhadamente qual documento está faltando ou incorreto. O cliente
                      receberá um alerta.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Textarea
                      placeholder="Ex: O holerite enviado está ilegível..."
                      className="min-h-[120px]"
                      value={pendencyReason}
                      onChange={(e) => setPendencyReason(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      className="bg-secondary hover:bg-secondary/90 text-white"
                      onClick={() => handleAction('pendency')}
                    >
                      Enviar Notificação
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive font-medium"
                onClick={() => handleAction('reject')}
              >
                <XCircle className="w-4 h-4 mr-2" /> Reprovar
              </Button>
            </CardContent>
          </Card>

          {/* Client Data Sheet */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Dados do Comprador
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50 text-sm">
                <div className="p-4 grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground col-span-1">Nome</span>
                  <span className="font-medium text-slate-800 col-span-2">
                    {process.clientName}
                  </span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground col-span-1">CPF</span>
                  <span className="font-medium text-slate-800 col-span-2">123.456.789-00</span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground col-span-1">Renda Bruta</span>
                  <span className="font-medium text-emerald-600 col-span-2">R$ 15.500,00</span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground col-span-1">Estado Civil</span>
                  <span className="font-medium text-slate-800 col-span-2">Casado(a)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Data */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" /> Imóvel Pretendido
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50 text-sm">
                <div className="p-4 grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground col-span-1">Valor</span>
                  <span className="font-medium text-slate-800 col-span-2">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      process.value,
                    )}
                  </span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground col-span-1">Entrada</span>
                  <span className="font-medium text-slate-800 col-span-2">R$ 70.000,00 (20%)</span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground col-span-1">Localização</span>
                  <span className="font-medium text-slate-800 col-span-2">
                    São Paulo, SP - CEP 01001-000
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Documents Viewer */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-border/50 h-full">
            <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border/50">
              <div>
                <CardTitle className="text-lg">Arquivos Anexados</CardTitle>
                <CardDescription>Revise os documentos enviados pelas partes.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-slate-50">
                {mockDocuments.length} Arquivos
              </Badge>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {mockDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="group border border-border/60 rounded-xl overflow-hidden bg-white hover:border-primary/40 hover:shadow-md transition-all duration-300 flex flex-col"
                  >
                    <div className="relative aspect-video bg-slate-100 overflow-hidden flex items-center justify-center border-b border-border/50">
                      <img
                        src={doc.url}
                        alt={doc.name}
                        className="object-cover w-full h-full opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="shadow-lg backdrop-blur-md bg-white/90 hover:bg-white text-slate-800"
                        >
                          <Eye className="w-4 h-4 mr-2" /> Visualizar
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 flex items-start justify-between gap-2 flex-1">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-800 line-clamp-2 leading-tight">
                          {doc.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                            PDF
                          </span>
                          <span className="text-[10px] text-muted-foreground">1.2 MB</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-primary shrink-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
