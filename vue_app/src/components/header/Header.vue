<script setup>
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import axios from 'axios';
import logo from '@/assets/img/logo.png';
import { useCart } from '@/assets/js/useCart';
import { useMarketplace } from '@/assets/js/marketplace';

const router = useRouter();
const { cartCount, openSidebar } = useCart();
const { search, loadPage } = useMarketplace();

const usd_bcv = ref('Cargando...');
const eur_bcv = ref('Cargando...');

const fetchBcvRates = async () => {
  try {
    const { data } = await axios.get('/bcv-api/');
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    
    // El BCV usa divs con IDs específicos "dolar" y "euro" donde las etiquetas <strong> contienen los valores.
    const usdEl = doc.querySelector('#dolar strong');
    const eurEl = doc.querySelector('#euro strong');
    
    const formatRate = (rateStr) => {
      if (!rateStr) return '';
      const parts = rateStr.split(',');
      if (parts.length === 2) {
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `${integerPart},${parts[1].substring(0, 2)}`;
      }
      return rateStr;
    };

    if (usdEl) {
      usd_bcv.value = formatRate(usdEl.innerText.trim());
    } else {
      usd_bcv.value = 'No hay datos'; // Fallback visual
    }
    
    if (eurEl) {
      eur_bcv.value = formatRate(eurEl.innerText.trim());
    } else {
      eur_bcv.value = 'No hay datos'; // Fallback visual
    }
  } catch (e) {
    console.error('Failed to fetch BCV rates:', e);
    usd_bcv.value = 'Error';
    eur_bcv.value = 'Error';
  }
};

onMounted(() => {
  fetchBcvRates();
});

const handleSearch = () => {
  if (search.value && search.value.trim() !== '') {
    router.push({ path: '/marketplace', query: { search: search.value } });
  } else {
    router.push({ path: '/marketplace' });
  }
};

const handleProfileClick = () => {
  const user = localStorage.getItem('user');
  if (user) {
    router.push('/dashboard');
  } else {
    router.push('/auth');
  }
};
</script>

<template>
  <header class="ebay-header">
    <div class="header-content-wrapper">
      
      <!-- Top Bar -->
      <div class="top-bar">
        <div class="top-left">
          <span class="top-links">
            <router-link to="/services">Nuestros Servicios</router-link>
            <router-link to="/acuerdos">Noticias</router-link>            
            <router-link to="/contact">Ayuda & Contacto</router-link>
          </span>
          <span class="rates-display">
            <div class="rate-badge">
              <span class="currency-code">USD</span>
              <span class="rate-value">{{ usd_bcv }} Bs</span>
            </div>
            <div class="rate-badge">
              <span class="currency-code">EUR</span>
              <span class="rate-value">{{ eur_bcv }} Bs</span>
            </div>
          </span>
        </div>

        <div class="top-right">
          <a href="#" class="top-link">¿Como vender?</a>
          <a href="#" class="top-link with-chevron">Listado de proyectos <i class="bx bx-chevron-down"></i></a>
          <a href="#" class="top-link with-chevron" @click.prevent="handleProfileClick">Mi cuenta <i class="bx bx-chevron-down"></i></a>
        </div>
      </div>

      <!-- Main Bar -->
      <div class="main-bar">
        
        <div class="logo-area">
          <router-link to="/" class="logo-link">
            <img :src="logo" alt="Fabrimine Logo" class="logo-image">
          </router-link>
        </div>

        <div class="search-area">
          <div class="search-box">
             <div class="search-input-wrapper">
               <i class="bx bx-search search-icon-left" @click="handleSearch" style="cursor: pointer;"></i>
               <input 
                 type="text" 
                 v-model="search"
                 @keyup.enter="handleSearch"
                 placeholder="Buscar" 
                 class="search-input"
               >
               <i class="bx bx-camera camera-icon"></i>
             </div>
             
             <div class="category-select-wrapper">
               <select class="category-select">
                 <option value="all">Todas las categorías</option>
                 <!-- Add dynamic categories if needed later -->
               </select>
             </div>
          </div>

          <button class="btn-search" @click="handleSearch">Buscar</button>

          <div class="header-actions">
            <a href="#" class="icon-link-container cart-wrapper" @click.prevent="openSidebar">
              <div class="cart-icon-container">
                <i class="bx bx-cart icon-large"></i>
                <span class="cart-badge" v-if="cartCount > 0">{{ cartCount }}</span>
              </div>
              <span class="icon-label">Carrito</span>
            </a>
            <a href="#" class="icon-link-container" @click.prevent="handleProfileClick">
              <i class="bx bx-user icon-large"></i>
              <span class="icon-label">Perfil</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  </header>
