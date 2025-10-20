# Design Guidelines

This project uses **PatternFly** (https://www.patternfly.org/) as its design system.

PatternFly provides enterprise-ready UI components specifically designed for OpenShift and Kubernetes dashboards.

## Color Palette

### Core Colors

**Primary Blue**
- Hex: `#0066CC`
- RGB: 0, 102, 204
- Usage: Primary buttons, accents, brand identification, gradient backgrounds

**Dark Blue**
- Hex: `#004080`
- Usage: Button hover states, gradient backgrounds

### Neutral Grays

- white: `#ffffff` (RGB 255, 255, 255) - Pure white
- gray-10: `#f2f2f2` (RGB 242, 242, 242) - Light background
- gray-20: `#e0e0e0` (RGB 224, 224, 224) - Borders
- gray-30: `#c7c7c7` (RGB 199, 199, 199) - Subtle dividers
- gray-40: `#a3a3a3` (RGB 163, 163, 163) - Disabled elements
- gray-50: `#707070` (RGB 112, 112, 112) - Secondary buttons
- gray-60: `#4d4d4d` (RGB 77, 77, 77) - Secondary button hover
- gray-70: `#383838` (RGB 56, 56, 56) - Dark text
- gray-95 (UX black): `#151515` (RGB 21, 21, 21) - Primary text
- black (rich black): `#000000` (CMYK 60 40 40 100) - Pure black

### Information Palette

**Danger Orange (Critical/Destructive)**
- danger-orange-50: `#f0561d`
- RGB: 240, 86, 29
- Pantone: 165 C
- Usage: Critical badges, destructive errors, decrease in value
- Semantic: Something negative has occurred

**Orange (Caution/Warning)**
- orange-50: `#ca6c0f`
- RGB: 202, 108, 15
- Pantone: 2019 C
- Usage: Warning badges, non-destructive errors
- Semantic: Take action now to avoid a destructive action or error

**Purple (Info/Note)**
- purple-50: `#5e40be`
- RGB: 94, 64, 190
- Pantone: 2097 C
- Usage: Info badges, helpful information
- Semantic: Helpful information is available

**Success Green**
- success-green-50: `#63993d`
- RGB: 99, 153, 61
- Pantone: 7737 C
- Usage: Success states, anonymous mode badge, increase in value
- Semantic: Something positive has occurred

**Interaction Blue**
- interaction-blue-50: `#0066cc`
- RGB: 0, 102, 204
- Pantone: 2387 C
- Usage: Links, interactions, loading spinners
- Semantic: Clickable or interactive element

## Typography

### Fonts

Primary: **Overpass** (PatternFly default)
- Usage: Headings, buttons, UI elements, body text
- Weights: 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)

Fallback: helvetica, arial, sans-serif

## UI Components

### Buttons

**Primary Button**
- Background: Primary Blue `#0066CC`
- Hover: Dark Blue `#004080`
- Text: White
- Font weight: 600

**Secondary Button**
- Background: Gray `#8a8d90`
- Hover: Dark Gray `#6a6e73`
- Text: White

### Status Badges

**Anonymous Mode (Green)**
- Background: `#28a745`
- Animation: Pulsing indicator

**External AI (Orange)**
- Background: `#ca6c0f`

### Issue Cards

**Critical (Danger)**
- Border: Danger Orange-50 `#f0561d`
- Background: danger-orange-10 `#ffe3d9`
- Semantic: Destructive error or critical issue

**Warning (Caution)**
- Border: Orange-50 `#ca6c0f`
- Background: orange-10 `#ffe8cc`
- Semantic: Non-destructive action needed

**Info (Note)**
- Border: Purple-50 `#5e40be`
- Background: purple-10 `#ece6ff`
- Semantic: Helpful information available

## Gradients

**Page Background**
```css
background: linear-gradient(135deg, #0066CC 0%, #004080 100%);
```

## Design Principles

1. **Use blue for primary actions** - Consistent with interaction color
2. **Maintain contrast** - White cards on blue gradient background
3. **Consistent spacing** - 2rem padding, 1rem gaps
4. **Rounded corners** - 6px buttons, 12px cards
5. **Shadows** - Subtle shadows for depth `0 10px 40px rgba(0, 0, 0, 0.1)`

## Accessibility

- Minimum contrast ratio: 4.5:1 for text
- Focus indicators on all interactive elements
- Semantic HTML structure
- ARIA labels where needed

## References

- [PatternFly Design System](https://www.patternfly.org/)
