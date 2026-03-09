<script setup>
// import sidebar from '@/components/sidebar/sidebar.vue'; // Removed
    import { useDashboardHome } from '@/assets/js/dashboard_home.js';
    import { isSidebarOpen } from '@/assets/js/dashboardState.js'
    // const { isSidebarOpen } = useDashboardHome(); // Removed local state
</script>

<template>
    <div>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
     <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
    
        <div class="dashboard-content">
                <div class="app-brand-container">
                        <!-- Botón hamburguesa al lado del título -->
                        <button v-if="!isSidebarOpen" class="btn-menu-toggle" @click="isSidebarOpen = true">
                            <i class='bx bx-menu'></i>
                        </button>
                        <!-- Content for dashboard home goes here if any -->
                        <!-- Placeholder title if none exists -->
                        <h3 class="app-brand-title" v-if="!isSidebarOpen">Dashboard</h3> 
                </div>
        </div>
    </div>
</template>
