/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.18-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: fabrimine_db    Database: marketplace
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account_verification_documents`
--

DROP TABLE IF EXISTS `account_verification_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_verification_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `verification_id` int NOT NULL,
  `document_type` enum('cbm_alliance_document','tax_id_document','face_photo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_verification_document_type` (`verification_id`,`document_type`),
  CONSTRAINT `fk_verification_documents_process` FOREIGN KEY (`verification_id`) REFERENCES `account_verification_process` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_verification_documents`
--

LOCK TABLES `account_verification_documents` WRITE;
/*!40000 ALTER TABLE `account_verification_documents` DISABLE KEYS */;
INSERT INTO `account_verification_documents` VALUES
(1,1,'cbm_alliance_document','uploads/verifications/1778607282550-326969073.webp','2026-05-12 17:34:42','2026-05-12 17:34:42'),
(2,1,'tax_id_document','uploads/verifications/1778607282562-361439694.webp','2026-05-12 17:34:42','2026-05-12 17:34:42'),
(3,1,'face_photo','uploads/verifications/1778607282565-776595687.webp','2026-05-12 17:34:42','2026-05-12 17:34:42'),
(7,8,'cbm_alliance_document','uploads/verifications/1785075500791-490449679.webp','2026-07-26 14:18:20','2026-07-26 14:18:20'),
(8,8,'tax_id_document','uploads/verifications/1785075500796-803038444.webp','2026-07-26 14:18:20','2026-07-26 14:18:20'),
(9,8,'face_photo','uploads/verifications/1785075500813-145337532.webp','2026-07-26 14:18:20','2026-07-26 14:18:20');
/*!40000 ALTER TABLE `account_verification_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_verification_process`
--

DROP TABLE IF EXISTS `account_verification_process`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_verification_process` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `status` enum('No verificado','Pendiente revision','Verificado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'No verificado',
  `feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `submitted_at` datetime DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `reviewed_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_verification_account` (`account_id`),
  KEY `idx_verification_status` (`status`),
  KEY `fk_verification_reviewer` (`reviewed_by`),
  CONSTRAINT `fk_verification_account` FOREIGN KEY (`account_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_verification_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_verification_process`
--

LOCK TABLES `account_verification_process` WRITE;
/*!40000 ALTER TABLE `account_verification_process` DISABLE KEYS */;
INSERT INTO `account_verification_process` VALUES
(1,67,'Verificado','Verificado correctamente',NULL,'2026-05-12 17:34:46',67,'2026-05-12 17:34:03','2026-05-12 17:34:46'),
(8,104,'Verificado','Verificado correctamente',NULL,'2026-07-26 14:20:37',67,'2026-07-26 14:15:01','2026-07-26 14:20:37'),
(9,103,'Verificado','Verificado correctamente',NULL,'2026-08-04 18:42:19',67,'2026-08-04 18:42:19','2026-08-04 18:42:19');
/*!40000 ALTER TABLE `account_verification_process` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_verification_tax_information`
--

DROP TABLE IF EXISTS `account_verification_tax_information`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_verification_tax_information` (
  `id` int NOT NULL AUTO_INCREMENT,
  `verification_id` int NOT NULL,
  `business_name` varchar(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tax_information_verification` (`verification_id`),
  CONSTRAINT `fk_tax_information_verification` FOREIGN KEY (`verification_id`) REFERENCES `account_verification_process` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_verification_tax_information`
--

LOCK TABLES `account_verification_tax_information` WRITE;
/*!40000 ALTER TABLE `account_verification_tax_information` DISABLE KEYS */;
INSERT INTO `account_verification_tax_information` VALUES
(1,1,'Fabrimine, C.A.','Sin direccion','J-305XXXXXX','0424XXXXXXX','2026-05-12 17:34:34','2026-05-12 17:34:34'),
(2,8,'Horizonte Profundo, C.A.','Lorem ipsum, asimit','J-XXXXXXXXX','04143691244','2026-07-26 14:19:23','2026-07-26 14:19:23');
/*!40000 ALTER TABLE `account_verification_tax_information` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backups`
--

DROP TABLE IF EXISTS `backups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `backups` (
  `idr` int NOT NULL AUTO_INCREMENT,
  `contenido` varchar(255) NOT NULL,
  `nombre` varchar(40) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idr`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backups`
--

LOCK TABLES `backups` WRITE;
/*!40000 ALTER TABLE `backups` DISABLE KEYS */;
INSERT INTO `backups` VALUES
(5,'/api/backup_service/backups/download/backup_2026-05-12_2329.sql','backup_2026-05-12_2329.sql','2026-05-12 23:29:04'),
(6,'/api/backup_service/backups/download/backup_2026-05-12_2329.sql','backup_2026-05-12_2329.sql','2026-05-12 23:29:11'),
(7,'/api/backup_service/backups/download/backup_2026-05-15_1453.sql','backup_2026-05-15_1453.sql','2026-05-15 14:53:15'),
(8,'/api/backup_service/backups/download/backup_2026-05-15_1453.sql','backup_2026-05-15_1453.sql','2026-05-15 14:53:18'),
(9,'/api/backup_service/backups/download/backup_2026-05-21_1614.sql','backup_2026-05-21_1614.sql','2026-05-21 16:14:23'),
(10,'/api/backup_service/backups/download/backup_2026-06-03_1508.sql','backup_2026-06-03_1508.sql','2026-06-03 15:08:56'),
(11,'/api/backup_service/backups/download/backup_2026-08-04_1815.sql','backup_2026-08-04_1815.sql','2026-08-04 18:15:10');
/*!40000 ALTER TABLE `backups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_product` int DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_location_product` (`id_product`),
  CONSTRAINT `fk_location_product` FOREIGN KEY (`id_product`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES
(51,501,'Venezuela','Anzoátegui','Soledad'),
(52,502,'Venezuela','Bolívar','Ciudad Guayanna'),
(53,503,'Venezuela','Bolívar','Ciudad Guayanna'),
(54,504,'Venezuela','Bolívar','Ciudad Guayanna'),
(55,505,'Venezuela','Bolívar','Ciudad Guayanna'),
(56,506,'Venezuela','Bolívar','Ciudad Guayanna'),
(57,507,'Venezuela','Bolívar','Ciudad Guayanna'),
(58,508,'Venezuela','Bolívar','Ciudad Guayanna'),
(59,509,'Venezuela','Bolívar','Ciudad Bolivar'),
(60,510,'Venezuela','Bolívar','Ciudad Guayanna'),
(61,511,'Venezuela','Bolívar','Ciudad Guayanna'),
(62,512,'Venezuela','Bolívar','Ciudad Guayanna'),
(63,513,'Venezuela','Bolívar','Ciudad Guayanna'),
(64,514,'Venezuela','Bolívar','Ciudad Guayanna'),
(65,515,'Venezuela','Bolívar','Ciudad Guayanna'),
(66,516,'Venezuela','Anzoátegui','Soledad'),
(67,517,'Venezuela','Anzoátegui','Soledad'),
(68,518,'Venezuela','Anzoátegui','Soledad');
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `manufacturers`
--

DROP TABLE IF EXISTS `manufacturers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `manufacturers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_product` int DEFAULT NULL,
  `manufacturer` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_manufacturer_product` (`id_product`),
  CONSTRAINT `fk_manufacturer_product` FOREIGN KEY (`id_product`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manufacturers`
--

LOCK TABLES `manufacturers` WRITE;
/*!40000 ALTER TABLE `manufacturers` DISABLE KEYS */;
INSERT INTO `manufacturers` VALUES
(11,501,'Fabrimine, C.A.','acunafernando592@gmail.com'),
(12,502,'Fabrimine C.A.','fabrimine.ca@gmail.com'),
(13,503,'Fabrimine C.A.','fabrimine.ca@gmail.com'),
(14,504,'Fabrimine C.A.','fabrimine.ca@gmail.com'),
(15,505,'Fabrimine C.A.','fabrimine.ca@gmail.com'),
(16,506,'Fabrimine C.A.','fabrimine.ca@gmail.com'),
(17,507,'Fabrimine C.A.','fabrimine.ca@gmail.com'),
(18,508,'Fabrimine C.A.','fabrimine.ca@gmail.com'),
(19,509,'Fabrimine C.A.','fabrimine.ca@gmail.com'),
(20,510,'Fabrimine C.A.','fabrimine.ca@gmail.com'),
(21,511,'Fabrimine C.A.','fabrimine.ca@gmail.com'),
(22,512,'Fabrimine C.A.','fabrimine.ca@gmail.com'),
(23,513,'Fabrimine C.A.','fabrimine.ca@gmail.com'),
(24,514,'Fabrimine C.A.','fabrimine.ca@gmail.com'),
(25,515,'Fabrimine C.A.','fabrimine.ca@gmail.com'),
(26,516,'Fabrimine, C.A.','acunafernando592@gmail.com'),
(27,517,'Horizonte Profundo, C.A.','04143691244'),
(28,518,'Fabrimine, C.A.','acunafernando592@gmail.com');
/*!40000 ALTER TABLE `manufacturers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media`
--

DROP TABLE IF EXISTS `media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_product` int NOT NULL,
  `item` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `fk_media_product` (`id_product`),
  CONSTRAINT `fk_media_product_constraint` FOREIGN KEY (`id_product`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media`
--

LOCK TABLES `media` WRITE;
/*!40000 ALTER TABLE `media` DISABLE KEYS */;
INSERT INTO `media` VALUES
(12,501,'image_1','/publications_service/uploads/1778607323321-722255385.webp'),
(13,502,'image_1','/publications_service/uploads/1780061688515-798343202.webp'),
(14,503,'image_1','/publications_service/uploads/1780062046912-163026144.webp'),
(15,504,'image_1','/publications_service/uploads/1780062139532-159663534.webp'),
(16,505,'image_1','/publications_service/uploads/1780062336258-962259408.webp'),
(17,506,'image_1','/publications_service/uploads/1780062737973-115459891.webp'),
(18,507,'image_1','/publications_service/uploads/1780062837453-471784064.webp'),
(19,508,'image_1','/publications_service/uploads/1780063019798-309933086.webp'),
(20,509,'image_1','/publications_service/uploads/1780063329706-350230745.webp'),
(21,510,'image_1','/publications_service/uploads/1780063923676-273407736.webp'),
(22,511,'image_1','/publications_service/uploads/1780066379788-754457660.webp'),
(23,512,'image_1','/publications_service/uploads/1780066522776-881256997.webp'),
(24,512,'image_2','/publications_service/uploads/1780066522779-900686833.webp'),
(25,512,'image_3','/publications_service/uploads/1780066522781-871301394.webp'),
(26,508,'new_image_1780066665117_0','/publications_service/uploads/1780066665104-774376392.webp'),
(27,513,'image_1','/publications_service/uploads/1780067243602-936455722.webp'),
(28,514,'image_1','/publications_service/uploads/1780067455833-922361466.webp'),
(29,515,'image_1','/publications_service/uploads/1780067566420-43648843.webp'),
(30,516,'image_1','/publications_service/uploads/1781550294926-579861814.webp'),
(31,517,'image_1','/publications_service/uploads/1785075665492-812925467.webp'),
(32,518,'image_1','/publications_service/uploads/1786139849555-116478281.webp');
/*!40000 ALTER TABLE `media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mineral_details`
--

DROP TABLE IF EXISTS `mineral_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mineral_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_product` int NOT NULL,
  `mineral_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Minerales',
  `sub_category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `purity` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `image` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `document` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_mineral_product` (`id_product`),
  CONSTRAINT `fk_mineral_product` FOREIGN KEY (`id_product`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mineral_details`
--

LOCK TABLES `mineral_details` WRITE;
/*!40000 ALTER TABLE `mineral_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `mineral_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notices`
--

DROP TABLE IF EXISTS `notices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `news_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notices_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notices`
--

LOCK TABLES `notices` WRITE;
/*!40000 ALTER TABLE `notices` DISABLE KEYS */;
/*!40000 ALTER TABLE `notices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `machine_id` int NOT NULL,
  `seller_id` int NOT NULL,
  `quantity` int DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_item_order` (`order_id`),
  KEY `fk_item_product` (`machine_id`),
  KEY `idx_order_items_seller_order` (`seller_id`,`order_id`),
  CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_item_product` FOREIGN KEY (`machine_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES
(2,2,503,103,100),
(3,3,515,103,1),
(4,3,513,103,1),
(5,4,517,104,1);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) DEFAULT NULL,
  `user_id` int NOT NULL,
  `seller_id` int NOT NULL DEFAULT '0',
  `status` varchar(50) DEFAULT 'pendiente',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_order_user` (`user_id`),
  KEY `fk_order_seller` (`seller_id`),
  KEY `idx_orders_user_status_created` (`user_id`,`status`,`created_at`),
  KEY `idx_orders_created_at` (`created_at`),
  CONSTRAINT `fk_order_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES
(2,'AE-KZDJ4X',67,103,'pendiente','2026-06-19 15:12:08'),
(3,'UY-DXSAAH',104,103,'pendiente','2026-07-26 14:21:26'),
(4,'YJ-2MMBPS',104,104,'pendiente','2026-07-26 14:21:26');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `platform` enum('Zelle','Zinli','Binance','Otros') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_holder` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_or_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_payment_method_user` (`user_id`),
  CONSTRAINT `fk_payment_method_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
INSERT INTO `payment_methods` VALUES
(1,67,'Binance','Fernando Acuña','acunafernando592@gmail.com','2026-06-15 23:02:06');
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_details`
--

DROP TABLE IF EXISTS `product_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_product` int NOT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sub_category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_product` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `document` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `image` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `fk_product` (`id_product`),
  KEY `idx_product_details_category` (`category`),
  CONSTRAINT `fk_details_product` FOREIGN KEY (`id_product`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_details`
--

LOCK TABLES `product_details` WRITE;
/*!40000 ALTER TABLE `product_details` DISABLE KEYS */;
INSERT INTO `product_details` VALUES
(12,501,'Procesamiento de Minerales','Molienda','Molino','H-40','Molino impactor H-40',NULL,'/publications_service/uploads/1778607323321-722255385.webp'),
(13,502,'Procesamiento de Minerales','Molienda','Molino de impacto','H-40','Molino de impacto H-40',NULL,'/publications_service/uploads/1780061688515-798343202.webp'),
(14,503,'De hizaje / elevacion vertical','Sistemas de Izaje Personal','Winche de 4 toneladas','Sin definir ','Winche de 4 toneladas',NULL,'/publications_service/uploads/1780062046912-163026144.webp'),
(15,504,'Procesamiento de Minerales','Molienda','Molino','H-25','Molino H-25',NULL,'/publications_service/uploads/1780062139532-159663534.webp'),
(16,505,'Procesamiento de Minerales','Clasificación','Tromer giratorio','Tromer de 25 toneladas','Tromer de 25 toneladas',NULL,'/publications_service/uploads/1780062336258-962259408.webp'),
(17,506,'Procesamiento de Minerales','Clasificación','Trituradora de mandibula','TR-1','Trituradora de mandíbula con tolva',NULL,'/publications_service/uploads/1780062737973-115459891.webp'),
(18,507,'Procesamiento de Minerales','Molienda','Molino de coco','MB-1','Molino de coco',NULL,'/publications_service/uploads/1780062837453-471784064.webp'),
(19,508,'Procesamiento de Minerales','Molienda','Molino de impacto','H-66','Molino H-66',NULL,'/publications_service/uploads/1780063019798-309933086.webp'),
(20,509,'Equipos Auxiliares e Insumos','Repuestos y Consumibles','Cuerpo moledor','No especificado','Bolas para molino de coco',NULL,'/publications_service/uploads/1780063329706-350230745.webp'),
(21,510,'Equipos Auxiliares e Insumos','Repuestos y Consumibles','Martillos de impacto','Sin especificar','Martillos para molinos de impacto',NULL,'/publications_service/uploads/1780063923676-273407736.webp'),
(22,511,'Procesamiento de Minerales','Molienda','Molino de impacto','H-40','Molino de impacto H-40 con motor Diesel',NULL,'/publications_service/uploads/1780066379788-754457660.webp'),
(23,512,'Procesamiento de Minerales','Clasificación','Trituradora de mandibula','Sin especificar','trituradora de mandíbula pequeña',NULL,'/publications_service/uploads/1780066522776-881256997.webp'),
(24,513,'Equipos Auxiliares e Insumos','Repuestos y Consumibles','Martillod (costillas)','Sin modelo','Martillos de molino de impacto ',NULL,'/publications_service/uploads/1780067243602-936455722.webp'),
(25,514,'Procesamiento de Minerales','Manejo de Materiales','Pie de bomba','Impeler 4 pulgadas','Pie de bomba de 4 pulgadas',NULL,'/publications_service/uploads/1780067455833-922361466.webp'),
(26,515,'Procesamiento de Minerales','Manejo de Materiales','Pie de bomba','Impeler 6 pulgadas','Pie de bomba de 6 pulgadas',NULL,'/publications_service/uploads/1780067566420-43648843.webp'),
(27,516,'Procesamiento de Minerales','Molienda','Molino','H-40','Molino de ipacto H-40',NULL,'/publications_service/uploads/1781550294926-579861814.webp'),
(28,517,'Procesamiento de Minerales','Molienda','Molino','H-40','adadad',NULL,'/publications_service/uploads/1785075665492-812925467.webp'),
(29,518,'Procesamiento de Minerales','Molienda','Molino','H-40','sfsf',NULL,'/publications_service/uploads/1786139849555-116478281.webp');
/*!40000 ALTER TABLE `product_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_user` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `price` decimal(10,2) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_products_name` (`name`),
  KEY `fk_product_seller` (`id_user`),
  CONSTRAINT `fk_product_seller` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=519 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES
(501,67,'Molino impactor H-40',1,NULL,1),
(502,103,'Molino de impacto H-40',0,NULL,0),
(503,103,'Winche de 4 toneladas',0,NULL,0),
(504,103,'Molino H-25',0,NULL,0),
(505,103,'Tromer de 25 toneladas',1,NULL,0),
(506,103,'Trituradora de mandibula con tolva',0,NULL,0),
(507,103,'Molino de coco',0,NULL,0),
(508,103,'Molino H-66',0,NULL,0),
(509,103,'Bolas para molino de coco',0,NULL,0),
(510,103,'Martillos para molinos de impacto',0,NULL,0),
(511,103,'Molino H-40 con motor Diesel',0,NULL,0),
(512,103,'Trituradora de mandibula para laboratorio',1,NULL,0),
(513,103,'Martillos de impacto (costillas)',0,NULL,0),
(514,103,'Pie de bomba (Burro) de 4 pulgadas',0,NULL,0),
(515,103,'Pie de bomba (Burro) de 6 pulgadas',0,NULL,0),
(516,67,'Molino impactor H-40',1,NULL,1),
(517,104,'Molino impactor H-40',0,NULL,1),
(518,67,'Molino impactor H-40',0,NULL,1);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `message` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Sin mensajes',
  `role` enum('Administrador','Usuario','Inactivo','Developer','Asociado') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Usuario',
  `security_question` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `security_answer` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(67,'Fernando D\' Sangeorge','acunafernando592@gmail.com','$2a$04$yYglLGOMeHxISA3kCIjSO.2eB5J0CD5krEIC9ZYn3Qejf2DAo71iG','','sin comentarios\r\n','Developer','¿Cual es el nombre de tu primer mascota?','Kiara'),
(103,'Fabrimine C.A.','fabrimine.ca@gmail.com','$2a$04$2wt40SU4MB7.ShIyo9hHK.JTzoElYX38UkGhYmy0SeBt8XxEOmt3i',NULL,'Sin mensajes','Asociado','¿Cuál fue el nombre de tu primera escuela?','marta vechio'),
(104,'Fernando Acuña','fernandodesangeorge@gmail.com','$2a$04$1G0AXJB.gRd1.NiJVS6puebe4nZOnkEHEiZTWrf0LFivuHCcj87VW',NULL,'Sin mensajes','Usuario','Google Auth','102430075618976959730');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'marketplace'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-07 22:00:43
