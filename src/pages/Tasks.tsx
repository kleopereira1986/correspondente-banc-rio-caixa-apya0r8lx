import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getTasks, getTaskTypes, createTask } from '@/services/tasks'
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

  // Form state
  const [selectedType, setSelectedType] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const [fetchedTasks, fetchedTypes] = await Promise.all([getTasks(), getTaskTypes()])
      setTasks(fetchedTasks)
      setTypes(fetchedTypes)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tarefas.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('tasks', () => {
    loadData()
  })

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType || !description) return
    setIsSubmitting(true)
    try {
      await createTask({
        type: selectedType,
        requester: user.id,
        description,
        status: 'pending',
      })
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

  const canCreate = user.role === 'broker' || user.role === 'master'

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Tarefas & Solicitações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie solicitações de parceiros e tarefas da equipe.
          </p>
        </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => {
          const status = statusMap[task.status] || statusMap.pending
          const StatusIcon = status.icon

          return (
            <Link key={task.id} to={`/tasks/${task.id}`} className="block group">
              <Card className="h-full hover:shadow-md transition-all border-slate-200 group-hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {task.expand?.type?.name || 'Tarefa'}
                    </CardTitle>
                    <Badge variant="outline" className={`${status.color} border gap-1`}>
                      <StatusIcon size={12} />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <p className="text-slate-600 line-clamp-2">{task.description}</p>
                  <div className="pt-2 border-t flex flex-col gap-1 text-slate-500">
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
                        {format(new Date(task.request_date || task.created), "dd 'de' MMM, HH:mm", {
                          locale: ptBR,
                        })}
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
            Nenhuma tarefa encontrada.
          </div>
        )}
      </div>
    </div>
  )
}
