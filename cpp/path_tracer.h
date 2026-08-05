// 路径追踪积分器：渲染方程的数值求解（NEE / MIS / RR / 调试）
#pragma once

#include "config.h"
#include "hittable.h"
#include "material.h"
#include "quad.h"
#include "rt_common.h"
#include "vec3.h"
#include <vector>

class path_tracer {
public:
  TraceFlags flags;
  color background = color(0, 0, 0);
  const std::vector<shared_ptr<quad>> *lights = nullptr;

  void set_flags(const TraceFlags &f) { flags = f; }

  color trace(const ray &r, const hittable &world) const {
    return trace_impl(r, flags.max_depth, world, true, 0, -1.0, false);
  }

private:
  static double mis_weight(double pdf_a, double pdf_b) {
    double a2 = pdf_a * pdf_a;
    double b2 = pdf_b * pdf_b;
    return a2 / (a2 + b2 + 1e-12);
  }

  color trace_impl(const ray &r, int depth, const hittable &world, bool is_camera_ray, int bounce,
                   double prev_bsdf_pdf, bool prev_lambert) const {
    if (depth <= 0) return color(0, 0, 0);

    hit_record rec;
    if (!world.hit(r, interval(0.001, infinity), rec)) {
      if (flags.debug_mode != 0) return color(0, 0, 0);
      return background;
    }

    if (flags.debug_mode == 1)
      return 0.5 * color(rec.normal.x() + 1, rec.normal.y() + 1, rec.normal.z() + 1);
    if (flags.debug_mode == 2) {
      auto d = clamp(rec.t / 12.0, 0.0, 1.0);
      return color(d, d, d);
    }
    if (flags.debug_mode == 3) return rec.mat->emitted(rec);

    color emit = rec.mat->emitted(rec);
    const bool hit_light = emit.length_squared() > 0;

    if (hit_light) {
      if (is_camera_ray || !flags.nee) return emit;
      if (flags.mis && prev_lambert && prev_bsdf_pdf > 0) {
        double pdf_l = pdf_light_direction(r.origin(), unit_vector(r.direction()), rec);
        if (pdf_l <= 0) return color(0, 0, 0);
        return emit * mis_weight(prev_bsdf_pdf, pdf_l);
      }
      return color(0, 0, 0);
    }

    ray scattered;
    color attenuation;
    if (!rec.mat->scatter(r, rec, attenuation, scattered)) return color(0, 0, 0);

    color L(0, 0, 0);
    const bool lambert = rec.mat->is_lambertian();
    double bsdf_pdf = lambert ? rec.mat->scattering_pdf(r, rec, scattered) : -1.0;

    if (flags.nee && lambert && lights && !lights->empty()) {
      L += sample_direct_light(rec, world);
    }

    if (flags.rr && bounce >= 3) {
      double p = std::fmax(attenuation.x(), std::fmax(attenuation.y(), attenuation.z()));
      p = clamp(p, 0.05, 0.95);
      if (random_double() > p) return L;
      attenuation = attenuation / p;
    }

    L += attenuation *
         trace_impl(scattered, depth - 1, world, false, bounce + 1, bsdf_pdf, lambert);
    return L;
  }

  double pdf_light_direction(const point3 &origin, const vec3 &unit_dir,
                             const hit_record &lrec) const {
    if (!lights || lights->empty()) return 0;
    const auto &list = *lights;
    double dist2 = (lrec.p - origin).length_squared();
    double cos_l = std::fabs(dot(lrec.normal, unit_dir));
    if (cos_l < 1e-8) return 0;

    double best_area = 0;
    double best_score = infinity;
    for (const auto &lg : list) {
      double align = std::fabs(dot(lg->outward_normal(), lrec.normal));
      if (align < 0.9) continue;
      double d = (lg->centroid() - lrec.p).length_squared();
      if (d < best_score) {
        best_score = d;
        best_area = lg->surface_area();
      }
    }
    if (best_area <= 0) best_area = list[0]->surface_area();
    if (best_area <= 0) return 0;

    double n = static_cast<double>(list.size());
    return (1.0 / (n * best_area)) * dist2 / cos_l;
  }

  color sample_direct_light(const hit_record &rec, const hittable &world) const {
    const auto &list = *lights;
    const size_t n = list.size();
    if (n == 0) return color(0, 0, 0);

    auto light = list[static_cast<size_t>(random_int(0, static_cast<int>(n) - 1))];
    point3 on_light = light->sample_point();
    vec3 to_light = on_light - rec.p;
    double dist2 = to_light.length_squared();
    if (dist2 < 1e-12) return color(0, 0, 0);

    double dist = std::sqrt(dist2);
    vec3 wi = to_light / dist;

    double cos_surf = dot(rec.normal, wi);
    if (cos_surf <= 0) return color(0, 0, 0);

    double cos_light = -dot(light->outward_normal(), wi);
    if (cos_light <= 0) return color(0, 0, 0);

    hit_record shadow_rec;
    if (world.hit(ray(rec.p, wi), interval(0.001, dist - 1e-4), shadow_rec))
      return color(0, 0, 0);

    double area = light->surface_area();
    if (area <= 0) return color(0, 0, 0);
    double pdf_area = 1.0 / (static_cast<double>(n) * area);
    double pdf_solid = pdf_area * dist2 / cos_light;
    if (pdf_solid <= 1e-12) return color(0, 0, 0);

    hit_record light_rec;
    light_rec.p = on_light;
    light_rec.normal = light->outward_normal();
    light_rec.front_face = true;
    light_rec.mat = light->material_ptr();
    color Le = light->material_ptr()->emitted(light_rec);

    color f = rec.mat->brdf_lambert(rec);
    color contrib = f * Le * (cos_surf / pdf_solid);

    if (flags.mis) {
      double pdf_bsdf = cos_surf / pi;
      contrib = contrib * mis_weight(pdf_solid, pdf_bsdf);
    }
    return contrib;
  }
};