</template>

<style scoped>
.ebay-header {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  width: 100%;
  background-color: #fff;
  color: #333;
}

.header-content-wrapper {
  max-width: 1540px;
  margin: 0 auto;
  padding: 10px 16px 20px 16px;
}

/* TOP BAR */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 0;
  color: #111820;
}

.btn-search {
  background-color: gold;
  color: black;
  border: none;
  border-radius: 40px; /* pill shape */
  height: 42px;
  padding: 0 36px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.btn-search:hover {
  background-color: rgba(255, 217, 0, 0.699);
}

.top-left, .top-right {
  display: flex;
  align-items: center;
}

.top-left {
  gap: 16px;
}

.top-right {
  gap: 16px;
}

.greeting a, .top-link, .icon-link {
  color: #3665f3; 
  text-decoration: none;
}
.top-links {
  display: flex;
  gap: 16px;
}

.top-links a {
  color: #111820;
  text-decoration: none;
}

.top-link, .icon-link {
  color: #111820;
}

.rates-display {
  display: flex;
  gap: 12px;
  align-items: center;
}

.rate-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s;
  cursor: default;
}

.currency-icon {
  font-size: 14px;
  line-height: 1;
}

.currency-code {
  font-size: 12px;
  font-weight: 700;
  color: #4b5563;
  letter-spacing: 0.5px;
}

.rate-value {
  font-size: 12px;
  font-weight: 600;
  color: #059669; /* Pleasant green */
}

.logo-link {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
}

.top-link {
  display: flex;
  align-items: center;
  gap: 2px;
}

.with-chevron i {
  font-size: 16px;
  margin-top: 2px;
}

.icon-link {
  font-size: 22px;
}

.cart-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  background-color: #e53238; 
  color: white;
  font-size: 10px;
  font-weight: bold;
  height: 16px;
  min-width: 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid white;
}

/* MAIN BAR */
.main-bar {
  display: flex;
  align-items: center;
  padding: 20px 0 0 0;
  gap: 16px;
}

.logo-area {
  flex: 0.2;
  flex-shrink: 0;
  margin-right: 4px;
}

.logo-image {
  height: 32px;
  object-fit: contain;
}

.shop-by-category {
  font-size: 12px;
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  line-height: 1.1;
  white-space: nowrap;
}
.shop-by-category:hover {
  color: #3665f3;
}
.shop-by-category i {
  font-size: 14px;
  margin-left: 2px;
}

/* SEARCH AREA */
.search-area {
  flex-grow: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-box {
  flex-grow: 1;
  display: flex;
  align-items: center;
  border: 2px solid gainsboro;
  border-radius: 40px; /* ebay pill shape */
  height: 42px;
  overflow: hidden;
  background: #fff;
  transition: box-shadow 0.2s;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  flex-grow: 1;
  padding: 0 8px 0 16px;
}

.search-icon-left {
  font-size: 18px;
  color: #707070;
  margin-right: 8px;
}

.search-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 16px;
  height: 100%;
  color: #111820;
  background: transparent;
}
.search-input::placeholder {
  color: #707070;
}

.camera-icon {
  font-size: 20px;
  color: #111820;
  cursor: pointer;
  padding: 0 4px;
}

.category-select-wrapper {
  height: 100%;
  border-left: 1px solid #ccc;
  display: flex;
  align-items: center;
}

.category-select {
  border: none;
  outline: none;
  background: transparent;
  padding: 0 12px 0 16px;
  padding-right: 36px;
  font-size: 13px;
  color: #555;
  height: 100%;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23555555%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 10px auto;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 0.2;
  justify-content: flex-end;
}

.icon-link-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #111820;
  gap: 2px;
}

.icon-link-container:hover {
  color: #3665f3;
}

.icon-large {
  font-size: 24px;
}

.icon-label {
  font-size: 11px;
  font-weight: 500;
}

.cart-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.advanced-search {
  font-size: 11px;
  margin-left: 2px;
  flex-shrink: 0;
  color: #707070;
  text-decoration: none;
}
.advanced-search:hover {
  color: #3665f3;
}

/* RESPONSIVE */
@media (max-width: 1024px) {
  .top-links { display: none; }
  .shop-by-category { display: none; }
  .category-select-wrapper { display: none; }
}

@media (max-width: 768px) {
  .rates-display { display: none; }
  .advanced-search { display: none; }
  .top-left .greeting { display: none; }
}

@media (max-width: 480px) {
  .header-actions {
    gap: 12px;
    margin-left: 8px;
  }
  .icon-large {
    font-size: 22px;
  }
  .icon-label {
    display: none; /* Optionally hide labels on very small screens */
  }
}
</style>
