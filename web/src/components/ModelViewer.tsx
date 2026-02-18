import { ContactShadows, Environment, Html, OrbitControls, useProgress } from "@react-three/drei";
import { Canvas, invalidate, useFrame, useLoader, useThree } from "@react-three/fiber";
import { FC, Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { type GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export interface ViewerProps {
  url: string;
  width?: number | string;
  height?: number | string;
  modelXOffset?: number;
  modelYOffset?: number;
  defaultRotationX?: number;
  defaultRotationY?: number;
  defaultZoom?: number;
  minZoomDistance?: number;
  maxZoomDistance?: number;
  enableMouseParallax?: boolean;
  enableManualRotation?: boolean;
  enableHoverRotation?: boolean;
  enableManualZoom?: boolean;
  ambientIntensity?: number;
  keyLightIntensity?: number;
  fillLightIntensity?: number;
  rimLightIntensity?: number;
  environmentPreset?:
    | "city"
    | "sunset"
    | "night"
    | "dawn"
    | "studio"
    | "apartment"
    | "forest"
    | "park"
    | "none";
  autoFrame?: boolean;
  autoFramePadding?: number;
  placeholderSrc?: string;
  showLoader?: boolean;
  showScreenshotButton?: boolean;
  fadeIn?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  onModelLoaded?: () => void;
}

type SupportedLoader = typeof GLTFLoader | typeof FBXLoader | typeof OBJLoader;
type SupportedAsset = GLTF | THREE.Object3D;
type ShadowCapableLight = THREE.Light & { castShadow: boolean };
type EnvironmentPreset = Exclude<NonNullable<ViewerProps["environmentPreset"]>, "none">;

const DEFAULT_DRACO_DECODER_PATH = "https://www.gstatic.com/draco/v1/decoders/";
const isTouch =
  typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
const deg2rad = (d: number) => (d * Math.PI) / 180;
const DECIDE = 8;
const ROTATE_SPEED = 0.005;
const INERTIA = 0.925;
const PARALLAX_MAG = 0.05;
const PARALLAX_EASE = 0.12;
const HOVER_MAG = deg2rad(6);
const HOVER_EASE = 0.15;

const getLoaderForExt = (ext: string): SupportedLoader => {
  if (ext === "fbx") return FBXLoader;
  if (ext === "obj") return OBJLoader;
  return GLTFLoader;
};

const getFileExt = (url: string) => {
  const [path] = url.split("?");
  const dotIndex = path.lastIndexOf(".");
  return dotIndex >= 0 ? path.slice(dotIndex + 1).toLowerCase() : "";
};

const configureLoaderWithDraco = (loader: THREE.Loader) => {
  if (loader instanceof GLTFLoader) {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DEFAULT_DRACO_DECODER_PATH);
    loader.setDRACOLoader(dracoLoader);
  }
};

const isMesh = (obj: THREE.Object3D): obj is THREE.Mesh => (obj as THREE.Mesh).isMesh === true;

const isShadowCapableLight = (obj: THREE.Object3D): obj is ShadowCapableLight =>
  obj instanceof THREE.Light && "castShadow" in obj;

const setMaterialOpacity = (
  material: THREE.Material | THREE.Material[],
  opacity: number,
  transparent: boolean,
) => {
  if (Array.isArray(material)) {
    for (const mat of material) {
      mat.transparent = transparent;
      (mat as THREE.Material & { opacity: number }).opacity = opacity;
    }
    return;
  }

  material.transparent = transparent;
  (material as THREE.Material & { opacity: number }).opacity = opacity;
};

const Loader: FC<{ placeholderSrc?: string }> = ({ placeholderSrc }) => {
  const { progress, active } = useProgress();
  if (!active && placeholderSrc) return null;

  return (
    <Html center>
      {placeholderSrc ? (
        <img
          src={placeholderSrc}
          alt="3D model placeholder"
          width={128}
          height={128}
          className="rounded-lg blur-lg"
        />
      ) : (
        `${Math.round(progress)} %`
      )}
    </Html>
  );
};

const DesktopControls: FC<{
  pivot: THREE.Vector3;
  min: number;
  max: number;
  zoomEnabled: boolean;
}> = ({ pivot, min, max, zoomEnabled }) => {
  const ref = useRef<OrbitControlsImpl | null>(null);
  useFrame(() => ref.current?.target.copy(pivot));

  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enablePan={false}
      enableRotate={false}
      enableZoom={zoomEnabled}
      minDistance={min}
      maxDistance={max}
    />
  );
};

