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
import { Loader2, Building2, AlertTriangle } from 'lucide-react'

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
  const [existingCompany, setExistingCompany] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const isAuthorized = user?.role === 'master' || user?.role === 'analyst'

  useEffect(() => {
    if (!isAuthorized) {
      navigate('/dashboard')
      return
    }
    Promise.all([
      pb.collection('construction_companies').getFullList({ sort: 'name' }),
      id ? pb.collection('processes').getOne(id) : Promise.resolve(null),
    ])
      .then(([companyList, processRecord]) => {
        setCompanies(companyList)
        if (processRecord?.construction_company) {
          setExistingCompany(processRecord.construction_company)
          setSelectedCompany(processRecord.construction_company)
        }
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
  const hasExistingCompany = !!existingCompany

  const [processData, setProcessData] = useState<any>(null)

  useEffect(() => {
    if (id) {
      pb.collection('processes')
        .getOne(id, { expand: 'development_type' })
        .then(setProcessData)
        .catch(() => {})
    }
  }, [id])

  const isNovo = processData?.expand?.development_type?.name?.toLowerCase() === 'novo'
  const canProceed = !isNovo || !!selectedCompanyObj

  const handleClose = () => {
    setOpen(false)
    navigate(-1)
  }

  const handleConfirm = async () => {
    if (!id) return
    setSubmitting(true)
    try {
      const payload: any = {
        type: 'housing',
        current_step: 'Triagem CCA',
        status: 'Nova Solicitação',
        last_updated_by: user?.id || '',
      }
      if (selectedCompany) {
        payload.construction_company = selectedCompany
      }
      await updateProcess(id, payload)
      await pb
        .send('/backend/v1/process-logs/manual', {
          method: 'POST',
          body: JSON.stringify({
            process: id,
            from_step: processData?.current_step || '',
            to_step: 'Triagem CCA',
            note: 'Processo enviado para o fluxo habitacional',
          }),
          headers: { 'Content-Type': 'application/json' },
        })
        .catch(() => {})
      toast({
        title: 'Sucesso',
        description: 'Processo enviado para o Kanban Habitacional com sucesso!',
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
              <DialogTitle>Enviar para triagem CCA</DialogTitle>
              <DialogDescription>
                {hasExistingCompany
                  ? 'Este processo já possui uma construtora vinculada. Você pode mantê-la ou selecionar outra.'
                  : 'Selecione uma construtora para vincular a este processo, ou continue sem vincular.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label className="text-sm font-medium">Construtora</Label>
              <ConstructionCompanySelect
                companies={companies}
                value={selectedCompany}
                onChange={setSelectedCompany}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={() => setConfirmStep(true)} disabled={submitting || !canProceed}>
                Avançar
              </Button>
            </DialogFooter>
            {isNovo && !selectedCompanyObj && (
              <div className="px-6 pb-4 pt-2">
                <p className="text-sm text-red-600 font-medium">
                  Este processo é de um imóvel "Novo". É obrigatório selecionar uma construtora para
                  avançar.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Enviar para triagem CCA</DialogTitle>
              <DialogDescription>Confirma a ação Enviar para triagem CCA?</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              {selectedCompanyObj ? (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Construtora: <strong>{selectedCompanyObj.name}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Continuando sem vincular uma construtora.</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmStep(false)} disabled={submitting}>
                Voltar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={submitting || (isNovo && !selectedCompanyObj)}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
            {isNovo && !selectedCompanyObj && (
              <div className="px-6 pb-4">
                <p className="text-sm text-red-600 font-medium">
                  Este processo é de um imóvel "Novo". É obrigatório selecionar uma construtora para
                  confirmar.
                </p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
