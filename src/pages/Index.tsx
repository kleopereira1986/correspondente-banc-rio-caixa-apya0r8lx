import { useAuth, Role } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Landmark, ShieldCheck } from 'lucide-react'

export default function Index() {
  const { login } = useAuth()

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
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@exemplo.com.br"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <a href="#" className="text-sm font-medium text-primary hover:underline">
                      Esqueceu a senha?
                    </a>
                  </div>
                  <Input id="password" type="password" placeholder="••••••••" className="h-11" />
                </div>
                <Button
                  className="w-full h-11 text-base font-semibold shadow-md"
                  onClick={() => login('master')}
                >
                  Entrar
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-medium">
                    Acesso Rápido (Demonstração)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="border-primary/20 hover:bg-primary/5 hover:text-primary"
                  onClick={() => login('master')}
                >
                  Master
                </Button>
                <Button
                  variant="outline"
                  className="border-primary/20 hover:bg-primary/5 hover:text-primary"
                  onClick={() => login('analyst')}
                >
                  Analista
                </Button>
                <Button
                  variant="outline"
                  className="border-secondary/30 hover:bg-secondary/10 hover:text-secondary-foreground"
                  onClick={() => login('buyer')}
                >
                  Comprador
                </Button>
                <Button
                  variant="outline"
                  className="border-secondary/30 hover:bg-secondary/10 hover:text-secondary-foreground"
                  onClick={() => login('seller')}
                >
                  Vendedor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
