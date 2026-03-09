<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

// Categorías del marketplace B2B con emojis representativos
// Industry Icons (Colorful Solid Theme to match reference)
const ecosystemIcons = [
    { icon: 'bx bxs-hard-hat', label: 'Minería', color: 'rgb(234, 179, 8)' }, // Gold
    { icon: 'bx bxs-factory', label: 'Procesamiento', color: 'rgb(234, 179, 8)' }, // Orange
    { icon: 'bx bxs-truck', label: 'Transporte', color: 'rgb(234, 179, 8)' }, // Blue
    { icon: 'bx bxs-building-house', label: 'Construcción', color: 'rgb(234, 179, 8)' }, // Yellow
    { icon: 'bx bxs-wrench', label: 'Equipos', color: 'rgb(234, 179, 8)' }, // Purple
    { icon: 'bx bxs-package', label: 'Logística', color: 'rgb(234, 179, 8)' }, // Pink
    { icon: 'bx bxs-bar-chart-alt-2', label: 'Trading', color: 'rgb(234, 179, 8)' }, // Green
];
</script>

<template>
    <section class="hero-clean-white">
        <div class="hero-content-clean">
            <!-- Main Typography -->
            <h1 class="hero-title-clean">
                Construyendo un ecosistema inclusivo para una <br class="desktop-only">
                economía global sostenible
            </h1>
            
            <p class="hero-subtitle-clean">
                La primera plataforma de intercambio industrial y de commodities <br class="desktop-only">
                bajo tecnología blockchain con su propio token de seguridad.
            </p>

            <!-- Icon Grid -->
            <div class="hero-icon-grid">
                <div 
                    v-for="(item, index) in ecosystemIcons" 
                    :key="index" 
                    class="icon-card"
                    :title="item.label"
                >
                    <i :class="item.icon" class="industry-icon" :style="{ color: item.color }"></i>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
/* Scoped styles can be here or in home-bento.css. 
   We will put main styles in home-bento.css to keep pattern. */
</style>
