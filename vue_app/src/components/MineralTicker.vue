<script setup>
import { ref } from 'vue';

// ── Reference prices (benchmark values) ─────────────────────────────────────
const metals = ref([
  { key: 'GOLD',    name: 'Oro',              unit: 'oz', price: 2940.00 },
  { key: 'SILVER',  name: 'Plata',            unit: 'oz', price: 32.50   },
  { key: 'PLAT',    name: 'Platino',          unit: 'oz', price: 985.00  },
  { key: 'PALL',    name: 'Paladio',          unit: 'oz', price: 960.00  },
  { key: 'CU',      name: 'Cobre',            unit: 'lb', price: 4.62    },
  { key: 'AL',      name: 'Aluminio',         unit: 'MT', price: 2640.00 },
  { key: 'FE',      name: 'Mineral de Hierro',unit: 'MT', price: 105.00  },
  { key: 'NI',      name: 'Níquel',      unit: 'MT', price: 15800.00},
  { key: 'ZN',      name: 'Zinc',             unit: 'MT', price: 2820.00 },
  { key: 'LI',      name: 'Litio',            unit: 'MT', price: 12500.00},
]);

const fmt = (val) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
</script>

<template>
  <div class="mineral-ticker-bar">
    <div class="ticker-center-wrapper">
      <!-- scrolling track —— duplicated for seamless loop -->
      <div class="ticker-track-wrapper">
        <div class="ticker-track">
          <div
            v-for="m in metals"
            :key="m.key"
            class="ticker-item"
          >
            <span class="ticker-name">{{ m.name }}</span>
            <span class="ticker-price">
              ${{ fmt(m.price) }}<span class="ticker-unit">/{{ m.unit }}</span>
            </span>
            <span class="ticker-sep">·</span>
          </div>
          <!-- Duplicate set for seamless infinite loop -->
          <div
            v-for="m in metals"
            :key="'dup-' + m.key"
            class="ticker-item"
            aria-hidden="true"
          >
            <span class="ticker-name">{{ m.name }}</span>
            <span class="ticker-price">
              ${{ fmt(m.price) }}<span class="ticker-unit">/{{ m.unit }}</span>
            </span>
            <span class="ticker-sep">·</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
