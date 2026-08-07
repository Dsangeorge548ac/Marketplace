<script setup>
import { ref, onMounted } from 'vue'
import { checkSession } from '@/services/authService'
import { isSidebarOpen } from '@/assets/js/dashboardState.js'
const user = ref(null)

onMounted(async () => {
    user.value = await checkSession()
})

function openSidebar() {
    isSidebarOpen.value = true
}

</script>
<template>
      <div class="contenedor">
                <div class="welcome-card">
                    <div class="welcome-title-row">
                        <button
                            v-if="!isSidebarOpen"
                            class="btn-menu-toggle banner-menu-toggle"
                            type="button"
                            @click="openSidebar"
                            aria-label="Abrir menu"
                            title="Abrir menu"
                        >
                            <i class='bx bx-menu'></i>
                        </button>
                    
                        <div id="colorBlack" style="display: flex; flex-direction: column; gap: 10px;">
                            <h4>Bienvenido, {{ user?.name }}</h4>
                        </div>
      
                    </div>
                </div>

                <div class="quick-links" v-show="false">
                    <RouterLink to="/publications" class="quick-link-card">
                        <div class="quick-link-icon pub">
                            <i class='bx bx-layer'></i>
                        </div>
                        <div class="quick-link-text">
                            <h4>Publicaciones</h4>
                            <p>Gestiona tus productos</p>
                        </div>
                    </RouterLink>

                    <RouterLink to="/orders" class="quick-link-card">
                        <div class="quick-link-icon orders">
                            <i class='bx bx-shopping-bag'></i>
                        </div>
                        <div class="quick-link-text">
                            <h4>Pedidos</h4>
                            <p>Compras y ventas</p>
                        </div>
                    </RouterLink>

                    <RouterLink to="/account" class="quick-link-card">
                        <div class="quick-link-icon account">
                            <i class='bx bx-user-circle'></i>
                        </div>
                        <div class="quick-link-text">
                            <h4>Mi Cuenta</h4>
                            <p>Verificación fiscal</p>
                        </div>
                    </RouterLink>

                    <RouterLink to="/marketplace" class="quick-link-card">
                        <div class="quick-link-icon market">
                            <i class='bx bx-store'></i>
                        </div>
                        <div class="quick-link-text">
                            <h4>Marketplace</h4>
                            <p>Explorar productos</p>
                        </div>
                    </RouterLink>
                </div>
            </div>
     
</template>