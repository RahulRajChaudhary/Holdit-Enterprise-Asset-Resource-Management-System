import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Departments from './pages/admin/Departments'
import Categories from './pages/admin/Categories'
import EmployeeDirectory from './pages/admin/EmployeeDirectory'
import AssetList from './pages/assets/AssetList'
import AssetRegister from './pages/assets/AssetRegister'
import AssetDetail from './pages/assets/AssetDetail'
import AllocationWorkspace from './pages/allocations/AllocationWorkspace'
import ResourceBooking from './pages/bookings/ResourceBooking'
import MaintenanceBoard from './pages/maintenance/MaintenanceBoard'
import AuditCycles from './pages/audit/AuditCycles'
import ActivityFeed from './pages/notifications/ActivityFeed'
import ReportsPage from './pages/reports/ReportsPage'
import RequireRole from './components/RequireRole'
import RequireAuth from './components/RequireAuth'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <RequireRole roles={['ADMIN']}>
            <Departments />
          </RequireRole>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <RequireRole roles={['ADMIN']}>
            <Categories />
          </RequireRole>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <RequireRole roles={['ADMIN']}>
            <EmployeeDirectory />
          </RequireRole>
        }
      />
      <Route
        path="/assets"
        element={
          <RequireAuth>
            <AssetList />
          </RequireAuth>
        }
      />
      <Route
        path="/assets/new"
        element={
          <RequireRole roles={['ASSET_MANAGER']}>
            <AssetRegister />
          </RequireRole>
        }
      />
      <Route
        path="/assets/:id"
        element={
          <RequireAuth>
            <AssetDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/allocations"
        element={
          <RequireAuth>
            <AllocationWorkspace />
          </RequireAuth>
        }
      />
      <Route
        path="/bookings"
        element={
          <RequireAuth>
            <ResourceBooking />
          </RequireAuth>
        }
      />
      <Route
        path="/maintenance"
        element={
          <RequireAuth>
            <MaintenanceBoard />
          </RequireAuth>
        }
      />
      <Route
        path="/audits"
        element={
          <RequireAuth>
            <AuditCycles />
          </RequireAuth>
        }
      />
      <Route
        path="/notifications"
        element={
          <RequireAuth>
            <ActivityFeed />
          </RequireAuth>
        }
      />
      <Route
        path="/reports"
        element={
          <RequireAuth>
            <ReportsPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default App
