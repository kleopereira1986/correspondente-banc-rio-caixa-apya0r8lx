import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/auth-context'
import { getUsers, createUser, updateUser, deleteUser } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Plus, Check } from 'lucide-react'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { Label } from '@/components/ui/label'

const roleLabels: Record<string, string> = {
  master: 'Master',
  analyst: 'Analista',
  buyer: 'Comprador',
  seller: 'Vendedor',
  broker: 'Corretor Parceiro',
}

export default function UsersPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('users')

  const [users, setUsers] = useState<any[]>([])
  const [agencies, setAgencies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isUserDeleteDialogOpen, setIsUserDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const [isAgencyDialogOpen, setIsAgencyDialogOpen] = useState(false)
  const [isAgencyDeleteDialogOpen, setIsAgencyDeleteDialogOpen] = useState(false)
  const [selectedAgency, setSelectedAgency] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer',
    cpf: '',
    real_estate_agency: '',
  })
  const [agencyName, setAgencyName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadUsers()
    loadAgencies()
  }, [])

  useRealtime('users', () => {
    loadUsers()
  })

  const loadUsers = async () => {
    try {
      const data = await pb
        .collection('users')
        .getFullList({ expand: 'real_estate_agency', sort: '-created' })
      setUsers(data)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const loadAgencies = async () => {
    try {
      const data = await pb.collection('real_estate_agencies').getFullList()
      setAgencies(data)
    } catch (err) {
      console.error(err)
    }
  }

  if (user?.role !== 'master') {
    return <div className="p-8 text-center text-muted-foreground">Acesso negado.</div>
  }

  const approvedUsers = users.filter((u) => u.is_approved)
  const pendingUsers = users.filter((u) => !u.is_approved)

  const handleOpenUserDialog = (u?: any) => {
    setErrors({})
    if (u) {
      setSelectedUser(u)
      setFormData({
        name: u.name,
        email: u.email,
        password: '',
        role: u.role,
        cpf: u.cpf || '',
        real_estate_agency: u.real_estate_agency || '',
      })
    } else {
      setSelectedUser(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'buyer',
        cpf: '',
        real_estate_agency: '',
      })
    }
    setIsUserDialogOpen(true)
  }

  const handleSaveUser = async () => {
    setErrors({})
    try {
      const dataToUpdate: any = { ...formData }
      if (!dataToUpdate.password) delete dataToUpdate.password
      if (dataToUpdate.role !== 'broker' && dataToUpdate.role !== 'real_estate_agency')
        dataToUpdate.real_estate_agency = null
      else if (!dataToUpdate.real_estate_agency) dataToUpdate.real_estate_agency = null

      if (selectedUser) {
        await updateUser(selectedUser.id, dataToUpdate)
        toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso.' })
      } else {
        await createUser({ ...dataToUpdate, is_approved: true })
        toast({ title: 'Sucesso', description: 'Usuário criado com sucesso.' })
      }
      setIsUserDialogOpen(false)
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    try {
      await deleteUser(selectedUser.id)
      toast({ title: 'Sucesso', description: 'Usuário removido.' })
      setIsUserDeleteDialogOpen(false)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleApproveUser = async (userId: string) => {
    try {
      await pb.collection('users').update(userId, { is_approved: true })
      toast({ title: 'Sucesso', description: 'Usuário aprovado com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleOpenAgencyDialog = (a?: any) => {
    setErrors({})
    if (a) {
      setSelectedAgency(a)
      setAgencyName(a.name)
    } else {
      setSelectedAgency(null)
      setAgencyName('')
    }
    setIsAgencyDialogOpen(true)
  }

  const handleSaveAgency = async () => {
    if (!agencyName.trim()) {
      setErrors({ name: 'O nome é obrigatório' })
      return
    }
    try {
      if (selectedAgency) {
        await pb.collection('real_estate_agencies').update(selectedAgency.id, { name: agencyName })
        toast({ title: 'Sucesso', description: 'Imobiliária atualizada com sucesso.' })
      } else {
        await pb.collection('real_estate_agencies').create({ name: agencyName })
        toast({ title: 'Sucesso', description: 'Imobiliária criada com sucesso.' })
      }
      setIsAgencyDialogOpen(false)
      loadAgencies()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleDeleteAgency = async () => {
    if (!selectedAgency) return
    try {
      await pb.collection('real_estate_agencies').delete(selectedAgency.id)
      toast({ title: 'Sucesso', description: 'Imobiliária removida.' })
      setIsAgencyDeleteDialogOpen(false)
      loadAgencies()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Configurações de Acesso
          </h1>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema, imobiliárias e aprovações.
          </p>
        </div>
        <Button
          onClick={() =>
            activeTab === 'users' ? handleOpenUserDialog() : handleOpenAgencyDialog()
          }
          className={activeTab === 'pending' ? 'hidden' : ''}
        >
          <Plus className="w-4 h-4 mr-2" />{' '}
          {activeTab === 'users' ? 'Novo Usuário' : 'Nova Imobiliária'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="users">Usuários Ativos</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Aprovações Pendentes
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-[10px] leading-none">
                {pendingUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="agencies">Imobiliárias</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Imobiliária</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || '-'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {roleLabels[u.role] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{u.cpf || '-'}</TableCell>
                    <TableCell>{u.expand?.real_estate_agency?.name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenUserDialog(u)}>
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(u)
                            setIsUserDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {approvedUsers.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário ativo encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil Solicitado</TableHead>
                  <TableHead>Data do Cadastro</TableHead>
                  <TableHead className="w-[200px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || '-'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {roleLabels[u.role] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(u.created).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 h-8 px-2"
                          onClick={() => handleApproveUser(u.id)}
                        >
                          <Check className="w-4 h-4 mr-1" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 h-8 px-2"
                          onClick={() => {
                            setSelectedUser(u)
                            setIsUserDeleteDialogOpen(true)
                          }}
                        >
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingUsers.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-slate-100 p-3 rounded-full mb-3">
                          <Check className="w-6 h-6 text-slate-400" />
                        </div>
                        <p>Nenhuma aprovação pendente no momento.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="agencies">
          <div className="bg-white border rounded-lg shadow-sm overflow-x-auto max-w-4xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Imobiliária</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agencies.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{new Date(a.created).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenAgencyDialog(a)}
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAgency(a)
                            setIsAgencyDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {agencies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Nenhuma imobiliária encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Senha {selectedUser && '(Deixe em branco para manter)'}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              />
              {errors.cpf && <p className="text-sm text-red-500">{errors.cpf}</p>}
            </div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.role === 'broker' && (
              <div className="space-y-2">
                <Label>Imobiliária</Label>
                <Select
                  value={formData.real_estate_agency}
                  onValueChange={(v) => setFormData({ ...formData, real_estate_agency: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a imobiliária..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUserDeleteDialogOpen} onOpenChange={setIsUserDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {!selectedUser?.is_approved ? 'Rejeitar Solicitação' : 'Excluir Usuário'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 py-4">
            Tem certeza que deseja{' '}
            {!selectedUser?.is_approved
              ? 'rejeitar a solicitação e remover o usuário'
              : 'remover o usuário'}{' '}
            <strong>{selectedUser?.name || selectedUser?.email}</strong>? Esta ação não pode ser
            desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              {!selectedUser?.is_approved ? 'Rejeitar e Excluir' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAgencyDialogOpen} onOpenChange={setIsAgencyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAgency ? 'Editar Imobiliária' : 'Nova Imobiliária'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Imobiliária</Label>
              <Input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAgencyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAgency}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAgencyDeleteDialogOpen} onOpenChange={setIsAgencyDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Imobiliária</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 py-4">
            Tem certeza que deseja remover a imobiliária <strong>{selectedAgency?.name}</strong>?
            Esta ação não pode ser desfeita e pode afetar os corretores associados.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAgencyDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteAgency}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
