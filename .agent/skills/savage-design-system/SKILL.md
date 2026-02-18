---
name: savage-design-system
description: Savage's border-centric design philosophy for Sigil. Use this when creating or modifying any frontend page to maintain visual consistency.
---

# Savage Design System — Border-Centric Philosophy

This skill documents the design language established by SavageOps across the Sigil frontend. **All new pages and components must follow these patterns** to maintain visual consistency.

## Core Principle: Border-Centric Layout

Every page uses a **centered container with left/right borders** as the structural spine. Content is stacked vertically in **horizontal bands** separated by `border-b`. There are **no rounded corners, no drop shadows, no cards with background elevation**. Structure comes entirely from borders and background color contrast.

```tsx
<section className="min-h-screen bg-{pastel} relative overflow-hidden px-2.5 lg:px-0">
  <div className="border-border relative container border-l border-r min-h-screen px-0">
    {/* Content bands stacked here */}
  </div>
</section>
```

## Page Structure

Every page follows this exact band order:

### 1. Header Band
```tsx
<div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-background">
  <div className="max-w-xl">
    <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
      section label
    </p>
    <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
      page title
    </h1>
    <p className="text-muted-foreground">Description text.</p>
  </div>
</div>
```

Key rules:
- **Section label**: `uppercase tracking-wider text-primary text-sm`
- **Page title**: Always **lowercase** via the `lowercase` class
- **Description**: `text-muted-foreground`

### 2. Section Header Bands
Thin separator bands that introduce content sections:
```tsx
<div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
  <h2 className="text-lg font-semibold text-foreground lowercase">section name</h2>
</div>
```
- Always `bg-secondary/30` (sage tint)
- Always `lowercase`

### 3. Content Grids
Use CSS grid with **border-based separators** (never gap-based):
```tsx
<div className="grid sm:grid-cols-2 lg:grid-cols-3">
  {items.map((item, i) => (
    <div
      key={item.id}
      className={cn(
        "px-6 py-5 border-border",
        i < 3 && "border-b",
        i % 3 !== 2 && "lg:border-r",
      )}
    >
      {/* content */}
    </div>
  ))}
</div>
```
Or use `divide-y` / `divide-x`:
```tsx
<div className="divide-y divide-border">
  {items.map(item => (
    <div className="px-6 py-4 lg:px-12">{/* content */}</div>
  ))}
</div>
```

### 4. Alternating Backgrounds
Alternate between `bg-background`, `bg-sage/30`, and `bg-lavender/50` for visual rhythm:
```
Band 1: bg-background   (white)
Band 2: bg-sage/30       (pale green)
Band 3: bg-background   (white)
Band 4: bg-lavender/50   (pale purple)
```

## Color Palette

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `primary` | `270 42% 33%` | `#482863` | Purple — buttons, labels, accents |
| `sage` | `110 33% 93%` | `#EAF4E8` | Pale green — alternating bands |
| `lavender` | `280 33% 93%` | `#F2E8F4` | Pale purple — alternating bands |
| `cream` | `50 33% 93%` | `#F4F3E8` | Warm neutral — backgrounds |
| `rose` | `10 33% 93%` | `#F4EAE8` | Warm pink — highlights |
| `secondary` | = `sage` | — | Used for `bg-secondary/30` headers |

## Briefing Cards

Savage uses small, inline "Briefing Card" visualizations — mini data previews embedded directly in content. These are **not standalone card components** but small inline elements:

```tsx
// Mini bar chart
<div className="h-20 flex items-end gap-0.5">
  {[40, 55, 45, 70, 60, 85].map((h, i) => (
    <div key={i} className="flex-1 bg-primary/20" style={{ height: `${h}%` }}>
      <div className="w-full bg-primary" style={{ height: `${h > 70 ? 100 : 60}%` }} />
    </div>
  ))}
</div>

// Progress bar
<div className="w-full h-1.5 bg-secondary">
  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
</div>

// Dot grid
<div className="grid grid-cols-4 gap-1">
  {items.map((active, i) => (
    <div key={i} className={cn("aspect-square", active ? "bg-primary/30" : "bg-secondary/30")} />
  ))}
</div>
```

## Typography Rules

| Element | Class | Casing |
|---------|-------|--------|
| Section label | `text-primary text-sm font-medium uppercase tracking-wider` | UPPERCASE |
| Page title (h1) | `text-3xl lg:text-4xl font-semibold text-foreground lowercase` | lowercase |
| Section heading (h2) | `text-lg font-semibold text-foreground lowercase` | lowercase |
| Item title (h3) | `font-medium text-foreground` | Normal |
| Body text | `text-muted-foreground text-sm` | Normal |
| Metadata | `text-xs text-muted-foreground` | Normal |
| Font family | Figtree (via `--font-figtree`) | — |

## Icons & Badges

- **Icons**: Always from `lucide-react`. Size `size-5` or `size-6` for primary, `size-3` or `size-4` for metadata.
- **Icon containers**: Square, no rounding — `size-10 bg-green-100 flex items-center justify-center` (or `bg-primary/10`)
- **Badges**: Use shadcn `<Badge>` with `variant="outline"` or `variant="default"` with custom colors like `bg-green-100 text-green-700`
- **Status dots**: `<div className="size-2 bg-green-500 animate-pulse" />`

## Component Patterns

### Data Row
```tsx
<div className="px-6 py-4 lg:px-12 flex items-center gap-4">
  <div className="size-10 bg-primary/10 flex items-center justify-center">
    <Icon className="size-5 text-primary" />
  </div>
  <div className="flex-1">
    <h3 className="font-medium text-foreground">Title</h3>
    <p className="text-xs text-muted-foreground">Subtitle</p>
  </div>
  <Badge variant="outline">Tag</Badge>
</div>
```

### CTA Section
```tsx
<div className="bg-primary">
  <div className="flex flex-col lg:flex-row">
    <div className="flex-1 px-6 py-12 lg:px-12 lg:py-16 border-border lg:border-r border-primary-foreground/20">
      <h2 className="text-2xl lg:text-3xl font-semibold text-primary-foreground mb-4 lowercase">
        cta heading
      </h2>
      <p className="text-primary-foreground/80 mb-6">Description.</p>
      <Button size="lg" variant="secondary">Action</Button>
    </div>
  </div>
</div>
```

## Anti-Patterns (Do NOT)

- ❌ No `rounded-*` on containers or sections (squares only)
- ❌ No `shadow-*` for elevation
- ❌ No dark mode (light-only palette)
- ❌ No TailwindCSS gap-based grid separators — use `border-*` or `divide-*`
- ❌ No floating cards — everything is inline in the border spine
- ❌ No Title Case headings — always `lowercase` for h1/h2
- ❌ No saturated background colors — only pastel tints at `/30` or `/50`
