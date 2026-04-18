import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, CheckCircle2, Clock, AlertCircle, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getProcesses, createProcess, getUsers } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function Dashboard() {
  const navigate = useNavigate()
  const [processes, setProcesses] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [newType, setNewType] = useState('credit')
  const [clients, setClients] = useState<any[]>([])
  const [selectedBuyer, setSelectedBuyer] = useState('')

  const loadData = async () => {
    try {
      const data = await getProcesses()
      setProcesses(data)
    } catch (e) {}
  }

  const loadClients = async () => {
    try {
      const data = await getUsers('buyer')
      setClients(data)
    } catch (e) {}
  }

  useEffect(() => {
    loadData()
    loadClients()
  }, [])

  useRealtime('processes', () => loadData())

  const handleCreate = async () => {
    if (!selectedBuyer) return
    await createProcess({
      type: newType,
      status: newType === 'credit' ? 'Awaiting Registration' : 'Documentação',
      current_step: newType === 'credit' ? 'Registration' : 'Documentação',
      buyer: selectedBuyer,
      result: 'pending',
    })
    setIsNewOpen(false)
    loadData()
  }

  const getStatusBadge = (status: string, result: string) => {
    if (result === 'approved')
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-medium">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado
        </Badge>
      )
    if (result === 'rejected')
      return (
        <Badge variant="destructive" className="border-none font-medium">
          Reprovado
        </Badge>
      )
    if (result === 'conditioned')
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none font-medium">
          Condicionado
        </Badge>
      )

    if (status === 'Pendente' || status === 'Pendência' || result === 'pending_docs') {
      return (
        <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/10 border-none font-medium animate-pulse-status">
          <AlertCircle className="w-3 h-3 mr-1" /> Pendência
        </Badge>
      )
    }

    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none font-medium">
        <Clock className="w-3 h-3 mr-1" /> {status}
      </Badge>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
  }

  const filtered = processes.filter(
    (p) =>
      p.expand?.buyer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()),
  )

  const pendingCount = processes.filter(
    (p) => p.result === 'pending' || p.status === 'Awaiting Registration',
  ).length
  const approvedCount = processes.filter((p) => p.result === 'approved').length

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Visão Geral</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o status das avaliações de crédito.
          </p>
        </div>

        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Novo Processo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Iniciar Novo Processo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Processo</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Análise de Crédito</SelectItem>
                    <SelectItem value="housing">Esteira Habitacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cliente (Comprador)</Label>
                <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Criar Processo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Processos
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{processes.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendente Avaliação
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprovados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{approvedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50">
          <CardTitle className="text-lg text-slate-800">Fila de Processos</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar cliente..."
                className="w-full sm:w-[250px] pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead>ID / Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right hidden md:table-cell">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((process) => (
                <TableRow
                  key={process.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/process/${process.id}`)}
                >
                  <TableCell className="py-4">
                    <div className="font-medium text-slate-800 group-hover:text-primary">
                      {process.expand?.buyer?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">{process.id}</div>
                  </TableCell>
                  <TableCell className="py-4 hidden sm:table-cell">
                    {process.type === 'credit' ? 'Crédito' : 'Habitacional'}
                  </TableCell>
                  <TableCell className="py-4 text-right font-medium text-slate-700">
                    {formatCurrency(process.value)}
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    {getStatusBadge(process.status, process.result)}
                  </TableCell>
                  <TableCell className="py-4 text-right text-muted-foreground text-sm hidden md:table-cell">
                    {new Date(process.created).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum processo encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
