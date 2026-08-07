-- Migration: orders performance indexes
-- Date: 2026-04-17
-- Goal: speed up seller/user order filters and ordering

ALTER TABLE `order_items`
  ADD INDEX `idx_order_items_seller_order` (`seller_id`, `order_id`);

ALTER TABLE `orders`
  ADD INDEX `idx_orders_user_status_created` (`user_id`, `status`, `created_at`),
  ADD INDEX `idx_orders_created_at` (`created_at`);
