<script setup>
import { ref, onMounted, computed } from 'vue'
import { isSidebarOpen } from '@/assets/js/dashboardState.js'
import { checkSession } from '@/services/authService'
import dashboard_banner from '@/components/dashboard/dashboard_banner.vue'

// Opcional, mantengo tu main.css y el nuevo home.css
import '@/assets/css/pages/dashboard/main.css'
import '@/assets/css/pages/dashboard/home.css'

// Composables para obtener los datos
import { useDashboardBackups } from '@/assets/js/dashboard_backups.js'
import { useDashboardUsers } from '@/assets/js/dashboard_users.js'
import { useDashboardOrders } from '@/assets/js/dashboard_orders.js'
import { useDashboardPublications } from '@/assets/js/dashboard_publications.js'
import { useDashboardNotices } from '@/assets/js/dashboard_notices.js'

// Gráficos (Chart.js)
import { Bar, Doughnut } from 'vue-chartjs'

import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
    ArcElement
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)

const user = ref(null)

// Extraer propiedades evitando superposición de nombres
const { backups } = useDashboardBackups()
const { users, totalCount: totalUsersCount } = useDashboardUsers()
const { totalCount: totalOrdersCount } = useDashboardOrders()
const { totalCount: totalPublicationsCount, products } = useDashboardPublications()
const { totalCount: totalNoticesCount } = useDashboardNotices()

// Computed properties para asegurar que los valores sean reactivos
const countUsers = computed(() => totalUsersCount?.value || users?.value?.length || 0)
const countOrders = computed(() => totalOrdersCount?.value || 0)
const countProducts = computed(() => totalPublicationsCount?.value || products?.value?.length || 0)
const countNotices = computed(() => totalNoticesCount?.value || 0)
const countBackups = computed(() => backups?.value?.length || 0)

// Permisos en base al usuario autenticado
const isAdmin = computed(() => user.value && ['administrador', 'developer'].includes(user.value.role.toLowerCase()))

const isDeveloper = ref(false)

onMounted(async () => {
    user.value = await checkSession()

    isDeveloper.value = user.value.role.toLowerCase() === 'developer'
})

// === Configuración de Gráficos ===

// Opciones globales
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                boxWidth: 12,
                font: { family: "'Inter', sans-serif" }
            }
        }
    }
}

// 1. Gráfico de Barras: Resumen general de la plataforma
const barChartData = computed(() => {
    let labels = ['Usuarios', 'Pedidos', 'Productos', 'Avisos', 'Respaldos']
    let bgColors = [
        'rgba(59, 130, 246, 0.8)', // Azul (Users)
        'rgba(16, 185, 129, 0.8)', // Esmeralda (Orders)
        'rgba(245, 158, 11, 0.8)', // Ambar (Products)
        'rgba(139, 92, 246, 0.8)', // Purpura (Notices)
        'rgba(239, 68, 68, 0.8)'   // Rojo (Backups)
    ]
    let dataPoints = [
        countUsers.value,
        countOrders.value,
        countProducts.value,
        countNotices.value,
        countBackups.value
    ]

    // Si no es admin/developer, filtramos "Usuarios", "Avisos" y "Respaldos"
    if (!isAdmin.value) {
        // Obtenemos los índices de lo que queremos remover (desde atrás hacia adelante para no dañar índices)
        const hideIndexes = [0, 3, 4] // Usuarios (0), Avisos (3), Respaldos (4)
        for (let i = hideIndexes.length - 1; i >= 0; i--) {
            labels.splice(hideIndexes[i], 1)
            bgColors.splice(hideIndexes[i], 1)
            dataPoints.splice(hideIndexes[i], 1)
        }
    }

    return {
        labels: labels,
        datasets: [
            {
                label: 'Total Registrado',
                backgroundColor: bgColors,
                borderRadius: 6,
                data: dataPoints
            }
        ]
    }
})

const barChartOptions = {
    ...chartOptions,
    plugins: {
        legend: { display: false } // No necesitamos leyenda porque las barras tienen las categorías en X
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: {
                color: '#f1f5f9',
                borderDash: [5, 5]
            }
        },
        x: {
            grid: { display: false }
        }
    }
}

