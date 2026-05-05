import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, MapPin, Building, Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PublicHousingStatus() {
  const { id } = useParams()
  const [process, setProcess] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      pb.collection('processes')
        .getOne(id, { expand: 'buyer' })
        .then((res) => setProcess(res))
        .catch(() => setError('Processo não encontrado.'))
    }
  }, [id])

  if (error) return <div className="p-8 text-center text-red-600 bg-red-50 h-screen">{error}</div>
  if (!process)
    return (
      <div className="p-8 text-center animate-pulse h-screen bg-slate-50">
        Carregando processo habitacional...
      </div>
    )

  const isCompleted = process.status === 'Finalizado'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-lg shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
            <Landmark className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            Acompanhamento Habitacional
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1">Status da documentação e contratos</p>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="bg-white border rounded-lg p-4 shadow-sm flex flex-col items-center">
            <Badge
              className={cn(
                'text-base py-1 px-3 border-none shadow-sm',
                isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800',
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <Clock className="w-4 h-4 mr-2 animate-pulse" />
              )}
              {process.status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-3">ID: {process.id}</p>
            <p className="text-sm font-medium mt-1">{process.expand?.buyer?.name}</p>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="font-semibold text-slate-700">Etapa Atual</h3>
            <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-md border border-slate-200">
              <MapPin className="text-primary w-5 h-5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-slate-800">
                  {process.current_step || 'Não iniciada'}
                </p>
                {process.status === 'Pendência' && (
                  <p className="text-xs text-red-600 mt-1 font-medium bg-red-50 p-1 rounded">
                    Ação Necessária: {process.observations}
                  </p>
                )}
              </div>
            </div>

            {process.boleto_sent_at && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md border border-blue-100 text-blue-800">
                <Building className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">
                  Boleto emitido em: {new Date(process.boleto_sent_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            {process.housing_finalized_at && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-md border border-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">
                  Processo Finalizado em:{' '}
                  {new Date(process.housing_finalized_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            Em caso de dúvidas, entre em contato com seu correspondente ou corretor.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
