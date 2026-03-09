<script setup>
</script>

<template>
    <div class="contact-banner-container">
        <div class="contact-banner">
            <h2 class="contact-title">¿Necesitas ayuda para encontrar tu equipo ideal hoy?</h2>
            <p class="contact-subtitle">
                Nuestro equipo está listo para guiarte a través de modelos, opciones de financiamiento,
                y ofertas exclusivas para hacer tu próxima compra sin esfuerzo.
            </p>
            
            <div class="contact-profile">
                <img src="https://ui-avatars.com/api/?name=Felix+Hartmann&background=random" alt="Felix Hartmann" class="profile-img">
                <div class="profile-info">
                    <span class="profile-name">Felix Hartmann</span>
                    <span class="profile-role">Director de Ventas</span>
                </div>
            </div>
            
            <button class="contact-btn">Contactar a Felix</button>
        </div>
    </div>
</template>

<style scoped>
.contact-banner-container {
    width: 100%;
    background-color: #f7f7f7; /* Matching the footer bg or image bg */
    padding: 80px 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 40px;
}

.contact-banner {
    max-width: 800px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.contact-title {
    font-size: 3rem;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.2;
    margin-bottom: 24px;
    letter-spacing: -1.5px;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.contact-subtitle {
    font-size: 1.15rem;
    color: #555;
    line-height: 1.6;
    margin-bottom: 40px;
    max-width: 650px;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.contact-profile {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 32px;
}

.profile-img {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.profile-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.profile-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a1a;
}

.profile-role {
    font-size: 0.95rem;
    color: #666;
    margin-top: 4px;
}

.contact-btn {
    background-color: #1a1a1a;
    color: #fff;
    border: none;
    padding: 16px 32px;
    font-size: 1.05rem;
    font-weight: 600;
    border-radius: 50px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.contact-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

@media (max-width: 768px) {
    .contact-title {
        font-size: 2.2rem;
    }
    .contact-subtitle {
        font-size: 1rem;
    }
}
</style>
