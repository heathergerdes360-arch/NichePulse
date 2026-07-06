import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import LaunchAssets from './pages/LaunchAssets'
import MockCheckout from './pages/MockCheckout'
import Settings from './pages/Settings'
import Archive from './pages/Archive'
import ArchiveDetail from './pages/ArchiveDetail'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import Success from './pages/Success'
import Pro from './pages/Pro'
import Tracker from './components/Tracker'

function App() {
  return (
    <BrowserRouter>
      <Tracker />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/launch-assets" element={<LaunchAssets />} />
        <Route path="/mock-checkout" element={<MockCheckout />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/archive/:id" element={<ArchiveDetail />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/success" element={<Success />} />
        <Route path="/pro" element={<Pro />} />
        {/* Fallback to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>\n    </BrowserRouter>
  )
}
export default App
