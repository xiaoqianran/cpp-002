// 相机：生成主射线 + 景深抖动 + 像素内抗锯齿抖动 + 调试视图
#pragma once

#include "color.h"
#include "hittable.h"
#include "material.h"
#include "rt_common.h"
#include "vec3.h"

// debug_mode:
// 0 = 美观路径追踪（默认）
// 1 = 法线着色
// 2 = 深度（灰度）
// 3 = 发光体 / 首次命中自发光
class camera {
public:
  double aspect_ratio = 16.0 / 9.0;
  int image_width = 400;
  int max_depth = 50;
  int debug_mode = 0;
  color background = color(0.70, 0.80, 1.00);

  double vfov = 20;
  point3 lookfrom = point3(13, 2, 3);
  point3 lookat = point3(0, 0, 0);
  vec3 vup = vec3(0, 1, 0);

  double defocus_angle = 0;
  double focus_dist = 10;

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

  // 追踪单条射线颜色
  color ray_color(const ray &r, int depth, const hittable &world) const {
    if (depth <= 0) return color(0, 0, 0);

    hit_record rec;
    if (!world.hit(r, interval(0.001, infinity), rec)) {
      if (debug_mode != 0) return color(0, 0, 0);
      return background;
    }

    // —— 调试视图：不走完整路径积分 ——
    if (debug_mode == 1) {
      // 法线映射到 [0,1]
      return 0.5 * color(rec.normal.x() + 1, rec.normal.y() + 1, rec.normal.z() + 1);
    }
    if (debug_mode == 2) {
      // 深度：t 越大越亮（钳制到合理范围）
      auto d = clamp(rec.t / 12.0, 0.0, 1.0);
      return color(d, d, d);
    }
    if (debug_mode == 3) {
      // 只看自发光（面光是否命中）
      return rec.mat->emitted(rec);
    }

    // —— 美观模式：自发光 + 散射递归 ——
    color emit = rec.mat->emitted(rec);

    ray scattered;
    color attenuation;
    if (!rec.mat->scatter(r, rec, attenuation, scattered))
      return emit;

    return emit + attenuation * ray_color(scattered, depth - 1, world);
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

  vec3 sample_square() const {
    return vec3(random_double() - 0.5, random_double() - 0.5, 0);
  }

  point3 defocus_disk_sample() const {
    auto p = random_in_unit_disk();
    return center + (p[0] * defocus_disk_u) + (p[1] * defocus_disk_v);
  }
};
