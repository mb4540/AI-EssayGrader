import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './pages/Dashboard'
import Submission from './pages/Submission'
import Help from './pages/Help'
import BridgeManager from './components/bridge/BridgeManager'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/submission/:id?" element={<Submission />} />
          <Route path="/bridge" element={<BridgeManager />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
