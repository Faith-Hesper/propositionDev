import { createApp } from "vue"
import App from "./App.vue"
import router from "@/router"
import "leaflet/dist/leaflet.css"
import "./assets/css/common.css"
import "./assets/css/map.less"
import "leaflet-draw/dist/leaflet.draw.css"
import "./config"
import Directives from "@/utils/directive"
import L from "leaflet"
import "@supermap/iclient-leaflet"

const app = createApp(App)

app.use(Directives)
// app.use(L)

// /* 注册全局指令 */
// Object.keys(directive).forEach(key => {
//   app.directive(`${key}`, directive[key])
// })

app.use(router)

app.mount("#app")
