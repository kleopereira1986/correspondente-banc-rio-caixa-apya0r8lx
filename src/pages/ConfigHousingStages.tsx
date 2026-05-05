import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  getHousingStages,
  createHousingStage,
  updateHousingStage,
  deleteHousingStage,
} from '@/services/api'
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

export default function ConfigHousingStages() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stages, setStages] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', order: '' })

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

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('housing_stages', () => loadData())

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

  if (user?.role !== 'master') return <div className="p-8">Acesso Negado</div>

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Configuração de Etapas Habitacionais</h1>
          <p className="text-muted-foreground">Gerencie o funil do Kanban Habitacional.</p>
        </div>
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
    </div>
  )
}
