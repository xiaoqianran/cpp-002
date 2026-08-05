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
        <h2 className="mb-2 text-sm font-medium">BVH 一句话</h2>
        <pre className="overflow-x-auto rounded-[var(--radius-md)] bg-bg p-3 font-mono text-[11px] leading-relaxed text-fg-muted">
{`射线 vs 大盒子?
  不相交 → 整棵子树跳过
  相交   → 再测左右子树

暴力: 每条射线测全部物体 O(n)
BVH:  约 O(log n)`}
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
            <code className="font-mono text-fg">aabb.h</code> slab 法求交
          </li>
          <li>
            <code className="font-mono text-fg">bvh.h</code> 二分层次树
          </li>
          <li>场景 4：随机多球压力测试</li>
          <li>UI 可开关 BVH 对比 ms</li>
        </ul>
      </div>
    );
  }

  return (
    <section className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-5 md:p-6">
      <h2 className="text-lg font-semibold tracking-tight">边写边学 · BVH</h2>
      <p className="mt-1 max-w-3xl text-sm text-fg-muted">
        物体一多，瓶颈几乎都在「每条射线和每个物体求交」。BVH 用盒子把空间层次化，先测便宜的盒子，再测贵的几何。
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card title="构建">
          <ol className="list-decimal space-y-1 pl-4 text-sm text-fg-muted">
            <li>每个物体有 AABB</li>
            <li>按最长轴排序物体中心</li>
            <li>对半切成左右子树递归</li>
            <li>父节点盒子 = 左右并集</li>
          </ol>
        </Card>
        <Card title="查询">
          <ol className="list-decimal space-y-1 pl-4 text-sm text-fg-muted">
            <li>射线 vs 当前节点盒子</li>
            <li>miss → return</li>
            <li>hit → 递归左右（近的先测可缩 tmax）</li>
            <li>叶子 → 真实 sphere/quad 求交</li>
          </ol>
        </Card>
        <Card title="源码">
          <table className="w-full text-left text-sm">
            <tbody className="text-fg-muted">
              {[
                ["aabb.h", "包围盒 + slab hit"],
                ["bvh.h", "bvh_node 构建与遍历"],
                ["renderer.h", "use_bvh 开关"],
                ["scenes.h #4", "多球测试场景"],
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
            打开「随机多球」，看状态栏 <code className="text-fg">ms</code>。关掉 BVH 再看同一分辨率——差几倍是正常的。物体越多差距越大。
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
