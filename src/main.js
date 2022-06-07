import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import 'leaflet/dist/leaflet.css'
import './assets/css/comman.css'
import 'leaflet-draw/dist/leaflet.draw.css'

const app = createApp(App)

app.use(router)

app.mount('#app')
