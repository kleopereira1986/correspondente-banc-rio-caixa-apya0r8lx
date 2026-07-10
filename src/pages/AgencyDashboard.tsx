import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/auth-context'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link, useNavigate } from 'react-router-dom'
import { Users, FolderOpen, CheckCircle2, Clock, FileText, AlertCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  in_progress: {
    label: 'Em Andamento',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
  },
  completed: {
    label: 'Concluído',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
  },
  returned: {
    label: 'Devolvido',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
  },
}

export default function AgencyDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [brokersCount, setBrokersCount] = useState(0)
  const [taskStatusFilter, setTaskStatusFilter] = useState('all')
  const [processes, setProcesses] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!user?.real_estate_agency) return
    try {
      const [brokers, procs, agencyTasks] = await Promise.all([
        pb.collection('users').getFullList({
          filter: `role = 'broker' && real_estate_agency = '${user.real_estate_agency}'`,
          fields: 'id',
        }),
        pb.collection('processes').getFullList({
          filter: `broker.real_estate_agency = '${user.real_estate_agency}'`,
          expand: 'buyer,broker',
          sort: '-created',
        }),
        pb.collection('tasks').getFullList({
          filter: `requester.real_estate_agency = '${user.real_estate_agency}'`,
          expand: 'requester,type,assigned_analyst',
          sort: '-created',
        }),
      ])
      setBrokersCount(brokers.length)
      setProcesses(procs)
      setTasks(agencyTasks)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.real_estate_agency])

  useRealtime('tasks', () => loadData())
  useRealtime('processes', () => loadData())

  const pendingCount = processes.filter(
    (p) => p.result === 'pending' || p.status === 'Triagem' || p.status === 'Pendência',
  ).length
  const approvedCount = processes.filter((p) => p.result === 'approved').length
  const rejectedCount = processes.filter((p) => p.result === 'rejected').length
  const inProgressCount = processes.length - pendingCount - approvedCount - rejectedCount
  const pendingTasksCount = tasks.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress',
  ).length
  const filteredTasks =
    taskStatusFilter === 'all' ? tasks : tasks.filter((t) => t.status === taskStatusFilter)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Painel da Imobiliária</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe o desempenho, processos e tarefas dos corretores da sua agência.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card
          className="shadow-sm border-border/50 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
          onClick={() => navigate('/agency/brokers')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Corretores
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{brokersCount}</div>
          </CardContent>
        </Card>

        <Card
          className="shadow-sm border-border/50 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
          onClick={() => navigate('/agency/processes')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Processos
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{processes.length}</div>
          </CardContent>
        </Card>

        <Card
          className="shadow-sm border-border/50 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
          onClick={() => navigate('/agency/processes')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{inProgressCount}</div>
          </CardContent>
        </Card>

        <Card
          className="shadow-sm border-border/50 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
          onClick={() => navigate('/agency/processes')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprovados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card
          className="shadow-sm border-border/50 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
          onClick={() => navigate('/tasks')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tarefas Pendentes
            </CardTitle>
            <FileText className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{pendingTasksCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-border/50">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" /> Tarefas dos Corretores
              </CardTitle>
              <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                <SelectTrigger className="w-[180px] h-8 text-sm">
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="returned">Devolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando tarefas...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <CheckCircle2 className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm">Nenhuma tarefa solicitada pelos corretores.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
                {filteredTasks.map((task) => {
                  const status = statusConfig[task.status] || statusConfig.pending
                  const StatusIcon = status.icon
                  return (
                    <Link
                      key={task.id}
                      to={`/tasks/${task.id}`}
                      className="block p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate">
                            {task.expand?.type?.name || 'Tarefa'}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {task.description}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${status.color} border shrink-0 text-[10px] gap-1`}
                        >
                          <StatusIcon className="w-3 h-3" /> {status.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          <strong>Corretor:</strong>{' '}
                          {task.expand?.requester?.name || 'Desconhecido'}
                        </span>
                        {task.client_name && (
                          <span>
                            <strong>Cliente:</strong> {task.client_name}
                          </span>
                        )}
                        <span>
                          {format(new Date(task.request_date || task.created), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-500" /> Processos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando processos...</div>
            ) : processes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <FolderOpen className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm">Nenhum processo encontrado.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
                {processes.slice(0, 15).map((proc) => (
                  <Link
                    key={proc.id}
                    to={`/process/${proc.id}`}
                    className="block p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="font-semibold text-sm text-slate-800 truncate">
                        {proc.expand?.buyer?.name || 'Sem cliente'}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] shrink-0',
                          proc.result === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : proc.result === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : proc.result === 'conditioned'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700',
                        )}
                      >
                        {proc.result === 'approved'
                          ? 'Aprovado'
                          : proc.result === 'rejected'
                            ? 'Reprovado'
                            : proc.result === 'conditioned'
                              ? 'Condicionado'
                              : proc.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        <strong>Corretor:</strong> {proc.expand?.broker?.name || 'N/A'}
                      </span>
                      <span>{format(new Date(proc.created), 'dd/MM/yyyy')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