// 2. Gráfico de Anillo (Doughnut): Actividad / Interacción
const doughnutChartData = computed(() => {
     let labels = ['Productos', 'Pedidos', 'Avisos', 'Usuarios']
     let bgColors = [
        '#f59e0b', // Productos
        '#10b981', // Pedidos
        '#8b5cf6', // Avisos
        '#3b82f6'  // Usuarios
     ]
     let dataPoints = [
        countProducts.value,
        countOrders.value,
        countNotices.value,
        countUsers.value
     ]

     // De igual forma, quitamos Avisos y Usuarios si no es developer
     if (!isAdmin.value) {
         labels.splice(2, 2)
         bgColors.splice(2, 2)
         dataPoints.splice(2, 2)
     }

    return {
        labels: labels,
        datasets: [
            {
                backgroundColor: bgColors,
                borderWidth: 0,
                hoverOffset: 4,
                data: dataPoints
            }
        ]
    }
})

const doughnutChartOptions = {
    ...chartOptions,
    cutout: '70%'
}
</script>

<template>
    <div>
        <div class="dashboard-content">
            <dashboard_banner />
            
            <div class="dashboard-home">
                
                <!-- ESTADÍSTICAS RÁPIDAS (STAT CARDS) -->
                <div class="stats-grid">
                    
                    <div class="stat-card" v-if="isDeveloper">
                        <div class="stat-card-header">
                            <h4 class="stat-title">Usuarios</h4>
                            <div class="stat-icon icon-users">
                                <i class='bx bx-group'></i>
                            </div>
                        </div>
                        <div>
                            <p class="stat-value">{{ countUsers }}</p>
                            <p class="stat-desc">Usuarios registrados</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <h4 class="stat-title">Pedidos</h4>
                            <div class="stat-icon icon-orders">
                                <i class='bx bx-cart'></i>
                            </div>
                        </div>
                        <div>
                            <p class="stat-value">{{ countOrders }}</p>
                            <p class="stat-desc">Total de órdenes</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <h4 class="stat-title">Productos</h4>
                            <div class="stat-icon icon-products">
                                <i class='bx bx-box'></i>
                            </div>
                        </div>
                        <div>
                            <p class="stat-value">{{ countProducts }}</p>
                            <p class="stat-desc">Artículos publicados</p>
                        </div>
                    </div>
                    
                    <div class="stat-card" v-if="isAdmin">
                        <div class="stat-card-header">
                            <h4 class="stat-title">Avisos</h4>
                            <div class="stat-icon icon-notices">
                                <i class='bx bx-news'></i>
                            </div>
                        </div>
                        <div>
                            <p class="stat-value">{{ countNotices }}</p>
                            <p class="stat-desc">Noticias publicadas</p>
                        </div>
                    </div>

                    <div class="stat-card" v-if="isAdmin">
                        <div class="stat-card-header">
                            <h4 class="stat-title">Respaldos</h4>
                            <div class="stat-icon icon-backups">
                                <i class='bx bx-data'></i>
                            </div>
                        </div>
                        <div>
                            <p class="stat-value">{{ countBackups }}</p>
                            <p class="stat-desc">Copias de seguridad</p>
                        </div>
                    </div>
                    
                </div>
                
                <!-- SECCIÓN DE GRÁFICOS -->
                <div class="charts-grid">
                    
                    <!-- Gráfico Principal: Distribución -->
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3>Resumen General del Sistema</h3>
                            <p>Distribución de todos los registros en la base de datos</p>
                        </div>
                        <div class="chart-body">
                            <Bar 
                                :data="barChartData" 
                                :options="barChartOptions" 
                            />
                        </div>
                    </div>
                    
                    <!-- Gráfico Secundario: Proporción -->
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3>Actividad de Mercado</h3>
                            <p>Proporción entre artículos, ventas y noticias</p>
                        </div>
                        <div class="chart-body" style="min-height: 250px;">
                            <Doughnut 
                                :data="doughnutChartData" 
                                :options="doughnutChartOptions" 
                            />
                        </div>
                    </div>
                    
                </div>
                
            </div> <!-- /dashboard-home -->
            
        </div>
    </div>
</template>
