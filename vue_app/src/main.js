import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// Base
import '@/assets/css/base/main.css';
import '@/assets/css/base/style.css';
import '@/assets/css/base/responsive.css';
import '@/assets/css/base/scrollbar.css';

// Components
import '@/assets/css/components/card.css';
import '@/assets/css/components/modal.css';
import '@/assets/css/components/cart.css';
import '@/assets/css/components/cart-sidebar.css';
import '@/assets/css/components/home-footer.css';
import '@/assets/css/components/sweetalert.css';

// Pages
import '@/assets/css/pages/auth.css';
import '@/assets/css/pages/marketplace.css';

// Dashboard
import '@/assets/css/pages/dashboard/home.css';
import '@/assets/css/pages/dashboard/publications.css';
import '@/assets/css/pages/dashboard/users.css';
import '@/assets/css/pages/dashboard/orders.css';

// Vendors
import 'boxicons';
import '@fortawesome/fontawesome-free/css/all.css';

const app = createApp(App);

app.use(router);


app.mount('#app');

