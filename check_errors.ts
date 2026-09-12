import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const db = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function run() {
  const { data, error } = await db
    .from('users')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error:', error.message)
    return
  }
  
  console.log(Object.keys(data[0] || {}))
}

run()
