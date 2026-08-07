<script setup>
import { ref, computed, onMounted } from 'vue';
import axios, { getApiBaseUrl } from '@/services/axiosInstance';
import Swal from 'sweetalert2';
import { checkSession } from '@/services/authService';

const currentStep = ref(1);
const isSavingStep1 = ref(false);
const isSavingStep2 = ref(false);
const isSubmitting = ref(false);
const isLoadingProfile = ref(true);
const sessionUser = ref(null);
const myVerification = ref(null);

const form = ref({
  business_name: '',
  tax_address: '',
  tax_id: '',
  phone: ''
});

const fileInputs = ref({
  cbm_alliance_document: null,
  tax_id_document: null,
  face_photo: null
});

const verificationStatus = computed(() => String(myVerification.value?.verification || 'Borrador'));
const isVerified = computed(() => verificationStatus.value.toLowerCase() === 'verificado');
const canStartVerification = computed(() => !isVerified.value);

const progress = computed(() => {
  const data = myVerification.value || {};
  const checks = [
    !!data.business_name,
    !!data.tax_address,
    !!data.tax_id,
    !!data.phone,
    !!data.cbm_alliance_document,
    !!data.tax_id_document,
    !!data.face_photo
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
});

const statusClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('verificado')) return 'ok';
  if (normalized.includes('cancelado')) return 'warn';
  if (normalized.includes('pendiente')) return 'pending';
  return 'draft';
};

const statusLabel = computed(() => {
  if (isVerified.value) return 'Cuenta verificada';
  if (verificationStatus.value.toLowerCase().includes('pendiente')) return 'En revision';
  return 'Verificacion pendiente';
});

const profileName = computed(() => {
  return sessionUser.value?.name || 'Tu perfil';
});

const businessName = computed(() => {
  return myVerification.value?.business_name || 'Sin nombre registrado';
});

const verificationInfo = computed(() => ({
  tax_id: myVerification.value?.tax_id || 'Sin dato',
  phone: myVerification.value?.phone || 'Sin dato',
  tax_address: myVerification.value?.tax_address || 'Sin dato'
}));

const profileEmail = computed(() => {
  return sessionUser.value?.email || 'Sin correo registrado';
});

const documentLinks = computed(() => ([
  myVerification.value?.cbm_alliance_document ? {
    label: 'Documento CBM',
    href: fileUrl(myVerification.value.cbm_alliance_document)
  } : null,
  myVerification.value?.tax_id_document ? {
    label: 'Cedula o RIF',
    href: fileUrl(myVerification.value.tax_id_document)
  } : null,
  myVerification.value?.face_photo ? {
    label: 'Foto de rostro',
    href: fileUrl(myVerification.value.face_photo)
  } : null
]).filter(Boolean));

const fileUrl = (storedPath) => {
  if (!storedPath) return '';
  if (String(storedPath).startsWith('http')) return String(storedPath);
  
  let baseURL = getApiBaseUrl();
  baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;

  const cleanPath = String(storedPath).replace(/^\/+/, '');
  return `${baseURL}/user_service/${cleanPath}`;
};

import { optimizeImage } from '@/services/imageOptimizer';

const onFileChange = async (event, key) => {
  let file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
  if (file) {
    isSavingStep2.value = true; // Use existing flag to disable buttons during optimization
    try {
      file = await optimizeImage(file);
    } finally {
      isSavingStep2.value = false;
    }
  }
  fileInputs.value[key] = file;
};

const hydrateForm = (payload) => {
  form.value.business_name = payload.business_name || '';
  form.value.tax_address = payload.tax_address || '';
  form.value.tax_id = payload.tax_id || '';
  form.value.phone = payload.phone || '';
};

