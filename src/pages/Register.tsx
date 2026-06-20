import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Landmark, ShieldCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Link, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function Register() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    passwordConfirm: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)

    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`
    }
    if (value.length > 10) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`
    }
    handleChange('phone', value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.role ||
      !formData.password ||
      !formData.passwordConfirm
    ) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      setErrors((prev) => ({ ...prev, passwordConfirm: 'As senhas não coincidem.' }))
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      await pb.collection('users').create({
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        is_approved: false,
      })

      toast({
        title: 'Sucesso!',
        description:
          'Solicitação de cadastro enviada com sucesso! Aguarde a aprovação de um administrador.',
      })
      navigate('/')
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
        toast({
          title: 'Erro de validação',
          description: 'Verifique os campos destacados no formulário.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erro',
          description: error?.message || 'Ocorreu um erro ao processar seu cadastro.',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
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

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in-up py-8">
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
                Solicitar Cadastro
              </CardTitle>
              <CardDescription className="text-center text-base">
                Preencha os dados abaixo para solicitar acesso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    className="h-11"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@exemplo.com.br"
                    className="h-11"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    className="h-11"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Perfil de Acesso</Label>
                  <Select value={formData.role} onValueChange={(val) => handleChange('role', val)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="analyst">Analista</SelectItem>
                      <SelectItem value="buyer">Comprador</SelectItem>
                      <SelectItem value="seller">Vendedor</SelectItem>
                      <SelectItem value="broker">Corretor</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-11"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                    />
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordConfirm">Confirmar Senha</Label>
                    <Input
                      id="passwordConfirm"
                      type="password"
                      placeholder="••••••••"
                      className="h-11"
                      value={formData.passwordConfirm}
                      onChange={(e) => handleChange('passwordConfirm', e.target.value)}
                    />
                    {errors.passwordConfirm && (
                      <p className="text-sm text-red-500">{errors.passwordConfirm}</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                    {loading ? 'Enviando...' : 'Solicitar Cadastro'}
                  </Button>

                  <div className="text-center">
                    <Link to="/">
                      <Button
                        variant="link"
                        className="text-slate-500 hover:text-slate-800"
                        type="button"
                      >
                        Já tenho uma conta? Entrar
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
