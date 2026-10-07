<script setup lang="ts">
useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap' }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-[#FAFAFA] font-sans">
    <NuxtLoadingIndicator color="#5530AB" :height="3" :duration="2000" :throttle="100" />
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');

html,
body,
#__nuxt,
.font-sans,
[class*="font-['Instrument_Sans'"] {
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
}

/* Smooth page transition */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(3px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}
</style>
