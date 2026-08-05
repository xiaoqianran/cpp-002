import type { ReactNode } from "react";

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
        <h2 className="mb-2 text-sm font-medium">NEE 一句话</h2>
        <pre className="overflow-x-auto rounded-[var(--radius-md)] bg-bg p-3 font-mono text-[11px] leading-relaxed text-fg-muted">
{`纯路径追踪:
  碰运气才撞上小灯 → 噪

NEE（下一事件估计）:
  主动在灯面上采一点
  阴影射线检查遮挡
  直接光方差大降`}
        </pre>
      </div>
    );
  }

  if (!full) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-4">
        <h2 className="mb-2 text-sm font-semibold">本版新增</h2>
        <ul className="space-y-2 text-sm text-fg-muted">
          <li>NEE：面光源重要性采样</li>
          <li>朗伯表面直接光 + 阴影射线</li>
          <li>避免与随机路径双重计数</li>
          <li>UI 可开关对比噪点</li>
        </ul>
      </div>
    );
  }

  return (
    <section className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-5 md:p-6">
      <h2 className="text-lg font-semibold tracking-tight">边写边学 · NEE 面光采样</h2>
      <p className="mt-1 max-w-3xl text-sm text-fg-muted">
        康奈尔箱的天花板灯面积很小。纯蒙特卡洛靠「散射方向碰巧指向灯」会极噪。
        NEE 在灯面上均匀采样一点，用阴影射线判断可见，把直接光照算准。
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card title="公式（朗伯）">
          <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-fg-muted">
{`在灯面采 P，方向 wi = P - x
pdf_area = 1/(N·Area)
pdf_ω = pdf_area · r² / cos_L

L_direct = (albedo/π) · Le
         · cos_surf / pdf_ω`}
          </pre>
        </Card>
        <Card title="防双重计数">
          <ul className="list-disc space-y-1 pl-4 text-sm text-fg-muted">
            <li>相机射线直接看到灯 → 仍返回 emit</li>
            <li>间接路径撞上灯 → emit 记 0</li>
            <li>直接光只来自 NEE 采样</li>
          </ul>
        </Card>
        <Card title="源码">
          <table className="w-full text-left text-sm">
            <tbody className="text-fg-muted">
              {[
                ["camera.h", "sample_direct_light"],
                ["quad.h", "sample_point / area"],
                ["scenes.h", "lights 列表"],
                ["material.h", "brdf_lambert"],
              ].map(([f, d]) => (
                <tr key={f} className="border-t border-border/60">
                  <td className="py-1.5 font-mono text-xs text-fg">{f}</td>
                  <td className="py-1.5 text-xs">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="怎么对比">
          <p className="text-sm text-fg-muted">
            选康奈尔箱，看地板/白球。关 NEE 再开，同样 spp 下开启后暗部更稳、亮斑（firefly）更少。
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
