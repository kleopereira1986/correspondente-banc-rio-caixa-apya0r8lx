import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { getProcesses, createProcess, getUsers } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

export default function BrokerProcesses() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [processes, setProcesses] = useState<any[]>([])
  const [buyers, setBuyers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ buyerId: '', observations: '', value: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [procs, users] = await Promise.all([getProcesses(), getUsers('buyer')])
      setProcesses(procs)
      setBuyers(users)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    setErrors({})
    try {
      if (!formData.buyerId) {
        setErrors({ buyerId: 'Selecione um cliente.' })
        return
      }
      await createProcess({
        type: 'credit',
        status: 'Nova Solicitação',
        current_step: 'Análise Inicial',
        buyer: formData.buyerId,
        broker: user?.id,
        observations: formData.observations,
        value: Number(formData.value) || 0,
      })
      toast({ title: 'Sucesso', description: 'Avaliação de crédito solicitada com sucesso.' })
      setIsDialogOpen(false)
      loadData()
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprovado':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado
          </Badge>
        )
      case 'reprovado':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" /> Reprovado
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Clock className="w-3 h-3 mr-1" /> {status}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Meus Processos</h1>
          <p className="text-muted-foreground">
            Acompanhe suas avaliações de crédito e financiamentos.
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({ buyerId: '', observations: '', value: '' })
            setIsDialogOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Avaliação de Crédito
        </Button>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Processo ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Etapa Atual</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processes.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.id}</TableCell>
                <TableCell className="font-medium">{p.expand?.buyer?.name || '-'}</TableCell>
                <TableCell className="capitalize">
                  {p.type === 'credit' ? 'Crédito' : 'Habitacional'}
                </TableCell>
                <TableCell>
                  {p.value
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        p.value,
                      )
                    : '-'}
                </TableCell>
                <TableCell>{getStatusBadge(p.status)}</TableCell>
                <TableCell>{p.current_step || '-'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/process/${p.id}`}>
                      <Eye className="w-4 h-4 mr-2" /> Ver Detalhes
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {processes.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nenhum processo encontrado. Solicite uma nova avaliação.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Avaliação de Crédito</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cliente (Comprador)</Label>
              <Select
                value={formData.buyerId}
                onValueChange={(v) => setFormData({ ...formData, buyerId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente cadastrado" />
                </SelectTrigger>
                <SelectContent>
                  {buyers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name || b.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.buyerId && <p className="text-sm text-red-500">{errors.buyerId}</p>}
            </div>
            <div className="space-y-2">
              <Label>Valor do Imóvel/Crédito Desejado</Label>
              <Input
                type="number"
                placeholder="Ex: 350000"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Observações Iniciais</Label>
              <Input
                placeholder="Ex: Cliente tem FGTS, renda composta, etc."
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Solicitar Avaliação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
