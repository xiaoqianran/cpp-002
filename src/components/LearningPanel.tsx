import type { ReactNode } from "react";

/**
 * 中文讲解面板：流程与源码地图。
 * 完整 Mermaid 图见 README.md 与 docs/ARCHITECTURE.md（GitHub 可渲染）。
 */

export function LearningPanel({
  compact = false,
  full = false,
}: {
  compact?: boolean;
  full?: boolean;
}) {
  if (compact) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-4">
        <h2 className="mb-2 text-sm font-medium">一图读懂当前帧</h2>
        <pre className="overflow-x-auto rounded-[var(--radius-md)] bg-bg p-3 font-mono text-[11px] leading-relaxed text-fg-muted">
{`相机 → 像素射线
  → 最近命中(球体)
  → 材质散射
  → 递归着色
  → 累加 / gamma
  → Canvas`}
        </pre>
        <p className="mt-2 text-xs text-fg-subtle">下方有完整架构与源码对应表。</p>
      </div>
    );
  }

  if (!full) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-4">
        <h2 className="mb-2 text-sm font-semibold">核心公式</h2>
        <ul className="space-y-2 text-sm text-fg-muted">
          <li>
            射线：<code className="font-mono text-fg">P(t) = O + t·D</code>
          </li>
          <li>
            球交：判别式 <code className="font-mono text-fg">h² − a·c</code>
          </li>
          <li>
            反射：<code className="font-mono text-fg">R = V − 2(V·N)N</code>
          </li>
          <li>
            漫反射方向：<code className="font-mono text-fg">N + random_unit</code>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <section className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-5 md:p-6">
      <h2 className="text-lg font-semibold tracking-tight">边写边学 · 架构讲解</h2>
      <p className="mt-1 max-w-3xl text-sm text-fg-muted">
        下列结构对应仓库 <code className="font-mono text-fg">cpp/</code>{" "}
        目录。GitHub README 中有可渲染的 Mermaid 图；这里用表格与流程摘要便于在预览里阅读。
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card title="渲染主循环（渐进采样）">
          <ol className="list-decimal space-y-1 pl-4 text-sm text-fg-muted">
            <li>
              JS 每帧调用 <code className="text-fg">rt_render_pass(spp)</code>
            </li>
            <li>C++ 对每个像素发 spp 条 jitter 射线</li>
            <li>
              <code className="text-fg">ray_color</code> 递归散射（深度=max_depth）
            </li>
            <li>颜色累加到 float 缓冲，再 gamma 写入 RGBA8</li>
            <li>JS 把 HEAPU8 像素贴到 Canvas</li>
          </ol>
        </Card>

        <Card title="源码地图">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-fg-subtle">
                <th className="pb-2 font-medium">文件</th>
                <th className="pb-2 font-medium">职责</th>
              </tr>
            </thead>
            <tbody className="text-fg-muted">
              {[
                ["vec3.h", "向量 / 点 / 颜色代数"],
                ["ray.h", "射线参数化"],
                ["sphere.h", "解析求交"],
                ["material.h", "Lambert / Metal / Glass"],
                ["camera.h", "成像平面 + 景深"],
                ["renderer.h", "累加缓冲与 pass"],
                ["wasm_bridge.cpp", "导出 C API"],
              ].map(([f, d]) => (
                <tr key={f} className="border-t border-border/60">
                  <td className="py-1.5 font-mono text-xs text-fg">{f}</td>
                  <td className="py-1.5 text-xs">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="材质散射决策">
          <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-fg-muted">
{`命中表面
├─ Lambertian → N + 随机单位向量
├─ Metal      → reflect + fuzz 球扰动
└─ Dielectric → Schlick 选反射/折射
                 (全反射时强制反射)`}
          </pre>
        </Card>

        <Card title="为什么渐进采样？">
          <p className="text-sm text-fg-muted">
            路径追踪是蒙特卡洛积分：每条随机路径是一次估计。spp
            越多方差越小，画面越干净。浏览器里我们把「最终 100 spp」拆成许多 1
            spp 的 pass，这样你可以立刻看到粗图，再看着噪点慢慢退去——这就是{" "}
            <code className="text-fg">samples_done</code> 累加的意义。
          </p>
        </Card>
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg p-4">
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      {children}
    </div>
  );
}
