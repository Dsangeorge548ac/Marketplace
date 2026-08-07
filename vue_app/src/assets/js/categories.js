// src/assets/js/categories.js

export const miningCategories = {
    'Maquinaria Pesada': [
        'Excavadoras Hidráulicas',
        'Camiones Rígidos y Articulados',
        'Cargadores Frontales',
        'Tractores de Oruga (Dozers)',
        'Motoniveladoras',
        'Perforadoras',
        'Gruas'
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
    ],
    'De hizaje / elevacion vertical': [
        'Montacargas',
        'Elevadores de Carga',
        'Sistemas de Izaje Personal'
    ],
    'Minerales': [
        'Mineral Precioso',
        'Mineral No Precioso',
        'Gemas y Piedras Preciosas',
        'Minerales Industriales'
    ]
};

// Helper for Vue templates to get just the category keys
export const categoryKeys = Object.keys(miningCategories);

// Mineral-specific constants
export const mineralNames = [
    'Oro', 'Plata', 'Platino', 'Rodio', 'Paladio',
    'Casiterita', 'Coltán', 'Peya', 'Bauxita', 'Cobre',
    'Diamante', 'Zafiro', 'Topacio', 'Esmeralda', 'Rubí',
    'Cuarzo', 'Turmalina', 'Amatista', 'Berilo', 'Granate',
    'Otro'
];

export const mineralUnits = [
    'gramo',
    'kilogramo',
    'tonelada',
    'quilate',
    'onza troy'
];
