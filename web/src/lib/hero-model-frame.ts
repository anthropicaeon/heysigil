export const HERO_MODEL_STAGE_SELECTOR = '[data-home-loader-stage="sigil-hero-stage"]';

// Primary hero target frame. Keep these stable for seamless overlay-to-hero handoff.
export const HERO_MODEL_FRAME = {
  centerX: 0.55,
  centerY: 0.57,
  widthScale: 1.08,
  heightScale: 1.08,
};

// Loader-only visual centering compensation.
// Tweak these without touching HERO_MODEL_FRAME to avoid reintroducing handoff snap.
export const HERO_MODEL_LOADER_CENTER = {
  xCompFactor: 0.055,
  yCompFactor: 0,
};

// Loader timing controls.
export const HERO_MODEL_LOADER_TIMING = {
  minLoaderMs: 2000,
  maxModelWaitMs: 12000,
  atmosphereFadeMs: 420,
  handoffSlideMs: 950,
};

// Shared model render settings used by both loader and hero stage.
// Edit here to keep both instances visually identical.
export const HERO_MODEL_VIEWER = {
  url: "/3D/logo_min.glb",
  modelXOffset: -0.09,
  modelYOffset: 0.14,
  defaultRotationX: 10,
  defaultRotationY: -6,
  defaultZoom: 1.1,
  ambientIntensity: 0.2,
  keyLightIntensity: 1.25,
  fillLightIntensity: 0.45,
  rimLightIntensity: 1.05,
  environmentPreset: "studio" as const,
  autoFrame: true,
  autoFramePadding: 1.1,
  autoRotateSpeed: 0.16,
  autoRotateSyncKey: "sigil-hero-main",
  showContactShadows: false,
};
