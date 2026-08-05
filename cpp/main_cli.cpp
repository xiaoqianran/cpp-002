// 本地 CLI：输出 PPM 到 stdout
// 用法: ./raytracer_cli [width] [height] [samples] [scene]
#include "camera.h"
#include "color.h"
#include "hittable.h"
#include "material.h"
#include "quad.h"
#include "scenes.h"

#include <iostream>
#include <vector>

int main(int argc, char **argv) {
  int width = 400;
  int height = 225;
  int samples = 20;
  int scene = 3;
  if (argc > 1) width = std::atoi(argv[1]);
  if (argc > 2) height = std::atoi(argv[2]);
  if (argc > 3) samples = std::atoi(argv[3]);
  if (argc > 4) scene = std::atoi(argv[4]);

  hittable_list world;
  std::vector<shared_ptr<quad>> lights;
  build_scene(scene, world, lights);

  camera cam;
  cam.lights = &lights;
  cam.use_nee = !lights.empty();
  if (scene == 3) {
    cam.lookfrom = point3(0, 1.0, 3.2);
    cam.lookat = point3(0, 1.0, 0);
    cam.vfov = 40;
    cam.defocus_angle = 0.0;
    cam.focus_dist = 3.2;
    cam.background = color(0, 0, 0);
    cam.max_depth = 40;
  } else {
    cam.lookfrom = point3(0, 1.5, 6);
    cam.lookat = point3(0, 1, 0);
    cam.vfov = 30;
    cam.defocus_angle = 0.3;
    cam.focus_dist = 6.0;
    cam.max_depth = 40;
  }
  cam.initialize(width, height);

  std::cout << "P3\n" << width << ' ' << height << "\n255\n";

  for (int j = 0; j < height; ++j) {
    std::clog << "\r扫描线剩余: " << (height - j) << ' ' << std::flush;
    for (int i = 0; i < width; ++i) {
      color pixel(0, 0, 0);
      for (int s = 0; s < samples; ++s) {
        ray r = cam.get_ray(i, j);
        pixel += cam.ray_color(r, cam.max_depth, world);
      }
      pixel = pixel * (1.0 / samples);
      auto r = linear_to_gamma(pixel.x());
      auto g = linear_to_gamma(pixel.y());
      auto b = linear_to_gamma(pixel.z());
      static const interval intensity(0.000, 0.999);
      std::cout << static_cast<int>(256 * intensity.clamp(r)) << ' '
                << static_cast<int>(256 * intensity.clamp(g)) << ' '
                << static_cast<int>(256 * intensity.clamp(b)) << '\n';
    }
  }
  std::clog << "\r完成.                 \n";
  return 0;
}
