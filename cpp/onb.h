// 正交基：把局部坐标（如余弦半球采样）变换到世界
#pragma once

#include "vec3.h"

class onb {
public:
  vec3 axis[3];

  const vec3 &u() const { return axis[0]; }
  const vec3 &v() const { return axis[1]; }
  const vec3 &w() const { return axis[2]; }

  vec3 local(double a, double b, double c) const {
    return a * u() + b * v() + c * w();
  }

  vec3 local(const vec3 &a) const { return a.x() * u() + a.y() * v() + a.z() * w(); }

  void build_from_w(const vec3 &w) {
    vec3 unit_w = unit_vector(w);
    vec3 a = (std::fabs(unit_w.x()) > 0.9) ? vec3(0, 1, 0) : vec3(1, 0, 0);
    vec3 v = unit_vector(cross(unit_w, a));
    vec3 u = cross(unit_w, v);
    axis[0] = u;
    axis[1] = v;
    axis[2] = unit_w;
  }
};

// 余弦加权半球方向（局部 z 朝上）
inline vec3 random_cosine_direction() {
  auto r1 = random_double();
  auto r2 = random_double();
  auto phi = 2 * pi * r1;
  auto x = std::cos(phi) * std::sqrt(r2);
  auto y = std::sin(phi) * std::sqrt(r2);
  auto z = std::sqrt(1 - r2);
  return vec3(x, y, z);
}
