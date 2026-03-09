// src/assets/js/categories.js

export const miningCategories = {
    'Maquinaria Pesada': [
        'Excavadoras Hidráulicas',
        'Camiones Rígidos y Articulados',
        'Cargadores Frontales',
        'Tractores de Oruga (Dozers)',
        'Motoniveladoras',
        'Perforadoras'
    ],
    'Procesamiento de Minerales': [
        'Trituración/Chancado',
        'Molienda',
        'Clasificación',
        'Concentración',
        'Planta de lavado',
        'Manejo de Materiales'
    ],
    'Equipos Auxiliares e Insumos': [
        'Sistemas de Bombeo',
        'Generación Eléctrica',
        'Repuestos y Consumibles',
        'Seguridad (EPP)'
    ]
};

// Helper for Vue templates to get just the category keys
export const categoryKeys = Object.keys(miningCategories);
