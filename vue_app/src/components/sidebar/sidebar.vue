<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import '@/assets/css/pages/dashboard/main.css'
import imgLogo from '@/assets/img/logo.png'

import Swal from 'sweetalert2'
import axios from '@/services/axiosInstance'
import { checkSession } from '@/services/authService'

const route = useRoute()
const user = ref(null);

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: true
    }
})
const emit = defineEmits(['toggle'])

const normalizeRole = (r) => r && r.toLowerCase();
const isDeveloper = computed(() => user.value && normalizeRole(user.value.role) === 'developer');
const isAdmin = computed(() => user.value && (normalizeRole(user.value.role) === 'administrador' || normalizeRole(user.value.role) === 'developer'));
const isUser = computed(() => user.value && normalizeRole(user.value.role) === 'usuario');
const isPaymentManager = computed(() => user.value && (normalizeRole(user.value.role) === 'developer' || normalizeRole(user.value.role) === 'asociado'));

const userInitial = computed(() => {
    if (!user.value) return '?';
    const name = user.value.name || user.value.email || '';
    return name.charAt(0).toUpperCase();
});

onMounted(async () => {
    user.value = await checkSession();
})

async function handleLogout() {
    const result = await Swal.fire({
        title: '¿Cerrar sesión?',
        text: "¿Estás seguro de que deseas salir?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#fccd1e',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await axios.post('/api/user_service/auth/logout', {}, { 
                withCredentials: true 
            });
        } catch (error) {
            console.error("Error de conexión al cerrar sesión:", error);
        } finally {
            localStorage.removeItem('user');
            
            Swal.fire({
                title: '¡Hasta luego!',
                text: 'Sesión cerrada correctamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = '/';
            });
        }
    }
}
</script>

<template>
    <div class="app-sidebar-overlay" :class="{ 'active': isOpen }" @click="$emit('toggle')"></div>
    <aside class="app-sidebar" :class="{ 'open': isOpen }" id="sidebar">
        <!-- Header -->
        <div class="app-sidebar-header">
            <div class="app-brand-container">
                <router-link to="/" class="logo">
                    <img :src="imgLogo" class="logo-img" alt="Logo">
                </router-link>
            </div>
            
            <button class="app-sidebar-close" @click="$emit('toggle')">
                <i class='bx bx-x'></i>
            </button>
        </div>

        <!-- Navigation -->
        <nav class="app-navigation">
            <p class="nav-section-label">Menu Principal</p>
            <ul class="app-nav-list" v-if="user">
                <li>
                    <RouterLink to="/dashboard/home" class="app-nav-link" active-class="active">
                        <i class='bx bx-grid-alt'></i>
                        <span>Dashboard</span>
                    </RouterLink>
                </li>
                <li>
                    <RouterLink to="/dashboard/publications" class="app-nav-link" active-class="active">
                        <i class='bx bx-layer'></i>
                        <span>Publicaciones</span>
                    </RouterLink>
                </li>
                <li v-if="isAdmin">
                    <RouterLink to="/dashboard/notices" class="app-nav-link" active-class="active">
                        <i class='bx bx-news'></i>
                        <span>Noticias</span>
                    </RouterLink>
                </li>
                <li>
                    <RouterLink to="/dashboard/orders" class="app-nav-link" active-class="active">
                        <i class='bx bx-shopping-bag'></i>
                        <span>Pedidos</span>
                    </RouterLink>
                </li>
                <li v-if="isAdmin">
                    <RouterLink to="/dashboard/users" class="app-nav-link" active-class="active">
                        <i class='bx bx-group'></i>
                        <span>Usuarios</span>
                    </RouterLink>
                </li>
            </ul>

            <p class="nav-section-label">Configuración</p>
            <ul class="app-nav-list">
                <li>
                    <RouterLink to="/dashboard/account" class="app-nav-link" active-class="active">
                        <i class='bx bx-user-circle'></i>
                        <span>Cuenta</span>
                    </RouterLink>
                </li>
                <li v-if="isPaymentManager">
                    <RouterLink to="/dashboard/payment-methods" class="app-nav-link" active-class="active">
                        <i class='bx bx-wallet'></i>
                        <span>Métodos de Pago</span>
                    </RouterLink>
                </li>
                <li v-if="isDeveloper">
                    <RouterLink to="/dashboard/backups" class="app-nav-link">
                        <i class='bx bx-data'></i>
                        <span>Respaldos</span>
                    </RouterLink>
                </li>
                <li>
                    <a href="#" class="app-nav-link logout-link" @click.prevent="handleLogout">
                        <i class='bx bx-log-out-circle'></i>
                        <span>Cerrar Sesión</span>
                    </a>
                </li>
            </ul>
        </nav>

        <!-- Footer User Card -->
        <div class="app-sidebar-footer">
            <div class="app-user-card">
                <div class="sidebar-avatar">{{ userInitial }}</div>
                <div class="app-user-info" v-if="user">
                    <span class="app-user-name">{{ user.name || user.email }}</span>
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
.sidebar-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50px;
    background: gold;
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 0.9rem;
    flex-shrink: 0;
}

@media (max-width: 900px) {
    .app-sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
    }
    .app-sidebar.open {
        transform: translateX(0);
    }
}
</style>
