import { useEffect, useId, useRef, useState } from "react";

/**
 * 轻量 Mermaid：动态加载 CDN，失败则显示源码。
 * 教学图不阻塞主渲染。
 */
export function MermaidBlock({ code, title }: { code: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = await loadMermaid();
        if (cancelled || !ref.current) return;
        const { svg } = await mermaid.render(`mmd-${id}-${Math.random().toString(36).slice(2, 7)}`, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          // 暗色主题可读
          const svgEl = ref.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
          }
        }
      } catch {
        if (!cancelled) setFallback(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-bg p-3">
      {title && <div className="mb-2 text-xs font-medium text-fg-muted">{title}</div>}
      {fallback ? (
        <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-fg-subtle">{code}</pre>
      ) : (
        <div ref={ref} className="overflow-x-auto mermaid-host min-h-16 text-fg" />
      )}
    </div>
  );
}

type MermaidApi = {
  initialize: (opts: Record<string, unknown>) => void;
  render: (id: string, code: string) => Promise<{ svg: string }>;
};

let mermaidPromise: Promise<MermaidApi> | null = null;

function loadMermaid(): Promise<MermaidApi> {
  if (mermaidPromise) return mermaidPromise;
  mermaidPromise = new Promise((resolve, reject) => {
    const w = window as unknown as { mermaid?: MermaidApi };
    if (w.mermaid) {
      w.mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      });
      resolve(w.mermaid);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
    s.async = true;
    s.onload = () => {
      const m = (window as unknown as { mermaid?: MermaidApi }).mermaid;
      if (!m) {
        reject(new Error("mermaid missing"));
        return;
      }
      m.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      });
      resolve(m);
    };
    s.onerror = () => reject(new Error("mermaid load fail"));
    document.head.appendChild(s);
  });
  return mermaidPromise;
}
