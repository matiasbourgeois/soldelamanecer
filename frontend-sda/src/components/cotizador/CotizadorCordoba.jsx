import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/botonesSistema.css";
import "../../styles/CotizadorCordoba.css";

import {
  PRICING_CAPITAL,
  PRICING_INTERIOR,
  PRICING_PALLET,
  PROTECCION,
} from "../../config/preciosCordoba";
import { LOCALITIES } from "../../data/localidadesCordoba";

/* Paleta puntual */
const COLORS = { text: "#111827", subtext: "#4b5563" };
const BRAND_GOLD = "var(--sda-gold)";
const BRAND_GREEN = "#16a34a";
const BRAND_GREEN_BG = "rgba(22,163,74,.10)";
const BRAND_GREEN_BORDER = "rgba(22,163,74,.45)";
const RESET_RED = "#dc2626";
const RESET_BG = "rgba(220,38,38,.08)";
const RESET_BORDER = "rgba(220,38,38,.35)";

/* Amarillos pill para “Seleccionado” */
const PILL_YELLOW_TEXT = "#7a4b00";
const PILL_YELLOW_BG = "rgba(242,182,50,.12)";
const PILL_YELLOW_BORDER = "rgba(242,182,50,.45)";

/* Sucursales habilitadas (CP) */
const BRANCH_CPS = new Set(["5000", "5800", "5900"]);
const hasBranch = (loc) => !!loc && BRANCH_CPS.has(String(loc.cp || "").trim());

/* Descripciones (medida lineal = L + A + H) */
const FRIENDLY_LIMITS = {
  Chico: "Hasta 90 cm lineales (L + A + H).",
  Mediano: "De 91 a 150 cm lineales (L + A + H).",
  Grande: "De 151 a 220 cm lineales (L + A + H).",
  Pallet:
    "Pallet ARLOG 120×100 cm (hasta 160 cm de alto y hasta 1000 kg). Consultar frecuencia y disponibilidad.",
};

/* =======================  Íconos SVG  ======================= */
function IconClipboard({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M9 2h6a2 2 0 0 1 2 2h1a2 2 0 0 1 2 2v13a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2-2Zm0 2a1 1 0 0 0-1 1v1h8V5a1 1 0 0 0-1-1H9Zm9 3H6v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7Z"/>
    </svg>
  );
}
function IconCheck({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z"/>
    </svg>
  );
}
function IconReset({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 5V2L7 7l5 5V9a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7Z"/>
    </svg>
  );
}

/* Utils */
function fmtMoney(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(n);
}
function isCordobaCapital(loc) {
  if (!loc) return false;
  const name = (loc.name || "").toLowerCase();
  const cp = (loc.cp || "").trim();
  return name.includes("córdoba capital") || name.includes("cordoba capital") || cp === "5000";
}
function normalize(str) {
  return (str || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
function displayLoc(l) {
  if (!l) return "—";
  return `${l.cp ? l.cp + " — " : ""}${l.name}`;
}

/* ===== Botón unificado (220px desktop / 100% mobile) ===== */
const BTN_WIDTH = "min(100%, 220px)";
function buttonStyle(variant) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 9999,
    padding: "6px 12px",
    fontWeight: 700,
    fontSize: 13,
    width: BTN_WIDTH,
    boxShadow: "0 1px 6px rgba(0,0,0,.06)",
    transition: "transform .06s ease, box-shadow .2s ease, border-color .2s ease, filter .2s ease",
    backdropFilter: "saturate(110%)",
    cursor: "pointer",
    userSelect: "none",
    textDecoration: "none",
  };
  if (variant === "green") {
    return {
      ...base,
      color: "#0b3d1f",
      background: `linear-gradient(0deg, ${BRAND_GREEN_BG}, ${BRAND_GREEN_BG})`,
      border: `1px solid ${BRAND_GREEN_BORDER}`,
    };
  }
  if (variant === "gold") {
    return {
      ...base,
      color: PILL_YELLOW_TEXT,
      background: `linear-gradient(0deg, ${PILL_YELLOW_BG}, ${PILL_YELLOW_BG})`,
      border: `1px solid ${PILL_YELLOW_BORDER}`,
    };
  }
  if (variant === "red") {
    return {
      ...base,
      color: "#5a0f0f",
      background: `linear-gradient(0deg, ${RESET_BG}, ${RESET_BG})`,
      border: `1px solid ${RESET_BORDER}`,
    };
  }
  return base;
}
function onHoverVariant(e, variant) {
  if (variant === "green") {
    e.currentTarget.style.boxShadow = "0 4px 12px rgba(22,163,74,.16)";
    e.currentTarget.style.borderColor = BRAND_GREEN;
  } else if (variant === "gold") {
    e.currentTarget.style.boxShadow = "0 4px 12px rgba(242,182,50,.22)";
    e.currentTarget.style.borderColor = "rgba(242,182,50,1)";
  } else if (variant === "red") {
    e.currentTarget.style.boxShadow = "0 4px 12px rgba(220,38,38,.16)";
    e.currentTarget.style.borderColor = RESET_RED;
  }
  e.currentTarget.style.filter = "brightness(1.02)";
}
function onLeaveVariant(e, variant) {
  e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,.06)";
  if (variant === "green") e.currentTarget.style.borderColor = BRAND_GREEN_BORDER;
  if (variant === "gold") e.currentTarget.style.borderColor = PILL_YELLOW_BORDER;
  if (variant === "red") e.currentTarget.style.borderColor = RESET_BORDER;
  e.currentTarget.style.filter = "none";
}

