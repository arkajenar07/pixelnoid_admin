export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for the login page itself
  if (to.path === '/login') return

  const supabase = useSupabaseClient()

  // Get the current session directly from Supabase (not from the reactive ref)
  // This is reliable even right after a fresh login
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user?.id) {
    return navigateTo('/login')
  }

  const userId = session.user.id

  // Fetch the user's role from the public.users table
  const { data: profile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', userId)
    .single()

  // Check if they have the 'admin' role
  const isAdmin = profile?.roles && profile.roles.includes('admin')

  if (!isAdmin) {
    await supabase.auth.signOut()
    return navigateTo('/login?error=unauthorized')
  }
})
