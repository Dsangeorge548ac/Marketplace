<script setup>
import { ref } from 'vue';
import MarketplaceHeader from '@/components/header/MarketplaceHeader.vue';
import imgHero from '@/assets/img/img28.jpg'; 
import heroBg from '@/assets/videos/video2.mp4';

const isMobileSearchActive = ref(false);

const handleSearchToggle = (isActive) => {
    isMobileSearchActive.value = isActive;
};
</script>

<template>
    <section class="commerce-hero-section">
        <!-- Hero Card -->
        <div class="hero-card">
            <!-- Video Background -->
            <video class="hero-image-bg" :src="heroBg" autoplay loop muted playsinline></video>

            <img class="hero-image-bg" :src="imgHero" v-show="false">
            <!-- Dark Overlay -->
            <div class="hero-overlay"></div>
            
            <div class="hero-header-wrapper">
                <MarketplaceHeader @search-toggle="handleSearchToggle" />
                 <!-- Added SVG Curves below header at far ends -->
                 <svg class="header-curve-corner curve-corner-left" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M20 0H0v20c0-11 9-20 20-20z"/>
                 </svg>
                 <svg class="header-curve-corner curve-corner-right" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M0 0h20v20c0-11-9-20-20-20z"/>
                 </svg>
            </div>
            
            <div class="hero-content">
          
            <div class="hero-content">
					<h1>Fabrimine lider en mineria</h1>
		
					<div class="hero-actions">
						<a class="btn btn-primary" href="#">Ir a Marketplace</a>
					</div>
				</div>
                
    
            </div>
        </div>
    </section>
</template>

<style scoped>
@import '@/assets/css/components/marketplace-hero.css';
</style>
