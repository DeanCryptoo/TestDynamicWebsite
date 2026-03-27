# Scroll Systems Starter

A reusable marketing-site starter focused on premium scrolling flow.

## Stack

- Vite
- TypeScript
- Three.js
- GSAP

## What is in here

- `src/core/smooth-scroll.ts`
  Native scroll with a damped visual transform and body-height syncing.
- `src/core/section-registry.ts`
  Shared section metrics: progress, visibility, and focus.
- `src/core/pointer-tracker.ts`
  Smoothed pointer input for subtle camera and layer motion.
- `src/webgl/background-scene.ts`
  Fixed Three.js scene that reacts to scroll and pointer state.
- `src/demo/demo-controller.ts`
  DOM choreography and HUD logic for the demo page.

## Commands

```bash
npm install
npm run dev
npm run build
```

## Reuse pattern

1. Keep the core modules.
2. Replace the HTML in `src/main.ts` with a project-specific page structure.
3. Replace the scene in `src/webgl/background-scene.ts` with the visual language for that project.
4. Add dedicated controllers when a project needs special sequences instead of stuffing everything into one file.
