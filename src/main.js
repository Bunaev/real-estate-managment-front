import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import ComplexDetail from './views/ComplexDetail.vue'
import Admin from './views/Admin.vue'
import './style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home, name: 'home', meta: { title: 'Каталог жилых комплексов' } },
    { path: '/complex/:id', component: ComplexDetail, name: 'complex-detail', meta: { title: 'Жилой комплекс' } },
    { path: '/admin', component: Admin, name: 'admin', meta: { title: 'Панель управления' } },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.afterEach((to) => {
  if (to.meta?.title) document.title = `${to.meta.title} · REM`
})

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
