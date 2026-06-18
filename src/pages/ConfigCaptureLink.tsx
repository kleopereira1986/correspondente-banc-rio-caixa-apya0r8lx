import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useToast } from '@/hooks/use-toast'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'

export default function ConfigCaptureLink() {
  const { toast } = useToast()

  // Regimes de Casamento
  const [regimes, setRegimes] = useState<any[]>([])
  const [newRegime, setNewRegime] = useState('')
  const [editingRegimeId, setEditingRegimeId] = useState<string | null>(null)
  const [editRegimeName, setEditRegimeName] = useState('')

  // Campos do Formulario
  const [fields, setFields] = useState<any[]>([])

  // Documentos Exigidos
  const [documents, setDocuments] = useState<any[]>([])
  const [newDoc, setNewDoc] = useState('')
  const [newDocCategory, setNewDocCategory] = useState('1º Proponente')
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editDocName, setEditDocName] = useState('')
  const [editDocCategory, setEditDocCategory] = useState('')

  const loadData = async () => {
    try {
      const [r, f, d] = await Promise.all([
        pb.collection('marriage_regimes').getFullList(),
        pb.collection('form_settings').getFullList(),
        pb.collection('credit_document_types').getFullList(),
      ])
      setRegimes(r)
      setFields(f)
      setDocuments(d)
    } catch (e) {
      toast({
        title: 'Erro ao carregar configurações',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('marriage_regimes', () => loadData())
  useRealtime('form_settings', () => loadData())
  useRealtime('credit_document_types', () => loadData())

  // --- Regimes Handlers ---
  const handleCreateRegime = async () => {
    if (!newRegime.trim()) return
    try {
      await pb.collection('marriage_regimes').create({ name: newRegime })
      setNewRegime('')
      toast({ title: 'Criado com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao criar', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  const handleUpdateRegime = async (id: string) => {
    if (!editRegimeName.trim()) return
    try {
      await pb.collection('marriage_regimes').update(id, { name: editRegimeName })
      setEditingRegimeId(null)
      toast({ title: 'Atualizado com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  const handleDeleteRegime = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este item?')) return
    try {
      await pb.collection('marriage_regimes').delete(id)
      toast({ title: 'Excluído com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  // --- Fields Handlers ---
  const handleToggleField = async (id: string, active: boolean) => {
    try {
      await pb.collection('form_settings').update(id, { is_active: active })
      toast({ title: 'Campo atualizado' })
    } catch (e) {
      toast({
        title: 'Erro ao atualizar campo',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  // --- Documents Handlers ---
  const handleToggleDoc = async (id: string, active: boolean) => {
    try {
      await pb.collection('credit_document_types').update(id, { is_active: active })
      toast({ title: 'Documento atualizado' })
    } catch (e) {
      toast({
        title: 'Erro ao atualizar documento',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const handleCreateDoc = async () => {
    if (!newDoc.trim()) return
    try {
      await pb
        .collection('credit_document_types')
        .create({ name: newDoc, category: newDocCategory, is_active: true })
      setNewDoc('')
      toast({ title: 'Criado com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao criar', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  const handleUpdateDoc = async (id: string) => {
    if (!editDocName.trim()) return
    try {
      await pb
        .collection('credit_document_types')
        .update(id, { name: editDocName, category: editDocCategory })
      setEditingDocId(null)
      toast({ title: 'Atualizado com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  const handleDeleteDoc = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este item?')) return
    try {
      await pb.collection('credit_document_types').delete(id)
      toast({ title: 'Excluído com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Configuração do Link de Captação
        </h1>
        <p className="text-muted-foreground">
          Gerencie as opções exibidas no formulário público de captação de clientes.
        </p>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-3xl mb-6">
          <TabsTrigger value="documents">Documentos Exigidos</TabsTrigger>
          <TabsTrigger value="fields">Campos do Formulário</TabsTrigger>
          <TabsTrigger value="regimes">Regimes de Casamento</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg uppercase">Documentos Exigidos</CardTitle>
              <CardDescription>
                Selecione quais documentos serão solicitados no checklist de anexos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  className="flex-1"
                  placeholder="Adicionar novo documento..."
                  value={newDoc}
                  onChange={(e) => setNewDoc(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && newDoc.trim() && handleCreateDoc()}
                />
                <Select value={newDocCategory} onValueChange={setNewDocCategory}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1º Proponente">1º Proponente</SelectItem>
                    <SelectItem value="2º Proponente / Conjuge">2º Proponente / Conjuge</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateDoc} disabled={!newDoc.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="divide-y divide-border/50 border rounded-md">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors gap-3"
                  >
                    {editingDocId === doc.id ? (
                      <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 w-full">
                        <Input
                          autoFocus
                          value={editDocName}
                          onChange={(e) => setEditDocName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && editDocName.trim() && handleUpdateDoc(doc.id)
                          }
                          className="h-8 flex-1"
                        />
                        <Select value={editDocCategory} onValueChange={setEditDocCategory}>
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
                            onClick={() => handleUpdateDoc(doc.id)}
                            disabled={!editDocName.trim()}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setEditingDocId(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start sm:items-center gap-3 flex-1 pr-4">
                          <Switch
                            checked={doc.is_active}
                            onCheckedChange={(val) => handleToggleDoc(doc.id, val)}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-800 leading-relaxed">
                              {doc.name}
                            </span>
                            <span className="text-xs text-muted-foreground">{doc.category}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => {
                              setEditingDocId(doc.id)
                              setEditDocName(doc.name)
                              setEditDocCategory(doc.category || '1º Proponente')
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteDoc(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhum documento cadastrado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields">
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg uppercase">Campos do Formulário</CardTitle>
              <CardDescription>
                Ative ou desative campos opcionais do formulário público de captação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/50 border rounded-md">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-800">{field.name}</span>
                    <Switch
                      checked={field.is_active}
                      onCheckedChange={(val) => handleToggleField(field.id, val)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regimes">
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg uppercase">Regimes de Casamento</CardTitle>
              <CardDescription>
                Gerencie as opções exibidas quando o cliente seleciona o estado civil "Casado(a)" ou
                "União Estável".
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar novo..."
                  value={newRegime}
                  onChange={(e) => setNewRegime(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && newRegime.trim() && handleCreateRegime()}
                />
                <Button onClick={handleCreateRegime} disabled={!newRegime.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="divide-y divide-border/50 border rounded-md">
                {regimes.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors"
                  >
                    {editingRegimeId === item.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          autoFocus
                          value={editRegimeName}
                          onChange={(e) => setEditRegimeName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' &&
                            editRegimeName.trim() &&
                            handleUpdateRegime(item.id)
                          }
                          className="h-8"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600"
                          onClick={() => handleUpdateRegime(item.id)}
                          disabled={!editRegimeName.trim()}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setEditingRegimeId(null)}
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
                              setEditingRegimeId(item.id)
                              setEditRegimeName(item.name)
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteRegime(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {regimes.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhum regime cadastrado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
