import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/Dashboard'
import Chat from '@/components/Chat'
import { calculateHeroStats } from '@/lib/stats'

interface DashboardPageProps {
  searchParams: { date?: string }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  const today = new Date().toISOString().split('T')[0]
  const selectedDate = searchParams.date || today

  const [mealsResult, workoutsResult, weighInResult] = await Promise.all([
    supabase
      .from('meals')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('date', selectedDate)
      .order('created_at', { ascending: true }),
    supabase
      .from('workouts')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('date', selectedDate),
    supabase
      .from('weigh_ins')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('date', selectedDate)
      .single(),
  ])

  const meals = mealsResult.data || []
  const workouts = workoutsResult.data || []
  const weighIn = weighInResult.data

  // Calculate hero stats
  const heroStats = await calculateHeroStats(profile.id, profile, supabase)

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="floating-orb purple w-96 h-96 -top-48 -left-48 opacity-10" />
      <div className="floating-orb pink w-80 h-80 top-1/3 -right-40 opacity-10" />

      <div className="flex h-screen relative z-10">
        {/* Chat Panel */}
        <div className="w-1/2 border-r border-surface-border flex flex-col">
          <Chat profile={profile} />
        </div>

        {/* Dashboard Panel */}
        <div className="w-1/2 overflow-y-auto">
          <Dashboard
            profile={profile}
            meals={meals}
            workouts={workouts}
            weighIn={weighIn}
            totals={totals}
            heroStats={heroStats}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </main>
  )
}
