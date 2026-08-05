import type { ReactNode } from "react";

/**
 * 中文讲解面板：面光源 / 康奈尔箱 / 调试视图
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
        <h2 className="mb-2 text-sm font-medium">发光方程（简化）</h2>
        <pre className="overflow-x-auto rounded-[var(--radius-md)] bg-bg p-3 font-mono text-[11px] leading-relaxed text-fg-muted">
{`L = emitted
  + albedo * L_scatter

康奈尔箱：
  emitted 来自天花板面光
  红/绿墙把色染进间接光`}
        </pre>
      </div>
    );
  }

  if (!full) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-4">
        <h2 className="mb-2 text-sm font-semibold">本版新增</h2>
        <ul className="space-y-2 text-sm text-fg-muted">
          <li>
            <code className="font-mono text-fg">diffuse_light</code>：自发光材质
          </li>
          <li>
            <code className="font-mono text-fg">quad</code>：墙面与面光源
          </li>
          <li>调试：法线 / 深度 / 发光体</li>
          <li>康奈尔箱场景（id=3）</li>
        </ul>
      </div>
    );
  }

  return (
    <section className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-5 md:p-6">
      <h2 className="text-lg font-semibold tracking-tight">边写边学 · 面光源与康奈尔箱</h2>
      <p className="mt-1 max-w-3xl text-sm text-fg-muted">
        之前只靠「天空色」当环境光。现在射线命中表面时先加{" "}
        <code className="text-fg">emitted</code>
        ，再决定是否散射——这就是最简路径追踪光照模型。
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card title="着色方程">
          <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-fg-muted">
{`ray_color(r):
  if miss → background   # 康奈尔箱=黑
  emit = mat.emitted()
  if not scatter → emit
  return emit
       + attenuation
       * ray_color(scattered)`}
          </pre>
        </Card>

        <Card title="源码地图（本版）">
          <table className="w-full text-left text-sm">
            <tbody className="text-fg-muted">
              {[
                ["material.h", "emitted + diffuse_light"],
                ["quad.h", "平行四边形求交"],
                ["scenes.h", "scene_id=3 康奈尔箱"],
                ["camera.h", "debug_mode 0..3"],
              ].map(([f, d]) => (
                <tr key={f} className="border-t border-border/60">
                  <td className="py-1.5 font-mono text-xs text-fg">{f}</td>
                  <td className="py-1.5 text-xs">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="为什么红墙会把白球染红？">
          <p className="text-sm text-fg-muted">
            路径随机撞上红墙 → attenuation 带红色 → 再弹到白球 →
            相机最终收到的路径里带着红色分量。这是<strong>间接光染色</strong>
            ，需要足够 spp 与 depth 才能稳定出现。
          </p>
        </Card>

        <Card title="调试视图怎么用">
          <ul className="list-disc space-y-1 pl-4 text-sm text-fg-muted">
            <li>法线：检查墙面朝向是否正确</li>
            <li>深度：检查相机是否在箱子里/外</li>
            <li>发光体：确认天花板灯几何可见</li>
            <li>美观：再开长时间采样看间接光</li>
          </ul>
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
