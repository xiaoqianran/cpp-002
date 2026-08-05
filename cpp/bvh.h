// BVH：层次包围盒，把 O(n) 暴力求交降到约 O(log n)
#pragma once

#include "aabb.h"
#include "hittable.h"
#include "rt_common.h"

#include <algorithm>

class bvh_node : public hittable {
public:
  bvh_node(const hittable_list &list) : bvh_node(list.objects, 0, list.objects.size()) {}

  bvh_node(const std::vector<shared_ptr<hittable>> &src_objects, size_t start, size_t end) {
    auto objects = src_objects;

    // 选最长轴划分（比纯随机更稳）
    aabb bounds;
    for (size_t i = start; i < end; i++)
      bounds = (i == start) ? objects[i]->bounding_box()
                            : aabb(bounds, objects[i]->bounding_box());
    int axis = bounds.longest_axis();

    auto comparator = (axis == 0)   ? box_x_compare
                      : (axis == 1) ? box_y_compare
                                    : box_z_compare;

    size_t object_span = end - start;

    if (object_span == 1) {
      left = right = objects[start];
    } else if (object_span == 2) {
      if (comparator(objects[start], objects[start + 1])) {
        left = objects[start];
        right = objects[start + 1];
      } else {
        left = objects[start + 1];
        right = objects[start];
      }
    } else {
      std::sort(objects.begin() + static_cast<long>(start),
                objects.begin() + static_cast<long>(end), comparator);
      auto mid = start + object_span / 2;
      left = make_shared<bvh_node>(objects, start, mid);
      right = make_shared<bvh_node>(objects, mid, end);
    }

    bbox = aabb(left->bounding_box(), right->bounding_box());
  }

  bool hit(const ray &r, interval ray_t, hit_record &rec) const override {
    // 先测大盒子：不相交则整棵子树剪掉
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

  static bool box_compare(const shared_ptr<hittable> &a, const shared_ptr<hittable> &b,
                          int axis_index) {
    auto a_axis = a->bounding_box().axis_interval(axis_index);
    auto b_axis = b->bounding_box().axis_interval(axis_index);
    return a_axis.min < b_axis.min;
  }

  static bool box_x_compare(const shared_ptr<hittable> &a, const shared_ptr<hittable> &b) {
    return box_compare(a, b, 0);
  }
  static bool box_y_compare(const shared_ptr<hittable> &a, const shared_ptr<hittable> &b) {
    return box_compare(a, b, 1);
  }
  static bool box_z_compare(const shared_ptr<hittable> &a, const shared_ptr<hittable> &b) {
    return box_compare(a, b, 2);
  }
};
