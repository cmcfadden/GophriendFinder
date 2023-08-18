// import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
// import router from './router'

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';

const app = createApp(App)

// app.use(router)

// rest of the code

import GoogleSignInPlugin from "vue3-google-signin"

app.use(GoogleSignInPlugin, {
  clientId: '39708357868-nis53om5p63ebu0fgh62qut57g992u9s.apps.googleusercontent.com',
});
// secret: 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



app.mount("#app");