interface ModelInnerProps {
  url: string;
  xOff: number;
  yOff: number;
  pivot: THREE.Vector3;
  initYaw: number;
  initPitch: number;
  minZoom: number;
  maxZoom: number;
  enableMouseParallax: boolean;
  enableManualRotation: boolean;
  enableHoverRotation: boolean;
  enableManualZoom: boolean;
  autoFrame: boolean;
  autoFramePadding: number;
  fadeIn: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number;
  onLoaded?: () => void;
}

const ModelInner: FC<ModelInnerProps> = ({
  url,
  xOff,
  yOff,
  pivot,
  initYaw,
  initPitch,
  minZoom,
  maxZoom,
  enableMouseParallax,
  enableManualRotation,
  enableHoverRotation,
  enableManualZoom,
  autoFrame,
  autoFramePadding,
  fadeIn,
  autoRotate,
  autoRotateSpeed,
  onLoaded,
}) => {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const { camera, gl } = useThree();

  const vel = useRef({ x: 0, y: 0 });
  const tPar = useRef({ x: 0, y: 0 });
  const cPar = useRef({ x: 0, y: 0 });
  const tHov = useRef({ x: 0, y: 0 });
  const cHov = useRef({ x: 0, y: 0 });

  const ext = useMemo(() => getFileExt(url), [url]);
  const loaderClass = useMemo(() => getLoaderForExt(ext), [ext]);
  const loaded = useLoader(loaderClass, url, configureLoaderWithDraco) as SupportedAsset;
  const content = useMemo<THREE.Object3D | null>(() => {
    if (ext === "glb" || ext === "gltf") {
      return (loaded as GLTF).scene.clone(true);
    }
    return (loaded as THREE.Object3D).clone(true);
  }, [ext, loaded]);

  const modelReady = useRef(false);
  const pivotW = useRef(new THREE.Vector3());

  useLayoutEffect(() => {
    if (!content) return;

    const group = inner.current;
    const root = outer.current;

    // Make normalization idempotent (important for dev/StrictMode remount cycles).
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    group.position.set(0, 0, 0);
    group.rotation.set(0, 0, 0);
    group.scale.set(1, 1, 1);

    group.updateWorldMatrix(true, true);

    const sphere = new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere());
    const scale = 1 / (sphere.radius * 2);
    group.position.set(-sphere.center.x * scale, -sphere.center.y * scale, -sphere.center.z * scale);
    group.scale.setScalar(scale);

    group.traverse((obj) => {
      if (isMesh(obj)) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (fadeIn) {
          setMaterialOpacity(obj.material, 0, true);
        }
      }
    });

    // Keep the model centered at world origin before screen-space offsets.
    pivotW.current.set(0, 0, 0);

    root.rotation.set(initPitch, initYaw, 0);

    if (autoFrame && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const perspectiveCamera = camera as THREE.PerspectiveCamera;
      const fitRadius = sphere.radius * scale;
      const distance = (fitRadius * autoFramePadding) / Math.sin((perspectiveCamera.fov * Math.PI) / 360);
      perspectiveCamera.position.set(pivotW.current.x, pivotW.current.y, pivotW.current.z + distance);
      perspectiveCamera.near = distance / 10;
      perspectiveCamera.far = distance * 10;
      perspectiveCamera.updateProjectionMatrix();
    }

    const ndc = pivotW.current.clone().project(camera);
    ndc.x += xOff;
    ndc.y += yOff;
    root.position.copy(ndc.unproject(camera));
    pivot.copy(pivotW.current);

    modelReady.current = true;
    vel.current = { x: 0, y: 0 };
    tPar.current = { x: 0, y: 0 };
    cPar.current = { x: 0, y: 0 };
    tHov.current = { x: 0, y: 0 };
    cHov.current = { x: 0, y: 0 };

    let fadeId: ReturnType<typeof setInterval> | null = null;

    if (fadeIn) {
      let t = 0;
      fadeId = setInterval(() => {
        t += 0.05;
        const opacity = Math.min(t, 1);

        group.traverse((obj) => {
          if (isMesh(obj)) {
            setMaterialOpacity(obj.material, opacity, true);
          }
        });

        invalidate();

        if (opacity === 1) {
          if (fadeId) {
            clearInterval(fadeId);
          }
          invalidate();
          onLoaded?.();
        }
      }, 16);
    } else {
      invalidate();
      onLoaded?.();
    }

    return () => {
      if (fadeId) {
        clearInterval(fadeId);
      }
    };
  }, [autoFrame, autoFramePadding, camera, content, fadeIn, initPitch, initYaw, onLoaded, pivot, xOff, yOff]);

  useEffect(() => {
    if (!enableManualRotation || isTouch) return;

    const canvasElement = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      window.addEventListener("pointerup", onPointerUp);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;

      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      outer.current.rotation.y += deltaX * ROTATE_SPEED;
      outer.current.rotation.x += deltaY * ROTATE_SPEED;
      vel.current = { x: deltaX * ROTATE_SPEED, y: deltaY * ROTATE_SPEED };
      invalidate();
    };

    const onPointerUp = () => {
      dragging = false;
    };

    canvasElement.addEventListener("pointerdown", onPointerDown);
    canvasElement.addEventListener("pointermove", onPointerMove);

    return () => {
      canvasElement.removeEventListener("pointerdown", onPointerDown);
      canvasElement.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [enableManualRotation, gl]);

  useEffect(() => {
    if (!isTouch) return;

    const canvasElement = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();

    type Mode = "idle" | "decide" | "rotate" | "pinch";
    let mode: Mode = "idle";
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let startDistance = 0;
    let startZoom = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;

      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size === 1) {
        mode = "decide";
        startX = lastX = event.clientX;
        startY = lastY = event.clientY;
      } else if (pointers.size === 2 && enableManualZoom) {
        mode = "pinch";
        const [p1, p2] = [...pointers.values()];
        startDistance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        startZoom = camera.position.z;
        event.preventDefault();
      }

      invalidate();
    };

    const onPointerMove = (event: PointerEvent) => {
      const pointer = pointers.get(event.pointerId);
      if (!pointer) return;

      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (mode === "decide") {
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        if (Math.abs(deltaX) > DECIDE || Math.abs(deltaY) > DECIDE) {
          if (enableManualRotation && Math.abs(deltaX) > Math.abs(deltaY)) {
            mode = "rotate";
            canvasElement.setPointerCapture(event.pointerId);
          } else {
            mode = "idle";
            pointers.clear();
          }
        }
      }

      if (mode === "rotate") {
        event.preventDefault();
        const deltaX = event.clientX - lastX;
        const deltaY = event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;

        outer.current.rotation.y += deltaX * ROTATE_SPEED;
        outer.current.rotation.x += deltaY * ROTATE_SPEED;
        vel.current = { x: deltaX * ROTATE_SPEED, y: deltaY * ROTATE_SPEED };
        invalidate();
      } else if (mode === "pinch" && pointers.size === 2) {
        event.preventDefault();

        const [p1, p2] = [...pointers.values()];
        const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const ratio = startDistance / distance;
        camera.position.z = THREE.MathUtils.clamp(startZoom * ratio, minZoom, maxZoom);
        invalidate();
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (mode === "rotate" && pointers.size === 0) mode = "idle";
      if (mode === "pinch" && pointers.size < 2) mode = "idle";
    };

    canvasElement.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });

    return () => {
      canvasElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [camera, enableManualRotation, enableManualZoom, gl, maxZoom, minZoom]);

  useEffect(() => {
    if (isTouch) return;

    const onMouseMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;

      if (enableMouseParallax) {
        tPar.current = { x: -normalizedX * PARALLAX_MAG, y: -normalizedY * PARALLAX_MAG };
      }

      if (enableHoverRotation) {
        tHov.current = { x: normalizedY * HOVER_MAG, y: normalizedX * HOVER_MAG };
      }

      invalidate();
    };

    window.addEventListener("pointermove", onMouseMove);
    return () => window.removeEventListener("pointermove", onMouseMove);
  }, [enableHoverRotation, enableMouseParallax]);

  useFrame((_, deltaTime) => {
    if (!modelReady.current) return;

    const ndc = pivotW.current.clone().project(camera);
    ndc.x += xOff + cPar.current.x;
    ndc.y += yOff + cPar.current.y;
    outer.current.position.copy(ndc.unproject(camera));

    let shouldInvalidate = false;

    cPar.current.x += (tPar.current.x - cPar.current.x) * PARALLAX_EASE;
    cPar.current.y += (tPar.current.y - cPar.current.y) * PARALLAX_EASE;

    const previousHoverX = cHov.current.x;
    const previousHoverY = cHov.current.y;
    cHov.current.x += (tHov.current.x - cHov.current.x) * HOVER_EASE;
    cHov.current.y += (tHov.current.y - cHov.current.y) * HOVER_EASE;

    outer.current.rotation.x += cHov.current.x - previousHoverX;
    outer.current.rotation.y += cHov.current.y - previousHoverY;

    if (autoRotate) {
      outer.current.rotation.y += autoRotateSpeed * deltaTime;
      shouldInvalidate = true;
    }

    outer.current.rotation.y += vel.current.x;
    outer.current.rotation.x += vel.current.y;
    vel.current.x *= INERTIA;
    vel.current.y *= INERTIA;

    if (Math.abs(vel.current.x) > 1e-4 || Math.abs(vel.current.y) > 1e-4) {
      shouldInvalidate = true;
    }

    if (
      Math.abs(cPar.current.x - tPar.current.x) > 1e-4 ||
      Math.abs(cPar.current.y - tPar.current.y) > 1e-4 ||
      Math.abs(cHov.current.x - tHov.current.x) > 1e-4 ||
      Math.abs(cHov.current.y - tHov.current.y) > 1e-4
    ) {
      shouldInvalidate = true;
    }

    if (shouldInvalidate) {
      invalidate();
    }
  });

  if (!content) return null;

  return (
    <group ref={outer}>
      <group ref={inner}>
        <primitive object={content} dispose={null} />
      </group>
    </group>
  );
};

