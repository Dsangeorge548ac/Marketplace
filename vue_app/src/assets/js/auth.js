import { ref, computed } from 'vue'
import Swal from 'sweetalert2'
import axios from '@/services/axiosInstance'
import { checkSession } from '@/services/authService'

export function useAuth() {
    // UI global
    const isSignUpMode = ref(false)
    const mainClass = computed(() => ({ 'sign-up-mode': isSignUpMode.value }))

    // Refs de inicio de sesión
    const email_in = ref('')
    const password_in = ref('')
    const captcha_in = ref('')
    const emailError = ref('')
    const passwordError = ref('')
    const captchaError = ref('')

    // Recovery Mode
    const isRecoveryMode = ref(false)
    const recoveryStep = ref(1) // 1: Email, 2: Question/Answer/Password
    const recoveryEmail = ref('')
    const recoveryQuestion = ref('') // Retrieved from backend
    const recoveryAnswer = ref('')
    const newPassword = ref('')
    const confirmNewPassword = ref('')

    // Recovery Errors
    const recoveryEmailError = ref('')
    const recoveryAnswerError = ref('')
    const newPasswordError = ref('')
    const confirmNewPasswordError = ref('')

    // Captcha
    const captchaSrcBase = '/api/user_service/auth/captcha'
    const captchaSrc = ref(`${captchaSrcBase}?r=${Math.random()}`)
    const refreshCaptcha = () => { captchaSrc.value = `${captchaSrcBase}?r=${Math.random()}` }

    // Registro refs
    const name_up = ref('')
    const email_up = ref('')
    const password_up = ref('')
    const confirm_password = ref('')
    const security_question = ref('') // New field for registration
    const security_answer = ref('')   // New field for registration

    const nameError = ref('')
    const emailUpError = ref('')
    const passwordUpError = ref('')
    const confirmPasswordError = ref('')
    const securityQuestionError = ref('')
    const securityAnswerError = ref('')

    // Sign Up Steps
    const signUpStep = ref(1)

    // Predefined Security Questions
    const securityQuestionsList = [
        "¿Cuál es el nombre de tu primera mascota?",
        "¿En qué ciudad naciste?",
        "¿Cuál es el apellido de soltera de tu madre?",
        "¿Cuál fue el nombre de tu primera escuela?",
        "¿Cuál es tu comida favorita?"
    ]

    // Alternar entre inicio de sesión, registro y recovery
    const toggleMode = (mode) => {
        if (mode === 'recovery') {
            isRecoveryMode.value = true
            isSignUpMode.value = false
            recoveryStep.value = 1
        } else {
            isRecoveryMode.value = false
            isSignUpMode.value = !!mode
            signUpStep.value = 1 // Reset step on toggle
        }
    }

    // --- Validaciones registro ---
    const validateName = () => {
        if (!name_up.value.trim()) {
            nameError.value = 'Por favor, ingresa tu nombre'
            return false
        } else {
            nameError.value = ''
            return true
        }
    }

    const validateEmailUp = () => {
        if (!email_up.value.trim()) {
            emailUpError.value = 'Por favor, ingresa tu correo'
            return false
        } else {
            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!regexEmail.test(email_up.value)) {
                emailUpError.value = 'Ingresa un correo válido'
                return false
            } else {
                emailUpError.value = ''
                return true
            }
        }
    }

    const validatePasswordUp = () => {
        const v = password_up.value
        if (!v.trim()) {
            passwordUpError.value = 'Por favor, crea una contraseña'
            return false
        } else if (v.length < 6) {
            passwordUpError.value = 'La contraseña debe contener al menos 6 caracteres'
            return false
        } else if (!/[A-Z]/.test(v)) {
            passwordUpError.value = 'La contraseña debe contener al menos una letra mayúscula'
            return false
        } else if (!/\d/.test(v)) {
            passwordUpError.value = 'La contraseña debe contener al menos un número'
            return false
        } else {
            passwordUpError.value = ''
            return true
        }
    }

    const validateConfirmPassword = () => {
        const c = confirm_password.value
        if (!c.trim()) {
            confirmPasswordError.value = 'Por favor, confirma tu contraseña'
            return false
        } else if (c !== password_up.value) {
            confirmPasswordError.value = 'Las contraseñas no coinciden'
            return false
        } else {
            confirmPasswordError.value = ''
            return true
        }
    }

    const validateSecurityFields = () => {
        let valid = true
        if (!security_question.value) {
            securityQuestionError.value = 'Selecciona una pregunta de seguridad'
            valid = false
        } else {
            securityQuestionError.value = ''
        }

        if (!security_answer.value.trim()) {
            securityAnswerError.value = 'Responde la pregunta de seguridad'
            valid = false
        } else {
            securityAnswerError.value = ''
        }
        return valid
    }

    const nextSignUpStep = () => {
        if (signUpStep.value === 1) {
            const v1 = validateName()
            const v2 = validateEmailUp()
            if (v1 && v2) signUpStep.value = 2
        } else if (signUpStep.value === 2) {
            const v3 = validatePasswordUp()
            const v4 = validateConfirmPassword()
            if (v3 && v4) signUpStep.value = 3
        }
    }

    const prevSignUpStep = () => {
        if (signUpStep.value > 1) {
            signUpStep.value--
        }
    }

    // --- Envío de inicio de sesión ---
    const handleSignIn = async () => {
        emailError.value = ''
        passwordError.value = ''
        captchaError.value = ''


        if (!email_in.value.trim()) { emailError.value = 'Por favor, ingresa tu correo'; return }
        if (!password_in.value.trim()) { passwordError.value = 'Por favor, ingresa tu contraseña'; return }
        if (!captcha_in.value.trim()) { captchaError.value = 'Por favor, ingresa el captcha'; return }

        try {
            const { data } = await axios.post(
                '/api/user_service/auth/login',
                {
                    email: email_in.value,
                    password: password_in.value,
                    captcha: captcha_in.value
                },
                {
                    withCredentials: true // Importante para cookies
                }
            );

            if (data.status === 'success') {
                // Persist the user in localStorage so navigation doesn't kill the session indicator
                const sessionUser = await checkSession(true);
                if (sessionUser) {
                    localStorage.setItem('user', JSON.stringify(sessionUser));
                }
                await Swal.fire({
                    icon: 'success',
                    title: 'Has iniciado sesión',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
                window.location.href = data.redirect;
            } else {
                // Manejar 200 OK con estado de error (ej. credenciales inválidas)
                Swal.fire({ icon: 'warning', title: 'Datos incorrectos', text: data.message });
                email_in.value = '';
                password_in.value = '';
                captcha_in.value = '';
                refreshCaptcha();
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error de sistema', text: 'Hubo un problema procesando la respuesta del servidor.' });
        }
    }

    // --- Envío de Google Login ---
    const handleGoogleCallback = async (response) => {
        if (!response.credential && !response.access_token) {
            Swal.fire({ icon: 'warning', title: 'Debug (Error Google)', text: JSON.stringify(response) });
            return;
        }

        try {
            Swal.fire({ title: 'Verificando con Google...', didOpen: () => { Swal.showLoading() } });
            
            const { data } = await axios.post('/api/user_service/auth/google-login', {
                credential: response.credential,
                access_token: response.access_token
            }, { withCredentials: true });

            if (data.status === 'success') {
                // Persist the user in localStorage so navigation doesn't kill the session indicator
                const sessionUser = await checkSession(true);
                if (sessionUser) {
                    localStorage.setItem('user', JSON.stringify(sessionUser));
                }
                await Swal.fire({
                    icon: 'success',
                    title: 'Has iniciado sesión con Google',
                    timer: 2000,
                    showConfirmButton: false
                });
                window.location.href = data.redirect;
            } else {
                Swal.fire({ icon: 'warning', title: 'Error', text: data.message });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error de sistema', text: 'Hubo un problema procesando la respuesta de Google.' });
        }
    }



    // --- Envío de registro ---
    const handleSignUp = async () => {
        // 1. Limpiar errores previos
        nameError.value = ''
        emailUpError.value = ''
        passwordUpError.value = ''
        confirmPasswordError.value = ''
        securityQuestionError.value = ''
        securityAnswerError.value = ''

        // 2. Ejecutar todas las validaciones
        validateName()
        validateEmailUp()
        validatePasswordUp()
        validateConfirmPassword()
        validateSecurityFields()

        // 3. Verificar si existe algún error
        if (nameError.value || emailUpError.value || passwordUpError.value || confirmPasswordError.value || securityQuestionError.value || securityAnswerError.value) {
            Swal.fire({
                icon: 'warning',
                title: 'Formulario incompleto',
                text: 'Por favor, corrige los errores antes de registrarte',
                timer: 2000,
                showConfirmButton: false
            })
            return
        }

        // 4. Si todo es válido, enviar
        try {
            const { data } = await axios.post('/api/user_service/auth/register', {
                name_up: name_up.value,
                email_up: email_up.value,
                password_up: password_up.value,
                security_question: security_question.value,
                security_answer: security_answer.value
            }, { withCredentials: true });

            if (data.status === 'success') {
                await Swal.fire({
                    icon: 'success',
                    title: '¡Te has registrado!',
                    text: 'Ahora inicia sesión',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
                // Reseteo y regreso a inicio de sesión
                name_up.value = ''
                email_up.value = ''
                password_up.value = ''
                confirm_password.value = ''
                security_question.value = ''
                security_answer.value = ''
                toggleMode('signIn') // Go to sign in
            } else {
                // Manejar 200 OK con estado de error (ej. Email existe)
                const title = data.status === 'error' && data.message.includes('exists') ? 'Correo duplicado' : 'Error al registrar';
                Swal.fire({ icon: 'warning', title: title, text: data.message || 'Ocurrió un error desconocido' })
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error de sistema', text: 'Hubo un problema procesando la respuesta del servidor.' })
        }
    }

    // --- Recuperación de Contraseña ---
    const handleRecoveryStep1 = async () => {
        recoveryEmailError.value = ''
        if (!recoveryEmail.value.trim()) {
            recoveryEmailError.value = 'Ingresa tu correo'
            return
        }

        try {
            Swal.fire({ title: 'Verificando...', didOpen: () => { Swal.showLoading() } });

            const { data } = await axios.post('/api/user_service/auth/recover-init', {
                email: recoveryEmail.value
            });

            if (data.status === 'success') {
                recoveryQuestion.value = data.question;
                await Swal.fire({
                    icon: 'success',
                    title: 'Correo verificado',
                    text: 'Responde tu pregunta de seguridad',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
                // Guaranteed wait so the user can read the alert
                await new Promise(resolve => setTimeout(resolve, 1000));
                recoveryStep.value = 2;
            } else {
                Swal.fire({ icon: 'warning', title: 'Aviso', text: data.message });
            }

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Usuario no encontrado o error en el servidor.' });
        }
    }

    const handleRecoveryStep2 = async () => {
        recoveryAnswerError.value = ''
        newPasswordError.value = ''
        confirmNewPasswordError.value = ''

        if (!recoveryAnswer.value.trim()) {
            recoveryAnswerError.value = 'Responde la pregunta'
            return
        }
        if (!newPassword.value.trim() || newPassword.value.length < 6) {
            newPasswordError.value = 'Ingresa una nueva contraseña (mínimo 6 caracteres)'
            return
        }
        if (newPassword.value !== confirmNewPassword.value) {
            confirmNewPasswordError.value = 'Las contraseñas no coinciden'
            return
        }

        try {
            Swal.fire({ title: 'Restableciendo...', didOpen: () => { Swal.showLoading() } });

            const { data } = await axios.post('/api/user_service/auth/recover-reset', {
                email: recoveryEmail.value,
                answer: recoveryAnswer.value,
                newPassword: newPassword.value
            });

            if (data.status === 'success') {
                await Swal.fire({
                    icon: 'success',
                    title: 'Contraseña actualizada',
                    text: 'Inicia sesión con tu nueva contraseña.',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
                toggleMode('signIn'); // Back to login

                // Reset fields
                recoveryStep.value = 1;
                recoveryEmail.value = '';
                recoveryAnswer.value = '';
                newPassword.value = '';
                confirmNewPassword.value = '';
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: data.message });
            }

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Respuesta incorrecta o error al actualizar.' });
        }
    }

    return {
        isSignUpMode,
        mainClass,
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
        confirmNewPasswordError
    }
}
