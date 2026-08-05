// BVH：SAH（表面积启发）划分，约 O(log n) 求交
#pragma once

#include "aabb.h"
#include "hittable.h"
#include "rt_common.h"

#include <algorithm>
#include <limits>

class bvh_node : public hittable {
public:
  bvh_node(const hittable_list &list) : bvh_node(list.objects, 0, list.objects.size()) {}

  bvh_node(const std::vector<shared_ptr<hittable>> &src_objects, size_t start, size_t end) {
    auto objects = src_objects;
    build(objects, start, end);
  }

  bool hit(const ray &r, interval ray_t, hit_record &rec) const override {
    if (!bbox.hit(r, ray_t)) return false;

    bool hit_left = left->hit(r, ray_t, rec);
    bool hit_right =
        right->hit(r, interval(ray_t.min, hit_left ? rec.t : ray_t.max), rec);

    return hit_left || hit_right;
  }

  aabb bounding_box() const override { return bbox; }

private:
  shared_ptr<hittable> left;
  shared_ptr<hittable> right;
  aabb bbox;

  void build(std::vector<shared_ptr<hittable>> &objects, size_t start, size_t end) {
    size_t span = end - start;

    // 本节点包围盒
    bbox = objects[start]->bounding_box();
    for (size_t i = start + 1; i < end; i++)
      bbox = aabb(bbox, objects[i]->bounding_box());

    if (span == 1) {
      left = right = objects[start];
      return;
    }
    if (span == 2) {
      left = objects[start];
      right = objects[start + 1];
      return;
    }

    // SAH：在三个轴上试桶划分，取代价最低
    int best_axis = 0;
    size_t best_mid = start + span / 2;
    double best_cost = std::numeric_limits<double>::infinity();

    const int buckets = 12;
    double parent_area = surface_area(bbox);
    if (parent_area <= 0) parent_area = 1;

    for (int axis = 0; axis < 3; axis++) {
      std::sort(objects.begin() + static_cast<long>(start),
                objects.begin() + static_cast<long>(end),
                [axis](const shared_ptr<hittable> &a, const shared_ptr<hittable> &b) {
                  return a->bounding_box().axis_interval(axis).min <
                         b->bounding_box().axis_interval(axis).min;
                });

      auto extent = bbox.axis_interval(axis);
      if (extent.size() < 1e-8) continue;

      // 前缀包围盒
      std::vector<aabb> left_boxes(span), right_boxes(span);
      left_boxes[0] = objects[start]->bounding_box();
      for (size_t i = 1; i < span; i++)
        left_boxes[i] = aabb(left_boxes[i - 1], objects[start + i]->bounding_box());
      right_boxes[span - 1] = objects[end - 1]->bounding_box();
      for (size_t i = span - 1; i-- > 0;)
        right_boxes[i] = aabb(right_boxes[i + 1], objects[start + i]->bounding_box());

      // 在 bucket 边界评估
      for (int b = 1; b < buckets; b++) {
        size_t mid_count = (span * static_cast<size_t>(b)) / static_cast<size_t>(buckets);
        if (mid_count == 0 || mid_count >= span) continue;
        size_t mid = start + mid_count;
        double sa_l = surface_area(left_boxes[mid_count - 1]);
        double sa_r = surface_area(right_boxes[mid_count]);
        double cost = 0.125 + (sa_l * mid_count + sa_r * (span - mid_count)) / parent_area;
        if (cost < best_cost) {
          best_cost = cost;
          best_axis = axis;
          best_mid = mid;
        }
      }
    }

    // 按最佳轴重排并递归
    std::sort(objects.begin() + static_cast<long>(start),
              objects.begin() + static_cast<long>(end),
              [best_axis](const shared_ptr<hittable> &a, const shared_ptr<hittable> &b) {
                return a->bounding_box().axis_interval(best_axis).min <
                       b->bounding_box().axis_interval(best_axis).min;
              });

    left = make_shared<bvh_node>(objects, start, best_mid);
    right = make_shared<bvh_node>(objects, best_mid, end);
    bbox = aabb(left->bounding_box(), right->bounding_box());
  }

  static double surface_area(const aabb &box) {
    double dx = box.x.size();
    double dy = box.y.size();
    double dz = box.z.size();
    return 2.0 * (dx * dy + dy * dz + dz * dx);
  }
};
