import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Heart,
  Building2,
  Settings,
  LogOut,
  ChevronDown,
  FileText,
  Receipt,
  Medal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/ui/mode-toggle"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { currentUser, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  // Get user's initials for avatar fallback
  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Fixed Sidebar - using sticky position for better compatibility */}
      <aside className="w-64 sticky top-0 h-screen bg-card border-r border-border flex flex-col overflow-y-auto z-10">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link to="/" className="flex items-center">
            <span className="font-bold text-xl">ClearGive</span>
          </Link>
          <ModeToggle />
        </div>

        {/* User Profile Section */}
        <div className="border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full p-8 flex items-center justify-between hover:bg-muted">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={currentUser?.photoURL || ''} />
                    <AvatarFallback>{currentUser?.email ? getInitials(currentUser.email) : 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">{currentUser?.displayName || currentUser?.email?.split('@')[0]}</p>
                    <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 p-4">
          <Link
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-muted"
            to="/dashboard"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-muted"
            to="/dashboard/donations"
          >
            <Heart className="h-4 w-4" />
            Donations
          </Link>
          <Link
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-muted"
            to="/dashboard/charities"
          >
            <Building2 className="h-4 w-4" />
            Charities
          </Link>
          <Link
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-muted"
            to="/dashboard/certificates"
          >
            <Medal className="h-4 w-4" />
            Certificates
          </Link>
          <Link
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-muted"
            to="/dashboard/tax-reporting"
          >
            <Receipt className="h-4 w-4" />
            Tax Reporting
          </Link>
          <Link
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-muted"
            to="/dashboard/settings"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>

        {/* Logout Button */}
        <div className="mt-auto p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full flex items-center gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Main Content with proper padding to account for sidebar */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 