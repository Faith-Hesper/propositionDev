import { createApp } from "vue"
import App from "./App.vue"
import router from "@/router"
import "leaflet/dist/leaflet.css"
import "./assets/css/common.css"
import "leaflet-draw/dist/leaflet.draw.css"
import "./config"
import Directives from "@/utils/directive"

const app = createApp(App)

app.use(Directives)
app.directive("focus", {
  // When the bound element is mounted into the DOM...
  mounted(el) {
    // Focus the element
    // console.log(el)
    el.focus()
  },
})

// /* 注册全局指令 */
// Object.keys(directive).forEach(key => {
//   app.directive(`${key}`, directive[key])
// })

app.use(router)

app.mount("#app")
