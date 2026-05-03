---
name: Developer Journal Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d8d9e6'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#ecedfa'
  surface-container-high: '#e7e7f4'
  surface-container-highest: '#e1e1ee'
  on-surface: '#191b24'
  on-surface-variant: '#424656'
  inverse-surface: '#2e303a'
  inverse-on-surface: '#eff0fd'
  outline: '#737687'
  outline-variant: '#c3c6d8'
  surface-tint: '#0052dd'
  primary: '#004ccd'
  on-primary: '#ffffff'
  primary-container: '#0f62fe'
  on-primary-container: '#f3f3ff'
  inverse-primary: '#b4c5ff'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#9e3100'
  on-tertiary: '#ffffff'
  tertiary-container: '#c84000'
  on-tertiary-container: '#fff1ed'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174c'
  on-primary-fixed-variant: '#003da9'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59d'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#832700'
  background: '#faf8ff'
  on-background: '#191b24'
  surface-variant: '#e1e1ee'
typography:
  display-01:
    fontFamily: IBM Plex Sans
    fontSize: 42px
    fontWeight: '300'
    lineHeight: 48px
    letterSpacing: -0.5px
  heading-03:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0px
  body-01:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.16px
  body-02:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0px
  label-01:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.32px
  code-01:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0px
  code-02:
    fontFamily: IBM Plex Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0px
spacing:
  base-unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  container-margin: 24px
---

## Brand & Style

This design system is built for the focused developer. It prioritizes clarity, efficiency, and a "tool-not-toy" mentality. By adhering to a strict minimalist and functional aesthetic, the UI recedes to the background, allowing the user's thoughts and code to take center stage. 

The style draws heavily from industrial and Swiss design principles—utilizing high-density layouts, a restrained color palette, and a rigid grid. The emotional response should be one of professional reliability, precision, and calm productivity. It avoids decorative elements in favor of structural integrity and clear information hierarchy.

## Colors

The color palette is strictly derived from the IBM Carbon Gray 10 theme. The primary background is pure white (#ffffff), providing a clean canvas for high-density information. 

- **Primary Action:** IBM Blue 60 (#0f62fe) is reserved for essential actions, active states, and primary buttons.
- **Surfaces:** Use Gray 10 (#f4f4f4) for secondary containers like sidebars or search bars, and Gray 20 (#e0e0e0) for subtle UI dividers or tertiary background elements.
- **Borders:** A consistent Gray 20 (#e0e0e0) border is used to define structure without adding visual weight.
- **Typography:** Text uses Gray 100 (#161616) for headings and primary body, ensuring maximum readability and contrast.

## Typography

Typography is the primary driver of hierarchy in this design system. We utilize **IBM Plex Sans** for all UI elements, labels, and standard prose to maintain a modern, engineered feel. 

**IBM Plex Mono** is strictly used for code blocks, technical metadata (like timestamps or file paths), and tags. This distinction helps developers instantly differentiate between content they are writing and the system's interface. 

Maintain a high density by favoring `body-01` (14px) for general interface text. Use weight (SemiBold) rather than size to denote importance in functional areas.

## Layout & Spacing

The layout follows a rigid 2px/4px/8px grid system to ensure a tight, professional density. 

- **Grid:** Use a 12-column fluid grid for main content areas, with 16px gutters.
- **Padding:** Use 16px (md) for standard container padding. For high-density data lists or sidebars, reduce internal padding to 8px (sm).
- **Alignment:** All elements must align to the grid edges. Functional icons and text labels should be vertically centered within their respective 32px or 40px hit areas.

## Elevation & Depth

This design system eschews shadows entirely to maintain a flat, architectural look. Depth is expressed through **Tonal Layering** and **High-Contrast Outlines**.

- **Layering:** The base layer is white (#ffffff). Secondary panels (sidebars, secondary navigation) sit on Gray 10 (#f4f4f4).
- **Separation:** Use 1px solid Gray 20 (#e0e0e0) borders to separate adjacent surfaces.
- **Interactions:** Hover states on interactive elements like list items or ghost buttons should use a Gray 10 (#f4f4f4) background fill rather than a shadow or lift effect.

## Shapes

To reinforce the "professional tool" aesthetic, all UI elements feature a **0px border radius**. This applies to:
- Buttons and inputs.
- Cards and containers.
- Modals and dropdown menus.
- Code blocks and tags.

The sharp corners emphasize the grid-based nature of the system and ensure a seamless look when elements are stacked or tiled.

## Components

- **Buttons:** Primary buttons use a solid IBM Blue 60 fill with white text. Secondary buttons use a 1px Gray 20 border with Blue 60 text. Ghost buttons have no border and use Blue 60 or Gray 100 text. All are sharp-edged.
- **Inputs:** Text fields use a Gray 10 background with a 1px bottom border in Gray 20. On focus, the bottom border changes to Blue 60 and thickens to 2px.
- **Cards:** Cards are defined by a 1px Gray 20 border, no shadow, and a white background. Header sections within cards should be separated by a subtle horizontal rule.
- **Chips/Tags:** Used for languages or categories. These use a Gray 10 background and IBM Plex Mono typography at a small scale (12px).
- **Code Blocks:** Displayed with a Gray 10 background, 1px Gray 20 border, and IBM Plex Mono. Include syntax highlighting based on standard Carbon color tokens.
- **Lists:** High-density rows with 8px vertical padding, separated by 1px Gray 20 lines. Use a Blue 60 vertical 4px "active stripe" on the left edge to indicate the selected item.