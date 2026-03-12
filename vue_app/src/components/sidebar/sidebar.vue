<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import '@/assets/css/pages/dashboard/main.css'
import imgLogo from '@/assets/img/logo.png'

// 2. IMPORTACIONES DE LIBRERÍAS EXTERNAS
import Swal from 'sweetalert2'
import axios from 'axios'
import { checkSession } from '@/services/authService'

// 3. INSTANCIAR ROUTE
const route = useRoute()

// ---------------------------------------------
// ESTADO Y VARIABLES
// ---------------------------------------------
const user = ref(null);

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: true
    }
})
const emit = defineEmits(['toggle'])
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL; // http://localhost:8088

// Role checks
const normalizeRole = (r) => r && r.toLowerCase();
const isDeveloper = computed(() => user.value && normalizeRole(user.value.role) === 'developer');
const isAdmin = computed(() => user.value && (normalizeRole(user.value.role) === 'administrador' || normalizeRole(user.value.role) === 'developer'));
const isUser = computed(() => user.value && normalizeRole(user.value.role) === 'usuario');
const isPaymentManager = computed(() => user.value && (normalizeRole(user.value.role) === 'developer' || normalizeRole(user.value.role) === 'asociado'));

onMounted(async () => {
    // Debug para verificar que la variable de entorno carga bien
    console.log("URL Base cargada:", apiBaseUrl);

    user.value = await checkSession();
})

// Logout function
async function handleLogout() {
    const result = await Swal.fire({
        title: '¿Cerrar sesión?',
        text: "¿Estás seguro de que deseas salir?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#fccd1e', // Brand color
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            // Attempt backend logout
            await axios.post('/api/user_service/auth/logout', {}, { 
                withCredentials: true 
            });
        } catch (error) {
            console.error("Error de conexión al cerrar sesión:", error);
        } finally {
            // Always clear client-side session
            localStorage.removeItem('user');
            
            Swal.fire({
                title: '¡Hasta luego!',
                text: 'Sesión cerrada correctamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = '/'; // Force reload and go to Home
            });
        }
    }
}

</script>
<template>
     <div class="app-sidebar-overlay" @click="$emit('toggle')" v-if="isOpen"></div>
                <aside class="app-sidebar" :class="{ 'open': isOpen }" id="sidebar">
                    <div class="app-sidebar-header">
                        <div class="app-brand-container">
                            <div class="brand-icon" style="display: none;">
                                <i class='bx bxs-component'></i>
                            </div>

                            <router-link to="/" class="logo">
                                <img :src="imgLogo" class="logo-img" alt="Logo">
                            </router-link>
                            <h3 class="app-brand-title" style="display: none;">Panel de control</h3>
                        </div>
                        
                        <button class="app-sidebar-close" @click="$emit('toggle')">
                            <i class='bx bx-x'></i>
                        </button>
                    </div>

                    <nav class="app-navigation">
                        <p class="nav-section-label">Menu Principal</p>
                        <ul class="app-nav-list" v-if="user"> <!-- Hide val while loading or if no user -->
                            <li>
                                <RouterLink to="/dashboard" class="app-nav-link" active-class="active">
                                    <i class='bx bx-grid-alt'></i>
                                    <span>Dashboard</span>
                                </RouterLink>
                            </li>
                            <li>
                                <RouterLink to="/publications" class="app-nav-link" active-class="active">
                                    <i class='bx bx-layer'></i>
                                    <span>Publicaciones</span>
                                </RouterLink>
                            </li>
                            <li v-if="isAdmin">
                                <RouterLink to="/noticesDashboard" class="app-nav-link" active-class="active">
                                    <i class='bx bx-layer'></i>
                                    <span>Noticias</span>
                                </RouterLink>
                            </li>
                            <li>
                                <RouterLink to="/orders" class="app-nav-link" active-class="active">
                                    <i class='bx bx-shopping-bag'></i>
                                    <span>Pedidos</span>
                                </RouterLink>
                            </li>
                            <li v-if="isAdmin">
                                <RouterLink to="/users" class="app-nav-link" active-class="active">
                                    <i class='bx bx-group'></i>
                                    <span>Usuarios</span>
                                </RouterLink>
                            </li>
                        </ul>

                        <p class="nav-section-label">Configuración</p>
                        <ul class="app-nav-list">
                            <li>
                                <RouterLink to="/account" class="app-nav-link">
                                    <i class='bx bx-user-circle'></i>
                                    <span>Mi Cuenta</span>
                                </RouterLink>
                            </li>
                            <li v-if="isPaymentManager">
                                <RouterLink to="/payment-methods" class="app-nav-link" active-class="active">
                                    <i class='bx bx-wallet'></i>
                                    <span>Métodos de Pago</span>
                                </RouterLink>
                            </li>
                            <li v-if="isDeveloper">
                                <RouterLink to="/backups" class="app-nav-link">
                                    <i class='bx bx-data'></i>
                                    <span>Respaldos</span>
                                </RouterLink>
                            </li>
                            <li>
                                <a href="#" class="app-nav-link logout-link" id="logout-btn" @click.prevent="handleLogout">
                                    <i class='bx bx-log-out-circle'></i>
                                    <span>Cerrar Sesión</span>
                                </a>
                            </li>
                        </ul>
                    </nav>

                    <div class="app-sidebar-footer">
                        <div class="app-user-card">
                            <div class="app-user-info" v-if="user">
                                <span class="app-user-name">{{ user.email }}</span>
                                <span class="app-user-role">{{ user.role }}</span>
                            </div>
                            <div class="app-user-info" v-else>
                                <span class="app-user-name">Cargando...</span>
                            </div>
                        </div>
                    </div>
                </aside>
</template>

<style scoped>
@media (max-width: 768px) {
    /* Ensure sidebar behaves with prop only on mobile */
    .app-sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
    }
    .app-sidebar.open {
        transform: translateX(0);
    }
}
</style>
