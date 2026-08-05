import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyCameraOnly,
  applyConfig,
  configNeedsCamera,
  configNeedsRebuild,
} from "./applyConfig";
import type { EngineConfig } from "./types";
import { createRayTracer, type RayTracerApi } from "./wasm";

export type EngineStatus = "loading" | "ready" | "error";

export type EngineSnapshot = {
  status: EngineStatus;
  error: string | null;
  samples: number;
  passMs: number;
  primCount: number;
  lightCount: number;
};

export function useEngine(cfg: EngineConfig, running: boolean) {
  const apiRef = useRef<RayTracerApi | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfgRef = useRef(cfg);
  const prevCfgRef = useRef<EngineConfig | null>(null);
  const rafRef = useRef(0);

  const [snap, setSnap] = useState<EngineSnapshot>({
    status: "loading",
    error: null,
    samples: 0,
    passMs: 0,
    primCount: 0,
    lightCount: 0,
  });

  cfgRef.current = cfg;

  const paint = useCallback(() => {
    const api = apiRef.current;
    const canvas = canvasRef.current;
    if (!api || !canvas) return;
    const w = api.width();
    const h = api.height();
    if (w <= 0 || h <= 0) return;
    const rgba = api.rgba();
    if (rgba.length < w * h * 4) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0);
    setSnap((s) => ({
      ...s,
      samples: api.samples(),
      primCount: api.primitiveCount(),
      lightCount: api.lightCount(),
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const api = await createRayTracer();
        if (cancelled) return;
        apiRef.current = api;
        applyConfig(api, cfgRef.current);
        if (api.width() <= 0 || api.rgba().length === 0) {
          throw new Error("applyConfig 后缓冲区为空，请检查 rt_apply_config");
        }
        prevCfgRef.current = { ...cfgRef.current };
        setSnap((s) => ({ ...s, status: "ready", error: null }));
        paint();
      } catch (e) {
        setSnap((s) => ({
          ...s,
          status: "error",
          error: e instanceof Error ? e.message : String(e),
        }));
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [paint]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api || snap.status !== "ready") return;
    const prev = prevCfgRef.current;
    if (!prev || configNeedsRebuild(prev, cfg)) {
      applyConfig(api, cfg);
    } else if (configNeedsCamera(prev, cfg)) {
      applyCameraOnly(api, cfg);
    }
    prevCfgRef.current = { ...cfg };
    paint();
  }, [cfg, snap.status, paint]);

  useEffect(() => {
    if (snap.status !== "ready" || !running) return;
    let alive = true;
    const loop = () => {
      if (!alive || !apiRef.current) return;
      const t0 = performance.now();
      apiRef.current.renderPass(cfgRef.current.spp);
      const ms = performance.now() - t0;
      setSnap((s) => ({ ...s, passMs: ms }));
      paint();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [snap.status, running, paint]);

  const reset = useCallback(() => {
    apiRef.current?.reset();
    paint();
    setSnap((s) => ({ ...s, samples: 0 }));
  }, [paint]);

  return { canvasRef, snap, reset };
}
