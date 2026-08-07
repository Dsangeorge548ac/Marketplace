import axiosLib from 'axios';
import axios from '@/services/axiosInstance';

let memoryUser = null;
let isSessionCheckedInThisRun = false;

/**
 * Checks the current session status.
 * Returns the user object if authenticated, or null if guest/unauthenticated.
 */
export async function checkSession(forceRefresh = false) {
    // 1. Si ya validamos en esta ejecución de la página, devolvemos lo que hay en memoria
    if (!forceRefresh && isSessionCheckedInThisRun && memoryUser) {
        return memoryUser;
    }

    const storedStr = localStorage.getItem('user');
    // 2. Si no hay nada en localStorage, directo a validar al servidor (es un invitado)
    if (!storedStr) {
        return await validateSessionBlocking();
    }

    // 3. Si hay datos, intentamos validar de forma BLOQUEANTE antes de entrar al Dashboard
    // Esto evita que el usuario vea el dashboard si su sesión de 30 días ya venció
    try {
        const parsedUser = JSON.parse(storedStr);
        
        // En lugar de retornar parsedUser e ir a segundo plano, 
        // vamos a validar contra el servidor de una vez para estar seguros
        const userValido = await validateSessionBlocking();
        
        if (userValido) {
            return userValido;
        } else {
            return null; // El servidor dijo que el token de 30 días murió
        }
    } catch (e) {
        clearSessionData();
        return null;
    }
}

async function validateSessionBlocking() {
    try {
        const { data } = await axios.get('/api/user_service/auth/validate', {
            withCredentials: true
        });

        if (data && data.error) {
            clearSessionData();
            return null;
        }

        memoryUser = data;
        isSessionCheckedInThisRun = true;
        localStorage.setItem('user', JSON.stringify(data));
        return data;

  
    } catch (error) {
        clearSessionData();
        return null;
    }
}


   

async function validateSessionBackground() {
    try {
        const { data } = await axios.get('/api/user_service/auth/validate', {
            withCredentials: true
        });

        if (data && data.error) {
            clearSessionData();
            window.location.hash = '#/auth';
        } else {
            memoryUser = data;
            isSessionCheckedInThisRun = true;
            localStorage.setItem('user', JSON.stringify(data));
        }
    } catch (error) {
        clearSessionData();
        window.location.hash = '#/auth';
    }
}

function clearSessionData() {
    memoryUser = null;
    isSessionCheckedInThisRun = true;
    localStorage.removeItem('user');
}
