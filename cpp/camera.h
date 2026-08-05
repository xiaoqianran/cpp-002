// 相机 + 路径追踪 + 可选 NEE（下一事件估计 / 面光重要性采样）
#pragma once

#include "color.h"
#include "hittable.h"
#include "material.h"
#include "quad.h"
#include "rt_common.h"
#include "vec3.h"
#include <vector>

// debug_mode: 0 美观 / 1 法线 / 2 深度 / 3 发光体
class camera {
public:
  double aspect_ratio = 16.0 / 9.0;
  int image_width = 400;
  int max_depth = 50;
  int debug_mode = 0;
  bool use_nee = true; // 面光直接采样，显著降低室内噪点
  color background = color(0.70, 0.80, 1.00);

  double vfov = 20;
  point3 lookfrom = point3(13, 2, 3);
  point3 lookat = point3(0, 0, 0);
  vec3 vup = vec3(0, 1, 0);

  double defocus_angle = 0;
  double focus_dist = 10;

  // 场景面光源（由 renderer 注入）
  const std::vector<shared_ptr<quad>> *lights = nullptr;

  void initialize(int width, int height) {
    image_width = width;
    image_height = height;
    if (image_height < 1) image_height = 1;
    aspect_ratio = double(image_width) / double(image_height);
    pixel_samples_scale = 1.0;

    center = lookfrom;

    auto theta = degrees_to_radians(vfov);
    auto h = std::tan(theta / 2);
    auto viewport_height = 2 * h * focus_dist;
    auto viewport_width = viewport_height * (double(image_width) / image_height);

    w = unit_vector(lookfrom - lookat);
    u = unit_vector(cross(vup, w));
    v = cross(w, u);

    vec3 viewport_u = viewport_width * u;
    vec3 viewport_v = viewport_height * -v;

    pixel_delta_u = viewport_u / image_width;
    pixel_delta_v = viewport_v / image_height;

    auto viewport_upper_left = center - (focus_dist * w) - viewport_u / 2 - viewport_v / 2;
    pixel00_loc = viewport_upper_left + 0.5 * (pixel_delta_u + pixel_delta_v);

    auto defocus_radius = focus_dist * std::tan(degrees_to_radians(defocus_angle / 2));
    defocus_disk_u = u * defocus_radius;
    defocus_disk_v = v * defocus_radius;
  }

  color ray_color(const ray &r, int depth, const hittable &world) const {
    return ray_color_impl(r, depth, world, /*is_camera_ray=*/true);
  }

  ray get_ray(int i, int j) const {
    auto offset = sample_square();
    auto pixel_sample = pixel00_loc + ((i + offset.x()) * pixel_delta_u) +
                        ((j + offset.y()) * pixel_delta_v);

    auto ray_origin = (defocus_angle <= 0) ? center : defocus_disk_sample();
    auto ray_direction = pixel_sample - ray_origin;
    return ray(ray_origin, ray_direction);
  }

  int image_height = 225;

private:
  double pixel_samples_scale;
  point3 center;
  point3 pixel00_loc;
  vec3 pixel_delta_u;
  vec3 pixel_delta_v;
  vec3 u, v, w;
  vec3 defocus_disk_u;
  vec3 defocus_disk_v;

  color ray_color_impl(const ray &r, int depth, const hittable &world,
                       bool is_camera_ray) const {
    if (depth <= 0) return color(0, 0, 0);

    hit_record rec;
    if (!world.hit(r, interval(0.001, infinity), rec)) {
      if (debug_mode != 0) return color(0, 0, 0);
      return background;
    }

    if (debug_mode == 1)
      return 0.5 * color(rec.normal.x() + 1, rec.normal.y() + 1, rec.normal.z() + 1);
    if (debug_mode == 2) {
      auto d = clamp(rec.t / 12.0, 0.0, 1.0);
      return color(d, d, d);
    }
    if (debug_mode == 3) return rec.mat->emitted(rec);

    color emit = rec.mat->emitted(rec);
    const bool hit_light = emit.length_squared() > 0;

    // NEE 开启时：间接路径撞上灯不再加 emit（避免与直接采样重复计数）
    // 相机射线直接看到灯仍返回 emit
    if (hit_light) {
      if (!use_nee || is_camera_ray) return emit;
      return color(0, 0, 0);
    }

    ray scattered;
    color attenuation;
    if (!rec.mat->scatter(r, rec, attenuation, scattered))
      return emit; // 非灯且不散射

    color L(0, 0, 0);

    // —— 下一事件估计：只对朗伯表面采样面光 ——
    if (use_nee && rec.mat->is_lambertian() && lights && !lights->empty()) {
      L += sample_direct_light(rec, world);
    }

    // —— 间接：继续随机散射 ——
    L += attenuation * ray_color_impl(scattered, depth - 1, world, /*is_camera_ray=*/false);
    return L;
  }

  // 面光源均匀采样 → 立体角 pdf → 朗伯 BRDF 直接光
  color sample_direct_light(const hit_record &rec, const hittable &world) const {
    const auto &list = *lights;
    const size_t n = list.size();
    if (n == 0) return color(0, 0, 0);

    // 均匀选一盏灯
    auto light = list[static_cast<size_t>(random_int(0, static_cast<int>(n) - 1))];
    point3 on_light = light->sample_point();
    vec3 to_light = on_light - rec.p;
    double dist2 = to_light.length_squared();
    if (dist2 < 1e-12) return color(0, 0, 0);

    double dist = std::sqrt(dist2);
    vec3 wi = to_light / dist;

    double cos_surf = dot(rec.normal, wi);
    if (cos_surf <= 0) return color(0, 0, 0);

    // 灯的朝向：光从法线一侧发出；射线射向灯时 cos_light = -N_light · wi
    double cos_light = -dot(light->outward_normal(), wi);
    if (cos_light <= 0) return color(0, 0, 0);

    // 阴影射线：途中有遮挡则无贡献
    hit_record shadow_rec;
    if (world.hit(ray(rec.p, wi), interval(0.001, dist - 1e-4), shadow_rec))
      return color(0, 0, 0);

    // 面积 pdf：1/(N * area)，转立体角 pdf = area_pdf * dist² / cos_light
    double area = light->surface_area();
    if (area <= 0) return color(0, 0, 0);
    double pdf_area = 1.0 / (static_cast<double>(n) * area);
    double pdf_solid = pdf_area * dist2 / cos_light;
    if (pdf_solid <= 1e-12) return color(0, 0, 0);

    color Le = light->material_ptr()->emitted(shadow_rec);
    // 若 emitted 需要 rec，构造一个假的：对 diffuse_light 不依赖 rec
    hit_record light_rec;
    light_rec.p = on_light;
    light_rec.normal = light->outward_normal();
    light_rec.front_face = true;
    light_rec.mat = light->material_ptr();
    Le = light->material_ptr()->emitted(light_rec);

    // L = f * Le * cos / pdf_ω ，f = albedo/π
    color f = rec.mat->brdf_lambert(rec);
    return f * Le * (cos_surf / pdf_solid);
  }

  vec3 sample_square() const {
    return vec3(random_double() - 0.5, random_double() - 0.5, 0);
  }

  point3 defocus_disk_sample() const {
    auto p = random_in_unit_disk();
    return center + (p[0] * defocus_disk_u) + (p[1] * defocus_disk_v);
  }
};
