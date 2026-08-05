// 轴对齐包围盒 AABB：BVH 的剪枝基础
#pragma once

#include "interval.h"
#include "ray.h"
#include "vec3.h"

class aabb {
public:
  interval x, y, z;

  aabb() {} // 空盒（interval 默认 empty）

  aabb(const interval &ix, const interval &iy, const interval &iz) : x(ix), y(iy), z(iz) {
    pad_to_minimums();
  }

  aabb(const point3 &a, const point3 &b) {
    x = interval(std::fmin(a.x(), b.x()), std::fmax(a.x(), b.x()));
    y = interval(std::fmin(a.y(), b.y()), std::fmax(a.y(), b.y()));
    z = interval(std::fmin(a.z(), b.z()), std::fmax(a.z(), b.z()));
    pad_to_minimums();
  }

  // 并集
  aabb(const aabb &box0, const aabb &box1) {
    x = interval(std::fmin(box0.x.min, box1.x.min), std::fmax(box0.x.max, box1.x.max));
    y = interval(std::fmin(box0.y.min, box1.y.min), std::fmax(box0.y.max, box1.y.max));
    z = interval(std::fmin(box0.z.min, box1.z.min), std::fmax(box0.z.max, box1.z.max));
  }

  const interval &axis_interval(int n) const {
    if (n == 1) return y;
    if (n == 2) return z;
    return x;
  }

  // slab 法：射线与 AABB 求交（更新 ray_t）
  bool hit(const ray &r, interval ray_t) const {
    const point3 &orig = r.origin();
    const vec3 &dir = r.direction();

    for (int axis = 0; axis < 3; axis++) {
      const interval &ax = axis_interval(axis);
      const double adinv = 1.0 / dir[axis];

      auto t0 = (ax.min - orig[axis]) * adinv;
      auto t1 = (ax.max - orig[axis]) * adinv;

      if (t0 < t1) {
        if (t0 > ray_t.min) ray_t.min = t0;
        if (t1 < ray_t.max) ray_t.max = t1;
      } else {
        if (t1 > ray_t.min) ray_t.min = t1;
        if (t0 < ray_t.max) ray_t.max = t0;
      }

      if (ray_t.max <= ray_t.min) return false;
    }
    return true;
  }

  int longest_axis() const {
    if (x.size() > y.size())
      return x.size() > z.size() ? 0 : 2;
    return y.size() > z.size() ? 1 : 2;
  }

  static const aabb empty, universe;

private:
  // 极薄盒子数值不稳，给一点厚度
  void pad_to_minimums() {
    double delta = 0.0001;
    if (x.size() < delta) x = interval(x.min - delta * 0.5, x.max + delta * 0.5);
    if (y.size() < delta) y = interval(y.min - delta * 0.5, y.max + delta * 0.5);
    if (z.size() < delta) z = interval(z.min - delta * 0.5, z.max + delta * 0.5);
  }
};

// 延迟定义，在 aabb.cpp 不方便 header-only 时用函数
inline aabb surrounding_box(const aabb &a, const aabb &b) { return aabb(a, b); }
