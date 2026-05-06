import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Landmark, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

export default function PublicHousingStatus() {
  const { id } = useParams()
  const [process, setProcess] = useState<any>(null)
  const [stages, setStages] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      pb.collection('processes')
        .getOne(id, { expand: 'buyer' })
        .then((res) => setProcess(res))
        .catch(() => setError('Processo não encontrado.'))

      pb.collection('housing_stages')
        .getFullList({ sort: 'order' })
        .then(setStages)
        .catch(console.error)

      pb.collection('process_logs')
        .getFullList({ filter: `process="${id}"`, sort: 'created' })
        .then(setLogs)
        .catch(console.error)
    }
  }, [id])

  if (error)
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 min-h-screen flex items-center justify-center font-semibold">
        {error}
      </div>
    )
  if (!process || stages.length === 0)
    return (
      <div className="p-8 text-center animate-pulse min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Landmark className="w-8 h-8 animate-bounce" />
          <p>Carregando processo habitacional...</p>
        </div>
      </div>
    )

  const isCompleted = process.status === 'Concluído' || process.status === 'Finalizado'

  const currentStepName = process.current_step || 'Documentação'
  let currentIndex = stages.findIndex((s) => s.name === currentStepName)
  if (currentIndex === -1) currentIndex = 0
  if (isCompleted) currentIndex = stages.length - 1

  const progressPercentage =
    stages.length > 1 ? Math.round((currentIndex / (stages.length - 1)) * 100) : 0

  const getStageDate = (stageName: string) => {
    const log = logs.find((l) => l.to_step === stageName)
    if (log) return new Date(log.created).toLocaleDateString('pt-BR')
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-start sm:items-center justify-center p-4 py-8 font-sans">
      <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center pb-6 border-b border-slate-100">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <Landmark className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800">
            Acompanhamento Habitacional
          </CardTitle>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">
            Status da documentação e contratos
          </p>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-primary" />
            <Badge
              className={cn(
                'text-base py-1.5 px-4 border-none shadow-sm rounded-full',
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
            <p className="text-xs text-muted-foreground mt-4 font-mono">ID: {process.id}</p>
            <p className="text-lg font-bold mt-1 text-slate-800 uppercase">
              {process.expand?.buyer?.name}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end mb-2">
              <h3 className="font-semibold text-slate-700 text-lg">Etapa Atual</h3>
              <span className="font-bold text-primary text-xl">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          <div className="space-y-6 pt-4 relative">
            <h3 className="font-semibold text-slate-700 text-lg mb-4">Linha do Tempo</h3>
            <div className="absolute left-[27px] top-[70px] bottom-[30px] w-0.5 bg-slate-200"></div>

            <div className="space-y-6 relative z-10">
              {stages.map((stage, idx) => {
                const isCompletedStage = idx <= currentIndex
                const isCurrentStage = idx === currentIndex && !isCompleted
                const stageDate = getStageDate(stage.name)

                return (
                  <div key={stage.id} className="flex gap-4">
                    <div className="shrink-0 flex flex-col items-center mt-0.5">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white',
                          isCompletedStage && !isCurrentStage
                            ? 'border-emerald-500 text-emerald-500'
                            : isCurrentStage
                              ? 'border-primary text-primary shadow-[0_0_0_4px_rgba(59,130,246,0.1)]'
                              : 'border-slate-300 text-slate-300',
                        )}
                      >
                        {isCompletedStage && !isCurrentStage ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isCurrentStage ? (
                          <Clock className="w-4 h-4 animate-pulse" />
                        ) : (
                          <Circle className="w-3 h-3 fill-current" />
                        )}
                      </div>
                    </div>
                    <div
                      className={cn('flex-1 pb-1', isCompletedStage ? 'opacity-100' : 'opacity-60')}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                        <h4
                          className={cn(
                            'font-semibold text-base',
                            isCompletedStage ? 'text-slate-800' : 'text-slate-500',
                          )}
                        >
                          {stage.name}
                        </h4>
                        {stageDate && (
                          <span className="text-xs text-slate-500 font-medium sm:ml-4 bg-slate-100 px-2 py-0.5 rounded-md w-fit mt-1 sm:mt-0">
                            {stageDate}
                          </span>
                        )}
                      </div>

                      {isCurrentStage && process.status === 'Pendência' && (
                        <div className="mt-3 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-md shadow-sm">
                          <p className="text-sm text-red-800 font-medium">Ação Necessária</p>
                          <p className="text-sm text-red-700 mt-1">{process.observations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-8 border-t border-slate-100">
            Em caso de dúvidas, entre em contato com seu correspondente ou corretor.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
