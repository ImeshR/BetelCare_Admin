"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  id: string
  email: string
  display_name: string | null
}

interface Payment {
  id: string
  userid: string
  amount: number
  currency: string
  payment_method: string
  status: string
  created_at: string
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  payment: Payment | null
  onSuccess: () => void
}

export default function PaymentModal({ isOpen, onClose, payment, onSuccess }: PaymentModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [userId, setUserId] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [paymentMethod, setPaymentMethod] = useState("Credit Card")
  const [status, setStatus] = useState("Completed")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true)
      try {
        // Fetch users from the custom users table
        const { data, error } = await supabase.from("users").select("id, email, display_name")

        if (error) throw error

        setUsers(data || [])
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoadingUsers(false)
      }
    }

    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  useEffect(() => {
    if (payment) {
      setUserId(payment.userid || "")
      setAmount(payment.amount.toString() || "")
      setCurrency(payment.currency || "USD")
      setPaymentMethod(payment.payment_method || "Credit Card")
      setStatus(payment.status || "Completed")
    } else {
      // Reset form for new payment
      setUserId("")
      setAmount("")
      setCurrency("USD")
      setPaymentMethod("Credit Card")
      setStatus("Completed")
    }
  }, [payment, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const paymentData = {
        userid: userId,
        amount: Number.parseFloat(amount),
        currency,
        payment_method: paymentMethod,
        status,
      }

      if (payment) {
        // Update existing payment
        const { error } = await supabase.from("payments").update(paymentData).eq("id", payment.id)

        if (error) throw error

        toast({
          title: "Payment updated",
          description: "Payment has been successfully updated",
        })
      } else {
        // Create new payment
        const { error } = await supabase.from("payments").insert(paymentData)

        if (error) throw error

        toast({
          title: "Payment created",
          description: "New payment has been successfully created",
        })
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      toast({
        title: payment ? "Error updating payment" : "Error creating payment",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{payment ? "Edit Payment" : "Add New Payment"}</DialogTitle>
          <DialogDescription>
            {payment ? "Update payment details" : "Create a new payment transaction"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user">User</Label>
              <Select value={userId} onValueChange={setUserId} required>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {loadingUsers ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.display_name ? `${user.display_name} (${user.email})` : user.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="PayPal">PayPal</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {payment ? "Updating..." : "Creating..."}
                </>
              ) : payment ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

