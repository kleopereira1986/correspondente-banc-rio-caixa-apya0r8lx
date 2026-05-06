import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import {
  getProcesses,
  createProcess,
  createUser,
  getCreditAnalysisTypes,
  getPropertyTypes,
  getDevelopmentTypes,
} from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
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
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

export default function BrokerProcesses() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [processes, setProcesses] = useState<any[]>([])
  const [creditAnalysisTypes, setCreditAnalysisTypes] = useState<any[]>([])
  const [propertyTypes, setPropertyTypes] = useState<any[]>([])
  const [developmentTypes, setDevelopmentTypes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [step, setStep] = useState(1)

  const [housingNotes, setHousingNotes] = useState('')
  const [selectedProcessId, setSelectedProcessId] = useState('')
  const [housingDialogOpen, setHousingDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    buyerId: '',
    buyerName: '',
    buyerCpf: '',
    buyerPhone: '',
    buyerEmail: '',
    creditAnalysisType: '',
    propertyType: '',
    value: '',
    developmentType: '',
    workHistory36Months: 'false',
    hasDependents: 'false',
    dependentsInfo: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('credit_analysis_types', () => loadData())
  useRealtime('property_types', () => loadData())
  useRealtime('development_types', () => loadData())

  const loadData = async () => {
    try {
      const [procs, cats, pts, devs] = await Promise.all([
        getProcesses(),
        getCreditAnalysisTypes(),
        getPropertyTypes(),
        getDevelopmentTypes(),
      ])
      setProcesses(procs)
      setCreditAnalysisTypes(cats)
      setPropertyTypes(pts)
      setDevelopmentTypes(devs)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const isMcmvEmpreendimento =
    creditAnalysisTypes.find((c) => c.id === formData.creditAnalysisType)?.name ===
    'MCMV IMOVEL NOVO DE EMPREENDIMENTO'

  const isFinalStep = step === 5 || (step === 4 && formData.hasDependents === 'false')

  const handleNext = () => {
    if (step === 1) {
      if (!formData.buyerName || !formData.buyerCpf || !formData.buyerEmail) {
        toast({ title: 'Aviso', description: 'Preencha os campos obrigatórios do cliente.' })
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!formData.creditAnalysisType || !formData.propertyType || !formData.value) {
        toast({ title: 'Aviso', description: 'Preencha os campos obrigatórios da avaliação.' })
        return
      }
      if (isMcmvEmpreendimento) {
        setStep(3)
      } else {
        setStep(4)
      }
    } else if (step === 3) {
      if (!formData.developmentType) {
        toast({ title: 'Aviso', description: 'Selecione um empreendimento.' })
        return
      }
      setStep(4)
    } else if (step === 4) {
      if (formData.hasDependents === 'true') {
        setStep(5)
      } else {
        handleCreate()
      }
    } else if (step === 5) {
      handleCreate()
    }
  }

  const handleBack = () => {
    if (step === 2) setStep(1)
    if (step === 3) setStep(2)
    if (step === 4) {
      if (isMcmvEmpreendimento) setStep(3)
      else setStep(2)
    }
    if (step === 5) setStep(4)
  }

  const handleCreate = async () => {
    setErrors({})
    try {
      const userRes = await createUser({
        name: formData.buyerName,
        cpf: formData.buyerCpf,
        email: formData.buyerEmail,
        phone: formData.buyerPhone,
        has_dependents: formData.hasDependents === 'true',
        dependents_info: formData.dependentsInfo,
        work_history_36_months: formData.workHistory36Months === 'true',
        role: 'buyer',
        password: 'Skip@Pass123!',
      })
      const currentBuyerId = userRes.id

      await createProcess({
        type: 'credit',
        status: 'Triagem',
        current_step: 'Triagem',
        buyer: currentBuyerId,
        broker: user?.id,
        credit_analysis_type: formData.creditAnalysisType,
        property_type: formData.propertyType,
        value: Number(formData.value) || 0,
        development_type: formData.developmentType || null,
      })

      toast({ title: 'Sucesso', description: 'Avaliação de crédito solicitada com sucesso.' })
      setIsDialogOpen(false)
      loadData()
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprovado':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado
          </Badge>
        )
      case 'condicionado':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <AlertCircle className="w-3 h-3 mr-1" /> Condicionado
          </Badge>
        )
      case 'reprovado':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" /> Reprovado
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Clock className="w-3 h-3 mr-1" /> {status}
          </Badge>
        )
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Nome Completo *</Label>
        <Input
          value={formData.buyerName}
          onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>CPF *</Label>
        <Input
          value={formData.buyerCpf}
          onChange={(e) => setFormData({ ...formData, buyerCpf: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Telefone</Label>
        <Input
          value={formData.buyerPhone}
          onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Email *</Label>
        <Input
          type="email"
          value={formData.buyerEmail}
          onChange={(e) => setFormData({ ...formData, buyerEmail: e.target.value })}
        />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Tipo de Análise de Crédito *</Label>
        <Select
          value={formData.creditAnalysisType}
          onValueChange={(v) => setFormData({ ...formData, creditAnalysisType: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {creditAnalysisTypes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Tipo de Imóvel *</Label>
        <Select
          value={formData.propertyType}
          onValueChange={(v) => setFormData({ ...formData, propertyType: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {propertyTypes.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Valor do Imóvel/Crédito *</Label>
        <Input
          type="number"
          placeholder="Ex: 350000"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
        />
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Tipo de Empreendimento *</Label>
        <Select
          value={formData.developmentType}
          onValueChange={(v) => setFormData({ ...formData, developmentType: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o empreendimento" />
          </SelectTrigger>
          <SelectContent>
            {developmentTypes.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6 py-4">
      <div className="space-y-3">
        <Label>Possui 36 meses sob regime FGTS?</Label>
        <RadioGroup
          value={formData.workHistory36Months}
          onValueChange={(v) => setFormData({ ...formData, workHistory36Months: v })}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="fgts-yes" />
            <Label htmlFor="fgts-yes">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="fgts-no" />
            <Label htmlFor="fgts-no">Não</Label>
          </div>
        </RadioGroup>
      </div>
      <div className="space-y-3">
        <Label>Possui dependente?</Label>
        <RadioGroup
          value={formData.hasDependents}
          onValueChange={(v) => setFormData({ ...formData, hasDependents: v })}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="dep-yes" />
            <Label htmlFor="dep-yes">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="dep-no" />
            <Label htmlFor="dep-no">Não</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )

  const handleStartHousing = async () => {
    try {
      const p = processes.find((x) => x.id === selectedProcessId)
      if (!p) return
      await createProcess({
        type: 'housing',
        buyer: p.buyer,
        broker: user?.id,
        current_step: 'Montagem de Pasta',
        status: 'Nova Solicitação',
        observations: housingNotes,
        credit_analysis_type: p.credit_analysis_type,
        development_type: p.development_type,
        value: p.approved_financing_value || p.value,
      })
      toast({ title: 'Sucesso', description: 'Processo Habitacional iniciado com sucesso.' })
      setHousingDialogOpen(false)
      loadData()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const renderStep5 = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Observação (Dependentes)</Label>
        <Input
          placeholder="Informe detalhes dos dependentes"
          value={formData.dependentsInfo}
          onChange={(e) => setFormData({ ...formData, dependentsInfo: e.target.value })}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Meus Processos</h1>
          <p className="text-muted-foreground">
            Acompanhe suas avaliações de crédito e financiamentos.
          </p>
        </div>
        <Button
          onClick={() => {
            setStep(1)
            setFormData({
              buyerId: '',
              buyerName: '',
              buyerCpf: '',
              buyerPhone: '',
              buyerEmail: '',
              creditAnalysisType: '',
              propertyType: '',
              value: '',
              developmentType: '',
              workHistory36Months: 'false',
              hasDependents: 'false',
              dependentsInfo: '',
            })
            setIsDialogOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Cadastrar Novo Cliente
        </Button>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Processo ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Etapa Atual</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processes.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.id}</TableCell>
                <TableCell className="font-medium">{p.expand?.buyer?.name || '-'}</TableCell>
                <TableCell className="capitalize">
                  {p.type === 'credit' ? 'Crédito' : 'Habitacional'}
                </TableCell>
                <TableCell>
                  {p.value
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        p.value,
                      )
                    : '-'}
                </TableCell>
                <TableCell>{getStatusBadge(p.status)}</TableCell>
                <TableCell>
                  {p.result === 'approved' ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">
                      APROVADO
                    </Badge>
                  ) : (
                    p.current_step || '-'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {p.type === 'credit' && p.result === 'approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        onClick={() => {
                          setSelectedProcessId(p.id)
                          setHousingNotes('')
                          setHousingDialogOpen(true)
                        }}
                      >
                        Iniciar Habitacional
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/process/${p.id}`}>
                        <Eye className="w-4 h-4 mr-2" /> Ver Detalhes
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {processes.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nenhum processo encontrado. Solicite uma nova avaliação.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(val) => {
          setIsDialogOpen(val)
          if (!val) setStep(1)
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Cliente (Passo {step})</DialogTitle>
          </DialogHeader>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}

          <DialogFooter className="flex flex-row justify-between w-full mt-4">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  Voltar
                </Button>
              )}
            </div>
            <Button onClick={handleNext}>{isFinalStep ? 'Finalizar' : 'Próximo'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={housingDialogOpen} onOpenChange={setHousingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Processo Habitacional</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Observações Iniciais</Label>
              <Input
                placeholder="Detalhes para a montagem de pasta..."
                value={housingNotes}
                onChange={(e) => setHousingNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHousingDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleStartHousing}>Iniciar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
