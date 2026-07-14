import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ConstructionCompanySelect } from '@/components/ConstructionCompanySelect'
import { updateProcess } from '@/services/api'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Loader2, Building2 } from 'lucide-react'

export default function HousingTransition() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)
  const [confirmStep, setConfirmStep] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const isAuthorized = user?.role === 'master' || user?.role === 'analyst'

  const [processData, setProcessData] = useState<any>(null)
  const [firstHousingStage, setFirstHousingStage] = useState<string>('TRIAGEM CCA')

  useEffect(() => {
    if (!isAuthorized) {
      navigate('/dashboard')
      return
    }
    Promise.all([
      pb.collection('construction_companies').getFullList({ sort: 'name' }),
      id
        ? pb.collection('processes').getOne(id, { expand: 'development_type' })
        : Promise.resolve(null),
      pb.collection('housing_stages').getFullList({ sort: 'order' }),
    ])
      .then(([companyList, processRecord, stagesList]) => {
        const triagem = stagesList.find((s) => s.name.toLowerCase().includes('triagem'))
        if (triagem) setFirstHousingStage(triagem.name)
        else if (stagesList.length > 0) setFirstHousingStage(stagesList[0].name)
        setCompanies(companyList)
        if (processRecord?.construction_company) {
          setSelectedCompany(processRecord.construction_company)
        }
        setProcessData(processRecord)
      })
      .catch(() => {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados.',
          variant: 'destructive',
        })
      })
      .finally(() => setLoading(false))
  }, [isAuthorized, navigate, toast, id])

  const selectedCompanyObj = companies.find((c) => c.id === selectedCompany)
  const canProceed = !!selectedCompanyObj

  const handleClose = () => {
    setOpen(false)
    navigate(-1)
  }

  const handleConfirm = async () => {
    if (!id) return
    if (!selectedCompany) {
      toast({
        title: 'Aviso',
        description: 'Selecione uma construtora para continuar.',
        variant: 'destructive',
      })
      return
    }
    setSubmitting(true)
    try {
      const targetStep = firstHousingStage || 'TRIAGEM CCA'
      const triagemStages = await pb
        .collection('housing_stages')
        .getFullList({ filter: `name = "${targetStep}"` })
      if (triagemStages.length === 0) {
        toast({
          title: 'Erro de Configuração',
          description:
            'A etapa "TRIAGEM CCA" não foi encontrada. Verifique as configurações de etapas habitacionais.',
          variant: 'destructive',
        })
        setSubmitting(false)
        return
      }
      const payload: any = {
        type: 'housing',
        current_step: targetStep,
        status: 'Nova Solicitação',
        result: 'approved',
        construction_company: selectedCompany,
        last_updated_by: user?.id || '',
      }
      await updateProcess(id, payload)
      await pb
        .send('/backend/v1/process-logs/manual', {
          method: 'POST',
          body: JSON.stringify({
            process: id,
            from_step: processData?.current_step || '',
            to_step: targetStep,
            from_status: processData?.status || '',
            to_status: 'Nova Solicitação',
            note: 'Transição para fluxo habitacional com seleção de construtora',
          }),
          headers: { 'Content-Type': 'application/json' },
        })
        .catch(() => {})
      toast({
        title: 'Sucesso',
        description: 'Processo enviado com sucesso para a Triagem CCA!',
      })
      setOpen(false)
      navigate('/housing-kanban')
    } catch (err) {
      toast({
        title: 'Erro ao enviar para Kanban',
        description: getErrorMessage(err) || 'Erro ao comunicar com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthorized) return null
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose()
      }}
    >
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        {!confirmStep ? (
          <>
            <DialogHeader>
              <DialogTitle>Enviar para Processo Habitacional</DialogTitle>
              <DialogDescription>
                Informe qual a Construtora responsável por este processo.
                <br />O processo será enviado para o fluxo habitacional na etapa TRIAGEM CCA.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label className="text-sm font-medium">Construtora *</Label>
              <ConstructionCompanySelect
                companies={companies}
                value={selectedCompany}
                onChange={setSelectedCompany}
              />
              {!selectedCompanyObj && (
                <p className="text-sm text-red-600 font-medium">
                  É obrigatório selecionar uma construtora para continuar.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={() => setConfirmStep(true)} disabled={submitting || !canProceed}>
                Avançar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Enviar para Processo Habitacional</DialogTitle>
              <DialogDescription>
                Informe qual a Construtora responsável por este processo.
                <br />O processo será enviado para o fluxo habitacional na etapa TRIAGEM CCA.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              {selectedCompanyObj && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Construtora: <strong>{selectedCompanyObj.name}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmStep(false)} disabled={submitting}>
                Voltar
              </Button>
              <Button onClick={handleConfirm} disabled={submitting || !selectedCompanyObj}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
