-- Migration: Convert order_number to VARCHAR to allow alphanumeric codes
-- Date: 2026-05-08

-- 1) Cambiar el tipo de columna para aceptar códigos alfanuméricos
ALTER TABLE `orders`
  MODIFY COLUMN `order_number` VARCHAR(50) NULL;

-- 2) Convertir valores numéricos existentes a texto (por seguridad)
UPDATE `orders`
SET `order_number` = CAST(`order_number` AS CHAR)
WHERE `order_number` IS NOT NULL;
