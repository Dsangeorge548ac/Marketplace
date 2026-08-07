<template>
  <div class="auth-page">
    <div class="auth-wrapper">

      <!-- LEFT: Form Panel -->
      <div class="auth-form-panel">

        <!-- Logo -->
        <div class="auth-logo" v-show="false">
          <div class="auth-logo-icon">
            <i class='bx bx-sparkles'></i>
          </div>
          <span class="auth-logo-text">Fabrimine</span>
        </div>

        <h1 class="auth-welcome">¡Bienvenido de nuevo!</h1>
        <p class="auth-subtitle">Fabrimine es el marketplace líder para el comercio B2B de maquinaria pesada.</p>

        <!-- Tabs -->
        <div class="auth-tabs">
          <button :class="['auth-tab', { active: !isSignUpMode && !isRecoveryMode }]" @click="toggleMode(false)">Iniciar sesión</button>
          <button :class="['auth-tab', { active: isSignUpMode }]" @click="toggleMode(true)">Registrarse</button>
        </div>

        <!-- ──── LOGIN ──── -->
        <div v-if="!isSignUpMode && !isRecoveryMode" class="auth-body fade-in" key="login">

          <form @submit.prevent="handleSignIn" class="auth-form" autocomplete="off">
            <div class="field">
              <div class="input-icon-wrap">
                <input id="login-email" type="email" v-model="email_in" placeholder="Ingresa tu correo" required />
                <button type="button" class="eye-btn" tabindex="-1">
                  <i class='bx bx-envelope'></i>
                </button>
              </div>
              <span class="field-error" v-if="emailError">{{ emailError }}</span>
            </div>

            <div class="field">
              <div class="input-icon-wrap">
                <input id="login-pass" :type="showPw ? 'text' : 'password'" v-model="password_in" placeholder="Ingresa tu contraseña" required />
                <button type="button" class="eye-btn" @click="showPw = !showPw" tabindex="-1">
                  <i :class="showPw ? 'bx bx-show' : 'bx bx-hide'"></i>
                </button>
              </div>
              <span class="field-error" v-if="passwordError">{{ passwordError }}</span>
            </div>

            <!-- Captcha -->
            <div class="field">
              <label>CAPTCHA</label>
              <div class="captcha-row">
                <img :src="captchaSrc" alt="Captcha" class="captcha-img" @click="refreshCaptcha" title="Clic para recargar" />
                <input type="text" v-model="captcha_in" class="captcha" placeholder="Código" required />
              </div>
              <span class="field-error" v-if="captchaError">{{ captchaError }}</span>
            </div>

            <div class="remember-forgot-row">
              <label class="remember-label">
                <input type="checkbox" v-model="rememberMe" />
                Recuérdame
              </label>
              <a href="#" class="forgot-link" @click.prevent="toggleMode('recovery')">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" class="btn-primary">Entrar</button>
          </form>

          <!-- Or divider -->
          <div class="auth-divider"><span>O</span></div>

          <!-- Social Login -->
          <div class="social-login-btns">
            <GoogleLogin :callback="handleGoogleCallback" />
          </div>
        </div>

        <!-- ──── REGISTER (3 pasos) ──── -->
        <div v-if="isSignUpMode" class="auth-body fade-in" key="register">
      
          <!-- Step indicator -->
          <div class="step-indicator">
            <div :class="['step-dot', { active: signUpStep >= 1, completed: signUpStep > 1 }]"><span>1</span></div>
            <div class="step-line" :class="{ active: signUpStep > 1 }"></div>
            <div :class="['step-dot', { active: signUpStep >= 2, completed: signUpStep > 2 }]"><span>2</span></div>
            <div class="step-line" :class="{ active: signUpStep > 2 }"></div>
            <div :class="['step-dot', { active: signUpStep >= 3 }]"><span>3</span></div>
          </div>
          <p class="step-label" v-if="signUpStep === 1">Datos personales</p>
          <p class="step-label" v-else-if="signUpStep === 2">Contraseña segura</p>
          <p class="step-label" v-else>Pregunta de seguridad</p>

          <form @submit.prevent="handleSignUp" class="auth-form" autocomplete="off">
            <!-- STEP 1: Name & Email -->
            <div v-if="signUpStep === 1" class="step-container fade-in" key="step1">
              <div class="field">
                <label for="reg-name">Nombre completo</label>
                <input id="reg-name" type="text" v-model="name_up" placeholder="Ingresa tu nombre" />
                <span class="field-error" v-if="nameError">{{ nameError }}</span>
              </div>
              <div class="field">
                <label for="reg-email">Correo electrónico</label>
                <input id="reg-email" type="email" v-model="email_up" placeholder="Ingresa tu correo" />
                <span class="field-error" v-if="emailUpError">{{ emailUpError }}</span>
              </div>
              <div class="field-row end">
                <button type="button" class="btn-primary" @click="nextSignUpStep">Siguiente →</button>
              </div>
            </div>

            <!-- STEP 2: Password -->
            <div v-if="signUpStep === 2" class="step-container fade-in" key="step2">
              <div class="field">
                <label for="reg-pass">Contraseña</label>
                <div class="input-icon-wrap">
                  <input id="reg-pass" :type="showPw ? 'text' : 'password'" v-model="password_up" placeholder="Mín. 6 caracteres, 1 mayúscula, 1 número" />
                  <button type="button" class="eye-btn" @click="showPw = !showPw" tabindex="-1">
                    <i :class="showPw ? 'bx bx-show' : 'bx bx-hide'"></i>
                  </button>
                </div>
                <span class="field-error" v-if="passwordUpError">{{ passwordUpError }}</span>
              </div>
              <div class="field">
                <label for="reg-confirm">Confirmar contraseña</label>
                <div class="input-icon-wrap">
                  <input id="reg-confirm" :type="showPwConfirm ? 'text' : 'password'" v-model="confirm_password" placeholder="Repite tu contraseña" />
                  <button type="button" class="eye-btn" @click="showPwConfirm = !showPwConfirm" tabindex="-1">
                    <i :class="showPwConfirm ? 'bx bx-show' : 'bx bx-hide'"></i>
                  </button>
                </div>
                <span class="field-error" v-if="confirmPasswordError">{{ confirmPasswordError }}</span>
              </div>
              <div class="field-row">
                <button type="button" class="btn-secondary" @click="prevSignUpStep">← Atrás</button>
                <button type="button" class="btn-primary" @click="nextSignUpStep">Siguiente →</button>
              </div>
            </div>

            <!-- STEP 3: Security Question -->
            <div v-if="signUpStep === 3" class="step-container fade-in" key="step3">
              <div class="field">
                <label>Pregunta de seguridad</label>
                <select v-model="security_question" class="select-input" required>
                  <option value="" disabled selected>Selecciona una pregunta</option>
                  <option v-for="(q, i) in securityQuestionsList" :key="i" :value="q">{{ q }}</option>
                </select>
                <span class="field-error" v-if="securityQuestionError">{{ securityQuestionError }}</span>
              </div>
              <div class="field">
                <label for="reg-answer">Tu respuesta</label>
                <input id="reg-answer" type="text" v-model="security_answer" placeholder="Escribe tu respuesta secreta" required />
                <span class="field-error" v-if="securityAnswerError">{{ securityAnswerError }}</span>
              </div>
              <div class="field-row">
                <button type="button" class="btn-secondary" @click="prevSignUpStep">← Atrás</button>
                <button type="submit" class="btn-primary">Registrarse ✓</button>
              </div>
            </div>

            <!-- Or divider -->
          <div class="auth-divider"><span>O</span></div>

          <!-- Social Login -->
          <div class="social-login-btns">
            <GoogleLogin :callback="handleGoogleCallback" />
          </div>
          </form>
        </div>

        <!-- ──── RECOVERY ──── -->
        <div v-if="isRecoveryMode" class="auth-body fade-in" key="recovery">
          <p class="auth-desc">Ingresa tu correo registrado para restablecer tu contraseña de forma segura.</p>

          <!-- Step 1: Email -->
          <form v-if="recoveryStep === 1" @submit.prevent="handleRecoveryStep1" class="auth-form" autocomplete="off">
            <div class="field">
              <label for="rec-email">Correo registrado</label>
              <input id="rec-email" type="email" v-model="recoveryEmail" placeholder="ejemplo@correo.com" required />
              <span class="field-error" v-if="recoveryEmailError">{{ recoveryEmailError }}</span>
            </div>
            <div class="field-row">
              <a href="#" class="forgot-link" @click.prevent="toggleMode(false)">Volver</a>
              <button type="submit" class="btn-primary">Continuar</button>
            </div>
          </form>

          <!-- Step 2: Security Q + New Password -->
          <form v-else @submit.prevent="handleRecoveryStep2" class="auth-form" autocomplete="off">
            <div class="field">
              <label>Pregunta de seguridad</label>
              <p class="security-q">{{ recoveryQuestion }}</p>
            </div>
            <div class="field">
              <label for="rec-answer">Tu respuesta</label>
              <input id="rec-answer" type="text" v-model="recoveryAnswer" placeholder="Respuesta secreta" required />
              <span class="field-error" v-if="recoveryAnswerError">{{ recoveryAnswerError }}</span>
            </div>
            <div class="field">
              <label for="rec-newpw">Nueva contraseña</label>
              <div class="input-icon-wrap">
                <input id="rec-newpw" :type="showPw ? 'text' : 'password'" v-model="newPassword" placeholder="Mínimo 6 caracteres" required />
                <button type="button" class="eye-btn" @click="showPw = !showPw" tabindex="-1">
                  <i :class="showPw ? 'bx bx-show' : 'bx bx-hide'"></i>
                </button>
              </div>
              <span class="field-error" v-if="newPasswordError">{{ newPasswordError }}</span>
            </div>
            <div class="field">
              <label for="rec-confirmpw">Confirmar contraseña</label>
              <div class="input-icon-wrap">
                <input id="rec-confirmpw" :type="showPwConfirm ? 'text' : 'password'" v-model="confirmNewPassword" placeholder="Repite nueva contraseña" required />
                <button type="button" class="eye-btn" @click="showPwConfirm = !showPwConfirm" tabindex="-1">
                  <i :class="showPwConfirm ? 'bx bx-show' : 'bx bx-hide'"></i>
                </button>
              </div>
              <span class="field-error" v-if="confirmNewPasswordError">{{ confirmNewPasswordError }}</span>
            </div>
            <div class="field-row">
              <a href="#" class="forgot-link" @click.prevent="toggleMode('signIn')">Volver al login</a>
              <button type="submit" class="btn-primary">Restablecer</button>
            </div>
          </form>
        </div>

      </div>

      <!-- RIGHT: Image Panel -->
      <div class="auth-image-panel">
        <img src="@/assets/img/img30.jpg" alt="Fabrimine" class="auth-hero-img" />
        <div class="auth-image-footer">
          <p>© 2025 Fabrimine. Todos los derechos reservados.<br>
          El uso o reproducción no autorizados de cualquier contenido en esta plataforma está prohibido. Para más información, visita nuestros Términos de Servicio y Política de Privacidad.</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/assets/js/auth.js';

