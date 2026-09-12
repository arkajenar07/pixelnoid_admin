import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  const config = useRuntimeConfig()
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || ''
  if (!serviceRoleKey || !supabaseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Konfigurasi server tidak lengkap.' })
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export default defineEventHandler(async (event) => {
  const client = makeAdminClient()
  const query = getQuery(event)
  const classId = query.class_id ? Number(query.class_id) : null

  // 1. Ambil daftar kelas untuk dropdown & filter
  const { data: classesData } = await client
    .from('class')
    .select('id, name')
    .order('id', { ascending: true })

  const classes = classesData ?? []
  const classMap = new Map<number, string>()
  for (const c of classes) {
    classMap.set(c.id, c.name)
  }

  // 2. Coba ambil resources dengan kolom class_id
  let resourcesQuery = client
    .from('resources')
    .select('*')
    .order('id', { ascending: false })

  if (classId) {
    resourcesQuery = resourcesQuery.eq('class_id', classId)
  }

  const { data: rawResources, error } = await resourcesQuery

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal mengambil data resources: ${error.message}`
    })
  }

  // 3. Tambahkan info kelas ke setiap item resource
  const resources = (rawResources ?? []).map((item: any) => ({
    ...item,
    class_name: item.class_id ? classMap.get(item.class_id) || `Kelas #${item.class_id}` : null
  }))

  return {
    resources,
    classes
  }
})
