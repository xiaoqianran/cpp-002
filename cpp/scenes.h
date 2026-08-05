// 预设场景构建
#pragma once

#include "hittable.h"
#include "material.h"
#include "sphere.h"

// scene_id:
// 0 = 经典三球 + 地面
// 1 = 玻璃聚焦
// 2 = 金属走廊
inline void build_scene(int scene_id, hittable_list &world) {
  world.clear();

  if (scene_id == 1) {
    auto ground = make_shared<lambertian>(color(0.35, 0.35, 0.4));
    world.add(make_shared<sphere>(point3(0, -1000, 0), 1000, ground));

    auto glass = make_shared<dielectric>(1.5);
    auto glass_bubble = make_shared<dielectric>(1.0 / 1.5);
    auto red = make_shared<lambertian>(color(0.65, 0.05, 0.05));
    auto chrome = make_shared<metal>(color(0.8, 0.8, 0.9), 0.05);

    world.add(make_shared<sphere>(point3(0, 1, 0), 1.0, glass));
    world.add(make_shared<sphere>(point3(0, 1, 0), 0.8, glass_bubble));
    world.add(make_shared<sphere>(point3(-2.2, 1, 0), 1.0, red));
    world.add(make_shared<sphere>(point3(2.2, 1, 0), 1.0, chrome));
    return;
  }

  if (scene_id == 2) {
    auto ground = make_shared<metal>(color(0.7, 0.7, 0.75), 0.15);
    world.add(make_shared<sphere>(point3(0, -1000, 0), 1000, ground));

    auto gold = make_shared<metal>(color(0.8, 0.6, 0.2), 0.2);
    auto chrome = make_shared<metal>(color(0.9, 0.9, 0.95), 0.0);
    auto blue = make_shared<lambertian>(color(0.1, 0.2, 0.5));

    for (int i = -2; i <= 2; ++i) {
      world.add(make_shared<sphere>(point3(i * 1.4, 0.5, 0), 0.5, (i % 2 == 0) ? gold : chrome));
    }
    world.add(make_shared<sphere>(point3(0, 1.6, -1.5), 0.8, blue));
    return;
  }

  // 默认：经典三球
  auto ground_material = make_shared<lambertian>(color(0.5, 0.5, 0.5));
  world.add(make_shared<sphere>(point3(0, -1000, 0), 1000, ground_material));

  auto material_center = make_shared<lambertian>(color(0.1, 0.2, 0.5));
  auto material_left = make_shared<dielectric>(1.5);
  auto material_bubble = make_shared<dielectric>(1.0 / 1.5);
  auto material_right = make_shared<metal>(color(0.8, 0.6, 0.2), 0.0);

  world.add(make_shared<sphere>(point3(0, 1, 0), 1.0, material_center));
  world.add(make_shared<sphere>(point3(-2, 1, 0), 1.0, material_left));
  world.add(make_shared<sphere>(point3(-2, 1, 0), 0.8, material_bubble));
  world.add(make_shared<sphere>(point3(2, 1, 0), 1.0, material_right));
}
