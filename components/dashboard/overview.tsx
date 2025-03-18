"use client"

import { useState, useEffect } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface MonthlyRevenue {
  name: string
  total: number
}

export function Overview() {
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMonthlyRevenue = async () => {
      try {
        setLoading(true)

        // Get current year
        const currentYear = new Date().getFullYear()

        // Fetch all completed payments
        const { data: payments, error } = await supabase
          .from("payments")
          .select("amount, created_at")
          .eq("status", "Completed")

        if (error) throw error

        // Initialize monthly data with zeros
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        const initialMonthlyData = months.map((month) => ({
          name: month,
          total: 0,
        }))

        // Process payments and aggregate by month
        if (payments && payments.length > 0) {
          payments.forEach((payment) => {
            const paymentDate = new Date(payment.created_at)
            const paymentYear = paymentDate.getFullYear()

            // Only include payments from the current year
            if (paymentYear === currentYear) {
              const monthIndex = paymentDate.getMonth()
              initialMonthlyData[monthIndex].total += payment.amount
            }
          })
        }

        setMonthlyData(initialMonthlyData)
      } catch (error) {
        console.error("Error fetching monthly revenue:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMonthlyRevenue()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly revenue for the current year</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {loading ? (
          <div className="flex h-[350px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

