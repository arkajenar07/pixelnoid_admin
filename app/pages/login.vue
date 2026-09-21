<script setup lang="ts">
const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

const route = useRoute()

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
    
    if (authError) throw authError

    const userId = authData?.user?.id
    if (!userId) {
      throw new Error('Gagal memuat profil user.')
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('roles')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.roles || !profile.roles.includes('admin')) {
      // User is not an admin, sign out immediately
      await supabase.auth.signOut()
      throw new Error('Akses ditolak: Akun Anda tidak memiliki hak akses admin.')
    }
    
    const router = useRouter()
    await router.push('/')
    // Force a full page reload so middleware reads fresh session
    router.go(0)
  } catch (error: any) {
    errorMsg.value = error.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.query.error === 'unauthorized') {
    errorMsg.value = 'Anda telah dikeluarkan. Sesi Anda tidak valid atau bukan admin.'
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-bold text-gray-900 tracking-tight">
        Admin Login
      </h2>
      <p class="mt-2 text-center text-sm text-gray-500">
        Sign in to access the dashboard
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <!-- Dihapus shadow tebal, menggunakan border tipis dan solid background -->
      <div class="bg-white py-8 px-4 sm:rounded-xl sm:px-10 border border-gray-200">
        <form class="space-y-6" @submit.prevent="handleLogin">
          
          <!-- Email Input -->
          <div>
            <label for="email" class="block text-sm font-semibold text-gray-700">Email address</label>
            <div class="mt-1.5">
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                v-model="email"
                class="block w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:border-[#5530AB] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5530AB] sm:text-sm transition-colors"
                placeholder="admin@example.com"
              >
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <label for="password" class="block text-sm font-semibold text-gray-700">Password</label>
            <div class="mt-1.5">
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                v-model="password"
                class="block w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:border-[#5530AB] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5530AB] sm:text-sm transition-colors"
                placeholder="••••••••"
              >
            </div>
          </div>

          <!-- Error Alert -->
          <div v-if="errorMsg" class="rounded-lg bg-red-50 p-3 text-sm text-red-600 font-medium">
            {{ errorMsg }}
          </div>

          <!-- Submit Button -->
          <div class="pt-2">
            <button
              type="submit"
              :disabled="loading"
              class="flex w-full justify-center items-center rounded-lg bg-[#5530AB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#43238A] focus:outline-none disabled:opacity-70 transition-colors cursor-pointer"
            >
              <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>