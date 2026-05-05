import { useState, useEffect } from 'react'
import {
  getCreditAnalysisTypes,
  createCreditAnalysisType,
  updateCreditAnalysisType,
  deleteCreditAnalysisType,
  getPropertyTypes,
  createPropertyType,
  updatePropertyType,
  deletePropertyType,
} from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'

export default function ConfigCreditAnalysis() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Configurações de Análise de Crédito
        </h1>
        <p className="text-muted-foreground">
          Gerencie os tipos de análise e tipos de imóvel disponíveis.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <ConfigSection
          title="Tipos de Análise de Crédito"
          fetchFn={getCreditAnalysisTypes}
          createFn={createCreditAnalysisType}
          updateFn={updateCreditAnalysisType}
          deleteFn={deleteCreditAnalysisType}
          realtimeKey="credit_analysis_types"
        />
        <ConfigSection
          title="Tipo de Imóvel"
          fetchFn={getPropertyTypes}
          createFn={createPropertyType}
          updateFn={updatePropertyType}
          deleteFn={deletePropertyType}
          realtimeKey="property_types"
        />
      </div>
    </div>
  )
}

function ConfigSection({ title, fetchFn, createFn, updateFn, deleteFn, realtimeKey }: any) {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const loadData = async () => {
    try {
      const data = await fetchFn()
      setItems(data)
    } catch (e) {
      toast({ title: 'Erro ao carregar', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime(realtimeKey, () => loadData())

  const handleCreate = async () => {
    if (!newItemName.trim()) return
    try {
      await createFn({ name: newItemName })
      setNewItemName('')
      toast({ title: 'Criado com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao criar', variant: 'destructive' })
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    try {
      await updateFn(id, { name: editName })
      setEditingId(null)
      toast({ title: 'Atualizado com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este item?')) return
    try {
      await deleteFn(id)
      toast({ title: 'Excluído com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
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
          <Button onClick={handleCreate}>
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
