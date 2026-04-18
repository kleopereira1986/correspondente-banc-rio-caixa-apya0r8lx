import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { FileText, ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { getProcesses, createProcess } from '@/services/api'
import { useAuth } from '@/contexts/auth-context'
import { useRealtime } from '@/hooks/use-realtime'

export default function CustomerPortal() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [processes, setProcesses] = useState<any[]>([])
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [observations, setObservations] = useState('')

  const loadData = async () => {
    try {
      const data = await getProcesses()
      setProcesses(data)
    } catch (e) {}
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('processes', () => loadData())

  const handleCreate = async () => {
    if (!user) return
    try {
      await createProcess({
        type: 'credit',
        status: 'Awaiting Registration',
        current_step: 'Registration',
        buyer: user.id,
        observations: observations,
        result: 'pending',
      })
      setIsNewOpen(false)
      setObservations('')
      loadData()
    } catch (e) {}
  }

  const getStatusBadge = (status: string, result: string) => {
    if (result === 'approved')
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-none">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado
        </Badge>
      )
    if (result === 'rejected')
      return (
        <Badge variant="destructive" className="border-none">
          Reprovado
        </Badge>
      )
    if (status === 'Pendente' || status === 'Pendência' || result === 'pending_docs')
      return (
        <Badge className="bg-secondary/10 text-secondary border-none animate-pulse-status">
          <AlertCircle className="w-3 h-3 mr-1" /> Pendência de Doc
        </Badge>
      )
    return (
      <Badge className="bg-blue-100 text-blue-800 border-none">
        <Clock className="w-3 h-3 mr-1" /> Em Análise
      </Badge>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Meus Processos</h1>
          <p className="text-muted-foreground mt-1">Acompanhe o andamento das suas solicitações.</p>
        </div>
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">Nova Análise de Crédito</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Análise de Crédito</DialogTitle>
              <DialogDescription>
                Inicie um novo processo de crédito enviando suas observações. Documentos poderão ser
                anexados em seguida.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="Ex: Gostaria de financiar um imóvel no valor de R$ 300.000..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleCreate} className="w-full">
                Enviar Solicitação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {processes.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-muted-foreground">Você não possui processos ativos no momento.</p>
          </Card>
        ) : (
          processes.map((process) => (
            <Card
              key={process.id}
              className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
              onClick={() => navigate(`/process/${process.id}`)}
            >
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-800">
                      {process.type === 'credit' ? 'Análise de Crédito' : 'Processo Habitacional'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Protocolo: {process.id} • Iniciado em{' '}
                      {new Date(process.created).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  {getStatusBadge(process.status, process.result)}
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
