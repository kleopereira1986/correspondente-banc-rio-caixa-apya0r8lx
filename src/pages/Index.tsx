import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Landmark, ShieldCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'

export default function Index() {
  const { login } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({ title: 'Erro', description: 'Preencha email e senha.', variant: 'destructive' })
      return
    }
    setLoading(true)
    const { error } = await login(email, password)
    setLoading(false)
    if (error) {
      toast({
        title: 'Erro',
        description: 'Credenciais inválidas ou pendente de aprovação.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-primary relative overflow-hidden flex-col justify-center p-12 text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('https://img.usecurling.com/p/800/1200?q=modern%20architecture')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent"></div>

        <div className="relative z-10 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-8 backdrop-blur-sm border border-white/30">
            <ShieldCheck size={20} className="text-secondary" />
            <span className="font-medium tracking-wide text-sm">Ambiente Seguro</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
            Gestão inteligente para correspondentes
          </h1>
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            O CCA Digital simplifica a avaliação de crédito e gestão de documentos imobiliários,
            conectando analistas, compradores e vendedores em uma única plataforma ágil e segura.
          </p>
        </div>
      </div>

      {/* Right side - Login */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="flex justify-center mb-8 md:hidden">
            <div className="flex items-center gap-2 text-primary font-bold text-2xl">
              <div className="bg-primary text-white p-2 rounded-lg">
                <Landmark size={28} />
              </div>
              CCA Digital
            </div>
          </div>

          <Card className="border-border/60 shadow-elevation">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="text-2xl text-center text-slate-800">
                Acesso à Plataforma
              </CardTitle>
              <CardDescription className="text-center text-base">
                Insira suas credenciais para continuar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nome@exemplo.com.br"
                      className="h-11"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>

                  <div className="text-center pt-2">
                    <Link to="/register" className="w-full block">
                      <Button
                        variant="outline"
                        className="w-full h-11 text-base font-medium border-primary/20 text-primary hover:bg-primary/5"
                        type="button"
                      >
                        FAÇA SEU CADASTRO
                      </Button>
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
