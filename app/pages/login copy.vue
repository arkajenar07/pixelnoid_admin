<template>
  <div class="min-h-screen bg-[#020617] font-['Instrument_Sans','Inter',sans-serif] relative overflow-hidden flex flex-col">
    <!-- Ambient background glow effects -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -top-[10%] -left-[8%] w-[50%] h-[50%] rounded-full bg-radial-gradient from-amber-500/[0.05] to-transparent filter blur-[100px]"></div>
      <div class="absolute top-[10%] -right-[5%] w-[30%] h-[30%] rounded-full bg-radial-gradient from-emerald-500/[0.03] to-transparent filter blur-[100px]"></div>
      <div class="absolute bottom-0 left-[45%] w-[55%] h-[28%] rounded-full bg-radial-gradient from-amber-500/[0.04] to-transparent filter blur-[100px]"></div>
    </div>

    <!-- Subtle grid pattern overlay -->
    <div class="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_80%,transparent)]" aria-hidden="true"></div>

    <div class="relative z-10 flex min-h-screen items-center justify-center p-6">
      <div class="w-full max-w-[420px]">
        <!-- Logo -->
        <div class="flex justify-center mb-10">
          <NuxtLink to="/" class="inline-block">
            <img :src="logo" alt="Pixelnoid Digital Academy" class="h-10 w-auto object-contain brightness-0 invert opacity-90" />
          </NuxtLink>
        </div>

        <div class="bg-[#0F172A] border border-white/10 rounded-2xl p-8 shadow-xl">
          <div class="mb-8 text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20">
              <ShieldCheckIcon class="w-6 h-6" />
            </div>
            <h1 class="text-2xl font-medium tracking-tight text-white mb-1">Admin Portal</h1>
            <p class="text-[0.9375rem] font-light text-slate-400">
              Silakan masuk dengan kredensial administrator
            </p>
          </div>

          <form class="flex flex-col gap-5" @submit.prevent="handleLogin" novalidate>
            <!-- Email -->
            <div class="flex flex-col gap-2">
              <label for="email" class="text-[0.875rem] font-medium text-slate-300">Email Admin</label>
              <div class="relative flex items-center">
                <EnvelopeIcon class="absolute left-4 w-[18px] h-[18px] text-slate-500 pointer-events-none group-focus-within:text-amber-500 transition-colors" />
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  class="w-full h-[50px] pl-11 pr-4 rounded-2xl border border-white/10 bg-slate-900/50 font-inherit text-[0.9375rem] text-white outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-slate-600"
                  :class="{ 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10': errors.email }"
                  placeholder="admin@pixelnoid.dev"
                  autocomplete="email"
                />
              </div>
              <span v-if="errors.email" class="text-[0.8125rem] text-rose-500 font-medium">{{ errors.email }}</span>
            </div>

            <!-- Password -->
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <label for="password" class="text-[0.875rem] font-medium text-slate-300">Password</label>
              </div>
              <div class="relative flex items-center">
                <LockClosedIcon class="absolute left-4 w-[18px] h-[18px] text-slate-500 pointer-events-none transition-colors" />
                <input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="w-full h-[50px] pl-11 pr-12 rounded-2xl border border-white/10 bg-slate-900/50 font-inherit text-[0.9375rem] text-white outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-slate-600"
                  :class="{ 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10': errors.password }"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <button type="button" class="absolute right-4 p-1 text-slate-500 hover:text-white transition-colors" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'">
                  <EyeIcon v-if="!showPassword" class="w-[18px] h-[18px]" />
                  <EyeSlashIcon v-else class="w-[18px] h-[18px]" />
                </button>
              </div>
              <span v-if="errors.password" class="text-[0.8125rem] text-rose-500 font-medium">{{ errors.password }}</span>
            </div>

            <!-- Login error banner -->
            <Transition
              enter-active-class="transition duration-300 ease-out"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-200 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <div v-if="loginError" class="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[0.875rem] font-medium">
                <ExclamationCircleIcon class="w-4 h-4 text-rose-500 shrink-0" />
                {{ loginError }}
              </div>
            </Transition>

            <!-- Submit -->
            <button 
              type="submit" 
              class="group w-full h-[52px] rounded-full bg-amber-500 text-slate-900 font-bold text-[0.9375rem] flex items-center justify-center gap-2 hover:bg-amber-400 hover:shadow-xl hover:shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2" 
              :disabled="isLoading"
            >
              <template v-if="!isLoading">
                Masuk ke Admin Panel
                <ArrowRightIcon class="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </template>
              <div v-else class="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
            </button>
            
            <!-- Quick Hint -->
            <div class="mt-4 text-center">
                <button type="button" @click="fillDemo" class="text-[0.75rem] text-slate-500 hover:text-amber-500 transition-colors">
                    Isi otomatis kredensial demo
                </button>
            </div>
          </form>
        </div>
        
        <div class="mt-8 text-center text-[0.8125rem] text-slate-500">
          <p>&copy; {{ new Date().getFullYear() }} Pixelnoid Digital Academy.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
const logo = ''
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  ExclamationCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon
} from '@heroicons/vue/24/outline'

useSeoMeta({
  title: 'Admin Login — Pixelnoid Digital Academy',
  description: 'Portal Administrator Pixelnoid Digital Academy.'
})

definePageMeta({
  layout: false,
})

const route = useRoute()
const { loginForPortal } = usePortalAuth()

const showPassword  = ref(false)
const isLoading     = ref(false)
const loginError    = ref('')

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
})

const fillDemo = () => {
    form.email = 'admin@pixelnoid.dev'
    form.password = 'admin123'
    errors.email = ''
    errors.password = ''
    loginError.value = ''
}

// ── Validation ──────────────────────────────────────────────────
const validate = () => {
  errors.email = ''
  errors.password = ''
  let valid = true

  if (!form.email) {
    errors.email = 'Email wajib diisi.'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Format email tidak valid.'
    valid = false
  }

  if (!form.password) {
    errors.password = 'Password wajib diisi.'
    valid = false
  }

  return valid
}

// ── Login handler ───────────────────────────────────────────────
const handleLogin = async () => {
  if (!validate()) return

  isLoading.value  = true
  loginError.value = ''

  // loginForPortal: authenticates via Supabase, checks 'admin' role from users table,
  // stores 'admin' in sessionStorage, returns error if role missing
  const result = await loginForPortal(form.email, form.password, 'admin')

  if (!result.success) {
    loginError.value = result.error || 'Login gagal.'
    isLoading.value  = false
    return
  }

  // Success → redirect to admin dashboard
  const redirectTo = (route.query.redirect as string) || '/admin'
  await navigateTo(redirectTo)
}
</script>

<style>
/* Aesthetic patterns and glows are handled by Tailwind classes */
</style>
