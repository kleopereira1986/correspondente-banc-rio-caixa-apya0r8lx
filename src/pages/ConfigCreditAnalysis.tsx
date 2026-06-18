import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useToast } from '@/hooks/use-toast'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'

export default function ConfigCreditAnalysis() {
  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Configurações de Análise de Crédito
        </h1>
        <p className="text-muted-foreground">
          Gerencie os tipos de análise, imóveis e documentos exigidos.
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <ConfigDocumentSection />
        <div className="space-y-6">
          <ConfigSection
            title="Tipos de Análise de Crédito"
            collectionName="credit_analysis_types"
          />
          <ConfigSection title="Tipo de Imóvel" collectionName="property_types" />
          <ConfigSection title="Tipos de Empreendimentos" collectionName="development_types" />
        </div>
      </div>
    </div>
  )
}

function ConfigDocumentSection() {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newCategory, setNewCategory] = useState('1º Proponente')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')

  const loadData = async () => {
    try {
      const data = await pb.collection('credit_document_types').getFullList()
      setItems(data)
    } catch (e) {
      toast({ title: 'Erro ao carregar', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('credit_document_types', () => loadData())

  const handleCreate = async () => {
    if (!newItemName.trim()) return
    try {
      await pb
        .collection('credit_document_types')
        .create({ name: newItemName, category: newCategory, is_active: true })
      setNewItemName('')
      toast({ title: 'Criado com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao criar', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    try {
      await pb
        .collection('credit_document_types')
        .update(id, { name: editName, category: editCategory })
      setEditingId(null)
      toast({ title: 'Atualizado com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este item?')) return
    try {
      await pb.collection('credit_document_types').delete(id)
      toast({ title: 'Excluído com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  return (
    <Card className="shadow-sm border-border/50 h-fit">
      <CardHeader>
        <CardTitle className="text-lg uppercase">Tipos de Documentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Nome do documento..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="flex-1"
          />
          <Select value={newCategory} onValueChange={setNewCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1º Proponente">1º Proponente</SelectItem>
              <SelectItem value="2º Proponente / Conjuge">2º Proponente / Conjuge</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} disabled={!newItemName.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="divide-y divide-border/50 border rounded-md">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors gap-2"
            >
              {editingId === item.id ? (
                <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 w-full">
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 flex-1"
                  />
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="h-8 w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1º Proponente">1º Proponente</SelectItem>
                      <SelectItem value="2º Proponente / Conjuge">
                        2º Proponente / Conjuge
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1 self-end sm:self-auto">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600"
                      onClick={() => handleUpdate(item.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setEditingId(item.id)
                        setEditName(item.name)
                        setEditCategory(item.category)
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum documento cadastrado.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ConfigSection({ title, collectionName }: { title: string; collectionName: string }) {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const loadData = async () => {
    try {
      const data = await pb.collection(collectionName).getFullList()
      setItems(data)
    } catch (e) {
      toast({ title: 'Erro ao carregar', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime(collectionName, () => loadData())

  const handleCreate = async () => {
    if (!newItemName.trim()) return
    try {
      await pb.collection(collectionName).create({ name: newItemName })
      setNewItemName('')
      toast({ title: 'Criado com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao criar', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    try {
      await pb.collection(collectionName).update(id, { name: editName })
      setEditingId(null)
      toast({ title: 'Atualizado com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este item?')) return
    try {
      await pb.collection(collectionName).delete(id)
      toast({ title: 'Excluído com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-lg uppercase">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Adicionar novo..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={!newItemName.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="divide-y divide-border/50 border rounded-md">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors"
            >
              {editingId === item.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(item.id)}
                    className="h-8"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-600"
                    onClick={() => handleUpdate(item.id)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium text-slate-800">{item.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setEditingId(item.id)
                        setEditName(item.name)
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum item cadastrado.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
