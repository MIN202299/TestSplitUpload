import { createApp } from 'vue'
import App from './App.vue'

// unocss
import 'virtual:uno.css'

// tailwind reset style
import '@unocss/reset/tailwind.css'

// style
import './style.css'

createApp(App).mount('#app')
