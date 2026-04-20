import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  
  if (error || !data?.user) {
    redirect('/login')
  }

  // Check if household exists
  // Since we haven't set up the database types yet, we just check generically
  // Supabase postgrest doesn't type this strictly since generic is not passed.
  const { data: household } = await supabase
    .from('households')
    .select('id')
    .eq('user_id', data.user.id)
    .single()

  if (!household) {
    redirect('/onboarding')
  }

  redirect('/basket')
}
