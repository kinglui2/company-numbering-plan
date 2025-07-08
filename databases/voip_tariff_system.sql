-- MySQL dump 10.13  Distrib 8.0.41, for Linux (x86_64)
--
-- Host: localhost    Database: voip_tariff_system
-- ------------------------------------------------------
-- Server version	8.0.41-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `consolidated_rates`
--

DROP TABLE IF EXISTS `consolidated_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consolidated_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prefix` varchar(20) NOT NULL,
  `country` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `primary_supplier_id` int NOT NULL,
  `primary_rate` decimal(10,4) NOT NULL,
  `backup_supplier_id` int DEFAULT NULL,
  `backup_rate` decimal(10,4) DEFAULT NULL,
  `grace_period` int DEFAULT '0',
  `minimal_time` int DEFAULT '0',
  `resolution` int DEFAULT '1',
  `rate_multiplier` decimal(5,2) DEFAULT '1.00',
  `rate_addition` decimal(10,4) DEFAULT '0.0000',
  `surcharge_time` int DEFAULT '0',
  `surcharge_amount` decimal(10,4) DEFAULT '0.0000',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `primary_supplier_id` (`primary_supplier_id`),
  KEY `backup_supplier_id` (`backup_supplier_id`),
  CONSTRAINT `consolidated_rates_ibfk_1` FOREIGN KEY (`primary_supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `consolidated_rates_ibfk_2` FOREIGN KEY (`backup_supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consolidated_rates`
--

LOCK TABLES `consolidated_rates` WRITE;
/*!40000 ALTER TABLE `consolidated_rates` DISABLE KEYS */;
/*!40000 ALTER TABLE `consolidated_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_rates`
--

DROP TABLE IF EXISTS `supplier_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `prefix` varchar(20) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `voice_rate` decimal(10,4) NOT NULL,
  `grace_period` int DEFAULT '0',
  `minimal_time` int DEFAULT '0',
  `resolution` int DEFAULT '1',
  `rate_multiplier` decimal(5,2) DEFAULT '1.00',
  `rate_addition` decimal(10,4) DEFAULT '0.0000',
  `surcharge_time` int DEFAULT '0',
  `surcharge_amount` decimal(10,4) DEFAULT '0.0000',
  `time_from_day` int DEFAULT NULL,
  `time_to_day` int DEFAULT NULL,
  `time_from_hour` int DEFAULT NULL,
  `time_to_hour` int DEFAULT NULL,
  `is_sms` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `supplier_rates_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_rates`
--

LOCK TABLES `supplier_rates` WRITE;
/*!40000 ALTER TABLE `supplier_rates` DISABLE KEYS */;
INSERT INTO `supplier_rates` VALUES (1,1,'44','UK - Generic','UK',0.1200,0,0,1,1.00,0.0000,0,0.0000,NULL,NULL,NULL,NULL,0,'2025-06-26 08:56:41'),(2,1,'2547','Kenya Mobile Safaricom','Kenya',0.0900,5,0,1,1.00,0.0000,0,0.0000,NULL,NULL,NULL,NULL,0,'2025-06-26 08:56:41'),(3,2,'44','UK - BT','UK',0.1150,0,0,1,1.00,0.0000,0,0.0000,NULL,NULL,NULL,NULL,0,'2025-06-26 08:56:41'),(4,2,'2547','Kenya Mobile Airtel','Kenya',0.0950,5,0,1,1.00,0.0000,0,0.0000,NULL,NULL,NULL,NULL,0,'2025-06-26 08:56:41'),(5,3,'254','Kenya General','Kenya',0.1100,3,0,1,1.00,0.0000,0,0.0000,NULL,NULL,NULL,NULL,0,'2025-06-26 08:56:41');
/*!40000 ALTER TABLE `supplier_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `currency` varchar(10) DEFAULT 'Ksh',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Supplier A','Ksh','2025-06-26 08:55:24'),(2,'Supplier B','Ksh','2025-06-26 08:55:24'),(3,'Supplier C','Ksh','2025-06-26 08:55:24'),(5,'telkom','Ksh','2025-07-03 08:08:26');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-08 21:39:43