const loadMyVerification = async () => {
  isLoadingProfile.value = true;
  try {
    const { data } = await axios.get('/api/user_service/account/me', { withCredentials: true });
    myVerification.value = data.data;
    hydrateForm(data.data || {});
  } catch (error) {
    Swal.fire('Error', 'No se pudo cargar la verificacion de cuenta', 'error');
  } finally {
    isLoadingProfile.value = false;
  }
};

const saveStepOne = async () => {
  if (!form.value.business_name || !form.value.tax_address || !form.value.tax_id || !form.value.phone) {
    Swal.fire('Campos incompletos', 'Debes completar todos los datos fiscales del paso 1', 'warning');
    return;
  }

  isSavingStep1.value = true;
  try {
    await axios.post('/api/user_service/account/me/step-1', form.value, { withCredentials: true });
    await loadMyVerification();
    Swal.fire('Guardado', 'Datos del paso 1 guardados correctamente', 'success');
    currentStep.value = 2;
  } catch (error) {
    const message = error.response?.data?.message || 'Error al guardar el paso 1';
    Swal.fire('Error', message, 'error');
  } finally {
    isSavingStep1.value = false;
  }
};

const saveStepTwo = async () => {
  const payload = new FormData();
  if (fileInputs.value.cbm_alliance_document) payload.append('cbm_alliance_document', fileInputs.value.cbm_alliance_document);
  if (fileInputs.value.tax_id_document) payload.append('tax_id_document', fileInputs.value.tax_id_document);
  if (fileInputs.value.face_photo) payload.append('face_photo', fileInputs.value.face_photo);

  if (!payload.has('cbm_alliance_document') && !payload.has('tax_id_document') && !payload.has('face_photo')) {
    Swal.fire('Sin archivos', 'Selecciona al menos un archivo para guardar este paso', 'warning');
    return;
  }

  isSavingStep2.value = true;
  try {
    await axios.post('/api/user_service/account/me/step-2', payload, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    await loadMyVerification();
    Swal.fire('Guardado', 'Documentos guardados correctamente', 'success');
    currentStep.value = 3;
  } catch (error) {
    const message = error.response?.data?.message || 'Error al guardar los documentos';
    Swal.fire('Error', message, 'error');
  } finally {
    isSavingStep2.value = false;
  }
};

const submitVerification = async () => {
  isSubmitting.value = true;
  try {
    await axios.post('/api/user_service/account/me/submit', {}, { withCredentials: true });
    await loadMyVerification();
    Swal.fire('Enviado', 'Tu solicitud fue enviada para revision administrativa', 'success');
  } catch (error) {
    const missing = error.response?.data?.missing || [];
    const message = missing.length > 0
      ? `Faltan campos o documentos: ${missing.join(', ')}`
      : (error.response?.data?.message || 'No se pudo enviar la solicitud');
    Swal.fire('Error', message, 'error');
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  sessionUser.value = await checkSession();
  await loadMyVerification();
});

const userInitial = computed(() => {
  const name = profileName.value || profileEmail.value || '';
  return name.charAt(0).toUpperCase() || '?';
});


</script>

<template>

  <main class="verification-page">

    <section class="card profile-card">
      <div class="profile-header">
        <div class="profile-avatar">{{ userInitial }}</div>

        <div class="profile-heading">
          <h3>{{ profileName }}</h3>
          <p class="lead">{{ profileEmail }}</p>
        </div>

        <div class="profile-actions" v-show="false">
          <button type="button" class="btn ghost">Quitar la foto</button>
          <button type="button" class="btn primary">Cambiar la foto</button>
        </div>
      </div>

      <div class="profile-divider"></div>

      <div class="profile-rows">
        <div class="profile-row">
          <div>
            <span class="row-label">Nombre</span>
            <strong class="row-value">{{ profileName }}</strong>
          </div>
        </div>

        <div class="profile-row">
          <div>
            <span class="row-label">Correo electrónico</span>
            <strong class="row-value">{{ profileEmail }}</strong>
          </div>
  
        </div>

        <div class="profile-row stack-row">
          <div>
            <span class="row-label">Estado de verificación</span>
            <strong class="row-value">{{ statusLabel }}</strong>
          </div>
          <span class="status-pill" :class="statusClass(verificationStatus)">{{ verificationStatus }}</span>
        </div>

        <div class="profile-section-title">Informacion de la verificacion</div>

       <div class="verification-info">
        <div class="profile-row verify-row" style="border:none;">
          <div>
            <span class="row-label">Nombre o razon social</span>
            <strong class="row-value">{{ businessName }}</strong>
          </div>
        </div>

        <div class="profile-row verify-row" style="border:none;">
          <div>
            <span class="row-label">Rif/Cedula</span>
            <strong class="row-value">{{ verificationInfo.tax_id }}</strong>
          </div>
        </div>

        <div class="profile-row verify-row" style="border:none;">
          <div>
            <span class="row-label">Telefono</span>
            <strong class="row-value">{{ verificationInfo.phone }}</strong>
          </div>
        </div>

        
        <div class="profile-row verify-row" style="border:none;">
          <div>
            <span class="row-label">Domicilio fiscal</span>
            <strong class="row-value">{{ verificationInfo.tax_address }}</strong>
          </div>
   
        </div>

       </div>
        


      </div>


    </section>

    <section v-if="!isLoadingProfile && documentLinks.length" class="card docs-card">
      <header class="section-head">
        <h2>Documentos cargados</h2>
        <p>Estos archivos siguen disponibles para consulta mientras completas o revisas tu verificación.</p>
      </header>

      <div class="docs-row">
        <a v-for="document in documentLinks" :key="document.label" :href="document.href" target="_blank" rel="noopener">
          {{ document.label }}
        </a>
      </div>
    </section>

    <section class="card status-card" v-if="!isVerified">
      <div class="hero-status">
        <span class="status-pill" :class="statusClass(verificationStatus)">{{ statusLabel }}</span>
        <div class="progress-wrap" v-if="!isVerified">
          <div class="progress-header">
            <span>Progreso de solicitud</span>
            <strong>{{ progress }}%</strong>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
        </div>
        <div class="hero-kpis">  
          <article>
            <span>Paso</span>
            <strong>{{ currentStep }}/3</strong>
          </article>
          <article>
            <span>Estado</span>
            <strong>{{ verificationStatus }}</strong>
          </article>
        </div>
      </div>
    </section>

    <section v-if="isLoadingProfile" class="card loading-card">
      <div class="skeleton title"></div>
      <div class="skeleton line"></div>
      <div class="skeleton line short"></div>
    </section>

    <section v-if="!isLoadingProfile && myVerification && isVerified" class="card verified-account" v-show="false">
      <header class="section-head">
        <h2>Cuenta verificada</h2>
        <p>Tu cuenta ya fue aprobada. A continuacion puedes consultar la informacion registrada.</p>
      </header>

      <div class="data-grid">
        <article>
          <span class="k">Razon social</span>
          <span class="v">{{ myVerification.business_name || 'Sin dato' }}</span>
        </article>
        <article>
          <span class="k">RIF/Cedula</span>
          <span class="v">{{ myVerification.tax_id || 'Sin dato' }}</span>
        </article>
        <article>
          <span class="k">Telefono</span>
          <span class="v">{{ myVerification.phone || 'Sin dato' }}</span>
        </article>
        <article>
          <span class="k">Domicilio fiscal</span>
          <span class="v">{{ myVerification.tax_address || 'Sin dato' }}</span>
        </article>
      </div>
    </section>

    <section v-if="!isLoadingProfile && myVerification && canStartVerification" class="card wizard-card">
      <header class="section-head">
        <h2>Verificar cuenta</h2>
        <p>Si aun no estas verificado, completa estos pasos para enviar tu solicitud.</p>
      </header>

      <div class="wizard-shell">
        <div class="stepper">
          <button class="step" :class="{ active: currentStep === 1 }" @click="currentStep = 1">1. Datos fiscales</button>
          <button class="step" :class="{ active: currentStep === 2 }" @click="currentStep = 2">2. Documentos</button>
          <button class="step" :class="{ active: currentStep === 3 }" @click="currentStep = 3">3. Enviar solicitud</button>
        </div>

        <div v-if="currentStep === 1" class="step-content">
          <div class="grid-2">
            <label>
              Nombre o razon social
              <input v-model="form.business_name" type="text" placeholder="Ejemplo: HORIZONTE DEL FUTURO, C.A." />
            </label>
            <label>
              RIF o cedula
              <input v-model="form.tax_id" type="text" placeholder="Ejemplo: J-50287372-9" />
            </label>
            <label>
              Numero de telefono
              <input v-model="form.phone" type="text" placeholder="Ejemplo: 04141234567" />
            </label>
          </div>

          <label>
            Domicilio fiscal
            <textarea v-model="form.tax_address" rows="3" placeholder="Direccion fiscal completa"></textarea>
          </label>

          <div class="actions">
            <button class="btn primary" :disabled="isSavingStep1" @click="saveStepOne">
              {{ isSavingStep1 ? 'Guardando...' : 'Guardar paso 1' }}
            </button>
          </div>
        </div>

        <div v-if="currentStep === 2" class="step-content">
          <div class="grid-1 upload-grid">
            <div class="upload-item">
              <label>
                Documento de alianza con la CVM o concecion de mina
                <input type="file" @change="onFileChange($event, 'cbm_alliance_document')" />
              </label>
              <a v-if="myVerification?.cbm_alliance_document" :href="fileUrl(myVerification.cbm_alliance_document)" target="_blank" rel="noopener">Ver documento actual</a>
            </div>

            <div class="upload-item">
              <label>
                Foto de la cedula o RIF
                <input type="file" @change="onFileChange($event, 'tax_id_document')" />
              </label>
              <a v-if="myVerification?.tax_id_document" :href="fileUrl(myVerification.tax_id_document)" target="_blank" rel="noopener">Ver archivo actual</a>
            </div>

            <div class="upload-item">
              <label>
                Foto del rostro
                <input type="file" accept="image/*" @change="onFileChange($event, 'face_photo')" />
              </label>
              <a v-if="myVerification?.face_photo" :href="fileUrl(myVerification.face_photo)" target="_blank" rel="noopener">Ver imagen actual</a>
            </div>
          </div>

          <div class="actions">
            <button class="btn" @click="currentStep = 1">Volver</button>
            <button class="btn primary" :disabled="isSavingStep2" @click="saveStepTwo">
              {{ isSavingStep2 ? 'Guardando...' : 'Guardar paso 2' }}
            </button>
          </div>
        </div>

        <div v-if="currentStep === 3" class="step-content">
          <p class="pre-submit">Antes de enviar, valida que tu informacion este completa.</p>
          <ul class="checklist">
            <li>Nombre o razon social: {{ form.business_name || 'Sin completar' }}</li>
            <li>Domicilio fiscal: {{ form.tax_address || 'Sin completar' }}</li>
            <li>RIF o cedula: {{ form.tax_id || 'Sin completar' }}</li>
            <li>Numero de telefono: {{ form.phone || 'Sin completar' }}</li>
          </ul>

          <div class="actions">
            <button class="btn" @click="currentStep = 2">Volver</button>
            <button class="btn primary" :disabled="isSubmitting" @click="submitVerification">
              {{ isSubmitting ? 'Enviando...' : 'Enviar a revision' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="!isLoadingProfile && myVerification?.verification_feedback" class="card feedback-card">
      <h3>Observaciones</h3>
      <p>{{ myVerification.verification_feedback }}</p>
    </section>
  </main>
</template>

<style scoped src="@/assets/css/pages/dashboard/account.css">

</style>

