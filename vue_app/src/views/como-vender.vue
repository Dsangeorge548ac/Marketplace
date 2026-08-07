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

const steps = [
    {
        number: '01',
        icon: 'bx bx-user-plus',
        title: 'Crea tu cuenta',
        description: 'Regístrate en nuestra plataforma en pocos minutos. Solo necesitas tu correo electrónico o cuenta de Google para comenzar.',
        color: '#f59e0b'
    },
    {
        number: '02',
        icon: 'bx bx-camera',
        title: 'Publica tu producto',
        description: 'Agrega fotos de alta calidad, descripción detallada, precio y ubicación de tu maquinaria, equipo o mineral. Mientras más información, mejores ventas.',
        color: '#3b82f6'
    },
    {
        number: '03',
        icon: 'bx bx-message-square-dots',
        title: 'Recibe contactos',
        description: 'Los compradores interesados se comunicarán contigo directamente. Responde rápido y cierra negocios de forma segura y eficiente.',
        color: '#10b981'
    },
    {
        number: '04',
        icon: 'bx bx-check-shield',
        title: 'Vende con confianza',
        description: 'Coordina la entrega o envío del producto. Nuestra plataforma conecta compradores verificados del sector minero e industrial.',
        color: '#8b5cf6'
    }
];

const benefits = [
    {
        icon: 'bx bx-globe',
        title: 'Alcance Nacional',
        description: 'Conecta con miles de empresas mineras y operadores industriales en todo el país.'
    },
    {
        icon: 'bx bx-money',
        title: 'Sin comisiones ocultas',
        description: 'Publicar tu equipo es completamente gratis. Tú ganas el 97% de la venta y nosotros el 3%.'
    },
    {
        icon: 'bx bx-shield-quarter',
        title: 'Compradores verificados',
        description: 'Los compradores pasan por un proceso de verificación para asegurar transacciones serias.'
    },
    {
        icon: 'bx bx-trending-up',
        title: 'Visibilidad garantizada',
        description: 'Tu publicación aparece en el marketplace y es visible para tu público objetivo.'
    },
    {
        icon: 'bx bx-support',
        title: 'Soporte dedicado',
        description: 'Nuestro equipo te ayuda en cualquier etapa del proceso de venta.'
    },
    {
        icon: 'bx bx-time',
        title: 'Publica en minutos',
        description: 'El proceso de publicación es rápido, sencillo e intuitivo. No necesitas experiencia técnica.'
    }
];

const faqs = [
    {
        question: '¿Qué puedo vender en Fabrimine?',
        answer: 'Puedes vender maquinaria pesada, equipos industriales, repuestos, insumos mineros, minerales (oro, coltán, cassiterita, etc.), herramientas especializadas y más productos del sector minero e industrial.'
    },
    {
        question: '¿Tiene algún costo publicar?',
        answer: 'No. Publicar tus productos en Fabrimine es completamente gratuito. solo cobramos comisiones por venta del 3%.'
    },
    {
        question: '¿Cómo me pagan los compradores?',
        answer: 'El pago se coordina directamente entre comprador y vendedor. Soportamos pagos en bolívares, dólares y transferencia bancaria. El método de pago lo definen ambas partes.'
    },
    {
        question: '¿Necesito tener una empresa registrada?',
        answer: 'No es obligatorio. Tanto personas naturales como empresas pueden vender en Fabrimine. Sin embargo, tener documentación de tu empresa genera mayor confianza con los compradores.'
    },
    {
        question: '¿Cómo se envían los productos?',
        answer: 'El envío lo coordinas tú directamente con el comprador. Para equipos pesados, ofrecemos servicios de logística especializada que puedes contratar opcionalmente.'
    }
];
</script>