/* ComboBox — pills “Seleccionado” con estilo tipo botón (amarillo) */
function ComboBox({ idBase, label, options, valueIdx, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [focused, setFocused] = useState(false);

  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  const listboxId = `${idBase}-listbox`;
  const optionId = (realIdx) => `${idBase}-opt-${realIdx}`;

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return options.map((o, idx) => ({ o, idx }));
    return options
      .map((o, idx) => ({ o, idx }))
      .filter(({ o }) => {
        const n = normalize(o.name);
        const cp = String(o.cp || "");
        if (cp === query) return true;
        if (n.startsWith(q)) return true;
        return n.includes(q) || cp.includes(query);
      });
  }, [options, query]);

  useEffect(() => {
    function handleClick(e) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
        setHighlight(0);
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-item-idx="${highlight}"]`);
    if (el && listRef.current) {
      const { top, bottom } = el.getBoundingClientRect();
      const { top: lt, bottom: lb } = listRef.current.getBoundingClientRect();
      if (top < lt || bottom > lb) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlight, open, filtered.length]);

  function handleSelect(idx) {
    onChange(idx);
    setOpen(false);
    setQuery("");
    setHighlight(0);
    setFocused(false);
    inputRef.current?.blur();
  }

  const selected = options[valueIdx];

  const pillStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 9999,
    padding: "6px 12px",
    fontWeight: 700,
    fontSize: 13,
    color: PILL_YELLOW_TEXT,
    background: `linear-gradient(0deg, ${PILL_YELLOW_BG}, ${PILL_YELLOW_BG})`,
    border: `1px solid ${PILL_YELLOW_BORDER}`,
    boxShadow: "0 1px 6px rgba(0,0,0,.06)",
    transition: "transform .06s ease, box-shadow .2s ease, border-color .2s ease, filter .2s ease",
    backdropFilter: "saturate(110%)",
  };

  return (
    <div ref={wrapperRef}>
      <label className="form-label label-sda" htmlFor={`${idBase}-input`}>
        {label}
      </label>
      <div className="position-relative">
        <input
          id={`${idBase}-input`}
          ref={inputRef}
          className="form-control input-sda"
          placeholder="Buscar por localidad o CP..."
          value={query}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && filtered[highlight] ? optionId(filtered[highlight].idx) : undefined
          }
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "Enter")) setOpen(true);
            if (e.key === "ArrowDown")
              setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
            if (e.key === "ArrowUp") setHighlight((h) => Math.max(h - 1, 0));
            if (e.key === "Home") setHighlight(0);
            if (e.key === "End") setHighlight(Math.max(filtered.length - 1, 0));
            if (e.key === "PageDown")
              setHighlight((h) => Math.min(h + 7, Math.max(filtered.length - 1, 0)));
            if (e.key === "PageUp") setHighlight((h) => Math.max(h - 7, 0));
            if (e.key === "Enter") {
              e.preventDefault();
              const item = filtered[highlight] || filtered[0];
              if (item) handleSelect(item.idx);
            }
            if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
          }}
          style={{
            borderColor: focused ? BRAND_GOLD : undefined,
            boxShadow: focused ? "0 0 0 .16rem rgba(242,182,50,.15)" : undefined,
          }}
        />

        {query && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            className="btn btn-link p-0"
            onClick={() => {
              setQuery("");
              setHighlight(0);
              setOpen(false);
              inputRef.current?.focus();
            }}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              textDecoration: "none",
            }}
          >
            ✕
          </button>
        )}

        {/* Mostrar “Seleccionado” SOLO si hay localidad elegida */}
        {valueIdx >= 0 && (
          <div className="mt-2">
            <span className="helper-sda" style={{ marginRight: 6, color: COLORS.subtext, fontSize: 13 }}>
              Seleccionado:
            </span>
            <span className="fw-semibold" style={pillStyle}>
              {displayLoc(selected)}
            </span>
          </div>
        )}

        {open && (
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="position-absolute mt-1 w-100 bg-white shadow dropdown-sda"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2 helper-sda">Sin resultados</div>
            ) : (
              filtered.slice(0, 80).map(({ o, idx }, i) => (
                <button
                  type="button"
                  key={`${o.name}-${idx}`}
                  id={optionId(idx)}
                  role="option"
                  aria-selected={i === highlight}
                  data-item-idx={i}
                  className={`w-100 text-start px-3 py-2 btn btn-link combo-option ${
                    i === highlight ? "active" : ""
                  }`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => handleSelect(idx)}
                >
                  {o.cp ? `${o.cp} — ` : ""}
                  {o.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* Componente principal */
export default function CotizadorCordoba() {
  // Estados
  const [origenIdx, setOrigenIdx] = useState(-1);
  const [destinoIdx, setDestinoIdx] = useState(-1);
  const [servicio, setServicio] = useState("Paquetería");
  const [categoria, setCategoria] = useState("Chico");
  const [modalidad, setModalidad] = useState("A sucursal");
  const [valorDeclaradoStr, setValorDeclaradoStr] = useState("3000"); // mínimo precargado
  const [modalidadAviso, setModalidadAviso] = useState("");
  const [copiedMsg, setCopiedMsg] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  const origen = LOCALITIES[origenIdx];
  const destino = LOCALITIES[destinoIdx];

  const hasOrigen = origenIdx >= 0;
  const hasDestino = destinoIdx >= 0;
  const invalidSamePlace = hasOrigen && hasDestino && origenIdx === destinoIdx;
  const canQuote = hasOrigen && hasDestino && !invalidSamePlace;

  const isInteriorInterior = useMemo(
    () => canQuote && !isCordobaCapital(origen) && !isCordobaCapital(destino),
    [canQuote, origen, destino]
  );
  const tarifaLabel = canQuote ? (isInteriorInterior ? "INTERIOR–INTERIOR" : "CAPITAL–INTERIOR") : "—";

  // Opciones de modalidad (sucursal)
  const modalidadOptions = useMemo(() => {
    if (servicio === "Pallet") return ["A domicilio"];
    if (hasOrigen && hasDestino && hasBranch(origen) && hasBranch(destino)) {
      return ["A sucursal", "A domicilio"];
    }
    return ["A domicilio"];
  }, [servicio, hasOrigen, hasDestino, origen, destino]);

  // Forzar modalidad válida y MOSTRAR aviso estable (sin timeout)
  useEffect(() => {
    const sucursalHabilitada =
      servicio === "Paquetería" && hasOrigen && hasDestino && hasBranch(origen) && hasBranch(destino);

    if (!modalidadOptions.includes(modalidad)) {
      setModalidad("A domicilio");
    }
    if (servicio === "Paquetería" && !sucursalHabilitada) {
      setModalidadAviso(
        "Entrega en sucursal disponible solo si origen y destino son Córdoba Capital (5000), Río Cuarto (5800) o Villa María (5900)."
      );
    } else {
      setModalidadAviso("");
    }
  }, [modalidadOptions, modalidad, servicio, hasOrigen, hasDestino, origen, destino]);

  // Valor declarado numérico
  const valorDeclarado = useMemo(() => {
    const n = parseFloat(String(valorDeclaradoStr).replace(/,/g, "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [valorDeclaradoStr]);

  // Precio base
  const basePrice = useMemo(() => {
    if (!canQuote) return 0;
    if (servicio === "Paquetería") {
      const key = modalidad === "A sucursal" ? "sucursal" : "domicilio";
      const table = isInteriorInterior ? PRICING_INTERIOR : PRICING_CAPITAL;
      return table[categoria][key];
    }
    return PRICING_PALLET.ARLOG_120x100.domicilio;
  }, [canQuote, servicio, categoria, modalidad, isInteriorInterior]);

  // Totales
  const protegidoSobre = Math.max(PROTECCION.minimo, valorDeclarado);
  const proteccion = useMemo(
    () => (canQuote ? (protegidoSobre > 0 ? protegidoSobre * PROTECCION.percent : 0) : 0),
    [canQuote, protegidoSobre]
  );
  const subtotal = useMemo(() => (canQuote ? basePrice + proteccion : 0), [canQuote, basePrice, proteccion]);
  const iva = useMemo(() => subtotal * 0.21, [subtotal]);
  const total = useMemo(() => subtotal + iva, [subtotal, iva]);

  // Frecuencia destino
  const freqText = useMemo(() => {
    if (!hasDestino) return "—";
    const f = (destino?.frecuencia || "").trim();
    const h = (destino?.horarios || "").trim();
    if (!f && !h) return "Sin datos";
    if (f && h) return `${f} · ${h}`;
    return f || h;
  }, [hasDestino, destino]);

  // Copiar resumen
  async function copiarResumen() {
    if (!canQuote) return;
    const partes = [
      `Cotización Sol del Amanecer`,
      `${displayLoc(origen)} → ${displayLoc(destino)}`,
      `${servicio}${servicio === "Paquetería" ? ` · ${categoria}` : " · ARLOG 120×100"} · ${modalidad}`,
      `Tarifa: ${tarifaLabel} · Frecuencia destino: ${freqText}`,
      `Precio base: ${fmtMoney(basePrice)}`,
      `Protección (${Math.round(PROTECCION.percent * 100)}%): ${fmtMoney(proteccion)} (mín. ${fmtMoney(PROTECCION.minimo)})`,
      `Subtotal (sin IVA): ${fmtMoney(subtotal)}`,
      `IVA (21%): ${fmtMoney(iva)}`,
      `Total con IVA: ${fmtMoney(total)}`
    ];
    try {
      await navigator.clipboard.writeText(partes.join("\n"));
      setCopiedMsg("¡Copiado!");
      setTimeout(() => setCopiedMsg(""), 1600);
    } catch {
      const el = document.createElement("textarea");
      el.value = partes.join("\n");
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); setCopiedMsg("¡Copiado!"); } catch {}
      document.body.removeChild(el);
      setTimeout(() => setCopiedMsg(""), 1600);
    }
  }

  // Reset cotización
  function resetCotizacion() {
    setOrigenIdx(-1);
    setDestinoIdx(-1);
    setServicio("Paquetería");
    setCategoria("Chico");
    setModalidad("A sucursal");
    setValorDeclaradoStr("3000"); // mínimo
    setModalidadAviso("");
    setCopiedMsg("");
    setResetMsg("Reiniciada");
    setTimeout(() => setResetMsg(""), 1400);
  }

  return (
    <section className="cotizador-sda">
      {/* Montserrat */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="container py-4">
        {/* Header: título + botón Reiniciar (alineado a la derecha) */}
        <div className="mb-3 mt-5 d-flex align-items-center justify-content-between">
          <h2 className="h4 mb-0 mt-5 sda-title" style={{ color: COLORS.text }}>
            Cotizador de Envíos
          </h2>

          {canQuote && (
            <div className="d-flex align-items-center gap-2">
              {resetMsg && (
                <span className="helper-sda" style={{ color: RESET_RED, fontWeight: 600, fontSize: 13 }}>
                  {resetMsg}
                </span>
              )}
              <button
                type="button"
                onClick={resetCotizacion}
                aria-label="Reiniciar cotización"
                title="Reiniciar cotización"
                style={buttonStyle("red")}
                onMouseEnter={(e) => onHoverVariant(e, "red")}
                onMouseLeave={(e) => onLeaveVariant(e, "red")}
                onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <span style={{ color: RESET_RED, display: "inline-flex" }}>
                  <IconReset size={14} />
                </span>
                <span>Reiniciar cotización</span>
              </button>
            </div>
          )}
        </div>

        {/* Panel origen/destino */}
        <div className="card card-sda mb-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <ComboBox
                  idBase="origen"
                  label="Origen"
                  options={LOCALITIES}
                  valueIdx={origenIdx}
                  onChange={setOrigenIdx}
                />
              </div>
              <div className="col-md-6">
                <ComboBox
                  idBase="destino"
                  label="Destino"
                  options={LOCALITIES}
                  valueIdx={destinoIdx}
                  onChange={setDestinoIdx}
                />
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="badge-chip">Tarifa: {tarifaLabel}</span>
                <span className="badge-chip muted">Frecuencia destino: {freqText}</span>
              </div>

              {/* Invertir con el mismo estilo (amarillo/dorado) */}
              <button
                type="button"
                onClick={() => {
                  setOrigenIdx(destinoIdx);
                  setDestinoIdx(origenIdx);
                }}
                aria-label="Invertir origen y destino"
                title="Invertir origen y destino"
                style={buttonStyle("gold")}
                onMouseEnter={(e) => onHoverVariant(e, "gold")}
                onMouseLeave={(e) => onLeaveVariant(e, "gold")}
                onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <span style={{ color: PILL_YELLOW_TEXT, display: "inline-flex" }}>↔</span>
                <span>Invertir origen/destino</span>
              </button>
            </div>

            {invalidSamePlace && (
              <div className="alert alert-danger mt-3 mb-0 py-2" role="alert" style={{ fontSize: 14 }}>
                Origen y destino son iguales. Cambiá alguno para poder cotizar.
              </div>
            )}
          </div>
        </div>

        {/* Parámetros */}
        <div className="row g-3 align-items-stretch">
          {/* Servicio */}
          <div className="col-12 col-md-3">
            <div className="card card-sda h-100">
              <div className="card-body">
                <label className="form-label label-sda">Servicio</label>
                <select
                  className="form-select input-sda"
                  value={servicio}
                  onChange={(e) => {
                    const s = e.target.value;
                    setServicio(s);
                    if (s === "Pallet") setModalidad("A domicilio");
                  }}
                >
                  <option>Paquetería</option>
                  <option>Pallet</option>
                </select>
                {servicio === "Pallet" && (
                  <p className="mt-2 mb-0 helper-sda">
                    Pallet: consultar <strong>frecuencia y disponibilidad</strong> con Sol del Amanecer.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Categoría */}
          <div className="col-12 col-md-3">
            <div className="card card-sda h-100">
              <div className="card-body">
                <label className="form-label label-sda">Categoría</label>
                {servicio === "Paquetería" ? (
                  <select
                    className="form-select input-sda"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    <option>Chico</option>
                    <option>Mediano</option>
                    <option>Grande</option>
                  </select>
                ) : (
                  <div className="text-muted helper-sda">{FRIENDLY_LIMITS.Pallet}</div>
                )}
                {servicio === "Paquetería" && (
                  <p className="mt-2 mb-0 helper-sda">{FRIENDLY_LIMITS[categoria]}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tipo de entrega */}
          <div className="col-12 col-md-3">
            <div className="card card-sda h-100">
              <div className="card-body">
                <label className="form-label label-sda">Tipo de entrega</label>
                <select
                  className="form-select input-sda"
                  value={modalidad}
                  onChange={(e) => setModalidad(e.target.value)}
                >
                  {modalidadOptions.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                {modalidadAviso && (
                  <p className="mt-2 mb-0 helper-sda">{modalidadAviso}</p>
                )}
                {servicio === "Pallet" && (
                  <p className="mt-2 mb-0 helper-sda">Para pallet no hay retiro en sucursal.</p>
                )}
              </div>
            </div>
          </div>

          {/* Valor declarado */}
          <div className="col-12 col-md-3">
            <div className="card card-sda h-100">
              <div className="card-body">
                <label className="form-label label-sda">Valor declarado (ARS)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-control input-sda"
                  value={valorDeclaradoStr}
                  onChange={(e) => setValorDeclaradoStr(e.target.value)}
                  aria-describedby="ayuda-proteccion"
                />
                <p id="ayuda-proteccion" className="mt-2 mb-0 helper-sda label-sda">
                  Se suma una protección de {Math.round(PROTECCION.percent * 100)}% sobre el valor declarado.
                  Mínimo {fmtMoney(PROTECCION.minimo)}.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Leyenda: múltiples bultos */}
        <div
          className="card mt-3"
          style={{
            border: "1px solid rgba(0,0,0,0.05)",
            background: "linear-gradient(0deg, rgba(242,182,50,0.10), rgba(242,182,50,0.10))",
          }}
        >
          <div className="card-body py-2">
            <div className="text-center" style={{ color: COLORS.text, fontSize: 14 }}>
              Si enviás varios bultos al mismo destino en un único despacho, la tarifa por unidad es menor que cotizar por separado.
            </div>
          </div>
        </div>

        {/* Resultado */}
        {canQuote && (
          <div className="card result-card mt-3" style={{ borderLeft: `4px solid ${BRAND_GOLD}` }}>
            <div className="card-body">
              {/* Encabezado */}
              <div
                className="d-flex flex-wrap align-items-center justify-content-between gap-2"
                style={{ paddingBottom: 6, borderBottom: "1px dashed rgba(0,0,0,.08)" }}
              >
                <div>
                  <h3 className="h6 mb-1" style={{ color: COLORS.text }}>
                    Resultado
                  </h3>
                  <p className="mb-0" style={{ fontSize: 14, color: COLORS.subtext }}>
                    {displayLoc(origen)} → {displayLoc(destino)} · {servicio}
                    {servicio === "Paquetería" ? ` · ${categoria}` : " · ARLOG 120×100"} · {modalidad}
                  </p>
                </div>

                {/* Copiar cotización — botón verde, mismo ancho */}
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    onClick={copiarResumen}
                    aria-label="Copiar datos de la cotización"
                    title="Copiar datos de la cotización"
                    style={buttonStyle("green")}
                    onMouseEnter={(e) => onHoverVariant(e, "green")}
                    onMouseLeave={(e) => onLeaveVariant(e, "green")}
                    onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                    onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <span style={{ color: BRAND_GREEN, display: "inline-flex" }}>
                      {copiedMsg ? <IconCheck size={14} /> : <IconClipboard size={14} />}
                    </span>
                    <span>{copiedMsg || "Copiar cotización"}</span>
                  </button>
                </div>
              </div>

              {/* Tarjetas: base, protección, subtotal, total con IVA */}
              <div className="row g-3 mt-2">
                <div className="col-md-3">
                  <div className="card card-sda h-100" style={{ borderTop: `3px solid ${BRAND_GOLD}` }}>
                    <div className="card-body">
                      <div className="text-muted helper-sda">Precio base</div>
                      <div className="fw-semibold" style={{ fontSize: 24, color: COLORS.text }}>
                        {fmtMoney(basePrice)}
                      </div>
                      <div className="text-muted mt-1 helper-sda">
                        {servicio === "Paquetería" ? FRIENDLY_LIMITS[categoria] : FRIENDLY_LIMITS.Pallet}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card card-sda h-100" style={{ borderTop: `3px solid ${BRAND_GOLD}` }}>
                    <div className="card-body">
                      <div className="text-muted helper-sda">
                        Protección ({Math.round(PROTECCION.percent * 100)}% del valor declarado)
                      </div>
                      <div className="fw-semibold" style={{ fontSize: 24, color: COLORS.text }}>
                        {fmtMoney(proteccion)}
                      </div>
                      <div className="text-muted mt-1 helper-sda">
                        Mínimo {fmtMoney(PROTECCION.minimo)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card card-sda h-100" style={{ borderTop: `3px solid ${BRAND_GOLD}` }}>
                    <div className="card-body">
                      <div className="text-muted helper-sda">Subtotal (sin IVA)</div>
                      <div className="fw-semibold" style={{ fontSize: 24, color: COLORS.text }}>
                        {fmtMoney(subtotal)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card card-sda h-100" style={{ borderTop: `3px solid ${BRAND_GOLD}` }}>
                    <div className="card-body">
                      <div className="text-muted helper-sda">Total con IVA</div>
                      <div className="fw-bold total-amount-gradient" style={{ fontSize: 28 }}>
                        {fmtMoney(total)}
                      </div>
                      <div className="mt-1 helper-sda">IVA (21%): {fmtMoney(iva)}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </section>
  );
}
