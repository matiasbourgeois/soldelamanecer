# Mobile App Visual Polish ("God Tier" UI)

## Goal
Transform the operational screens (`SelectorHojas`, `ModalAcciones`) from "functional" to "premium/consumer-grade" UX.

## 1. SelectorHojasScreen (The "Dashboard")
Current: Simple list with text.
**Redesign Goal:** "Command Center" feel.
- **Header:** Personalized greeting ("Hola, [Nombre]") + Date.
- **Cards:**
  - Gradient accent strip (Brand colors).
  - Key metrics prominently displayed (Totals, Route Code).
  - Status chips with unified theme colors.
- **Empty State:** Friendly illustration/icon + clear text.

## 2. ModalAccionesEnvio (The "Action Center")
Current: Basic Modal with standard inputs.
**Redesign Goal:** Frictionless, thumb-friendly interactions.
- **Header:** Clean modal header with "Sheet" behavior (rounded top).
- **Selection Screen:**
  - Two large, distinct touch zones: "Entrega Exitosa" (Green/Teal) vs "No Entregado" (Red/Orange).
  - Icons for quick recognition (Check vs Alert).
- **Delivery Form:**
  - Floating label inputs (Outlined).
  - Big, full-width "CONFIRMAR" button (Easy to hit while walking).
- **Rejection Form:**
  - **Chip Selection** for common reasons (instead of list of buttons).
  - "Otro" expands a text area with smooth animation.

## 3. Implementation Steps
1.  **SelectorHojasScreen**:
    - [ ] Add Header component.
    - [ ] Redesign `RenderItem` card.
2.  **ModalAccionesEnvio**:
    - [ ] Refactor into sub-views (`ActionSelector`, `DeliveryForm`, `RejectionForm`) for code cleanliness.
    - [ ] Implement "Chip Group" for rejection reasons.
    - [ ] Polish Input styles.
