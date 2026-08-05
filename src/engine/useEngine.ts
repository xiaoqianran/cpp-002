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
  scanY: number;
};

/** 自适应行预算：控制单次 rAF 耗时，拖拽更跟手 */
const TARGET_MS = 14;

export function useEngine(cfg: EngineConfig, running: boolean) {
  const apiRef = useRef<RayTracerApi | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfgRef = useRef(cfg);
  const prevCfgRef = useRef<EngineConfig | null>(null);
  const rafRef = useRef(0);
  const rowsBudgetRef = useRef(32);

  const [snap, setSnap] = useState<EngineSnapshot>({
    status: "loading",
    error: null,
    samples: 0,
    passMs: 0,
    primCount: 0,
    lightCount: 0,
    scanY: 0,
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
      scanY: api.scanY(),
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
          throw new Error("引擎缓冲未就绪（rt_apply）");
        }
        prevCfgRef.current = { ...cfgRef.current };
        rowsBudgetRef.current = Math.max(8, Math.floor(api.height() / 4));
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
      rowsBudgetRef.current = Math.max(8, Math.floor(api.height() / 4));
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
      const api = apiRef.current;
      const h = api.height();
      let budget = rowsBudgetRef.current;
      if (budget > h) budget = h;

      const t0 = performance.now();
      api.renderPass(cfgRef.current.spp, budget);
      const ms = performance.now() - t0;

      // 自适应：太慢减行，太快加行
      if (ms > TARGET_MS * 1.4) {
        rowsBudgetRef.current = Math.max(4, Math.floor(budget * 0.7));
      } else if (ms < TARGET_MS * 0.6) {
        rowsBudgetRef.current = Math.min(h, Math.floor(budget * 1.25) + 1);
      }

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
    setSnap((s) => ({ ...s, samples: 0, scanY: 0 }));
  }, [paint]);

  return { canvasRef, snap, reset };
}
