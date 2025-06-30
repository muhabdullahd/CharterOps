import AuthForm from '@/lib/auth'

// Force dynamic rendering to avoid prerendering issues with Supabase
export const dynamic = 'force-dynamic'

export default function AuthPage() {
  return <AuthForm />
} 