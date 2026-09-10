<template>
  <div class="relative min-h-screen overflow-x-clip">
    <!-- Ambient animated background -->
    <div class="app-bg" aria-hidden="true">
      <div class="blob blob-1" />
      <div class="blob blob-2" />
      <div class="blob blob-3" />
    </div>

    <!-- Header -->
    <div class="relative z-30">
      <Header />
    </div>

    <!-- Content -->
    <main class="relative z-10 mx-auto w-full max-w-7xl px-4 pt-6 pb-24 sm:px-6 lg:px-8">
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>

    <!-- Footer -->
    <footer class="relative z-10 border-t border-slate-200/70 bg-white/60 backdrop-blur">
      <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
        <p class="flex items-center gap-2">
          <span class="text-base font-extrabold tracking-tight text-slate-800">REM</span>
          <span>· Real Estate Management</span>
        </p>
        <p>Каталог жилых комплексов © {{ year }}</p>
      </div>
    </footer>

    <ToastHost />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Header from '@/components/Header.vue'
import ToastHost from '@/components/ui/ToastHost.vue'

const year = ref(new Date().getFullYear())
</script>
