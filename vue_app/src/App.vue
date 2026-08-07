<script setup>

import { RouterView } from 'vue-router'; 
import CartSidebar from '@/components/cart/CartSidebar.vue';
</script>

<template>
    <main>
        <CartSidebar />
        <RouterView v-slot="{ Component }">
            <transition name="page-fade" mode="out-in">
                <component :is="Component" :key="$route.path" />
            </transition>
        </RouterView> 
    </main>
</template>
