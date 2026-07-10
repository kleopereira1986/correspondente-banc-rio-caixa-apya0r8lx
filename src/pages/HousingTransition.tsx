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

  useEffect(() => {
    if (!isAuthorized) {
      navigate('/dashboard')
      return
    }
    pb.collection('construction_companies')
      .getFullList({ sort: 'name' })
      .then(setCompanies)
      .catch(() => {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as construtoras.',
          variant: 'destructive',
        })
      })
      .finally(() => setLoading(false))
  }, [isAuthorized, navigate, toast])

  const selectedCompanyObj = companies.find((c) => c.id === selectedCompany)

  const handleClose = () => {
    setOpen(false)
    navigate(-1)
  }

  const handleConfirm = async () => {
    if (!id || !selectedCompany) return
    setSubmitting(true)
    try {
      await updateProcess(id, {
        type: 'housing',
        current_step: 'Triagem CCA',
        status: 'Nova Solicitação',
        result: 'pending',
        construction_company: selectedCompany,
        last_updated_by: user?.id,
      })
      await pb
        .send('/backend/v1/process-logs/manual', {
          method: 'POST',
          body: JSON.stringify({
            process: id,
            note: 'Processo enviado para o Kanban Habitacional (Triagem CCA).',
          }),
          headers: { 'Content-Type': 'application/json' },
        })
        .catch(console.error)
      toast({
        title: 'Sucesso',
        description: 'Processo enviado para Kanban com sucesso!',
      })
      handleClose()
    } catch (err: any) {
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
              <DialogTitle>Vincular Construtora</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label className="text-sm font-medium">
                Selecione a construtora <span className="text-red-500">*</span>
              </Label>
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
              <Button
                onClick={() => selectedCompany && setConfirmStep(true)}
                disabled={!selectedCompany || submitting}
              >
                Avançar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirmação</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <p className="text-sm text-slate-700">
                Confirma o envio para kanban habitacional na etapa triagem cca?
              </p>
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
              <Button onClick={handleConfirm} disabled={submitting}>
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
