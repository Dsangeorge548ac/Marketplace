<script setup>
import { defineProps, defineEmits } from 'vue'
import { getImageUrl } from '@/assets/js/imageHelper.js';

const props = defineProps({
  isOpen: Boolean,
  notice: Object
})

const emit = defineEmits(['close'])

function close() {
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay active" @click.self="close">
    <div class="modal-container-2">
      
      <div class="modal-header">
        <button class="close-button" @click="close">cerrar</button>
      </div>

      <div class="modal-body">
        
        <!-- 1. Header Section (Title & Meta) -->
        <div class="notice-header">
            <h1 class="notice-title-h1">{{ notice.title }}</h1>
            
            <div class="notice-meta">
                <span class="notice-date"><i class='bx bx-calendar'></i> {{ new Date(notice.created_at).toLocaleDateString() }}</span>
            </div>
        </div>

        <!-- 2. Featured Image -->
        <div class="product-gallery">
            <div class="main-image-container">
                <img 
                    :src="getImageUrl(notice.image)" 
                    loading="lazy"
                    alt="Imagen de noticia"
                    @error="$event.target.src = '/placeholder.jpg'"
                >
            </div>
        </div>

        <!-- 3. Content Body -->
        <div class="product-details">
            <div class="description-section">
                <!-- Using v-html if content has formatting, otherwise preserving whitespace -->
                <div class="description-content">
                     <!-- If description contains HTML tags (like from a rich text editor), use v-html. 
                          If plain text but relies on newlines, style="white-space: pre-wrap" works.
                          Assuming plain text for now but structure supports upgrading. -->
                    <p style="white-space: pre-wrap;">{{ notice.description }}</p>
                </div>
            </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
    padding: 0 !important;
}

.modal-body {
    display: flex;
    flex-direction: column;
    padding: 0 120px;
    justify-content: flex-start;
    gap: 20px;
    overflow-y: auto;
    flex: 1;
    
}

html {
    scroll-behavior: smooth;
}

.modal-body::-webkit-scrollbar {
    width: 6px;
    background-color: gainsboro;
}

.modal-body::-webkit-scrollbar-track {
    background: var(--gray-100);
}

.modal-body::-webkit-scrollbar-thumb {
    background: gray;
    border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
    background: rgb(95, 95, 95);
}

.modal-container-2 {
    background: #ffffff;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    animation: modalSlideIn 0.3s ease-out;
    border-radius: 5px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
}

/* Fix for double scrollbar: Override global product-details scroll */
.product-details {
    overflow: visible !important;
    height: auto !important;
    flex: none !important;
    padding: 0 !important;
}

/* Header & Title Styling */
.notice-header {

    display: grid;
    grid-template-columns: repeat(2, max-content);
    justify-content: space-between;
    width: 100%;
    margin-bottom: 30px;
}

.notice-title-h1 {
    font-size: 3rem; /* Matching the large impact of the reference */
    font-weight: 800; /* Extra bold */
    margin-bottom: 15px;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: #000000;
    margin: auto;
    text-align: start;
}

.notice-meta {
    display: flex;
    gap: 20px;
    justify-content: center;
    align-items: center;
    color: #555;
    font-size: 0.95rem;
    margin-top: 15px;
}

.notice-author {
    font-weight: 700;
    color: #000;
    display: flex;
    align-items: center;
    gap: 6px;
}

.notice-date {
    display: flex;
    align-items: center;
    gap: 6px;
}

/* Image Styling */
.product-gallery {
    padding: 0;
}

.main-image-container {
    border-radius: 0;
    box-shadow: none;
    margin-bottom: 30px;
}

.main-image-container img {
    width: 100%;
    display: block;
}

/* Content Styling */
.description-section {
    padding: 0 auto;
}

.description-content {
    font-size: 1.1rem;
    line-height: 1.8;
    color: #333;
    text-align: justify;
}

.description-content h3 {
    font-size: 1.8rem;
    font-weight: 700;
    margin-top: 35px;
    margin-bottom: 15px;
    color: #000;
    font-style: italic;
}

.description-content p {
    margin-bottom: 20px;
}
</style>
