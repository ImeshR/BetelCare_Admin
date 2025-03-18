"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface User {
  id: string
  email: string
  display_name: string | null
  provider: string | null
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  created_at: string
}

interface UserSettings {
  id: string
  userId: string
  payment_status: boolean
  notification_enable: boolean
  new_user: boolean
  created_at: string
  updated_at: string
}

interface UserDrawerProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess: () => void
}

export default function UserDrawer({ isOpen, onClose, user, onSuccess }: UserDrawerProps) {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [paymentStatus, setPaymentStatus] = useState(false)
  const [notificationEnable, setNotificationEnable] = useState(true)
  const [newUser, setNewUser] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        const { data, error } = await supabase.from("user_settings").select("*").eq("userId", user.id).single()

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "no rows returned" error
          throw error
        }

        if (data) {
          setUserSettings(data)
          setPaymentStatus(data.payment_status)
          setNotificationEnable(data.notification_enable)
          setNewUser(data.new_user)
        } else {
          // No settings found, create default settings
          setPaymentStatus(false)
          setNotificationEnable(true)
          setNewUser(true)
        }
      } catch (error: any) {
        toast({
          title: "Error fetching user settings",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen && user) {
      fetchUserSettings()
    }
  }, [user, isOpen, toast])

  const handleSaveSettings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("user_settings").upsert({
        userId: user.id,
        payment_status: paymentStatus,
        notification_enable: notificationEnable,
        new_user: newUser,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Settings saved",
        description: "User settings have been updated successfully",
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!user) return

    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      setIsDeleting(true)
      try {
        // Delete user via Edge Function
        const { error } = await supabase.functions.invoke("delete-user", {
          body: { userId: user.id },
        })

        if (error) throw error

        toast({
          title: "User deleted",
          description: "User has been successfully deleted",
        })

        onSuccess()
        onClose()
      } catch (error: any) {
        toast({
          title: "Error deleting user",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  if (!user) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>View and manage user information and settings</SheetDescription>
        </SheetHeader>

        <div className="py-6">
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Information</CardTitle>
                  <CardDescription>Basic user account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{user.email}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Display Name</Label>
                    <p className="font-medium">{user.display_name || "Not set"}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Provider</Label>
                    <p className="font-medium">{user.provider || "Email"}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Email Confirmed</Label>
                    <p className="font-medium">
                      {user.email_confirmed_at ? new Date(user.email_confirmed_at).toLocaleString() : "Not confirmed"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Created At</Label>
                    <p className="font-medium">{new Date(user.created_at).toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Last Sign In</Label>
                    <p className="font-medium">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Never"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button variant="destructive" className="w-full" onClick={handleDeleteUser} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Settings</CardTitle>
                  <CardDescription>Manage user preferences and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="payment-status">Payment Status</Label>
                          <p className="text-sm text-muted-foreground">Whether the user has an active payment</p>
                        </div>
                        <Switch id="payment-status" checked={paymentStatus} onCheckedChange={setPaymentStatus} />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifications">Notifications</Label>
                          <p className="text-sm text-muted-foreground">Enable email notifications for this user</p>
                        </div>
                        <Switch
                          id="notifications"
                          checked={notificationEnable}
                          onCheckedChange={setNotificationEnable}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="new-user">New User</Label>
                          <p className="text-sm text-muted-foreground">Mark as a new user for onboarding</p>
                        </div>
                        <Switch id="new-user" checked={newUser} onCheckedChange={setNewUser} />
                      </div>

                      {userSettings && (
                        <>
                          <Separator />
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Settings Last Updated</Label>
                            <p className="text-sm">{new Date(userSettings.updated_at).toLocaleString()}</p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Button className="w-full" onClick={handleSaveSettings} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}

