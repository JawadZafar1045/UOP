---
name: Unified Operations Platform
colors:
  surface: '#f9f9ff'
  surface-dim: '#d8d9e3'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3fd'
  surface-container: '#ecedf7'
  surface-container-high: '#e6e7f2'
  surface-container-highest: '#e1e2ec'
  on-surface: '#191b23'
  on-surface-variant: '#424754'
  inverse-surface: '#2e3038'
  inverse-on-surface: '#eff0fa'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#924700'
  on-tertiary: '#ffffff'
  tertiary-container: '#b75b00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#f9f9ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ec'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin: 24px
---

## Brand & Style

The brand personality for the design system is rooted in **Corporate Modernism**: a synthesis of utilitarian efficiency and sophisticated digital craft. The target audience consists of operations managers and enterprise stakeholders who require high-density information without cognitive overload.

The UI evokes a sense of "calm authority." By prioritizing whitespace and structural clarity over decorative elements, the design system ensures that the platform feels like a high-performance tool rather than a generic dashboard. The aesthetic is characterized by a "minimal but powerful" ethos, utilizing subtle transitions and a disciplined color application to guide the user's focus toward actionable data.

## Colors

The color strategy centers on a primary "Action Blue" (#3B82F6) to denote interactivity and progress. The neutral palette is derived from cool grays to maintain a crisp, clinical environment that reduces eye strain during long-term usage.

- **Primary:** Used for key call-to-actions, active states, and primary navigational markers.
- **Surface & Background:** A tiered system using White (#FFFFFF) for interactive cards and Slate-50 (#F8FAFC) for the canvas background to create subtle container distinction.
- **Functional:** Success and Error tokens are calibrated for high legibility against the primary white surfaces.
- **Grays:** Slate-600 (#64748B) is the standard for secondary text, providing sufficient contrast while maintaining a softer visual hierarchy than pure black.

## Typography

The typography system relies exclusively on **Inter**, a typeface designed for user interfaces. The hierarchy is built on a tight scale to maximize screen real estate in data-heavy views.

Headlines use semi-bold weights and slight negative letter-spacing to create a "compact" and authoritative feel. Body copy is set at 14px for standard density, with a 16px variant for less intensive reading tasks. Label styles utilize medium weights and increased letter-spacing to ensure legibility at small scales, particularly within KPI cards and tags.

## Layout & Spacing

This design system employs a **12-column fluid grid** for main content areas, paired with a fixed 260px sidebar for navigation. The spacing rhythm is based on a 4px baseline grid, ensuring consistent vertical and horizontal alignment.

Internal card padding is set to a standard 24px (lg) to allow data to "breathe," while dense data tables utilize 12px (sm/md hybrid) cell padding. Grouped elements, such as form inputs and their labels, use 8px (sm) spacing to maintain clear associations.

## Elevation & Depth

Visual hierarchy is achieved through **Ambient Shadows** and tonal layering rather than heavy borders. The system uses three primary elevation levels:

1.  **Flat (Level 0):** Used for the main background canvas and structural dividers.
2.  **Raised (Level 1):** Soft, diffused shadows (Y: 2px, Blur: 8px, 4% Opacity) used for KPI cards and Kanban columns.
3.  **Floating (Level 2):** More pronounced depth (Y: 10px, Blur: 20px, 8% Opacity) reserved for dropdowns, modals, and active chat popovers.

To maintain a modern look, shadows are slightly tinted with the primary blue to prevent a "muddy" appearance on the light background.

## Shapes

The design system uses a **Rounded** shape language to balance professional rigor with approachable usability. 

- **Standard Elements:** Buttons and input fields use a 0.5rem (8px) radius.
- **Containers:** Large cards and Kanban columns use a 0.75rem (12px) radius.
- **Interactive Indicators:** Notification badges and toggle switches utilize "Pill" shapes (full round) to distinguish them from structural components.

## Components

### Navigation
- **Sidebar:** A collapsed/expanded sidebar using a dark-neutral or clean white finish. Icons are paired with `label-md` text.
- **Top Navbar:** A flat, white surface with a bottom border (Slate-200) for breadcrumbs and global search.

### Data & Feedback
- **KPI Cards:** Feature a `h3` value, a `label-sm` title, and a small sparkline or percentage indicator.
- **Data Tables:** Borderless rows with a subtle hover state (#F1F5F9). Headers use `label-sm` in all-caps.
- **Kanban Boards:** Columns are semi-transparent with a light gray fill; cards use Level 1 Elevation.

### Inputs & Actions
- **Buttons:** Primary buttons use solid Action Blue with white text. Secondary buttons use a Slate-100 background or a subtle 1px border.
- **Form Elements:** Input fields use a 1px Slate-200 border that transitions to Action Blue on focus.
- **Chat Interface:** Bubbles for users are Action Blue, while system/other responses are Slate-100. Typography is kept to `body-md`.