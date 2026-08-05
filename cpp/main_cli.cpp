// CLI：整帧渲染
#include "engine.h"
#include <iostream>

int main(int argc, char **argv) {
  int width = 400, height = 225, samples = 20, scene = 3;
  if (argc > 1) width = std::atoi(argv[1]);
  if (argc > 2) height = std::atoi(argv[2]);
  if (argc > 3) samples = std::atoi(argv[3]);
  if (argc > 4) scene = std::atoi(argv[4]);

  EngineConfig cfg;
  cfg.width = width;
  cfg.height = height;
  cfg.scene_id = scene;
  cfg.background = scene_background(scene);
  cfg.flags.max_depth = 40;
  cfg.flags.nee = cfg.flags.mis = cfg.flags.rr = cfg.flags.bvh = true;

  if (scene == 3) {
    cfg.pose.lookfrom = point3(0, 1.0, 3.2);
    cfg.pose.lookat = point3(0, 1.0, 0);
    cfg.pose.vfov = 40;
    cfg.pose.focus_dist = 3.2;
  } else {
    cfg.pose.lookfrom = point3(0, 1.5, 6);
    cfg.pose.lookat = point3(0, 1, 0);
    cfg.pose.vfov = 30;
    cfg.pose.defocus_angle = 0.3;
    cfg.pose.focus_dist = 6.0;
  }

  engine eng;
  eng.apply(cfg);
  // 整帧 × samples
  for (int s = 0; s < samples; ++s)
    eng.render_pass(1, 0);

  std::cout << "P3\n" << width << ' ' << height << "\n255\n";
  const unsigned char *rgba = eng.get_rgba();
  for (int n = 0; n < width * height; ++n)
    std::cout << int(rgba[n * 4]) << ' ' << int(rgba[n * 4 + 1]) << ' ' << int(rgba[n * 4 + 2])
              << '\n';
  std::clog << "完成 " << samples << " spp\n";
  return 0;
}
