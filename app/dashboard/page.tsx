"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/dashboard/overview"
import { RecentPayments } from "@/components/dashboard/recent-payments"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const [userCount, setUserCount] = useState<number>(0)
  const [totalRevenue, setTotalRevenue] = useState<number>(0)
  const [activeSubscriptions, setActiveSubscriptions] = useState<number>(0)
  const [pendingPayments, setPendingPayments] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch user count
        const { count: userCountData, error: userCountError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })

        if (userCountError) throw userCountError

        // Fetch total revenue (sum of completed payments)
        const { data: revenueData, error: revenueError } = await supabase
          .from("payments")
          .select("amount")
          .eq("status", "Completed")

        if (revenueError) throw revenueError

        const totalRevenueAmount = revenueData.reduce((sum, payment) => sum + payment.amount, 0)

        // Fetch active subscriptions (count of users with payment_status = true)
        const { count: subscriptionCount, error: subscriptionError } = await supabase
          .from("user_settings")
          .select("*", { count: "exact", head: true })
          .eq("payment_status", true)

        if (subscriptionError) throw subscriptionError

        // Fetch pending payments
        const { count: pendingCount, error: pendingError } = await supabase
          .from("payments")
          .select("*", { count: "exact", head: true })
          .eq("status", "Pending")

        if (pendingError) throw pendingError

        // Update state with fetched data
        setUserCount(userCountData || 0)
        setTotalRevenue(totalRevenueAmount || 0)
        setActiveSubscriptions(subscriptionCount || 0)
        setPendingPayments(pendingCount || 0)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your system and recent activity</p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{userCount}</div>
              <p className="text-xs text-muted-foreground">Active user accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From completed payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">Users with active payment status</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{pendingPayments}</div>
              <p className="text-xs text-muted-foreground">Payments awaiting completion</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent">Recent Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Overview />
        </TabsContent>
        <TabsContent value="recent" className="space-y-4">
          <RecentPayments />
        </TabsContent>
      </Tabs>
    </div>
  )
}