const router = useRouter();
const showPw = ref(false);
const showPwConfirm = ref(false);
const rememberMe = ref(false);

const {
    isSignUpMode,
    email_in,
    password_in,
    captcha_in,
    emailError,
    passwordError,
    captchaError,
    captchaSrc,
    refreshCaptcha,
    name_up,
    email_up,
    password_up,
    confirm_password,
    security_question,
    security_answer,
    securityQuestionsList,
    signUpStep,
    nextSignUpStep,
    prevSignUpStep,
    nameError,
    emailUpError,
    passwordUpError,
    confirmPasswordError,
    securityQuestionError,
    securityAnswerError,
    toggleMode,
    handleSignIn,
    handleSignUp,
    handleGoogleCallback,
    isRecoveryMode,
    recoveryStep,
    recoveryEmail,
    recoveryQuestion,
    recoveryAnswer,
    newPassword,
    confirmNewPassword,
    handleRecoveryStep1,
    handleRecoveryStep2,
    recoveryEmailError,
    recoveryAnswerError,
    newPasswordError,
    confirmNewPasswordError,
} = useAuth();

onMounted(() => {
    if (router.currentRoute.value.query.mode === 'signup') {
        toggleMode(true);
    }
});



</script>

<style scoped>
@import '@/assets/css/pages/auth.css';
</style>
