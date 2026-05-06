import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { resetSystemData } from '@/services/api'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TestingTools() {
  const [isResetting, setIsResetting] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await resetSystemData()
      toast({
        title: 'Sistema resetado com sucesso!',
        description: 'Todos os dados de teste foram apagados.',
      })
      navigate('/dashboard')
    } catch (e) {
      toast({
        title: 'Erro ao resetar sistema',
        description: 'Não foi possível limpar os dados.',
        variant: 'destructive',
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Ferramentas de Teste</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie o estado do sistema durante o período de homologação.
        </p>
      </div>

      <Card className="border-red-200 bg-red-50/30">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam toda a base de dados. Use com extremo cuidado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-200 bg-white rounded-lg">
            <div>
              <h4 className="font-semibold text-slate-800">Resetar Dados do Sistema</h4>
              <p className="text-sm text-slate-600 mt-1">
                Apaga todos os processos, documentos, tarefas e avaliações. Mantém usuários e
                configurações.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="shrink-0" disabled={isResetting}>
                  {isResetting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Zerar Sistema
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Zerar Dados do Sistema?</AlertDialogTitle>
                  <AlertDialogDescription className="text-red-600 font-medium">
                    Tem certeza que deseja zerar todas as informações do sistema? Esta ação é
                    irreversível e apagará todos os processos, documentos e tarefas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isResetting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault()
                      handleReset()
                    }}
                    disabled={isResetting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isResetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Sim, Resetar Sistema
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
