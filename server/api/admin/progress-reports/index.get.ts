import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  const config = useRuntimeConfig()
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || ''
  if (!serviceRoleKey || !supabaseUrl) {
    return null
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export default defineEventHandler(async () => {
  const client = makeAdminClient()
  if (!client) {
    return { reports: [], message: 'Supabase client not configured' }
  }

  try {
    const { data, error } = await client
      .from('student_progress_reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      const isMissingTable = error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))
      return { reports: [], tableExists: false, isMissingTable, error: error.message }
    }

    return { reports: data ?? [], tableExists: true }
  } catch (err: any) {
    return { reports: [], error: err.message }
  }
})
