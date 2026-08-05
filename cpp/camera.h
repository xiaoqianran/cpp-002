// 相机：只负责成像平面与主射线（不负责积分）
#pragma once

#include "config.h"
#include "ray.h"
#include "rt_common.h"
#include "vec3.h"

class camera {
public:
  void set_pose(const CameraPose &pose) {
    lookfrom = pose.lookfrom;
    lookat = pose.lookat;
    vup = pose.vup;
    vfov = pose.vfov;
    defocus_angle = pose.defocus_angle;
    focus_dist = pose.focus_dist;
  }

  void initialize(int width, int height) {
    image_width = width;
    image_height = height < 1 ? 1 : height;

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

  ray get_ray(int i, int j) const {
    auto offset = sample_square();
    auto pixel_sample = pixel00_loc + ((i + offset.x()) * pixel_delta_u) +
                        ((j + offset.y()) * pixel_delta_v);
    auto ray_origin = (defocus_angle <= 0) ? center : defocus_disk_sample();
    return ray(ray_origin, pixel_sample - ray_origin);
  }

  int image_width = 400;
  int image_height = 225;

private:
  point3 lookfrom = point3(0, 1, 3);
  point3 lookat = point3(0, 1, 0);
  vec3 vup = vec3(0, 1, 0);
  double vfov = 40;
  double defocus_angle = 0;
  double focus_dist = 3;

  point3 center;
  point3 pixel00_loc;
  vec3 pixel_delta_u, pixel_delta_v;
  vec3 u, v, w;
  vec3 defocus_disk_u, defocus_disk_v;

  vec3 sample_square() const {
    return vec3(random_double() - 0.5, random_double() - 0.5, 0);
  }

  point3 defocus_disk_sample() const {
    auto p = random_in_unit_disk();
    return center + (p[0] * defocus_disk_u) + (p[1] * defocus_disk_v);
  }
};
