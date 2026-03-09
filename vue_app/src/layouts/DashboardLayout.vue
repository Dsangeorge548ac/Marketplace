<script setup>
import { RouterView } from 'vue-router';
import sidebar from '@/components/sidebar/sidebar.vue';
import { isSidebarOpen } from '@/assets/js/dashboardState.js';
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
    document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
    document.body.style.overflow = '';
});
</script>

<template>
  <main class="main-content-dashboard">
    <div class="container-place-dashboard">
       <sidebar :isOpen="isSidebarOpen" @toggle="isSidebarOpen = !isSidebarOpen" />
        
        <div class="section-scroll-dasboard" :class="{ 'expanded': !isSidebarOpen }">
            <!-- Inner Content - Las páginas individuales manejan el botón hamburguesa junto a su título -->
            <RouterView /> 
        </div>
        
    </div>
  </main>
</template>

<style scoped>
/* Ensure the layout fills the screen */
.main-content-dashboard {
    min-height: 100vh;
    background-color: #f8f9fa; /* Match dashboard.css */
}
</style>
