-- Migration: Add order_number column to orders table
-- Date: 2026-04-14
-- Description: Adds a sequential order_number field that does not skip numbers when orders are deleted.
--              Existing orders are backfilled with sequential numbers based on their creation date.

ALTER TABLE `orders`
  ADD COLUMN `order_number` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `id`;

-- Backfill existing orders with sequential numbers ordered by created_at
SET @row := 0;
UPDATE `orders`
SET `order_number` = (@row := @row + 1)
ORDER BY `created_at` ASC;
