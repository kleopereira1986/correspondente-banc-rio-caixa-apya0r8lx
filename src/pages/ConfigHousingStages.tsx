import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  getHousingStages,
  createHousingStage,
  updateHousingStage,
  deleteHousingStage,
} from '@/services/api'
import {
  getConditioningReasons,
  createConditioningReason,
  updateConditioningReason,
  deleteConditioningReason,
} from '@/services/conditioning_reasons'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ConfigHousingStages() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [stages, setStages] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', order: '' })

  const [reasons, setReasons] = useState<any[]>([])
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false)
  const [editingReasonId, setEditingReasonId] = useState<string | null>(null)
  const [reasonFormData, setReasonFormData] = useState({ name: '' })

  const loadData = async () => {
    try {
      const res = await getHousingStages()
      setStages(res)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as etapas.',
        variant: 'destructive',
      })
    }
  }

  const loadReasons = async () => {
    try {
      const res = await getConditioningReasons()
      setReasons(res)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os motivos de condicionamento.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadData()
    loadReasons()
  }, [])
  useRealtime('housing_stages', () => loadData())
  useRealtime('conditioning_reasons', () => loadReasons())

  const handleSave = async () => {
    if (!formData.name || !formData.order) return
    try {
      if (editingId) {
        await updateHousingStage(editingId, { name: formData.name, order: Number(formData.order) })
        toast({ title: 'Etapa atualizada' })
      } else {
        await createHousingStage({ name: formData.name, order: Number(formData.order) })
        toast({ title: 'Etapa criada' })
      }
      setIsDialogOpen(false)
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta etapa?')) return
    try {
      await deleteHousingStage(id)
      toast({ title: 'Etapa excluída' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const handleReasonSave = async () => {
    if (!reasonFormData.name) return
    try {
      if (editingReasonId) {
        await updateConditioningReason(editingReasonId, { name: reasonFormData.name })
        toast({ title: 'Motivo atualizado' })
      } else {
        await createConditioningReason({ name: reasonFormData.name })
        toast({ title: 'Motivo criado' })
      }
      setIsReasonDialogOpen(false)
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const handleReasonDelete = async (id: string) => {
    if (!confirm('Deseja excluir este motivo?')) return
    try {
      await deleteConditioningReason(id)
      toast({ title: 'Motivo excluído' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const openDialog = (stage?: any) => {
    if (stage) {
      setEditingId(stage.id)
      setFormData({ name: stage.name, order: String(stage.order) })
    } else {
      setEditingId(null)
      setFormData({ name: '', order: String((stages[stages.length - 1]?.order || 0) + 1) })
    }
    setIsDialogOpen(true)
  }

  const openReasonDialog = (reason?: any) => {
    if (reason) {
      setEditingReasonId(reason.id)
      setReasonFormData({ name: reason.name })
    } else {
      setEditingReasonId(null)
      setReasonFormData({ name: '' })
    }
    setIsReasonDialogOpen(true)
  }

  if (user?.role !== 'master') return <div className="p-8">Acesso Negado</div>

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Configuração Habitacional</h1>
        <p className="text-muted-foreground">
          Gerencie parâmetros e etapas do processo habitacional e de crédito.
        </p>
      </div>

      <Tabs defaultValue="stages" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="stages">Etapas Kanban</TabsTrigger>
          <TabsTrigger value="reasons">Motivos de Condicionamento</TabsTrigger>
        </TabsList>

        <TabsContent value="stages">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Etapas do Funil</h2>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Nova Etapa
            </Button>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Nome da Etapa</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stages.map((stage) => (
                  <TableRow key={stage.id}>
                    <TableCell>{stage.order}</TableCell>
                    <TableCell className="font-medium">{stage.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDialog(stage)}>
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(stage.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="reasons">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Motivos de Condicionamento</h2>
            <Button onClick={() => openReasonDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Novo Motivo
            </Button>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Motivo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reasons.map((reason) => (
                  <TableRow key={reason.id}>
                    <TableCell className="font-medium">{reason.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openReasonDialog(reason)}>
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReasonDelete(reason.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {reasons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                      Nenhum motivo cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da Etapa</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ordem (Ex: 1, 2, 3)</Label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReasonDialogOpen} onOpenChange={setIsReasonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReasonId ? 'Editar Motivo' : 'Novo Motivo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Motivo</Label>
              <Input
                value={reasonFormData.name}
                onChange={(e) => setReasonFormData({ ...reasonFormData, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReasonDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReasonSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
