import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings,
  Trash2,
  Edit2,
  Filter,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  getTasks,
  getTaskTypes,
  createTask,
  createTaskType,
  updateTaskType,
  deleteTaskType,
} from '@/services/tasks'
import { useAuth } from '@/contexts/auth-context'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
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

export default function Tasks() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])

  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)
  const [isTaskTypesOpen, setIsTaskTypesOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedType, setSelectedType] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [editingType, setEditingType] = useState<any>(null)
  const [newTypeName, setNewTypeName] = useState('')

  const loadData = async () => {
    try {
      const [fetchedTasks, fetchedTypes] = await Promise.all([
        getTasks(statusFilter),
        getTaskTypes(),
      ])
      setTasks(fetchedTasks)
      setTypes(fetchedTypes)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])
  useRealtime('tasks', () => {
    loadData()
  })
  useRealtime('task_types', () => {
    loadData()
  })

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType || !description) return
    setIsSubmitting(true)
    try {
      await createTask({ type: selectedType, requester: user.id, description, status: 'pending' })
      toast({ title: 'Sucesso', description: 'Tarefa solicitada com sucesso.' })
      setIsNewTaskOpen(false)
      setSelectedType('')
      setDescription('')
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao solicitar tarefa.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTypeName.trim()) return
    try {
      if (editingType) {
        await updateTaskType(editingType.id, { name: newTypeName.trim() })
        toast({ title: 'Sucesso', description: 'Tipo atualizado.' })
      } else {
        await createTaskType({ name: newTypeName.trim() })
        toast({ title: 'Sucesso', description: 'Tipo criado.' })
      }
      setNewTypeName('')
      setEditingType(null)
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar tipo.', variant: 'destructive' })
    }
  }

  const handleDeleteType = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo?')) return
    try {
      await deleteTaskType(id)
      toast({ title: 'Sucesso', description: 'Tipo excluído.' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir tipo. Pode estar em uso.',
        variant: 'destructive',
      })
    }
  }

  const canCreate = user.role === 'broker' || user.role === 'master'

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Tarefas & Solicitações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie solicitações de parceiros e tarefas da equipe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter size={14} className="mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="returned">Devolvido</SelectItem>
            </SelectContent>
          </Select>

          {user.role === 'master' && (
            <Dialog open={isTaskTypesOpen} onOpenChange={setIsTaskTypesOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings size={16} /> Tipos
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Gerenciar Tipos de Tarefa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <form onSubmit={handleSaveType} className="flex gap-2">
                    <Input
                      placeholder="Nome do tipo"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                    />
                    <Button type="submit">{editingType ? 'Salvar' : 'Adicionar'}</Button>
                    {editingType && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setEditingType(null)
                          setNewTypeName('')
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                  </form>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead className="w-[100px] text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {types.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>{t.name}</TableCell>
                            <TableCell className="text-right flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingType(t)
                                  setNewTypeName(t.name)
                                }}
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteType(t.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {types.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-slate-500">
                              Nenhum tipo cadastrado.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {canCreate && (
            <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={16} /> Nova Solicitação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Solicitar Nova Tarefa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Tipo de Tarefa</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Observações / Detalhes</Label>
                    <Textarea
                      rows={4}
                      placeholder="Descreva o que precisa ser feito..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !selectedType || !description}
                  >
                    {isSubmitting ? 'Enviando...' : 'Criar Solicitação'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => {
          const status = statusMap[task.status] || statusMap.pending
          const StatusIcon = status.icon
          return (
            <Link key={task.id} to={`/tasks/${task.id}`} className="block group">
              <Card className="h-full hover:shadow-md transition-all border-slate-200 group-hover:border-primary/30 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors leading-tight">
                      {task.expand?.type?.name || 'Tarefa'}
                    </CardTitle>
                    <Badge variant="outline" className={`${status.color} border gap-1 shrink-0`}>
                      <StatusIcon size={12} /> {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-3 flex-1 flex flex-col justify-end">
                  <p className="text-slate-600 line-clamp-2 mb-2 flex-1">{task.description}</p>
                  <div className="pt-3 border-t flex flex-col gap-1.5 text-slate-500">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">Solicitante:</span>
                      <span>{task.expand?.requester?.name || 'Desconhecido'}</span>
                    </div>
                    {task.expand?.assigned_analyst && (
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-700">Analista:</span>
                        <span>{task.expand.assigned_analyst.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">Data:</span>
                      <span>
                        {format(new Date(task.request_date || task.created), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
        {tasks.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-lg border border-dashed">
            Nenhuma tarefa encontrada para os filtros atuais.
          </div>
        )}
      </div>
    </div>
  )
}
