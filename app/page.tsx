import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="floating-orb purple w-96 h-96 -top-48 -left-48 animate-float" />
      <div className="floating-orb pink w-80 h-80 top-1/4 -right-40 animate-float" style={{ animationDelay: '-2s' }} />
      <div className="floating-orb indigo w-64 h-64 bottom-20 left-1/4 animate-float" style={{ animationDelay: '-4s' }} />

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero section */}
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6">
              Track nutrition
              <br />
              <span className="gradient-text">conversationally</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-2xl mx-auto text-balance leading-relaxed">
              A nutrition and fitness tracker powered by Claude AI. Log meals, workouts, and weight using natural language.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link href="/signup" className="btn-primary text-lg px-8 py-4">
              Get Started
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-4">
              Log In
            </Link>
          </div>

          {/* Feature cards */}
          <div className="mt-24 grid md:grid-cols-3 gap-6">
            <div className="glass-card-hover p-8 text-left">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-indigo to-accent-violet flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Natural Language</h3>
              <p className="text-text-secondary leading-relaxed">
                Just tell Claude what you ate. No tedious manual entry or searching through databases.
              </p>
            </div>

            <div className="glass-card-hover p-8 text-left">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-violet to-accent-fuchsia flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Tracking</h3>
              <p className="text-text-secondary leading-relaxed">
                Automatic macro estimation, progress visualization, and personalized insights.
              </p>
            </div>

            <div className="glass-card-hover p-8 text-left">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-fuchsia to-accent-indigo flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Coaching</h3>
              <p className="text-text-secondary leading-relaxed">
                Get personalized tips and encouragement based on your goals and patterns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
