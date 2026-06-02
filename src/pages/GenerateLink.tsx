import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, CheckCircle2, ExternalLink, Share2 } from 'lucide-react'
import { toast } from 'sonner'

export default function GenerateLink() {
  const { user } = useAuth()
  const [type, setType] = useState('credit-analysis')
  const [correspondente, setCorrespondente] = useState('CAPITAL CREDITO')
  const [copied, setCopied] = useState(false)

  const generatedLink = `${window.location.origin}/formulario?correspondente=${encodeURIComponent(correspondente)}&usuario=${user?.id || ''}&form=${type}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      toast.success('Link copiado para a área de transferência!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Erro ao copiar o link.')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Formulário de Cadastro',
          text: 'Preencha seus dados para iniciarmos o seu processo.',
          url: generatedLink,
        })
      } catch (err) {
        // Ignore AbortError when user closes share sheet
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Gerar Link de Captação</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Crie um link personalizado para enviar aos seus clientes e captar novos processos
          automaticamente.
        </p>
      </div>

      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/50"></div>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Configuração do Link</CardTitle>
          <CardDescription>
            Selecione o tipo de processo que será iniciado quando o cliente preencher o formulário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-3">
              <Label className="text-slate-700">Nome do Correspondente</Label>
              <Input
                value={correspondente}
                onChange={(e) => setCorrespondente(e.target.value)}
                className="h-11"
                placeholder="Ex: CAPITAL CREDITO"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-slate-700">Formulário</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit-analysis">Solicitação de Crédito</SelectItem>
                  <SelectItem value="housing">Processo Habitacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <Label className="text-slate-700 flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Seu Link Exclusivo
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                readOnly
                value={generatedLink}
                className="bg-white font-medium text-slate-600 h-12 focus-visible:ring-0"
              />
              <div className="flex gap-2 shrink-0">
                <Button onClick={handleCopy} className="h-12 w-full sm:w-32 transition-all">
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
                <Button
                  onClick={handleShare}
                  variant="secondary"
                  className="h-12 w-12 sm:hidden px-0"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              Este link contém o seu código de identificação único. Os clientes que se cadastrarem
              através dele serão vinculados e atribuídos automaticamente à sua carteira.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button variant="outline" asChild className="w-full sm:w-auto h-11">
              <a href={generatedLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Visualizar Formulário Público
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
