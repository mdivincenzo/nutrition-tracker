import { redirect } from 'next/navigation'

// Redirect old onboarding URL to root
export default function OnboardingRedirect() {
  redirect('/')
}