const ModelViewer: FC<ViewerProps> = ({
  url,
  width = 400,
  height = 400,
  modelXOffset = 0,
  modelYOffset = 0,
  defaultRotationX = -50,
  defaultRotationY = 20,
  defaultZoom = 0.5,
  minZoomDistance = 0.5,
  maxZoomDistance = 10,
  enableMouseParallax = true,
  enableManualRotation = true,
  enableHoverRotation = true,
  enableManualZoom = true,
  ambientIntensity = 0.3,
  keyLightIntensity = 1,
  fillLightIntensity = 0.5,
  rimLightIntensity = 0.8,
  environmentPreset = "forest",
  autoFrame = false,
  autoFramePadding = 1.2,
  placeholderSrc,
  showLoader = true,
  showScreenshotButton = true,
  fadeIn = false,
  autoRotate = false,
  autoRotateSpeed = 0.35,
  onModelLoaded,
}) => {
  const ext = useMemo(() => getFileExt(url), [url]);
  const loaderClass = useMemo(() => getLoaderForExt(ext), [ext]);

  useEffect(() => {
    useLoader.preload(loaderClass, url, configureLoaderWithDraco);
  }, [loaderClass, url]);

  const pivot = useRef(new THREE.Vector3()).current;
  const contactRef = useRef<THREE.Object3D | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  const initYaw = deg2rad(defaultRotationX);
  const initPitch = deg2rad(defaultRotationY);
  const cameraZ = Math.min(Math.max(defaultZoom, minZoomDistance), maxZoomDistance);

  const capture = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    renderer.shadowMap.enabled = false;

    const shadowState: { light: ShadowCapableLight; castShadow: boolean }[] = [];
    scene.traverse((obj) => {
      if (isShadowCapableLight(obj)) {
        shadowState.push({ light: obj, castShadow: obj.castShadow });
        obj.castShadow = false;
      }
    });

    if (contactRef.current) {
      contactRef.current.visible = false;
    }

    renderer.render(scene, camera);
    const screenshotData = renderer.domElement.toDataURL("image/png");

    const link = document.createElement("a");
    link.download = "model.png";
    link.href = screenshotData;
    link.click();

    renderer.shadowMap.enabled = true;
    for (const state of shadowState) {
      state.light.castShadow = state.castShadow;
    }

    if (contactRef.current) {
      contactRef.current.visible = true;
    }

    invalidate();
  };

  return (
    <div
      style={{ width, height, touchAction: "pan-y pinch-zoom" }}
      className="relative"
    >
      {showScreenshotButton && (
        <button
          onClick={capture}
          className="absolute top-4 right-4 z-10 cursor-pointer rounded-xl border border-white bg-transparent px-4 py-2 text-white transition-colors hover:bg-white hover:text-black"
        >
          Take Screenshot
        </button>
      )}

      <Canvas
        shadows
        frameloop="demand"
        gl={{ preserveDrawingBuffer: true }}
        onCreated={({ gl, scene, camera }) => {
          rendererRef.current = gl;
          sceneRef.current = scene;
          cameraRef.current = camera;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        camera={{ fov: 50, position: [0, 0, cameraZ], near: 0.01, far: 100 }}
        style={{ touchAction: "pan-y pinch-zoom" }}
      >
        {environmentPreset !== "none" && (
          <Environment
            preset={environmentPreset as EnvironmentPreset}
            background={false}
          />
        )}

        <ambientLight intensity={ambientIntensity} />
        <directionalLight position={[5, 5, 5]} intensity={keyLightIntensity} castShadow />
        <directionalLight position={[-5, 2, 5]} intensity={fillLightIntensity} />
        <directionalLight position={[0, 4, -5]} intensity={rimLightIntensity} />

        <ContactShadows ref={contactRef} position={[0, -0.5, 0]} opacity={0.35} scale={10} blur={2} />

        <Suspense fallback={showLoader ? <Loader placeholderSrc={placeholderSrc} /> : null}>
          <ModelInner
            url={url}
            xOff={modelXOffset}
            yOff={modelYOffset}
            pivot={pivot}
            initYaw={initYaw}
            initPitch={initPitch}
            minZoom={minZoomDistance}
            maxZoom={maxZoomDistance}
            enableMouseParallax={enableMouseParallax}
            enableManualRotation={enableManualRotation}
            enableHoverRotation={enableHoverRotation}
            enableManualZoom={enableManualZoom}
            autoFrame={autoFrame}
            autoFramePadding={autoFramePadding}
            fadeIn={fadeIn}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            onLoaded={onModelLoaded}
          />
        </Suspense>

        {!isTouch && enableManualZoom && (
          <DesktopControls
            pivot={pivot}
            min={minZoomDistance}
            max={maxZoomDistance}
            zoomEnabled={enableManualZoom}
          />
        )}
      </Canvas>
    </div>
  );
};

export default ModelViewer;
