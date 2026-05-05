import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Landmark, Download, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function PublicEngineeringStatus() {
  const { id } = useParams()
  const [request, setRequest] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaid, setIsPaid] = useState(false)
  const [paymentDate, setPaymentDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!id) return
    pb.collection('engineering_requests')
      .getOne(id)
      .then((data) => {
        setRequest(data)
        setIsPaid(data.is_paid || false)
        setPaymentDate(data.payment_date ? data.payment_date.split('T')[0] : '')
      })
      .catch(() => {
        toast({ title: 'Erro', description: 'Solicitação não encontrada.', variant: 'destructive' })
      })
      .finally(() => setIsLoading(false))
  }, [id, toast])

  const handleConfirmPayment = async () => {
    if (!isPaid || !paymentDate) {
      toast({
        title: 'Atenção',
        description: 'Informe a data de pagamento.',
        variant: 'destructive',
      })
      return
    }
    setIsSubmitting(true)
    try {
      const updated = await pb.collection('engineering_requests').update(id!, {
        is_paid: true,
        payment_date: new Date(paymentDate).toISOString(),
      })
      setRequest(updated)
      toast({ title: 'Sucesso', description: 'Pagamento confirmado!' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível confirmar o pagamento.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">Carregando...</div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        Solicitação não encontrada.
      </div>
    )
  }

  const boletoUrl = request.boleto_file ? pb.files.getURL(request, request.boleto_file) : null
  const showBoleto =
    request.status === 'boleto_issued' ||
    request.status === 'engineer_requested' ||
    request.status === 'in_evaluation' ||
    request.status === 'completed'

  const statusMap: Record<string, string> = {
    pending_analysis: 'PENDENTE ANÁLISE',
    in_progress: 'EM ANÁLISE',
    boleto_issued: 'BOLETO EMITIDO',
    engineer_requested: 'AVALIAÇÃO EM ANDAMENTO',
    in_evaluation: 'AVALIAÇÃO EM ANDAMENTO',
    completed: 'AVALIAÇÃO FINALIZADA',
  }

  const displayStatus =
    statusMap[request.status] || request.status?.toUpperCase() || 'PENDENTE ANÁLISE'

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="h-16 flex items-center px-4 sm:px-6 bg-white border-b border-border/50 shadow-sm sticky top-0 z-10 mb-8">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <div className="bg-primary text-white p-1.5 rounded-md">
              <Landmark size={20} />
            </div>
            CCA Digital
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 space-y-6 animate-in fade-in duration-300">
        <Card>
          <CardHeader>
            <CardTitle>Status da Solicitação de Engenharia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block">Solicitante</span>
                <span className="font-medium text-slate-800">{request.requester_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Data da Solicitação</span>
                <span className="font-medium text-slate-800">
                  {format(new Date(request.created), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Atual</span>
                <span className="font-bold text-primary uppercase">{displayStatus}</span>
              </div>
            </div>

            {showBoleto && (
              <div className="border-t pt-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="text-blue-800 mb-4 sm:mb-0">
                    <h3 className="font-semibold">Boleto Disponível</h3>
                    <p className="text-sm text-blue-600">
                      Baixe o boleto para pagamento da taxa de engenharia.
                    </p>
                  </div>
                  {boletoUrl && (
                    <Button asChild>
                      <a href={boletoUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" /> Baixar Boleto
                      </a>
                    </Button>
                  )}
                </div>

                {!request.is_paid && request.status === 'boleto_issued' && (
                  <div className="bg-slate-50 p-6 rounded-lg border space-y-4">
                    <h3 className="font-semibold text-slate-800">Confirmação de Pagamento</h3>
                    <div className="flex items-center space-x-2">
                      <Switch id="paid" checked={isPaid} onCheckedChange={setIsPaid} />
                      <Label htmlFor="paid" className="font-medium">
                        BOLETO PAGO?
                      </Label>
                    </div>
                    {isPaid && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label>DATA DE PAGAMENTO:</Label>
                        <Input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="max-w-[200px]"
                        />
                      </div>
                    )}
                    <Button
                      onClick={handleConfirmPayment}
                      disabled={isSubmitting || !isPaid || !paymentDate}
                      className="mt-4"
                    >
                      Confirmar Pagamento
                    </Button>
                  </div>
                )}

                {request.is_paid && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">
                      Pagamento confirmado em {format(new Date(request.payment_date), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {(request.status === 'engineer_requested' ||
              request.status === 'in_evaluation' ||
              request.status === 'completed') &&
              request.engineer_name && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-slate-800 mb-4">
                    Empresa Contratada / Engenharia
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-lg border">
                    <div>
                      <span className="text-slate-500 text-sm block">Dados da Empresa</span>
                      <span className="font-medium">{request.engineer_name}</span>
                    </div>
                  </div>
                </div>
              )}

            {request.status === 'completed' && request.evaluation_value && (
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold text-slate-800">Resultado da Avaliação</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <span className="text-slate-500 text-sm block mb-1">Valor da Avaliação</span>
                    <span className="text-xl font-bold text-green-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(request.evaluation_value)}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <span className="text-slate-500 text-sm block mb-1">Status do Laudo</span>
                    {request.report_status === 'valid' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Válido
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        Inválido
                      </span>
                    )}
                  </div>
                  {request.report_status === 'invalid' && request.non_conformity_notes && (
                    <div className="sm:col-span-2 bg-red-50 p-4 rounded-lg border border-red-100">
                      <span className="text-red-800 text-sm font-semibold block mb-1">
                        Observações de Não Conformidade
                      </span>
                      <p className="text-red-700 text-sm whitespace-pre-wrap">
                        {request.non_conformity_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
