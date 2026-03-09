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

<style scoped>
.mineral-ticker-bar {
  width: 100%;
  background: transparent;
  color: #111820;
  display: flex;
  align-items: center;
  height: 34px;
  overflow: hidden;
  font-family: "Market Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 12px;
  position: relative;
  z-index: 100;
}

/* Contenedor centrado igual que el header */
.ticker-center-wrapper {
  max-width: 1540px;
  width: 100%;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  align-items: center;
  height: 100%;
  overflow: hidden;
}

.ticker-label {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 10;
  background: #111820;
  color: #fff;
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 14px 0 12px;
  white-space: nowrap;
}

.ticker-label i {
  font-size: 14px;
}

.ticker-track-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.ticker-track {
  display: flex;
  align-items: center;
  white-space: nowrap;
  animation: ticker-scroll 55s linear infinite;
}

.ticker-track:hover {
  animation-play-state: paused;
}

@keyframes ticker-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  cursor: default;
  transition: background 0.2s;
  height: 36px;
}

.ticker-item:hover {
  background: rgba(255,255,255,0.06);
  border-radius: 4px;
}

.ticker-icon {
  font-size: 13px;
}

.ticker-name {
  font-weight: 600;
  color: #555;
  letter-spacing: 0.3px;
}

.ticker-price {
  font-weight: 700;
  color: #111820;
}

.ticker-unit {
  font-weight: 400;
  font-size: 10px;
  color: #888;
  margin-left: 1px;
}

.ticker-change {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.ticker-change.up   { color: #16a34a; }
.ticker-change.down { color: #dc2626; }
.ticker-change.flat { color: #999; }

.ticker-sep {
  color: #ccc;
  margin-left: 4px;
}

.ticker-timestamp {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  background: transparent;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #999;
  white-space: nowrap;
  border-left: 1px solid #e5e5e5;
}
</style>
