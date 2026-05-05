import { useEffect, useState } from 'react'
import { getEngineeringRequests, updateEngineeringRequest } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { CopyIcon } from 'lucide-react'

export default function EngineeringRequestsList() {
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const [boletoDialogOpen, setBoletoDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [boletoFile, setBoletoFile] = useState<File | null>(null)

  const [engineerDialogOpen, setEngineerDialogOpen] = useState(false)
  const [engineerName, setEngineerName] = useState('')
  const [engineerPhone, setEngineerPhone] = useState('')

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const data = await getEngineeringRequests()
      setRequests(data)
    } catch (error) {
      console.error('Error fetching engineering requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleStartAnalysis = async (id: string) => {
    try {
      await updateEngineeringRequest(id, { status: 'in_progress' })
      toast({ title: 'Análise Iniciada' })
      fetchRequests()
    } catch (error) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const handleBoletoSubmit = async () => {
    if (!boletoFile || !selectedRequest) return
    try {
      const formData = new FormData()
      formData.append('status', 'boleto_issued')
      formData.append('boleto_file', boletoFile)
      await updateEngineeringRequest(selectedRequest.id, formData)
      toast({ title: 'Boleto emitido com sucesso' })
      setBoletoDialogOpen(false)
      setBoletoFile(null)
      fetchRequests()
    } catch (error) {
      toast({ title: 'Erro ao emitir boleto', variant: 'destructive' })
    }
  }

  const handleEngineerSubmit = async () => {
    if (!engineerName || !engineerPhone || !selectedRequest) return
    try {
      await updateEngineeringRequest(selectedRequest.id, {
        status: 'engineer_requested',
        engineer_name: engineerName,
        engineer_phone: engineerPhone,
      })
      toast({ title: 'Engenheiro solicitado com sucesso' })
      setEngineerDialogOpen(false)
      setEngineerName('')
      setEngineerPhone('')
      fetchRequests()
    } catch (error) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const handleGenerateLink = (id: string) => {
    const url = `${window.location.origin}/consultar-engenharia/${id}`
    navigator.clipboard.writeText(url)
    toast({
      title: 'Link copiado!',
      description: 'O link de pagamento foi copiado para a área de transferência.',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-blue-500">EM ANÁLISE</Badge>
      case 'boleto_issued':
        return <Badge className="bg-purple-500">BOLETO EMITIDO</Badge>
      case 'engineer_requested':
        return <Badge className="bg-green-500">ENGENHEIRO SOLICITADO</Badge>
      case 'completed':
        return <Badge className="bg-slate-700">CONCLUÍDO</Badge>
      default:
        return <Badge className="bg-amber-500">PENDENTE ANÁLISE</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Avaliações de Engenharia Solicitadas</h1>
        <p className="text-slate-500">
          Acompanhe todas as solicitações de avaliação de engenharia (internas e externas).
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Lista de Solicitações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                      Carregando solicitações...
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                      Nenhuma solicitação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {req.requester_name}
                        {req.requester_cpf && (
                          <span className="block text-xs text-muted-foreground">
                            {req.requester_cpf}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {req.evaluation_type === 'new' ? 'Novo' : 'Usado'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(req.created), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {req.origin === 'external' ? (
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                          >
                            Externo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-600 bg-slate-50">
                            Interno
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(req.status)}
                          {req.is_paid && (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-200 bg-green-50 text-[10px]"
                            >
                              Pago em{' '}
                              {format(new Date(req.payment_date), 'dd/MM', { locale: ptBR })}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {(!req.status || req.status === 'pending_analysis') && (
                            <Button size="sm" onClick={() => handleStartAnalysis(req.id)}>
                              Iniciar Análise
                            </Button>
                          )}
                          {req.status === 'in_progress' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(req)
                                setBoletoDialogOpen(true)
                              }}
                            >
                              Emitir Boleto
                            </Button>
                          )}
                          {req.status === 'boleto_issued' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerateLink(req.id)}
                                title="Copiar Link"
                              >
                                <CopyIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(req)
                                  setEngineerDialogOpen(true)
                                }}
                              >
                                Solicitar Engenheiro
                              </Button>
                            </>
                          )}
                          {req.status === 'engineer_requested' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateLink(req.id)}
                              title="Copiar Link"
                            >
                              <CopyIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={boletoDialogOpen} onOpenChange={setBoletoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emitir Boleto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Arquivo do Boleto (PDF, etc)</Label>
              <Input type="file" onChange={(e) => setBoletoFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBoletoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBoletoSubmit} disabled={!boletoFile}>
              Salvar e Emitir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={engineerDialogOpen} onOpenChange={setEngineerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Engenheiro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Engenheiro</Label>
              <Input
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                placeholder="Ex: João da Silva"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone do Engenheiro</Label>
              <Input
                value={engineerPhone}
                onChange={(e) => setEngineerPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEngineerDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEngineerSubmit} disabled={!engineerName || !engineerPhone}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
