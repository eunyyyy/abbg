# EDITORIAL LANDING BUILDER v2 (LLM OPTIMIZED)

## Workflow (always)

1. Analyze reference
2. Select variants
3. Output Variant Memo
4. Output Layout Declaration
5. Generate HTML
6. Link styles.css only

Never skip.

---

# Reference Analysis

Determine from the reference:

- image-radius = sharp | soft | round
- card-radius = sharp | soft | round
- button-radius = sharp | soft | round
- border = borderless | hairline | outlined
- button-style = solid | outline | text
- font-weight = 800/400 | 700/400 | 600/400 | 300/500
- spacing = space-8 ~ space-13

Priority

1. Figma MCP
2. Screenshot
3. Website
4. No reference → defaults

Defaults

image-radius=soft
card-radius=soft
button-radius=soft
border=hairline
button-style=solid+outline
fw=700/400
spacing=space-section

---

# Variant Selection

Choose

Typography

- loud
- medium
- quiet

Image

- high
- medium
- low

Color

- mono
- accent
- dominant

---

# Variant Memo (required)

Output before Layout Declaration.

```html
<!--
variant:
typo=
image=
color=

image-radius=
card-radius=
button-radius=

border=
button-style=
fw=
spacing=
-->
```

---

# Layout Declaration (required)

Output before HTML.

Example

```
Hero        — full-bleed — 8-4
Intro       — 5-7
Features    — 4-4-4
Gallery     — 7-5
Stats       — 3-3-3-3
CTA         — full-bleed
```

Rules

- Use asymmetric layouts.
- Never repeat the same split in consecutive sections.
- Offset at least one element per section.
- Tablet → stack.
- Mobile → single column.

Allowed splits

6-6
5-7
7-5
4-8
8-4
4-4-4
3-3-3-3

---

# Container Rules

## full-bleed

- Section width MUST be 100%.
- Never apply `.container`, `.container--wide`, `.container--narrow` or `max-width` to the section.
- Background/image/color must extend to both viewport edges.
- ONLY the inner content is wrapped with `.container`.

Correct

```html
<section class="hero">
    <div class="container">
        ...
    </div>
</section>
```

Wrong

```html
<section class="hero container--wide">
...
</section>
```

---

## wide

Use

```html
<div class="container container--wide">
```

Width

1600px

---

## default

Use

```html
<div class="container">
```

Width

1440px

---

## narrow

Use

```html
<div class="container container--narrow">
```

Width

1280px

---

# Typography

## Font Source

If a Figma MCP reference exists

- ALWAYS use the font-family detected from Figma.
- Preserve font-family, font-weight and font-style.
- Never replace the detected font.
- Never normalize multiple font families into one.
- If multiple fonts exist, use each where it appears.

If typography cannot be obtained from Figma

- Use the default font defined in styles.css.

---

# Visual Fidelity (Highest Priority)

When a Figma MCP reference is available, reproduce the design as faithfully as possible.

Copy from the Figma MCP reference whenever possible:

- overall visual style
- layout structure
- spacing rhythm
- alignment
- composition
- typography hierarchy
- font families
- font sizes
- font weights
- line heights
- letter spacing
- color palette
- border treatment
- image treatment
- icon style
- corner radius
- button style
- card style
- visual density
- whitespace
- section proportions
- content width
- image cropping
- aspect ratios

Do not reinterpret the design.

Do not redesign.

Do not simplify.

Do not modernize.

Do not add your own visual style.

Follow the Figma MCP reference as closely as possible while using the project's existing HTML structure and design tokens.

If a value exists in Figma MCP, use it.

Infer missing values only when they are unavailable.

Never replace a detected design decision with your own preference.

Visual fidelity is more important than creativity.

The generated page should look like the original Figma design at first glance.

---

## Scale

Hero

loud

display-lg ~ display-md

medium

h0 ~ h1

quiet

h2 ~ h3

Section

h1

Card

h3

Body

body-1

Caption

body-2

Weights

800/400
700/400
600/400
300/500

Only two weights.

Difference >=200.

---

# Image Radius

sharp

radius-0

soft

radius-sm

round

radius-lg

---

# Card Radius

sharp

radius-0

soft

radius-sm

round

radius-md

---

# Button Radius

sharp

radius-0

soft

radius-sm

round

radius-circle

---

# Border

borderless

border-0

hairline

border-1

outlined

border-1
border-2

---

# Button Style

Use only TWO styles on the page.

solid

filled

outline

transparent + border

text

underline only

Hover

- background
- invert
- underline

Never

- box-shadow
- arrow icons
- scale animation

---

# Grid

Containers

full-bleed
wide
default
narrow

Grid gutter

24
16
8
0

Cards

Desktop

3~4 columns

Tablet

2 columns

Mobile

1 column

---

# Spacing

Section

space-8 ~ space-13

Title → Body

space-5 ~ space-6

Card padding

space-5 ~ space-6

Element gap

space-3 ~ space-5

Never use arbitrary spacing values.

---

# Colors

Only use design tokens.

Text

text-default
text-subtle

Inverse

text-default-inverse
text-subtle-inverse

Background

color-canvas
color-primary-050
color-primary-100
color-primary-800
color-primary-900

Border

border-hairline
color-primary-100
color-primary-200

Never use arbitrary HEX colors unless brand colors are explicitly provided.

---

# Images

high

- Hero full-bleed
- Multiple image sections
- Text allowed over dimmed images

medium

- 1~2 image sections
- Image/text separated

low

- Text-first
- Images only for support

Text over image always requires a dim overlay.

---

# Hard Rules

Landing page only.

Forbidden

- carousel
- slider
- pagination
- accordion
- modal
- tabs
- next / prev navigation
- arrow buttons

Typography

- Always use the font-family from the Figma MCP design.
- Figma typography always overrides styles.css.
- Never replace detected fonts.
- Preserve the original typography hierarchy.

Containers

- If Layout Declaration says **full-bleed**, the section MUST be width:100%.
- Full-bleed sections MUST NEVER use `.container`, `.container--wide`, `.container--narrow` or any `max-width`.
- Only the INNER content may use `.container`.
- Never replace a full-bleed section with `.container--wide`.

Styling

- No box-shadow.
- No arbitrary border-radius.
- No arbitrary spacing.
- No arbitrary colors.
- No font-size in px inside generated HTML.
- Use design tokens only.

Output

- Link styles.css.
- Generate semantic HTML only.

Final Output Order

1. Variant Memo
2. Layout Declaration
3. HTML

Do NOT output reasoning.
Do NOT output analysis.
Do NOT output explanations.
Output only the required result.