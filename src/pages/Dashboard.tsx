import { useNavigate } from 'react-router-dom'
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
import { FileText, CheckCircle2, Clock, AlertCircle, Plus, Search, Filter } from 'lucide-react'
import { mockProcesses, ProcessStatus } from '@/lib/data'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const navigate = useNavigate()

  const getStatusBadge = (status: ProcessStatus) => {
    switch (status) {
      case 'Aprovado':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-medium px-2.5 py-0.5">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado
          </Badge>
        )
      case 'Pendente':
        return (
          <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/10 border-none font-medium px-2.5 py-0.5 animate-pulse-status">
            <AlertCircle className="w-3 h-3 mr-1" /> Pendência
          </Badge>
        )
      case 'Em Análise':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none font-medium px-2.5 py-0.5">
            <Clock className="w-3 h-3 mr-1" /> Em Análise
          </Badge>
        )
      case 'Reprovado':
        return (
          <Badge variant="destructive" className="border-none font-medium px-2.5 py-0.5">
            Reprovado
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="font-medium px-2.5 py-0.5">
            {status}
          </Badge>
        )
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Visão Geral</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o status das avaliações de crédito.
          </p>
        </div>
        <Button className="w-full sm:w-auto shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Novo Processo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Processos
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">124</div>
            <p className="text-xs text-muted-foreground mt-1">+12% desde o último mês</p>
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
            <div className="text-3xl font-bold text-slate-800">15</div>
            <p className="text-xs text-muted-foreground mt-1">Requerem sua atenção</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprovados (Mês)
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">48</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">R$ 12.4 Milhões em crédito</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Com Pendência
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">8</div>
            <p className="text-xs text-secondary font-medium mt-1">Aguardando cliente</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Table */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50">
          <div>
            <CardTitle className="text-lg text-slate-800">Processos Recentes</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar cliente..."
                className="w-full sm:w-[250px] pl-9 h-9 bg-slate-50"
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-slate-600">ID / Cliente</TableHead>
                <TableHead className="font-semibold text-slate-600 hidden sm:table-cell">
                  Tipo
                </TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">Valor</TableHead>
                <TableHead className="font-semibold text-slate-600 text-center">Status</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right hidden md:table-cell">
                  Data
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProcesses.map((process) => (
                <TableRow
                  key={process.id}
                  className="cursor-pointer group transition-colors"
                  onClick={() => navigate(`/process/${process.id}`)}
                >
                  <TableCell className="py-4">
                    <div className="font-medium text-slate-800 group-hover:text-primary transition-colors">
                      {process.clientName}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{process.id}</div>
                  </TableCell>
                  <TableCell className="py-4 hidden sm:table-cell text-slate-600">
                    {process.type}
                  </TableCell>
                  <TableCell className="py-4 text-right font-medium text-slate-700">
                    {formatCurrency(process.value)}
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    {getStatusBadge(process.status)}
                  </TableCell>
                  <TableCell className="py-4 text-right text-muted-foreground text-sm hidden md:table-cell">
                    {new Date(process.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
