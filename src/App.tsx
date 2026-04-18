import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/auth-context'
import Layout from './components/Layout'
import Index from './pages/Index'
import Dashboard from './pages/Dashboard'
import CustomerPortal from './pages/CustomerPortal'
import ProcessDetail from './pages/ProcessDetail'
import PublicOnboarding from './pages/PublicOnboarding'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/public/onboarding/:id" element={<PublicOnboarding />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portal" element={<CustomerPortal />} />
            <Route path="/process/:id" element={<ProcessDetail />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
