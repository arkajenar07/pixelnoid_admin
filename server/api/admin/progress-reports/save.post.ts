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

export default defineEventHandler(async (event) => {
  const client = makeAdminClient()
  if (!client) {
    throw createError({ statusCode: 500, statusMessage: 'Konfigurasi Supabase tidak lengkap.' })
  }

  const body = await readBody(event)
  if (!body || !body.student_name || !body.generated_report) {
    throw createError({ statusCode: 400, statusMessage: 'Data laporan tidak lengkap untuk disimpan.' })
  }

  const { data, error } = await client
    .from('student_progress_reports')
    .insert([
      {
        student_name: body.student_name,
        student_id: body.student_id || null,
        mentor_name: body.mentor_name || '',
        mentor_id: body.mentor_id || null,
        program: body.program || '',
        period: body.period || '',
        input_data: body.input_data || {},
        generated_report: body.generated_report,
        human_readable_text: body.human_readable_text || ''
      }
    ])
    .select()
    .single()

  if (error) {
    const isMissingTable = error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))
    throw createError({
      statusCode: isMissingTable ? 404 : 500,
      statusMessage: isMissingTable
        ? `Tabel 'public.student_progress_reports' belum ditemukan di Supabase. Pastikan file sql/student_progress_reports.sql telah dijalankan di Supabase SQL Editor.`
        : `Gagal menyimpan ke database Supabase: ${error.message}`,
      data: {
        code: error.code,
        isMissingTable,
        tableName: 'student_progress_reports',
        sqlFile: 'sql/student_progress_reports.sql'
      }
    })
  }

  return { success: true, data }
})
