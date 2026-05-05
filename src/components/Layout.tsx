import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Bell,
  LayoutDashboard,
  FolderOpen,
  Users,
  FileText,
  UploadCloud,
  LifeBuoy,
  LogOut,
  User,
  Landmark,
  Settings,
  HardHat,
} from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  // Do not show layout on login page
  if (!user || location.pathname === '/') {
    return <Outlet />
  }

  const isInternal = user.role === 'master' || user.role === 'analyst'
  const isBroker = user.role === 'broker'

  let navItems = []
  if (isInternal) {
    navItems = [
      { title: 'Painel de Controle', url: '/dashboard', icon: LayoutDashboard },
      { title: 'Processos', url: '/dashboard', icon: FolderOpen },
      { title: 'Tarefas', url: '/tasks', icon: FileText },
      { title: 'Clientes', url: '#', icon: Users },
      { title: 'Solicitar Engenharia', url: '/engineering-request', icon: HardHat },
      ...(user.role === 'master'
        ? [
            { title: 'Usuários', url: '/users', icon: Users },
            { title: 'Configurações de Crédito', url: '/config/credit-analysis', icon: Settings },
          ]
        : []),
      { title: 'Relatórios', url: '#', icon: FileText },
    ]
  } else if (isBroker) {
    navItems = [
      { title: 'Painel do Corretor', url: '/dashboard', icon: LayoutDashboard },
      { title: 'Minhas Solicitações', url: '/tasks', icon: FileText },
      { title: 'Meus Processos', url: '/broker-processes', icon: FolderOpen },
    ]
  } else {
    navItems = [
      { title: 'Meu Processo', url: '/portal', icon: FolderOpen },
      { title: 'Enviar Documentos', url: '/portal', icon: UploadCloud },
      { title: 'Suporte', url: '#', icon: LifeBuoy },
    ]
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background animate-fade-in">
        <Sidebar className="border-r border-border/50 shadow-sm">
          <SidebarHeader className="h-16 flex items-center px-4 pt-4 pb-2 border-b border-border/50">
            <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
              <div className="bg-primary text-white p-1.5 rounded-md">
                <Landmark size={20} />
              </div>
              CCA Digital
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/50">
            <div className="text-xs text-muted-foreground text-center">CCA Digital v1.0</div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 w-full overflow-hidden">
          <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-border/50 shadow-sm sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
              <h2 className="font-semibold text-lg text-slate-800 hidden sm:block">
                {isInternal
                  ? 'Área do Correspondente'
                  : isBroker
                    ? 'Portal do Parceiro'
                    : 'Portal do Cliente'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-slate-100">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full animate-pulse-status"></span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <div className="flex items-center gap-2 hover:bg-slate-50 p-1 pr-3 rounded-full transition-colors border border-transparent hover:border-border/50">
                    <Avatar className="w-8 h-8 border border-primary/20">
                      <AvatarImage
                        src={`https://img.usecurling.com/ppl/thumbnail?seed=${user.id}`}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start hidden sm:flex">
                      <span className="text-sm font-medium leading-none text-slate-800">
                        {user.name.split(' ')[0]}
                      </span>
                      <span className="text-xs text-muted-foreground leading-none mt-1 capitalize">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 animate-in slide-in-from-top-2">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" /> Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
