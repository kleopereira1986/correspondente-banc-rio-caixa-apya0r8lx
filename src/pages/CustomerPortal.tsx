import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  UploadCloud,
  FileCheck,
  FileX,
  File,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import { mockDocuments } from '@/lib/data'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function CustomerPortal() {
  const { toast } = useToast()

  // Simulate status
  const currentStep = 2 // 1: Enviado, 2: Em Análise/Pendente, 3: Concluído
  const isPending = true

  const handleUpload = () => {
    toast({
      title: 'Documento recebido',
      description: 'O arquivo foi enviado para análise com sucesso.',
      variant: 'default',
    })
  }

  const steps = [
    { id: 1, name: 'Envio de Dados', active: true, completed: true },
    { id: 2, name: 'Análise de Crédito', active: true, completed: false },
    { id: 3, name: 'Aprovação Final', active: false, completed: false },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Meu Processo Imobiliário
        </h1>
        <p className="text-muted-foreground mt-1">Acompanhe o andamento da sua avaliação.</p>
      </div>

      {isPending && (
        <Alert className="border-secondary/50 bg-secondary/5 text-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
          <AlertTriangle className="h-5 w-5 text-secondary" />
          <AlertTitle className="text-secondary font-bold text-base">
            Ação Necessária: Pendência Encontrada
          </AlertTitle>
          <AlertDescription className="mt-2 text-sm leading-relaxed">
            O analista solicitou uma atualização nos seus documentos. Verifique a lista abaixo,
            anexe o documento correto e reenvie para dar continuidade ao processo.
            <br />
            <strong className="block mt-2 font-medium">
              Motivo: "O comprovante de renda anexado está ilegível. Por favor, envie uma cópia mais
              nítida dos últimos 3 holerites."
            </strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Stepper */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-500 rounded-full"
              style={{ width: '50%' }}
            ></div>

            {steps.map((step, idx) => (
              <div key={step.id} className="flex flex-col items-center gap-3 bg-white px-2">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors',
                    step.completed
                      ? 'bg-primary border-primary text-white'
                      : step.active
                        ? 'bg-white border-primary text-primary shadow-[0_0_0_4px_rgba(0,92,169,0.1)]'
                        : 'bg-white border-slate-200 text-slate-400',
                  )}
                >
                  {step.completed ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <span
                  className={cn(
                    'text-xs sm:text-sm font-medium text-center max-w-[100px]',
                    step.active ? 'text-slate-800' : 'text-slate-400',
                  )}
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Upload Area */}
        <Card className="md:col-span-1 shadow-sm border-border/50 h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Enviar Documento</CardTitle>
            <CardDescription>Selecione ou arraste o arquivo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-slate-50 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG ou PNG (Max. 5MB)</p>
              </div>
              <Button onClick={handleUpload} size="sm" className="mt-2 w-full">
                Selecionar Arquivo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="md:col-span-2 shadow-sm border-border/50">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-lg">Meus Documentos</CardTitle>
            <CardDescription>Documentos anexados a este processo</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {mockDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 flex items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'p-2 rounded-lg shrink-0',
                        doc.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-600'
                          : doc.status === 'pending'
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-blue-100 text-blue-600',
                      )}
                    >
                      {doc.status === 'approved' ? (
                        <FileCheck className="w-5 h-5" />
                      ) : doc.status === 'pending' ? (
                        <FileX className="w-5 h-5" />
                      ) : (
                        <File className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-800">{doc.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Enviado em 24/10/2023</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {doc.status === 'approved' && (
                      <Badge
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 bg-emerald-50"
                      >
                        Válido
                      </Badge>
                    )}
                    {doc.status === 'pending' && (
                      <Badge
                        variant="outline"
                        className="text-secondary border-secondary/30 bg-secondary/5 font-semibold"
                      >
                        Atualizar
                      </Badge>
                    )}
                    {doc.status === 'review' && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                        Em Análise
                      </Badge>
                    )}

                    {doc.status === 'pending' && (
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary">
                        Substituir arquivo <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
