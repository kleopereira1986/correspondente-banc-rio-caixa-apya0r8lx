import pb from '@/lib/pocketbase/client'
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
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  UserPlus,
  Filter,
  FileOutput,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { createProcess, getUsers, updateProcess } from '@/services/api'
import { useAuth } from '@/contexts/auth-context'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { ConstructionCompanySelect } from '@/components/ConstructionCompanySelect'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMaster = user?.role === 'master'
  const isBroker = user?.role === 'broker'
  const { toast } = useToast()
  const [processes, setProcesses] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [agencyFilter, setAgencyFilter] = useState('all')
  const [brokerFilter, setBrokerFilter] = useState('all')
  const [expiryDateStart, setExpiryDateStart] = useState('')
  const [expiryDateEnd, setExpiryDateEnd] = useState('')
  const [evalDateStart, setEvalDateStart] = useState('')
  const [evalDateEnd, setEvalDateEnd] = useState('')
  const [valueMin, setValueMin] = useState('')
  const [valueMax, setValueMax] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [newType, setNewType] = useState('credit')
  const [clients, setClients] = useState<any[]>([])
  const [selectedBuyer, setSelectedBuyer] = useState('')

  const [isUnassignedListOpen, setIsUnassignedListOpen] = useState(false)
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [deleteProcessId, setDeleteProcessId] = useState<string | null>(null)
  const [isDeletingProcess, setIsDeletingProcess] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [transitionProcess, setTransitionProcess] = useState<any>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [firstHousingStage, setFirstHousingStage] = useState<string>('TRIAGEM CCA')

  const loadData = async () => {
    try {
      const data = await pb.collection('processes').getFullList({
        sort: '-created',
        expand:
          'buyer,buyer_2,assigned_analyst,broker,broker.real_estate_agency,credit_analysis_type,property_type,development_type,last_updated_by',
      })
      setProcesses(data)
    } catch (e) {
      console.error(e)
    }
  }

  const loadClients = async () => {
    try {
      const data = await getUsers('buyer')
      setClients(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
    loadClients()
  }, [])

  useEffect(() => {
    pb.collection('construction_companies')
      .getFullList({ sort: 'name' })
      .then(setCompanies)
      .catch(console.error)
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
  useRealtime('users', () => loadClients())

  const handleCreateClient = async () => {
    if (!newClientName) {
      toast({ title: 'O nome é obrigatório', variant: 'destructive' })
      return
    }
    const email = newClientEmail || `comprador_${Date.now()}@caixa.com`
    const password = `Caixa@${Date.now()}`
    try {
      await pb.collection('users').create({
        name: newClientName,
        email,
        password,
        passwordConfirm: password,
        role: 'buyer',
      })
      toast({ title: 'Cliente cadastrado com sucesso!' })
      setIsNewClientOpen(false)
      setNewClientName('')
      setNewClientEmail('')
      loadClients()
    } catch (e) {
      toast({ title: 'Erro ao cadastrar cliente', variant: 'destructive' })
    }
  }

  const handleAssumeProcess = async (processId: string) => {
    try {
      await updateProcess(processId, {
        assigned_analyst: user?.id,
        status: 'Em Análise',
        current_step: 'Análise',
      })
      toast({ title: 'Processo assumido com sucesso!' })
      loadData()
    } catch (e) {
      toast({
        title: 'Erro ao assumir processo',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const handleAuthorization = async (procId: string) => {
    try {
      await updateProcess(procId, {
        status: 'Autorização Concluída',
      })
      if (user?.id) {
        try {
          await pb.send('/backend/v1/process-logs/manual', {
            method: 'POST',
            body: JSON.stringify({
              process: procId,
              note: 'Autorização Gerencial confirmada pelo analista no Dashboard.',
            }),
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (logErr) {
          console.error('Erro ao registrar log manual', logErr)
        }
      }
      toast({ title: 'Autorização confirmada!' })
      loadData()
    } catch (e) {
      toast({
        title: 'Erro ao confirmar autorização',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const handleAcknowledgePendency = async (procId: string) => {
    try {
      await updateProcess(procId, {
        status: 'Em Cadastramento',
      })
      if (user?.id) {
        try {
          await pb.send('/backend/v1/process-logs/manual', {
            method: 'POST',
            body: JSON.stringify({
              process: procId,
              note: 'Pendência reconhecida como resolvida no Dashboard.',
            }),
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (logErr) {
          console.error('Erro ao registrar log manual', logErr)
        }
      }
      toast({ title: 'Pendência reconhecida!' })
      loadData()
    } catch (e) {
      toast({
        title: 'Erro ao atualizar processo',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const handleCreate = async () => {
    if (!selectedBuyer) return
    let step = 'Documentação'
    if (newType === 'housing') {
      step = 'Triagem CCA'
    }

    await createProcess({
      type: newType,
      status: newType === 'credit' ? 'Triagem' : 'Nova Solicitação',
      current_step: newType === 'credit' ? 'Triagem' : step,
      buyer: selectedBuyer,
      result: 'pending',
    })
    toast({ title: 'Processo iniciado com sucesso!' })
    setIsNewOpen(false)
    loadData()
  }

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
      await updateProcess(transitionProcess.id, {
        type: 'housing',
        current_step: targetStep,
        status: 'Nova Solicitação',
        result: 'approved',
        construction_company: selectedCompanyId,
        last_updated_by: user?.id || '',
      })
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
    } catch (err) {
      toast({
        title: 'Erro ao enviar para habitacional',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setIsTransitioning(false)
    }
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

  const uniqueAgencies = Array.from(
    new Set(
      processes.map((p) => p.expand?.broker?.expand?.real_estate_agency?.name).filter(Boolean),
    ),
  ) as string[]

  const uniqueBrokers = Array.from(
    new Set(processes.map((p) => p.expand?.broker?.name).filter(Boolean)),
  ) as string[]

  const filtered = processes.filter((p) => {
    const q = search.toLowerCase()
    const name1 = p.expand?.buyer?.name?.toLowerCase() || ''
    const cpf1 = p.expand?.buyer?.cpf?.toLowerCase() || ''
    const name2 = p.expand?.buyer_2?.name?.toLowerCase() || ''
    const cpf2 = p.expand?.buyer_2?.cpf?.toLowerCase() || ''
    const id = p.id.toLowerCase()
    return (
      name1.includes(q) ||
      cpf1.includes(q) ||
      name2.includes(q) ||
      cpf2.includes(q) ||
      id.includes(q)
    )
  })

  const filteredCredit = filtered.filter((p) => {
    if (p.type !== 'credit') return false

    if (
      agencyFilter !== 'all' &&
      p.expand?.broker?.expand?.real_estate_agency?.name !== agencyFilter
    )
      return false
    if (brokerFilter !== 'all' && p.expand?.broker?.name !== brokerFilter) return false

    if (
      expiryDateStart &&
      (!p.evaluation_expiry_date ||
        new Date(p.evaluation_expiry_date) < new Date(expiryDateStart + 'T00:00:00'))
    )
      return false
    if (
      expiryDateEnd &&
      (!p.evaluation_expiry_date ||
        new Date(p.evaluation_expiry_date) > new Date(expiryDateEnd + 'T23:59:59'))
    )
      return false

    if (evalDateStart && new Date(p.updated) < new Date(evalDateStart + 'T00:00:00')) return false
    if (evalDateEnd && new Date(p.updated) > new Date(evalDateEnd + 'T23:59:59')) return false

    const approvedValue = p.approved_financing_value || 0
    if (valueMin && approvedValue < Number(valueMin)) return false
    if (valueMax && approvedValue > Number(valueMax)) return false

    return true
  })

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setIsExporting(true)
      const headers = [
        'ID',
        'Cliente',
        'Corretor',
        'Imobiliária',
        'Valor Aprovado',
        'Status',
        'Validade Avaliação',
        'Data Criação',
        'Última Atualização',
      ]
      const rows = filteredCredit.map((p) => [
        p.id,
        p.expand?.buyer?.name && p.expand?.buyer_2?.name
          ? `${p.expand.buyer.name} / ${p.expand.buyer_2.name}`
          : p.expand?.buyer?.name || p.expand?.buyer_2?.name || 'Sem proponente vinculado',
        p.expand?.broker?.name || '-',
        p.expand?.broker?.expand?.real_estate_agency?.name || '-',
        formatCurrency(p.approved_financing_value || 0),
        p.status,
        p.result !== 'pending' && p.evaluation_expiry_date
          ? new Date(p.evaluation_expiry_date).toLocaleDateString('pt-BR')
          : '',
        new Date(p.created).toLocaleString('pt-BR'),
        new Date(p.updated).toLocaleString('pt-BR'),
      ])

      if (format === 'excel') {
        const csvContent =
          '\uFEFF' +
          [headers.join(';')]
            .concat(
              rows.map((row) =>
                row
                  .map((cell) => {
                    const cellStr = (cell || '').toString().replace(/"/g, '""')
                    return `"${cellStr}"`
                  })
                  .join(';'),
              ),
            )
            .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `exportacao_credito_${Date.now()}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast({ title: 'Exportação concluída com sucesso!' })
      } else if (format === 'pdf') {
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
          toast({
            title: 'Erro ao gerar PDF',
            description: 'Habilite pop-ups para este site.',
            variant: 'destructive',
          })
          return
        }

        const html = `
          <html>
            <head>
              <title>Exportação de Processos</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f4f4f4; }
                h1 { font-size: 18px; }
              </style>
            </head>
            <body>
              <h1>Fila de Processos - Análise de Crédito</h1>
              <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
              <table>
                <thead>
                  <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${rows
                    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
                    .join('')}
                </tbody>
              </table>
              <script>
                window.onload = () => { window.print(); window.close(); }
              </script>
            </body>
          </html>
        `
        printWindow.document.write(html)
        printWindow.document.close()
        toast({ title: 'PDF gerado com sucesso!' })
      }
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro na exportação', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  const filteredHousing = filtered.filter((p) => {
    if (p.type !== 'housing') return false
    if (
      agencyFilter !== 'all' &&
      p.expand?.broker?.expand?.real_estate_agency?.name !== agencyFilter
    )
      return false
    if (brokerFilter !== 'all' && p.expand?.broker?.name !== brokerFilter) return false
    return true
  })

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

  const pendingCount = processes.filter(
    (p) => p.result === 'pending' || p.status === 'Triagem' || p.status === 'Awaiting Registration',
  ).length
  const approvedCount = processes.filter((p) => p.result === 'approved').length

  // Credit Dashboard Data
  const creditProcesses = processes.filter((p) => p.type === 'credit')
  const unassignedCredit = creditProcesses.filter(
    (p) => !p.assigned_analyst && p.result === 'pending',
  )
  const creditStats = {
    inProgress: creditProcesses.filter(
      (p) =>
        p.result !== 'approved' &&
        p.result !== 'rejected' &&
        p.result !== 'conditioned' &&
        p.status !== 'Pendência' &&
        p.result !== 'pending',
    ).length,
    approved: creditProcesses.filter((p) => p.result === 'approved').length,
    pending: creditProcesses.filter((p) => p.status === 'Pendência' || p.result === 'pending')
      .length,
    conditioned: creditProcesses.filter((p) => p.result === 'conditioned').length,
    rejected: creditProcesses.filter((p) => p.result === 'rejected').length,
  }

  const creditChartData = [
    { status: 'inProgress', value: creditStats.inProgress, fill: 'var(--color-inProgress)' },
    { status: 'approved', value: creditStats.approved, fill: 'var(--color-approved)' },
    { status: 'pending', value: creditStats.pending, fill: 'var(--color-pending)' },
    { status: 'conditioned', value: creditStats.conditioned, fill: 'var(--color-conditioned)' },
    { status: 'rejected', value: creditStats.rejected, fill: 'var(--color-rejected)' },
  ].filter((d) => d.value > 0)

  const chartConfigCredit = {
    inProgress: { label: 'Em Andamento', color: 'hsl(var(--chart-1))' },
    approved: { label: 'Aprovados', color: 'hsl(var(--chart-2))' },
    pending: { label: 'Pendentes', color: 'hsl(var(--chart-3))' },
    conditioned: { label: 'Condicionados', color: 'hsl(var(--chart-4))' },
    rejected: { label: 'Reprovados', color: 'hsl(var(--chart-5))' },
  }

  // Housing Dashboard Data
  const housingProcesses = processes.filter((p) => p.type === 'housing')
  const housingStagesCount = housingProcesses.reduce(
    (acc, p) => {
      const step = p.current_step || 'Não iniciada'
      acc[step] = (acc[step] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const housingChartData = Object.entries(housingStagesCount).map(([step, count], index) => {
    const key = `step${index}`
    return { stepName: step, status: key, value: count, fill: `var(--color-${key})` }
  })

  const chartConfigHousing = housingChartData.reduce(
    (acc, item, index) => {
      acc[item.status] = { label: item.stepName, color: `hsl(var(--chart-${(index % 5) + 1}))` }
      return acc
    },
    {} as Record<string, any>,
  )

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Visão Geral</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o status das avaliações de crédito.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {!isBroker && (
            <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto shadow-sm">
                  <UserPlus className="mr-2 h-4 w-4" /> Cadastrar Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                  <DialogDescription>
                    Preencha os dados abaixo para cadastrar um novo cliente no sistema.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Ex: João da Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email (Opcional)</Label>
                    <Input
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="Ex: joao@email.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateClient} className="w-full">
                    Cadastrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {!isBroker && (
            <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto shadow-sm">
                  <Plus className="mr-2 h-4 w-4" /> Novo Processo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Iniciar Novo Processo</DialogTitle>
                  <DialogDescription>
                    Selecione o tipo de processo e o cliente para iniciar um novo atendimento.
                  </DialogDescription>
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
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} className="w-full">
                    Criar Processo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Dialog open={isUnassignedListOpen} onOpenChange={setIsUnassignedListOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Processos Aguardando Analista</DialogTitle>
            <DialogDescription>
              Lista de processos de crédito aguardando atribuição de analista.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0">
                <TableRow>
                  <TableHead>ID / Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedCredit.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">
                        {p.expand?.buyer?.name && p.expand?.buyer_2?.name
                          ? `${p.expand.buyer.name} / ${p.expand.buyer_2.name}`
                          : p.expand?.buyer?.name ||
                            p.expand?.buyer_2?.name ||
                            'Sem proponente vinculado'}
                      </div>
                      <div className="text-xs text-muted-foreground">{p.id}</div>
                    </TableCell>
                    <TableCell>{formatCurrency(p.value)}</TableCell>
                    <TableCell>{new Date(p.created).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleAssumeProcess(p.id)}>
                        Assumir Processo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {unassignedCredit.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum processo aguardando analista.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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

      <Tabs defaultValue="fila_credito" className="w-full space-y-6">
        <TabsList className="bg-slate-100/50 flex-wrap h-auto">
          <TabsTrigger value="fila_credito">Fila de Processos Análise de Crédito</TabsTrigger>
          <TabsTrigger value="fila_habitacional">Fila de Processos Habitacional</TabsTrigger>
          {isMaster && (
            <>
              <TabsTrigger value="credito">Dashboard de Crédito</TabsTrigger>
              <TabsTrigger value="habitacional">Dashboard Habitacional</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="fila_credito" className="space-y-6 mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Processos Análise de Crédito
                </CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800">{filteredCredit.length}</div>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aprovados
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800">{approvedCount}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-border/50 overflow-hidden">
            <CardHeader className="pb-3 flex flex-col gap-4 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg text-slate-800">
                  Fila de Processos Análise de Crédito
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar cliente ou CPF..."
                      className="w-full sm:w-[200px] pl-9 h-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />{' '}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                  >
                    <FileOutput className="h-4 w-4 mr-2 text-red-500" />
                    Gerar PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => handleExport('excel')}
                    disabled={isExporting}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" />
                    Gerar Excel
                  </Button>
                </div>
              </div>

              {showAdvancedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 border rounded-md text-sm animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-700">Imobiliária</label>
                    <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                      <SelectTrigger className="h-9 bg-white">
                        <SelectValue placeholder="Todas" />
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
                    <label className="font-medium text-slate-700">Corretor</label>
                    <Select value={brokerFilter} onValueChange={setBrokerFilter}>
                      <SelectTrigger className="h-9 bg-white">
                        <SelectValue placeholder="Todos" />
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
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-700">Validade da Avaliação</label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        className="h-9 bg-white"
                        value={expiryDateStart}
                        onChange={(e) => setExpiryDateStart(e.target.value)}
                      />
                      <Input
                        type="date"
                        className="h-9 bg-white"
                        value={expiryDateEnd}
                        onChange={(e) => setExpiryDateEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-700">Data de Avaliação</label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        className="h-9 bg-white"
                        value={evalDateStart}
                        onChange={(e) => setEvalDateStart(e.target.value)}
                      />
                      <Input
                        type="date"
                        className="h-9 bg-white"
                        value={evalDateEnd}
                        onChange={(e) => setEvalDateEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 lg:col-span-2">
                    <label className="font-medium text-slate-700">Valor Aprovado (R$)</label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Mínimo"
                        className="h-9 bg-white"
                        value={valueMin}
                        onChange={(e) => setValueMin(e.target.value)}
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="number"
                        placeholder="Máximo"
                        className="h-9 bg-white"
                        value={valueMax}
                        onChange={(e) => setValueMax(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-end justify-end lg:col-span-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAgencyFilter('all')
                        setBrokerFilter('all')
                        setExpiryDateStart('')
                        setExpiryDateEnd('')
                        setEvalDateStart('')
                        setEvalDateEnd('')
                        setValueMin('')
                        setValueMax('')
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[1200px]">
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead>ID / Cliente</TableHead>
                    <TableHead>Corretor / Imobiliária</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Validade Avaliação</TableHead>
                    <TableHead className="text-right">Data/Hora Criação</TableHead>
                    <TableHead className="text-right">Última Atualização</TableHead>
                    <TableHead>Atualizado Por</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCredit.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                        Nenhum processo encontrado com os filtros atuais.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCredit.map((process) => (
                      <TableRow
                        key={process.id}
                        className="cursor-pointer group"
                        onClick={() => navigate(`/process/${process.id}`)}
                      >
                        <TableCell className="py-4 min-w-[200px]">
                          <div className="font-medium text-slate-800 group-hover:text-primary">
                            {process.expand?.buyer?.name && process.expand?.buyer_2?.name
                              ? `${process.expand.buyer.name} / ${process.expand.buyer_2.name}`
                              : process.expand?.buyer?.name ||
                                process.expand?.buyer_2?.name ||
                                'Sem proponente vinculado'}
                          </div>
                          <div className="text-xs text-muted-foreground">{process.id}</div>
                        </TableCell>
                        <TableCell className="py-4 min-w-[180px]">
                          <div className="text-sm">{process.expand?.broker?.name || '-'}</div>
                          <div className="text-xs text-muted-foreground">
                            {process.expand?.broker?.expand?.real_estate_agency?.name || ''}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right font-medium text-slate-700 whitespace-nowrap">
                          {formatCurrency(process.value)}
                        </TableCell>
                        <TableCell className="py-4 text-center min-w-[140px]">
                          {process.status === 'Pendência Resolvida' ? (
                            <Button
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse shadow-md w-full whitespace-nowrap"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAcknowledgePendency(process.id)
                              }}
                            >
                              Pendência Resolvida
                            </Button>
                          ) : process.status === 'Autorização Solicitada' ? (
                            <div className="flex flex-col gap-2 items-center">
                              <Badge className="bg-amber-100 text-amber-800 border-none font-medium whitespace-nowrap">
                                Aguardando Autorização Gerencial
                              </Badge>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm w-full text-xs h-7 whitespace-nowrap"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAuthorization(process.id)
                                }}
                              >
                                Informar Autorização
                              </Button>
                            </div>
                          ) : (
                            getStatusBadge(process.status, process.result)
                          )}
                        </TableCell>
                        <TableCell className="py-4 text-center text-sm whitespace-nowrap">
                          {process.result !== 'pending' && process.evaluation_expiry_date
                            ? new Date(process.evaluation_expiry_date).toLocaleDateString('pt-BR')
                            : ''}
                        </TableCell>
                        <TableCell className="py-4 text-right text-muted-foreground text-sm whitespace-nowrap">
                          {new Date(process.created).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </TableCell>
                        <TableCell className="py-4 text-right text-muted-foreground text-sm whitespace-nowrap">
                          {new Date(process.updated).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </TableCell>
                        <TableCell className="py-4 text-sm min-w-[150px]">
                          {process.expand?.last_updated_by?.name || '-'}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          {process.result === 'approved' &&
                            (user?.role === 'master' ||
                              user?.role === 'analyst' ||
                              user?.role === 'broker') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-teal-200 text-teal-700 hover:bg-teal-50 whitespace-nowrap"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedCompanyId(process.construction_company || '')
                                  setTransitionProcess(process)
                                }}
                              >
                                Enviar para Habitacional
                              </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {filteredCredit.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Nenhum processo de análise de crédito encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fila_habitacional" className="space-y-6 mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Processos Habitacionais
                </CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800">{filteredHousing.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-border/50 overflow-hidden">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50">
              <CardTitle className="text-lg text-slate-800">
                Fila de Processos Habitacional
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar cliente ou CPF..."
                    className="w-full sm:w-[250px] pl-9 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                  <SelectTrigger className="h-9 w-full sm:w-[180px] bg-white">
                    <SelectValue placeholder="Imobiliária" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Imobiliárias</SelectItem>
                    {uniqueAgencies.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={brokerFilter} onValueChange={setBrokerFilter}>
                  <SelectTrigger className="h-9 w-full sm:w-[180px] bg-white">
                    <SelectValue placeholder="Corretor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Corretores</SelectItem>
                    {uniqueBrokers.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead>ID / Cliente</TableHead>
                    <TableHead>Corretor Parceiro</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Data/Hora Criação</TableHead>
                    <TableHead className="text-right">Última Atualização</TableHead>
                    <TableHead>Atualizado Por</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHousing.map((process) => (
                    <TableRow
                      key={process.id}
                      className="cursor-pointer group"
                      onClick={() => navigate(`/process/${process.id}`)}
                    >
                      <TableCell className="py-4 min-w-[200px]">
                        <div className="font-medium text-slate-800 group-hover:text-primary">
                          {process.expand?.buyer?.name && process.expand?.buyer_2?.name
                            ? `${process.expand.buyer.name} / ${process.expand.buyer_2.name}`
                            : process.expand?.buyer?.name ||
                              process.expand?.buyer_2?.name ||
                              'Sem proponente vinculado'}
                        </div>
                        <div className="text-xs text-muted-foreground">{process.id}</div>
                      </TableCell>
                      <TableCell className="py-4 min-w-[180px]">
                        <div className="text-sm">{process.expand?.broker?.name || '-'}</div>
                        <div className="text-xs text-muted-foreground">
                          {process.expand?.broker?.expand?.real_estate_agency?.name || ''}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right font-medium text-slate-700 whitespace-nowrap">
                        {formatCurrency(process.value)}
                      </TableCell>
                      <TableCell className="py-4 text-center min-w-[140px]">
                        {process.status === 'Pendência Resolvida' ? (
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse shadow-md w-full whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAcknowledgePendency(process.id)
                            }}
                          >
                            Pendência Resolvida
                          </Button>
                        ) : process.status === 'Autorização Solicitada' ? (
                          <div className="flex flex-col gap-2 items-center">
                            <Badge className="bg-amber-100 text-amber-800 border-none font-medium whitespace-nowrap">
                              Aguardando Autorização Gerencial
                            </Badge>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm w-full text-xs h-7 whitespace-nowrap"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAuthorization(process.id)
                              }}
                            >
                              Informar Autorização
                            </Button>
                          </div>
                        ) : (
                          getStatusBadge(process.status, process.result)
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-right text-muted-foreground text-sm whitespace-nowrap">
                        {new Date(process.created).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </TableCell>
                      <TableCell className="py-4 text-right text-muted-foreground text-sm whitespace-nowrap">
                        {new Date(process.updated).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </TableCell>
                      <TableCell className="py-4 text-sm min-w-[150px]">
                        {process.expand?.last_updated_by?.name || '-'}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(user?.role === 'master' || user?.role === 'analyst') &&
                            (!process.current_step ||
                              ![
                                'Triagem CCA',
                                'Montagem de Pasta',
                                'Análise de Documentos',
                                'Emissão de Boleto',
                                'Aguardando Avaliação',
                                'Finalizado',
                              ].includes(process.current_step)) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50 whitespace-nowrap"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/housing-transition/${process.id}`)
                                }}
                              >
                                Enviar para processo habitacional
                              </Button>
                            )}
                          {user?.role === 'master' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteProcessId(process.id)
                              }}
                              title="Excluir processo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredHousing.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum processo habitacional encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {isMaster && (
          <>
            <TabsContent value="credito" className="space-y-6 mt-0">
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Card
                  className="cursor-pointer hover:border-primary/50 transition-colors bg-amber-50/30"
                  onClick={() => setIsUnassignedListOpen(true)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Aguardando Analista
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">
                      {unassignedCredit.length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Em Andamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-800">
                      {creditStats.inProgress}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Aprovados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">
                      {creditStats.approved}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-secondary">{creditStats.pending}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Condicionados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {creditStats.conditioned}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Reprovados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      {creditStats.rejected}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Status (Crédito)</CardTitle>
                </CardHeader>
                <CardContent>
                  {creditChartData.length > 0 ? (
                    <ChartContainer
                      config={chartConfigCredit}
                      className="h-[300px] w-full max-w-md mx-auto"
                    >
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          data={creditChartData}
                          dataKey="value"
                          nameKey="status"
                          innerRadius={60}
                          strokeWidth={2}
                        >
                          {creditChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent />} />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Sem dados suficientes.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="habitacional" className="space-y-6 mt-0">
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Object.entries(housingStagesCount).map(([step, count]) => (
                  <Card key={step}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">{step}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-800">{count}</div>
                    </CardContent>
                  </Card>
                ))}
                {Object.keys(housingStagesCount).length === 0 && (
                  <div className="col-span-full p-4 text-center text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                    Nenhum processo habitacional no momento.
                  </div>
                )}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Processos por Etapa (Habitacional)</CardTitle>
                </CardHeader>
                <CardContent>
                  {housingChartData.length > 0 ? (
                    <ChartContainer
                      config={chartConfigHousing}
                      className="h-[300px] w-full max-w-md mx-auto"
                    >
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          data={housingChartData}
                          dataKey="value"
                          nameKey="status"
                          innerRadius={60}
                          strokeWidth={2}
                        >
                          {housingChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent />} />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Sem dados suficientes.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
