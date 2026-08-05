// 平行四边形（墙面 / 面光源）+ AABB
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
    w = n / dot(n, n);

    // 四个角点的包围盒
    point3 p0 = Q;
    point3 p1 = Q + u;
    point3 p2 = Q + v;
    point3 p3 = Q + u + v;
    bbox = aabb(aabb(p0, p1), aabb(p2, p3));
  }

  bool hit(const ray &r, interval ray_t, hit_record &rec) const override {
    auto denom = dot(normal, r.direction());
    if (std::fabs(denom) < 1e-8) return false;

    auto t = (D - dot(normal, r.origin())) / denom;
    if (!ray_t.contains(t)) return false;

    auto intersection = r.at(t);
    vec3 planar_hitpt_vector = intersection - Q;
    auto alpha = dot(w, cross(planar_hitpt_vector, v));
    auto beta = dot(w, cross(u, planar_hitpt_vector));

    if (alpha < 0 || alpha > 1 || beta < 0 || beta > 1) return false;

    rec.t = t;
    rec.p = intersection;
    rec.mat = mat;
    rec.set_face_normal(r, normal);
    return true;
  }

  aabb bounding_box() const override { return bbox; }

private:
  point3 Q;
  vec3 u, v;
  shared_ptr<material> mat;
  vec3 normal;
  double D;
  vec3 w;
  aabb bbox;
};
