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
        <h2 className="mb-2 text-sm font-medium">MIS / RR / SAH</h2>
        <pre className="overflow-x-auto rounded-[var(--radius-md)] bg-bg p-3 font-mono text-[11px] leading-relaxed text-fg-muted">
{`MIS: w=p^2/(p^2+q^2) 合并两种采样
RR:  3  bounce 后按亮度存活
SAH: 按表面积启发切 BVH`}
        </pre>
      </div>
    );
  }

  if (!full) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-4">
        <h2 className="mb-2 text-sm font-semibold">本版新增</h2>
        <ul className="space-y-2 text-sm text-fg-muted">
          <li>MIS 平衡启发（NEE 与 BSDF）</li>
          <li>俄罗斯轮盘路径截断</li>
          <li>SAH 划分 BVH</li>
          <li>朗伯余弦半球采样</li>
        </ul>
      </div>
    );
  }

  return (
    <section className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-5 md:p-6">
      <h2 className="text-lg font-semibold tracking-tight">边写边学 · MIS / RR / SAH</h2>
      <p className="mt-1 max-w-3xl text-sm text-fg-muted">
        工业路径追踪三件套：用 MIS 公平合并「朝灯采」和「碰巧撞灯」；用俄罗斯轮盘砍掉暗路径；用 SAH 建更好的 BVH。
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card title="MIS 平衡启发">
          <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-fg-muted">
{`w(p,q) = p^2 / (p^2 + q^2)

NEE 贡献 * w(pdf_light, pdf_bsdf)
BSDF 撞灯 * w(pdf_bsdf, pdf_light)`}
          </pre>
        </Card>
        <Card title="俄罗斯轮盘">
          <p className="text-sm text-fg-muted">
            第 3 次反弹后，取衰减通道最大值 p 限制在 0.05～0.95：随机超过 p 则终止，否则衰减除以 p，期望无偏。
          </p>
        </Card>
        <Card title="SAH-BVH">
          <p className="text-sm text-fg-muted">
            划分代价约等于遍历常数加（左面积×左数量 + 右面积×右数量）除以父面积。比最长轴对半切更贴物体分布。
          </p>
        </Card>
        <Card title="源码">
          <table className="w-full text-left text-sm">
            <tbody className="text-fg-muted">
              {[
                ["camera.h", "MIS + RR + NEE"],
                ["bvh.h", "SAH buckets"],
                ["onb.h", "余弦半球采样"],
                ["material.h", "scattering_pdf"],
              ].map(([f, d]) => (
                <tr key={f} className="border-t border-border/60">
                  <td className="py-1.5 font-mono text-xs text-fg">{f}</td>
                  <td className="py-1.5 text-xs">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
