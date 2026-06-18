import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2, Plus, Search, Building2, Link as LinkIcon } from 'lucide-react'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

export default function ConstructionCompanies() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [companies, setCompanies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    legal_representative: '',
    phone: '',
    email: '',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isMaster = user?.role === 'master'
  const isAnalyst = user?.role === 'master' || user?.role === 'analyst'

  useEffect(() => {
    if (isAnalyst) {
      loadCompanies()
    }
  }, [isAnalyst])

  const loadCompanies = async () => {
    try {
      const data = await pb.collection('construction_companies').getFullList({
        sort: '-created',
      })
      setCompanies(data)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (c?: any) => {
    setErrors({})
    if (c) {
      setSelectedCompany(c)
      setFormData({
        name: c.name,
        cnpj: c.cnpj,
        legal_representative: c.legal_representative || '',
        phone: c.phone || '',
        email: c.email || '',
        bank_name: c.bank_name || '',
        bank_agency: c.bank_agency || '',
        bank_account: c.bank_account || '',
      })
    } else {
      setSelectedCompany(null)
      setFormData({
        name: '',
        cnpj: '',
        legal_representative: '',
        phone: '',
        email: '',
        bank_name: '',
        bank_agency: '',
        bank_account: '',
      })
    }
    setIsDialogOpen(true)
  }

  const applyCnpjMask = (val: string) => {
    return val
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18)
  }

  const applyPhoneMask = (val: string) => {
    return val
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .substring(0, 15)
  }

  const handleSave = async () => {
    setErrors({})
    try {
      if (selectedCompany) {
        await pb.collection('construction_companies').update(selectedCompany.id, formData)
        toast({ title: 'Sucesso', description: 'Construtora atualizada com sucesso.' })
      } else {
        await pb.collection('construction_companies').create(formData)
        toast({ title: 'Sucesso', description: 'Construtora cadastrada com sucesso.' })
      }
      setIsDialogOpen(false)
      loadCompanies()
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!selectedCompany) return
    try {
      await pb.collection('construction_companies').delete(selectedCompany.id)
      toast({ title: 'Sucesso', description: 'Construtora removida.' })
      setIsDeleteDialogOpen(false)
      loadCompanies()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const filteredCompanies = companies.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.cnpj.includes(search),
  )

  if (!isAnalyst) {
    return <div className="p-8 text-center text-muted-foreground">Acesso negado.</div>
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            Construtoras
          </h1>
          <p className="text-muted-foreground">
            Gerencie as construtoras parceiras para os processos habitacionais.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" /> Nova Construtora
        </Button>
      </div>

      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar por Razão Social ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão Social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Responsável Legal</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.cnpj}</TableCell>
                  <TableCell>{c.legal_representative || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/public/construtora/${c.id}`,
                          )
                          toast({
                            title: 'Link copiado!',
                            description: 'Link do dashboard externo copiado.',
                          })
                        }}
                        title="Copiar Link do Dashboard"
                      >
                        <LinkIcon className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(c)}>
                        <Pencil className="w-4 h-4 text-slate-500" />
                      </Button>
                      {isMaster && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedCompany(c)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCompanies.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhuma construtora encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCompany ? 'Editar Construtora' : 'Nova Construtora'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label>Razão Social *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label>CNPJ *</Label>
              <Input
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: applyCnpjMask(e.target.value) })}
                maxLength={18}
                placeholder="00.000.000/0000-00"
              />
              {errors.cnpj && <p className="text-sm text-red-500">{errors.cnpj}</p>}
            </div>
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label>Responsável Legal</Label>
              <Input
                value={formData.legal_representative}
                onChange={(e) => setFormData({ ...formData, legal_representative: e.target.value })}
              />
              {errors.legal_representative && (
                <p className="text-sm text-red-500">{errors.legal_representative}</p>
              )}
            </div>
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: applyPhoneMask(e.target.value) })
                }
                maxLength={15}
                placeholder="(00) 00000-0000"
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            <div className="col-span-2 border-t pt-4 mt-2">
              <h4 className="font-medium text-sm text-slate-700 mb-4">
                Dados Bancários (Opcional)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Banco</Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  />
                  {errors.bank_name && <p className="text-sm text-red-500">{errors.bank_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Agência</Label>
                  <Input
                    value={formData.bank_agency}
                    onChange={(e) => setFormData({ ...formData, bank_agency: e.target.value })}
                  />
                  {errors.bank_agency && (
                    <p className="text-sm text-red-500">{errors.bank_agency}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Conta</Label>
                  <Input
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                  />
                  {errors.bank_account && (
                    <p className="text-sm text-red-500">{errors.bank_account}</p>
                  )}
                </div>
              </div>
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Construtora</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 py-4">
            Tem certeza que deseja remover a construtora <strong>{selectedCompany?.name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
