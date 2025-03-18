"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface Payment {
  id: string
  amount: number
  currency: string
  payment_method: string
  status: string
  created_at: string
  userid: string
}

interface User {
  id: string
  email: string
  display_name: string | null
}

export function RecentPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5)

        if (paymentsError) throw paymentsError

        // Fetch users from custom users table
        const { data: userData, error: userError } = await supabase.from("users").select("id, email, display_name")

        if (userError) throw userError

        setUsers(userData || [])
        setPayments(paymentsData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getUserInfo = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return "Unknown"
    return user.display_name ? `${user.display_name} (${user.email})` : user.email
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "failed":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
        <CardDescription>The most recent payments in the system</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : payments.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">No payments found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{getUserInfo(payment.userid)}</TableCell>
                  <TableCell>
                    {payment.currency} {payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{payment.payment_method}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(payment.status)} text-white`}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

