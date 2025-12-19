// src/config/preciosCordoba.js
// Precios en ARS (sin IVA) — versión actualizada

export const PROTECCION = Object.freeze({
  percent: 0.01, // 1% (sin cambios)
  minimo: 3000.00, // mínimo fijo
});

// Paquetería — Capital ↔ Interior
export const PRICING_CAPITAL = Object.freeze({
  Chico:   Object.freeze({ sucursal: 6655.01,  domicilio: 7107.46 }),
  Mediano: Object.freeze({ sucursal: 9546.81,  domicilio: 10256.42 }),
  Grande:  Object.freeze({ sucursal: 15845.34, domicilio: 16128.06 }),
});

// Paquetería — Interior ↔ Interior
export const PRICING_INTERIOR = Object.freeze({
  Chico:   Object.freeze({ sucursal: 7968.68,  domicilio: 8317.88 }),
  Mediano: Object.freeze({ sucursal: 10793.72, domicilio: 11877.39 }),
  Grande:  Object.freeze({ sucursal: 16351.55, domicilio: 17351.97 }),
});

// Pallet ARLOG 120×100 — solo a domicilio
export const PRICING_PALLET = Object.freeze({
  ARLOG_120x100: Object.freeze({ domicilio: 79931.74 }),
});

// Meta opcional
export const PRICES_META = Object.freeze({
  lastUpdated: "2025-09-18",
  currency: "ARS",
  ivaIncluido: false,
});
