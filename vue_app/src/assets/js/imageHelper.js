export function getImageUrl(imagePath) {
    if (!imagePath) return null // Return null to allow UI to handle fallback
    if (imagePath.startsWith('http')) return imagePath

    // Fallback para WAMP local si no hay variable de entorno
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/fabrimine'
    const imgPrefix = import.meta.env.VITE_IMG_PREFIX || ''

    let cleanPath = imagePath
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1) // Normalizar quitando slash inicial

    // Si viene como path absoluto de disco o relativo extraño, limpiamos
    // Si viene como path absoluto de disco o relativo extraño, limpiamos
    // Estrategia robusta: Si contiene 'uploads/', nos quedamos con eso y lo que sigue.
    if (cleanPath.includes('uploads/')) {
        cleanPath = cleanPath.substring(cleanPath.indexOf('uploads/'))
    }
    // Si contiene 'src/' pero no uploads (caso raro), quitamos 'src/'
    else if (cleanPath.includes('src/')) {
        cleanPath = cleanPath.replace('src/', '')
    }

    // Normalización de rutas
    if (!cleanPath.startsWith('http')) {

        // 1. Detect environment
        // If we are in Docker (implied by NGINX presence usually), we need /publications_service/uploads/
        // If we represent a bare filename 'cat.jpg', likely needs full path.

        // Clean any existing incorrect prefixes
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
        if (cleanPath.startsWith('src/')) cleanPath = cleanPath.replace('src/', '');

        // Ensure 'uploads/' is present
        if (!cleanPath.includes('uploads/')) {
            cleanPath = `uploads/${cleanPath}`;
        }

        // Ensure 'publications_service/' is present (Crucial for NGINX)
        if (!cleanPath.includes('publications_service/')) {
            cleanPath = `publications_service/${cleanPath}`;
        }

        // Ensure leading slash
        if (!cleanPath.startsWith('/')) {
            cleanPath = `/${cleanPath}`;
        }
    }

    if (cleanPath.startsWith('http')) return cleanPath

    // Evitar dobles slashes con base URL si este ya incluye el host 
    // pero si apiBaseUrl es solo el host, concatenamos

    // CASO DOCKER: VITE_API_BASE_URL suele ser vacio o '/' o el host.
    // Si la ruta ya es absoluta al dominio (empieza con /), la devolvemos tal cual para que el navegador la pida al mismo host
    return cleanPath;
}

export function handleImageError(event) {
    // Evitar bucle infinito
    if (event.target.src.includes('placeholder.jpg')) return
    event.target.src = '/placeholder.jpg'
}
