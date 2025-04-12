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
import { useDonations } from '@/hooks/useDonations'
import { useEffect } from 'react'
import { ModeToggle } from '@/components/ui/mode-toggle'
import DashboardLayout from '@/components/DashboardLayout'
import DonorAnalytics from '@/components/DonorAnalytics'

export default function DashboardPage() {
  const { currentUser, logout } = useAuth()
  const { donations, loading, error, fetchDonations } = useDonations()

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

  useEffect(() => {
    fetchDonations()
  }, [fetchDonations])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <DashboardLayout>
      <header className="flex h-14 items-center gap-4 border-b px-6  ">
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </header>
      <div className="p-6">
        {/* Dashboard Content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between pb-2 space-y-0">
              <h3 className="text-sm font-medium">Total Donations</h3>
            </div>
            <div className="text-2xl font-bold">$1,234</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between pb-2 space-y-0">
              <h3 className="text-sm font-medium">Active Charities</h3>
            </div>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 new this month</p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between pb-2 space-y-0">
              <h3 className="text-sm font-medium">Impact Score</h3>
            </div>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+5 points improvement</p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between pb-2 space-y-0">
              <h3 className="text-sm font-medium">Monthly Goal</h3>
            </div>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">$750 of $1,000 goal</p>
          </div>
        </div>

        {/* Donor Analytics */}
        {currentUser && (
          <div className="mt-6">
            <DonorAnalytics userId={currentUser.uid} />
          </div>
        )}

        {/* Recent Activity */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="rounded-lg border">
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium">Donation to Red Cross</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">$100 - 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium">Donation to UNICEF</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">$50 - 5 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Donations List */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Donations List</h2>
          <div className="rounded-lg border">
            <div className="p-4">
              <div className="space-y-4">
                {donations.map(donation => (
                  <div key={donation.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium">{donation.donorName} - {donation.amount} {donation.currency}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 