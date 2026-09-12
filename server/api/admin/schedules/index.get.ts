// server/api/admin/schedules/index.get.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (_event) => {
  const config = useRuntimeConfig()
  const db = createClient(
    config.supabaseUrl || process.env.SUPABASE_URL || '',
    config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await db
    .from('teaching_schedules')
    .select('*')
    .order('start_at', { ascending: true })

  if (error) throw createError({ statusCode: 500, statusMessage: `Failed to fetch schedules: ${error.message}` })
  return { schedules: data ?? [] }
})
