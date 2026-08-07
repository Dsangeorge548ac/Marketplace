<script setup>
import MarketplaceHeader from '@/components/header/Header.vue';
import MineralTicker from '@/components/MineralTicker.vue';
import FooterComponent from '@/components/footer/footer.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const redirectWSP = () => {
    window.open('https://api.whatsapp.com/send/?phone=0584148755808&text=Hola,%20quiero%20vender%20en%20Fabrimine&type=phone_number&app_absent=0', '_blank');
};

const goToAuth = () => {
    router.push('/auth');
};

const benefits = [
    {
        icon: 'bx bx-globe',
        title: 'Alcance Nacional',
        description: 'Vendemos nuestra maquinaria a compradores de todo el país.'
    },
    {
        icon: 'bx bx-money',
        title: 'Mantenimiento y montaje',
        description: 'Somos especialistas en alineación, vulcanizado y reparación de sistemas hidráulicos para maquinaria pesada.'
    },
    {
        icon: 'bx bx-shield-quarter',
        title: 'Alquiler (Renting)',
        description: 'Flota pesada certificada con contratos flexibles adaptados al ciclo de tu operación.'
    },
    {
        icon: 'bx bx-trending-up',
        title: 'Geología y Prospección',
        description: 'Desde la perforación diamantina hasta los estudios de mapeo geológico con análisis de laboratorio.'
    },
    {
        icon: 'bx bx-support',
        title: 'Logística EspecializadaSoporte dedicado',
        description: 'Transporte de carga sobredimensionada y manejo de sustancias controladas hasta zonas remotas.'
    },
    {
       icon: 'bx bx-time',
        title: 'Marketplace B2B',
        description: 'Plataforma para compra y venta de maquinaria y equipos para la industria minera.'
    }
];

</script>

<template>
    <div class="como-vender-wrapper">
        <MarketplaceHeader />
        <MineralTicker />

        <main class="como-vender-main">

            <!-- Benefits Section -->
            <section class="cv-benefits-section">
                <div class="cv-section-container">
                    <div class="cv-section-header">
                        <h2 class="cv-section-title">Nuestros servicios</h2>
                        <p class="cv-section-subtitle">Fabrimine ofrece una amplia gama de servicios para satisfacer las necesidades de nuestros clientes.</p>
                    </div>

                    <div class="cv-benefits-grid">
                        <div 
                            v-for="(benefit, index) in benefits" 
                            :key="index" 
                            class="cv-benefit-card"
                        >
                            <div class="cv-benefit-icon">
                                <i :class="benefit.icon"></i>
                            </div>
                            <h3 class="cv-benefit-title">{{ benefit.title }}</h3>
                            <p class="cv-benefit-description">{{ benefit.description }}</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <FooterComponent />
    </div>
</template>

<style src="@/assets/css/pages/como-vender.css" scoped></style>
