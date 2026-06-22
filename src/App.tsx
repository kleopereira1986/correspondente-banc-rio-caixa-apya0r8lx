import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/auth-context'
import Layout from './components/Layout'
import Index from './pages/Index'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import CustomerPortal from './pages/CustomerPortal'
import ProcessDetail from './pages/ProcessDetail'
import PendingApproval from './pages/PendingApproval'
import PublicOnboarding from './pages/PublicOnboarding'
import Tasks from './pages/Tasks'
import TaskDetail from './pages/TaskDetail'
import NotFound from './pages/NotFound'
import Users from './pages/Users'
import BrokerProcesses from './pages/BrokerProcesses'
import AgencyDashboard from './pages/AgencyDashboard'
import AgencyBrokers from './pages/AgencyBrokers'
import AgencyProcesses from './pages/AgencyProcesses'
import ConfigCreditAnalysis from './pages/ConfigCreditAnalysis'
import EngineeringRequest from './pages/EngineeringRequest'
import PublicEngineeringRequest from './pages/PublicEngineeringRequest'
import EngineeringRequestsList from './pages/EngineeringRequestsList'
import PublicEngineeringStatus from './pages/PublicEngineeringStatus'
import HousingKanban from './pages/HousingKanban'
import ConfigHousingStages from './pages/ConfigHousingStages'
import PublicHousingStatus from './pages/PublicHousingStatus'
import PublicConstructionDashboard from './pages/PublicConstructionDashboard'
import ConfigRejectionReasons from './pages/ConfigRejectionReasons'
import CreditAnalysis from './pages/CreditAnalysis'
import ConfigCaptureLink from './pages/ConfigCaptureLink'
import TestingTools from './pages/TestingTools'
import RgExtraction from './pages/RgExtraction'
import GenerateLink from './pages/GenerateLink'
import PublicForm from './pages/PublicForm'
import ConstructionCompanies from './pages/ConstructionCompanies'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/public/onboarding/:id" element={<PublicOnboarding />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/public/solicitacao-engenharia" element={<PublicEngineeringRequest />} />
          <Route path="/consultar-engenharia/:id" element={<PublicEngineeringStatus />} />
          <Route path="/public/housing/:id" element={<PublicHousingStatus />} />
          <Route path="/public/construtora/:id" element={<PublicConstructionDashboard />} />
          <Route path="/formulario" element={<PublicForm />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/credit-analysis" element={<CreditAnalysis />} />
            <Route path="/portal" element={<CustomerPortal />} />
            <Route path="/process/:id" element={<ProcessDetail />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/users" element={<Users />} />
            <Route path="/broker-processes" element={<BrokerProcesses />} />
            <Route path="/agency/dashboard" element={<AgencyDashboard />} />
            <Route path="/agency/brokers" element={<AgencyBrokers />} />
            <Route path="/agency/processes" element={<AgencyProcesses />} />
            <Route path="/config/credit-analysis" element={<ConfigCreditAnalysis />} />
            <Route path="/config/housing-stages" element={<ConfigHousingStages />} />
            <Route path="/config/rejection-reasons" element={<ConfigRejectionReasons />} />
            <Route path="/config/capture-link" element={<ConfigCaptureLink />} />
            <Route path="/housing-kanban" element={<HousingKanban />} />
            <Route path="/engineering-request" element={<EngineeringRequest />} />
            <Route path="/engineering-requests-list" element={<EngineeringRequestsList />} />
            <Route path="/emissao-ficha-rg" element={<RgExtraction />} />
            <Route path="/testing-tools" element={<TestingTools />} />
            <Route path="/gerar-link" element={<GenerateLink />} />
            <Route path="/construction-companies" element={<ConstructionCompanies />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
