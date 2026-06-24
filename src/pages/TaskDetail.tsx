import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  Paperclip,
  X,
  Download,
} from 'lucide-react'
import { getTask, updateTask, getInteractions, createInteraction } from '@/services/tasks'
import { useAuth } from '@/contexts/auth-context'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

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

export default function TaskDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [task, setTask] = useState<any>(null)
  const [interactions, setInteractions] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    if (!id) return
    try {
      const [fetchedTask, fetchedInteractions] = await Promise.all([
        getTask(id),
        getInteractions(id),
      ])
      setTask(fetchedTask)
      setInteractions(fetchedInteractions)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a tarefa.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  useEffect(() => {
    loadData()
  }, [id])
  useRealtime('tasks', () => {
    loadData()
  })
  useRealtime('task_interactions', () => {
    loadData()
  })

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 100)
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateTask(task.id, { status: newStatus })
      toast({ title: 'Status Atualizado', description: 'O status da tarefa foi alterado.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar status.', variant: 'destructive' })
    }
  }

  const handleAssignToMe = async () => {
    try {
      await updateTask(task.id, { assigned_analyst: user.id, status: 'in_progress' })
      toast({ title: 'Sucesso', description: 'Tarefa atribuída a você.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao atribuir tarefa.', variant: 'destructive' })
    }
  }

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && files.length === 0) || !task) return
    try {
      const formData = new FormData()
      formData.append('task', task.id)
      formData.append('user', user.id)
      formData.append('message', newMessage.trim() || 'Arquivo(s) anexado(s)')

      files.forEach((f) => {
        formData.append('file', f)
      })

      await createInteraction(formData)

      if (
        task.status === 'returned' &&
        (user.role === 'broker' || user.role === 'real_estate_agency' || task.requester === user.id)
      ) {
        await updateTask(task.id, { status: 'pending' })
      }

      toast({ title: 'Sucesso', description: 'Mensagem enviada com sucesso.' })
      setNewMessage('')
      setFiles([])
      scrollToBottom()
    } catch (error) {
      toast({
        title: 'Erro',
        description: getErrorMessage(error) || 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      })
    }
  }

  if (loading || !task)
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )

  const status = statusMap[task.status] || statusMap.pending
  const StatusIcon = status.icon
  const isInternal = user.role === 'master' || user.role === 'analyst'

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/tasks">
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {task.expand?.type?.name || 'Detalhes da Tarefa'}
          </h1>
          <p className="text-slate-500 text-sm">
            Criada em {format(new Date(task.request_date || task.created), "dd/MM/yyyy 'às' HH:mm")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Status
                </span>
                {isInternal ? (
                  <Select value={task.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className={`font-medium ${status.color}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="returned">Devolvido</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    variant="outline"
                    className={`${status.color} border px-3 py-1 text-sm gap-2`}
                  >
                    <StatusIcon size={14} /> {status.label}
                  </Badge>
                )}
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Solicitante
                </span>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage
                      src={`https://img.usecurling.com/ppl/thumbnail?seed=${task.requester}`}
                    />
                    <AvatarFallback>
                      <User size={12} />
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-slate-800">
                    {task.expand?.requester?.name || 'Desconhecido'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Analista Responsável
                </span>
                {task.expand?.assigned_analyst ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage
                        src={`https://img.usecurling.com/ppl/thumbnail?seed=${task.assigned_analyst}`}
                      />
                      <AvatarFallback>
                        <User size={12} />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-slate-800">
                      {task.expand.assigned_analyst.name}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-slate-500 italic text-sm">Não atribuído</span>
                    {isInternal && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={handleAssignToMe}
                      >
                        Assumir Tarefa
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {task.return_date && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Data de Retorno
                  </span>
                  <span className="text-slate-800 font-medium">
                    {format(new Date(task.return_date), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Descrição Original</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                {task.description}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CRM / Interactions Column */}
        <div className="lg:col-span-2 flex flex-col h-[600px] lg:h-[calc(100vh-10rem)] min-h-[500px]">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3 border-b bg-slate-50 shrink-0">
              <CardTitle className="text-lg">Histórico & Interações</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden min-h-0">
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 min-h-0"
              >
                {interactions.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 italic">
                    Nenhuma interação registrada ainda.
                  </div>
                ) : (
                  interactions.map((msg) => {
                    const isMe = msg.user === user.id
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-8 h-8 shrink-0 border border-slate-200">
                          <AvatarImage
                            src={`https://img.usecurling.com/ppl/thumbnail?seed=${msg.user}`}
                          />
                          <AvatarFallback>
                            {msg.expand?.user?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-medium text-sm text-slate-700">
                              {msg.expand?.user?.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {format(new Date(msg.created), 'dd/MM HH:mm')}
                            </span>
                          </div>
                          <div
                            className={`px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}
                          >
                            {msg.message}
                          </div>

                          {(() => {
                            const attachments = Array.isArray(msg.file)
                              ? msg.file
                              : msg.file
                                ? [msg.file]
                                : []
                            if (attachments.length === 0) return null
                            return (
                              <div className="mt-2 flex flex-col gap-1.5 w-full">
                                {attachments.map((f: string) => (
                                  <a
                                    key={f}
                                    href={pb.files.getUrl(msg, f)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 text-xs transition-colors p-2 rounded-lg border ${isMe ? 'bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                                  >
                                    <Paperclip size={14} className="shrink-0" />
                                    <span className="truncate flex-1 font-medium">{f}</span>
                                    <Download size={14} className="shrink-0" />
                                  </a>
                                ))}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              <div className="p-4 bg-white border-t shrink-0">
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {files.map((f, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-100 border-slate-200"
                      >
                        <span className="truncate max-w-[180px] text-xs font-normal text-slate-700">
                          {f.name}
                        </span>
                        <button
                          onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                          className="text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files) {
                        setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)])
                        e.target.value = ''
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-[60px] w-[60px] border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={20} className="text-slate-500" />
                  </Button>
                  <Textarea
                    placeholder="Adicionar nota ou comentário..."
                    className="min-h-[60px] resize-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    className="h-auto px-4"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && files.length === 0}
                  >
                    <Send size={18} />
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    Pressione Enter para enviar, Shift+Enter para quebrar linha.
                  </p>
                  <p className="text-[10px] text-muted-foreground">Max 50MB por arquivo.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
