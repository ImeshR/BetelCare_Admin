import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import LoginForm from "@/components/login-form"

export default function Home() {
  // Check if user is already logged in
  const cookieStore = cookies()
  const session = cookieStore.get("supabase-auth-session")

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <LoginForm />
    </div>
  )
}

