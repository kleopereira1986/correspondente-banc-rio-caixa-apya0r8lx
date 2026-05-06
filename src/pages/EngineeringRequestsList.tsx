import { useEffect, useState } from 'react'
import {
  getEngineeringRequests,
  updateEngineeringRequest,
  getEngineeringLogs,
} from '@/services/api'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/hooks/use-toast'
import { CopyIcon, Eye, Filter, Search, X, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function EngineeringRequestsList() {
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Filter States
  const [filterRequesterName, setFilterRequesterName] = useState('')
  const [filterRequesterType, setFilterRequesterType] = useState('all')
  const [filterEngineerName, setFilterEngineerName] = useState('')
  const [filterRegistration, setFilterRegistration] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>()
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>()
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const [boletoDialogOpen, setBoletoDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [boletoFile, setBoletoFile] = useState<File | null>(null)

  const [engineerDialogOpen, setEngineerDialogOpen] = useState(false)
  const [engineerName, setEngineerName] = useState('')

  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false)
  const [evaluationValue, setEvaluationValue] = useState('')
  const [reportStatus, setReportStatus] = useState('')
  const [nonConformityNotes, setNonConformityNotes] = useState('')

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  const loadData = async (filters: any) => {
    setIsLoading(true)
    try {
      const conditions = []
      if (filters.reqName)
        conditions.push(`requester_name ~ "${filters.reqName.replace(/"/g, '\\"')}"`)
      if (filters.reqType && filters.reqType !== 'all')
        conditions.push(`requester_type = "${filters.reqType}"`)
      if (filters.engName)
        conditions.push(`engineer_name ~ "${filters.engName.replace(/"/g, '\\"')}"`)
      if (filters.regNum)
        conditions.push(`registration_number ~ "${filters.regNum.replace(/"/g, '\\"')}"`)
      if (filters.dFrom)
        conditions.push(`created >= "${format(filters.dFrom, 'yyyy-MM-dd')} 00:00:00"`)
      if (filters.dTo) conditions.push(`created <= "${format(filters.dTo, 'yyyy-MM-dd')} 23:59:59"`)

      const filterStr = conditions.join(' && ')
      const data = await getEngineeringRequests(filterStr)
      setRequests(data)
    } catch (error) {
      console.error('Error fetching engineering requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRequests = () =>
    loadData({
      reqName: filterRequesterName,
      reqType: filterRequesterType,
      engName: filterEngineerName,
      regNum: filterRegistration,
      dFrom: filterDateFrom,
      dTo: filterDateTo,
    })

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleClearFilters = () => {
    setFilterRequesterName('')
    setFilterRequesterType('all')
    setFilterEngineerName('')
    setFilterRegistration('')
    setFilterDateFrom(undefined)
    setFilterDateTo(undefined)
    loadData({ reqType: 'all' })
  }

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
    if (!engineerName || !selectedRequest) return
    try {
      await updateEngineeringRequest(selectedRequest.id, {
        status: 'in_evaluation',
        engineer_name: engineerName,
      })
      toast({ title: 'Empresa informada com sucesso' })
      setEngineerDialogOpen(false)
      setEngineerName('')
      fetchRequests()
    } catch (error) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const handleFinalizeSubmit = async () => {
    if (!evaluationValue || !reportStatus || !selectedRequest) return
    if (reportStatus === 'invalid' && !nonConformityNotes) return

    try {
      await updateEngineeringRequest(selectedRequest.id, {
        status: 'completed',
        evaluation_value: Number(evaluationValue),
        report_status: reportStatus,
        non_conformity_notes: reportStatus === 'invalid' ? nonConformityNotes : '',
      })
      toast({ title: 'Avaliação finalizada com sucesso' })
      setFinalizeDialogOpen(false)
      setEvaluationValue('')
      setReportStatus('')
      setNonConformityNotes('')
      fetchRequests()
    } catch (error) {
      toast({ title: 'Erro ao finalizar', variant: 'destructive' })
    }
  }

  const handleGenerateLink = (id: string) => {
    const url = `${window.location.origin}/consultar-engenharia/${id}`
    navigator.clipboard.writeText(url)
    toast({
      title: 'Link copiado!',
      description: 'O link de acompanhamento foi copiado para a área de transferência.',
    })
  }

  const handleOpenDetails = async (req: any) => {
    setSelectedRequest(req)
    setDetailsOpen(true)
    setIsLoadingLogs(true)
    try {
      const data = await getEngineeringLogs(req.id)
      setLogs(data)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const getStatusName = (status: string) => {
    const map: Record<string, string> = {
      pending_analysis: 'Pendente Análise',
      in_progress: 'Em Análise',
      boleto_issued: 'Boleto Emitido',
      engineer_requested: 'Empresa Informada',
      in_evaluation: 'Em Avaliação',
      completed: 'Finalizada',
    }
    return map[status] || status || 'Criado'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-blue-500">EM ANÁLISE</Badge>
      case 'boleto_issued':
        return <Badge className="bg-purple-500">BOLETO EMITIDO</Badge>
      case 'engineer_requested':
      case 'in_evaluation':
        return <Badge className="bg-indigo-500">AVALIAÇÃO EM ANDAMENTO</Badge>
      case 'completed':
        return <Badge className="bg-slate-700">AVALIAÇÃO FINALIZADA</Badge>
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

      <Card className="bg-slate-50/50">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              Filtros de Busca
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsFilterOpen(!isFilterOpen)}>
              {isFilterOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
          </div>
        </CardHeader>
        {isFilterOpen && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nome do Solicitante</Label>
                <Input
                  placeholder="Ex: João da Silva"
                  value={filterRequesterName}
                  onChange={(e) => setFilterRequesterName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchRequests()}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Solicitante</Label>
                <Select value={filterRequesterType} onValueChange={setFilterRequesterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Construtora">Construtora</SelectItem>
                    <SelectItem value="Parceiro Corretor">Parceiro Corretor</SelectItem>
                    <SelectItem value="Comprador">Comprador</SelectItem>
                    <SelectItem value="Vendedor PF">Vendedor PF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome da Empresa/Engenheiro</Label>
                <Input
                  placeholder="Ex: Engenharia XYZ"
                  value={filterEngineerName}
                  onChange={(e) => setFilterEngineerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchRequests()}
                />
              </div>
              <div className="space-y-2">
                <Label>Matrícula do Imóvel</Label>
                <Input
                  placeholder="Ex: 12345"
                  value={filterRegistration}
                  onChange={(e) => setFilterRegistration(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchRequests()}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Inicial (Criação)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filterDateFrom && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterDateFrom ? (
                        format(filterDateFrom, 'dd/MM/yyyy')
                      ) : (
                        <span>Selecione...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterDateFrom}
                      onSelect={setFilterDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Data Final (Criação)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filterDateTo && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterDateTo ? (
                        format(filterDateTo, 'dd/MM/yyyy')
                      ) : (
                        <span>Selecione...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterDateTo}
                      onSelect={setFilterDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
              <Button onClick={fetchRequests}>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

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
                        {req.origin === 'internal'
                          ? `Interno - ${req.requester_name}`
                          : req.requester_name}
                        {req.requester_cpf && (
                          <span className="block text-xs text-muted-foreground">
                            {req.requester_cpf}
                          </span>
                        )}
                        {req.requester_type === 'Construtora' && (
                          <Badge variant="outline" className="mt-1 text-[10px]">
                            Construtora
                          </Badge>
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

                          {req.boleto_sent_at && (
                            <span className="text-[10px] text-muted-foreground mt-1">
                              Boleto:{' '}
                              {format(new Date(req.boleto_sent_at), 'dd/MM/yy', { locale: ptBR })}
                            </span>
                          )}

                          {req.is_paid && req.payment_date && (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-200 bg-green-50 text-[10px]"
                            >
                              Pago em{' '}
                              {format(new Date(req.payment_date), 'dd/MM', { locale: ptBR })}
                            </Badge>
                          )}

                          {req.finalized_at && (
                            <span className="text-[10px] text-muted-foreground">
                              Finalizado:{' '}
                              {format(new Date(req.finalized_at), 'dd/MM/yy', { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenDetails(req)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>

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
                                Informar Empresa
                              </Button>
                            </>
                          )}
                          {(req.status === 'engineer_requested' ||
                            req.status === 'in_evaluation') && (
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
                                  setFinalizeDialogOpen(true)
                                }}
                              >
                                Finalizar Avaliação
                              </Button>
                            </>
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
            <DialogTitle>Dados da Empresa Contratada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dados da Empresa (Nome, CNPJ, etc)</Label>
              <Input
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                placeholder="Ex: Engenharia XYZ Ltda"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEngineerDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEngineerSubmit} disabled={!engineerName}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Avaliação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor da Avaliação (R$)</Label>
              <Input
                type="number"
                value={evaluationValue}
                onChange={(e) => setEvaluationValue(e.target.value)}
                placeholder="Ex: 500000"
              />
            </div>
            <div className="space-y-2">
              <Label>Status do Laudo</Label>
              <Select value={reportStatus} onValueChange={setReportStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valid">Válido</SelectItem>
                  <SelectItem value="invalid">Inválido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {reportStatus === 'invalid' && (
              <div className="space-y-2">
                <Label>Observações (Não Conformidade)</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={nonConformityNotes}
                  onChange={(e) => setNonConformityNotes(e.target.value)}
                  placeholder="Descreva as não conformidades encontradas..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleFinalizeSubmit}
              disabled={
                !evaluationValue ||
                !reportStatus ||
                (reportStatus === 'invalid' && !nonConformityNotes)
              }
            >
              Salvar Finalização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto w-full">
          <SheetHeader className="mb-6">
            <SheetTitle>Detalhes da Solicitação</SheetTitle>
            <SheetDescription>Informações completas e histórico da avaliação.</SheetDescription>
          </SheetHeader>

          {selectedRequest && (
            <Tabs defaultValue="details">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="details">Dados do Formulário</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-slate-500 block">Origem</span>
                    <span>{selectedRequest.origin === 'external' ? 'Externa' : 'Interna'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Tipo de Avaliação</span>
                    <span>{selectedRequest.evaluation_type === 'new' ? 'Novo' : 'Usado'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Solicitante</span>
                    <span>{selectedRequest.requester_name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">CPF/CNPJ Solicitante</span>
                    <span>{selectedRequest.requester_cpf || '-'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Tipo Solicitante</span>
                    <span>{selectedRequest.requester_type || '-'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Email</span>
                    <span>{selectedRequest.requester_email}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Telefone</span>
                    <span>{selectedRequest.requester_phone || '-'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Valor Solicitado</span>
                    <span>
                      {selectedRequest.requested_value
                        ? `R$ ${selectedRequest.requested_value.toLocaleString('pt-BR')}`
                        : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Matrícula</span>
                    <span>{selectedRequest.registration_number || '-'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Quadra/Lote</span>
                    <span>{selectedRequest.block || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-slate-500 block">
                      Informações do Vendedor
                    </span>
                    <span>{selectedRequest.seller_info || '-'}</span>
                  </div>

                  <div className="col-span-2 border-t pt-4 mt-2">
                    <h4 className="font-semibold mb-2">Dados de Contato (Vistoria)</h4>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Nome</span>
                    <span>{selectedRequest.contact_person_name || '-'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Telefone</span>
                    <span>{selectedRequest.contact_person_phone || '-'}</span>
                  </div>

                  <div className="col-span-2 border-t pt-4 mt-2">
                    <h4 className="font-semibold mb-2">Dados de Faturamento</h4>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Nome/Razão Social</span>
                    <span>{selectedRequest.billing_name || '-'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">CPF/CNPJ</span>
                    <span>{selectedRequest.billing_cpf_cnpj || '-'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Email</span>
                    <span>{selectedRequest.billing_email || '-'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Telefone</span>
                    <span>{selectedRequest.billing_phone || '-'}</span>
                  </div>

                  {(selectedRequest.documents || selectedRequest.boleto_file) && (
                    <div className="col-span-2 border-t pt-4 mt-2 space-y-2 flex flex-col items-start">
                      <h4 className="font-semibold mb-2">Documentos</h4>
                      {selectedRequest.documents && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`${import.meta.env.VITE_POCKETBASE_URL}/api/files/engineering_requests/${selectedRequest.id}/${selectedRequest.documents}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download Matrícula
                          </a>
                        </Button>
                      )}
                      {selectedRequest.boleto_file && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`${import.meta.env.VITE_POCKETBASE_URL}/api/files/engineering_requests/${selectedRequest.id}/${selectedRequest.boleto_file}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download Boleto
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                {isLoadingLogs ? (
                  <div className="text-center py-8 text-slate-500">Carregando histórico...</div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Nenhum movimento registrado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="border-l-2 border-slate-200 pl-4 py-1">
                        <div className="text-xs text-slate-500 mb-1">
                          {format(new Date(log.created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        <div className="text-sm">
                          Mudou de{' '}
                          <span className="font-medium text-slate-700">
                            {getStatusName(log.from_status)}
                          </span>{' '}
                          para{' '}
                          <span className="font-medium text-slate-700">
                            {getStatusName(log.to_status)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Por: {log.expand?.changed_by?.name || 'Sistema'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
