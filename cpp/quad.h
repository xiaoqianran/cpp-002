// 平行四边形（墙面 / 面光源）
// 由角点 Q 与两边向量 u、v 定义：P(α,β) = Q + αu + βv，α,β ∈ [0,1]
#pragma once

#include "hittable.h"
#include "vec3.h"

class quad : public hittable {
public:
  quad(const point3 &Q, const vec3 &u, const vec3 &v, shared_ptr<material> mat)
      : Q(Q), u(u), v(v), mat(mat) {
    auto n = cross(u, v);
    normal = unit_vector(n);
    D = dot(normal, Q);
    w = n / dot(n, n); // 用于平面坐标
  }

  bool hit(const ray &r, interval ray_t, hit_record &rec) const override {
    auto denom = dot(normal, r.direction());
    // 平行于平面
    if (std::fabs(denom) < 1e-8) return false;

    auto t = (D - dot(normal, r.origin())) / denom;
    if (!ray_t.contains(t)) return false;

    auto intersection = r.at(t);
    vec3 planar_hitpt_vector = intersection - Q;
    auto alpha = dot(w, cross(planar_hitpt_vector, v));
    auto beta = dot(w, cross(u, planar_hitpt_vector));

    if (!is_interior(alpha, beta, rec)) return false;

    rec.t = t;
    rec.p = intersection;
    rec.mat = mat;
    rec.set_face_normal(r, normal);
    return true;
  }

private:
  point3 Q;
  vec3 u, v;
  shared_ptr<material> mat;
  vec3 normal;
  double D;
  vec3 w;

  static bool is_interior(double a, double b, hit_record &) {
    return (a >= 0) && (a <= 1) && (b >= 0) && (b <= 1);
  }
};
