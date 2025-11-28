import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Home, 
  Briefcase, 
  MessageSquare, 
  CreditCard, 
  User, 
  LogOut,
  Settings,
  FileText,
  Users,
  Mail,
  Package,
  BarChart3
} from 'lucide-react'

// Client navigation items
const clientNavigation = [
  { name: 'Πίνακας Ελέγχου', href: '/', icon: Home },
  { name: 'Τα Περιουσιακά Μου', href: '/assets', icon: Briefcase },
  { name: 'Οι Υπηρεσίες Μου', href: '/services', icon: Settings },
  { name: 'Τα Εισιτήρια Μου', href: '/tickets', icon: MessageSquare },
  { name: 'Η Χρέωση Μου', href: '/billing', icon: CreditCard },
  { name: 'Προφίλ', href: '/profile', icon: User },
]

// Super Admin navigation items
const superAdminNavigation = [
  { name: 'Επισκόπηση', href: '/admin', icon: BarChart3 },
  { name: 'Διαχείριση Πελατών', href: '/admin/clients', icon: Users },
  { name: 'Διαχείριση Περιουσιακών', href: '/admin/assets', icon: Briefcase },
  { name: 'Χρέωση & Έσοδα', href: '/admin/billing', icon: CreditCard },
  { name: 'Εισιτήρια Υποστήριξης', href: '/admin/tickets', icon: MessageSquare },
  { name: 'Πρότυπα Email', href: '/admin/templates', icon: Mail },
  { name: 'Διαχείριση Πακέτων', href: '/admin/packages', icon: Package },
  { name: 'Ρυθμίσεις Συστήματος', href: '/admin/settings', icon: Settings },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
  }

  // Determine which navigation to show
  const isSuperAdmin = user?.admin_role === 'super_admin'
  const navigation = isSuperAdmin ? superAdminNavigation : clientNavigation

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-slate-200 bg-white">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              {isSuperAdmin ? 'Super Admin Portal' : 'Kubik Portal'}
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto scrollbar-thin">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-slate-200 p-4 bg-white">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-slate-700">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-500">
                  {isSuperAdmin ? 'Super Admin' : 'Πελάτης'} • {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Αποσύνδεση
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
} 