import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useRealtime } from '@/hooks/use-realtime'

export default function ConfigRejectionReasons() {
  const [reasons, setReasons] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const { toast } = useToast()

  const loadReasons = async () => {
    try {
      const records = await pb.collection('rejection_reasons').getFullList({ sort: 'name' })
      setReasons(records)
    } catch (e) {
      toast({ title: 'Erro ao carregar motivos', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadReasons()
  }, [])

  useRealtime('rejection_reasons', () => loadReasons())

  const handleSubmit = async () => {
    if (!name.trim()) return
    try {
      if (editingId) {
        await pb.collection('rejection_reasons').update(editingId, { name })
        toast({ title: 'Motivo atualizado' })
      } else {
        await pb.collection('rejection_reasons').create({ name })
        toast({ title: 'Motivo criado' })
      }
      setIsOpen(false)
      setName('')
      setEditingId(null)
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este motivo?')) return
    try {
      await pb.collection('rejection_reasons').delete(id)
      toast({ title: 'Motivo excluído' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Motivos de Reprovação</h1>
          <p className="text-muted-foreground">
            Gerencie os motivos de reprovação de análise de crédito.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setName('')
            setIsOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Motivo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reasons.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(r.id)
                          setName(r.name)
                          setIsOpen(true)
                        }}
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reasons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                    Nenhum motivo cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Motivo' : 'Novo Motivo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Motivo</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: RATING"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