<template>
    <div class="como-vender-wrapper">
        <MarketplaceHeader />
        <MineralTicker />

        <main class="como-vender-main">

            <!-- Hero Section -->
            <section class="cv-hero-section" v-show="false">
                <div class="cv-hero-container">
                    <div class="cv-hero-content">
                        <span class="cv-hero-badge">
                            <i class='bx bx-store-alt'></i> Marketplace B2B Minero
                        </span>
                        <h1 class="cv-hero-title">Vende tu maquinaria y equipos mineros</h1>
                        <p class="cv-hero-subtitle">Conecta con miles de compradores del sector minero e industrial. Publica gratis y comienza a generar ingresos con Fabrimine.</p>
                        <div class="cv-hero-actions">
                            <button class="cv-btn-primary" @click="goToAuth">
                                <i class='bx bx-rocket'></i> Comenzar a vender
                            </button>
                            <button class="cv-btn-secondary" @click="redirectWSP">
                                <i class='bx bxl-whatsapp'></i> Contactar ahora
                            </button>
                        </div>
                        <div class="cv-hero-stats">
                            <div class="cv-stat">
                                <span class="cv-stat-number">500+</span>
                                <span class="cv-stat-label">Productos listados</span>
                            </div>
                            <div class="cv-stat-divider"></div>
                            <div class="cv-stat">
                                <span class="cv-stat-number">200+</span>
                                <span class="cv-stat-label">Empresas activas</span>
                            </div>
                            <div class="cv-stat-divider"></div>
                            <div class="cv-stat">
                                <span class="cv-stat-number">24</span>
                                <span class="cv-stat-label">Estados cubiertos</span>
                            </div>
                        </div>
                    </div>
                    <div class="cv-hero-visual">
                        <div class="cv-hero-graphic">
                            <div class="cv-graphic-circle cv-circle-1"></div>
                            <div class="cv-graphic-circle cv-circle-2"></div>
                            <div class="cv-graphic-circle cv-circle-3"></div>
                            <div class="cv-graphic-icon-wrap">
                                <i class='bx bx-package'></i>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Steps Section -->
            <section class="cv-steps-section">
                <div class="cv-section-container">
                    <div class="cv-section-header">
                        <h2 class="cv-section-title">¿Cómo funciona?</h2>
                        <p class="cv-section-subtitle">Vender en Fabrimine es rápido y sencillo. Sigue estos 4 pasos para comenzar.</p>
                    </div>

                    <div class="cv-steps-grid">
                        <div 
                            v-for="step in steps" 
                            :key="step.number" 
                            class="cv-step-card"
                        >
                            <div class="cv-step-number" :style="{ background: step.color }">{{ step.number }}</div>
                            <div class="cv-step-icon-wrap" :style="{ background: step.color + '12' }">
                                <i :class="step.icon" :style="{ color: step.color }"></i>
                            </div>
                            <h3 class="cv-step-title">{{ step.title }}</h3>
                            <p class="cv-step-description">{{ step.description }}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Benefits Section -->
            <section class="cv-benefits-section">
                <div class="cv-section-container">
                    <div class="cv-section-header">
                        <h2 class="cv-section-title">¿Por qué vender con nosotros?</h2>
                        <p class="cv-section-subtitle">Fabrimine ofrece ventajas únicas para vendedores del sector minero.</p>
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

            <!-- FAQ Section -->
            <section class="cv-faq-section">
                <div class="cv-section-container">
                    <div class="cv-section-header">
                        <h2 class="cv-section-title">Preguntas frecuentes</h2>
                        <p class="cv-section-subtitle">Resolvemos tus dudas más comunes sobre vender en Fabrimine.</p>
                    </div>

                    <div class="cv-faq-list">
                        <details v-for="(faq, index) in faqs" :key="index" class="cv-faq-item">
                            <summary class="cv-faq-question">
                                <span>{{ faq.question }}</span>
                                <i class='bx bx-plus cv-faq-toggle-icon'></i>
                            </summary>
                            <div class="cv-faq-answer">
                                <p>{{ faq.answer }}</p>
                            </div>
                        </details>
                    </div>
                </div>
            </section>

            <!-- CTA Section -->
            <section class="cv-cta-section">
                <div class="cv-cta-container">
                    <h2 class="cv-cta-title">¿Listo para vender?</h2>
                    <p class="cv-cta-subtitle">Crea tu cuenta hoy y comienza a llegar a cientos de compradores del sector minero.</p>
                    <div class="cv-cta-actions">
                        <button class="cv-btn-primary cv-btn-lg" @click="goToAuth">
                            <i class='bx bx-rocket'></i> Crear mi cuenta gratis
                        </button>
                        <button class="cv-btn-outline cv-btn-lg" @click="redirectWSP">
                            <i class='bx bxl-whatsapp'></i> Hablar con un asesor
                        </button>
                    </div>
                </div>
            </section>

        </main>

        <FooterComponent />
    </div>
</template>

<style src="@/assets/css/pages/como-vender.css" scoped></style>
