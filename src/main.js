import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
import VScaleScreen from './components/VScaleScreen.vue';

const app = createApp(App);
app.use(router);
app.component('v-scale-screen', VScaleScreen);
app.mount('#app');
