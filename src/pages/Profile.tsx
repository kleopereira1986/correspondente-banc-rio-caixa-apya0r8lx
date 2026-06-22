import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const profileSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
  cpf: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function Profile() {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      cpf: user?.cpf || '',
    },
  })

  if (!user) return null

  const currentAvatarUrl = user.avatar
    ? pb.files.getURL(user as any, user.avatar, { thumb: '200x200' })
    : `https://img.usecurling.com/ppl/medium?seed=${user.id}`

  const displayAvatar = avatarPreview || currentAvatarUrl

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida (JPG, PNG, WEBP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.')
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSaving(true)
      const formData = new FormData()
      formData.append('name', data.name)

      if (data.phone) formData.append('phone', data.phone)
      if (data.cpf) formData.append('cpf', data.cpf)

      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      const updatedRecord = await pb.collection('users').update(user.id, formData)

      // Update the local auth store to refresh the layout and context automatically
      pb.authStore.save(pb.authStore.token, updatedRecord)

      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao atualizar o perfil. Verifique os dados e tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e foto de perfil.
        </p>
      </div>

      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize sua foto e seus dados cadastrais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start p-4 bg-slate-50/50 rounded-lg border border-slate-100">
              <div className="relative group">
                <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white shadow-md">
                  <AvatarImage src={displayAvatar} className="object-cover" />
                  <AvatarFallback className="text-3xl uppercase font-semibold">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="text-white w-8 h-8" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left flex-1">
                <h3 className="font-medium text-slate-800 text-lg">Foto de Perfil</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto sm:mx-0">
                  Recomendamos uma imagem quadrada. O tamanho máximo permitido é de 5MB. Formatos
                  aceitos: JPG, PNG ou WEBP.
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="shadow-sm"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Alterar Foto
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" value={user.email} disabled className="bg-slate-100/50" />
                <p className="text-xs text-muted-foreground">
                  O endereço de e-mail não pode ser alterado por aqui.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" {...form.register('cpf')} placeholder="000.000.000-00" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" {...form.register('phone')} placeholder="(00) 00000-0000" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t pt-6 bg-slate-50/50 rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset()
                setAvatarFile(null)
                setAvatarPreview(null)
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
