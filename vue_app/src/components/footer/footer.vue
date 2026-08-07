<script setup>
import '@/assets/css/components/home-footer.css';
import logo from '@/assets/img/logo.png';
</script>

<template>
  <footer class="site-footer">
    <div class="footer-top">
      <div class="footer-brand">
        <router-link to="/" class="footer-logo">
          <img :src="logo" alt="Fabrimine Logo">
        </router-link>
        <p class="footer-text">Explora el marketplace, revisa las noticias y conoce cómo vender en Fabrimine.</p>

        <div class="footer-actions">
          <router-link to="/marketplace" class="footer-action primary-action">Explorar marketplace</router-link>
          <a
            href="https://api.whatsapp.com/send/?phone=4148755808&text&type=phone_number&app_absent=0"
            class="footer-action secondary-action"
            target="_blank"
            rel="noreferrer"
          >
            Hablar por WhatsApp
          </a>
        </div>
      </div>

      <div class="footer-columns">
        <div class="footer-links-group">
          <h4>Explorar</h4>
          <ul>
            <li><router-link to="/">Inicio</router-link></li>
            <li><router-link to="/marketplace">Marketplace</router-link></li>
            <li><router-link to="/noticias">Noticias</router-link></li>
            <li><router-link to="/como-vender">Cómo vender</router-link></li>
            <li><router-link to="/services">Servicios</router-link></li>
          </ul>
        </div>

        <div class="footer-links-group">
          <h4>Contacto</h4>
          <ul>
            <li><a href="https://api.whatsapp.com/send/?phone=4148755808&text&type=phone_number&app_absent=0" target="_blank" rel="noreferrer">WhatsApp</a></li>
            <li><a href="https://www.instagram.com/fabrimine.ca/" target="_blank" rel="noreferrer">Instagram</a></li>
            <li><a href="https://www.facebook.com/p/fabrimineca-100075799825627/" target="_blank" rel="noreferrer">Facebook</a></li>
            <li><a href="mailto:fabrimine.ca@gmail.com">Correo</a></li>
          </ul>
        </div>

        <div class="footer-links-group footer-socials-block">
          <h4>Redes</h4>
          <div class="footer-socials">
            <a href="https://www.instagram.com/fabrimine.ca/" target="_blank" rel="noreferrer" aria-label="Instagram"><i class="bx bxl-instagram"></i></a>
            <a href="https://www.facebook.com/p/fabrimineca-100075799825627/" target="_blank" rel="noreferrer" aria-label="Facebook"><i class="bx bxl-facebook-circle"></i></a>
            <a href="https://api.whatsapp.com/send/?phone=0584148755808&text&type=phone_number&app_absent=0" target="_blank" rel="noreferrer" aria-label="WhatsApp"><i class="bx bxl-whatsapp"></i></a>
            <a href="mailto:fabrimine.ca@gmail.com" aria-label="Correo"><i class="bx bx-envelope"></i></a>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <span class="footer-copyright">© 2026 Fabrimine, C.A.</span>
      <span class="footer-country"><i class="bx bx-globe"></i> Venezuela</span>
    </div>
  </footer>
</template>
