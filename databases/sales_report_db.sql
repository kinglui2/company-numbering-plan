-- MySQL dump 10.13  Distrib 8.0.41, for Linux (x86_64)
--
-- Host: localhost    Database: sales_report_db
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
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'Atul Chauhan','2025-06-20 06:50:51'),(2,'Dragan Dincin','2025-06-20 06:50:51'),(3,'Amir Ali','2025-06-20 06:50:51'),(4,'Antoninah  Ombogo','2025-06-20 06:50:51'),(5,'Divina Mokeira','2025-06-20 06:50:51'),(6,'Aron Kipkemoi','2025-06-20 06:50:51'),(7,'Victor Mwatu','2025-06-20 06:50:51');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products_services`
--

DROP TABLE IF EXISTS `products_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products_services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` enum('Good','Service','Talktime') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=143 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products_services`
--

LOCK TABLES `products_services` WRITE;
/*!40000 ALTER TABLE `products_services` DISABLE KEYS */;
INSERT INTO `products_services` VALUES (1,'Hosting Space per HU','Service','2025-06-20 12:12:29'),(2,'Interconnect billing','Service','2025-06-20 12:12:30'),(3,'3CX Phone System Hosting by 3CX.COM','Service','2025-06-20 12:12:30'),(13,'3CX Phone System Startup 10 User Subscription','Service','2025-06-20 12:12:31'),(14,'3rd Party SIP Trunk Interconnect Fee','Service','2025-06-20 12:12:32'),(29,'Additional Cloud One Phone Number Subscription','Service','2025-06-20 12:12:33'),(32,'Cloud One Appliance','Service','2025-06-20 12:12:33'),(33,'Cloud One Business SIP Trunk Subscription','Service','2025-06-20 12:12:33'),(48,'Cloud One CORPRED Autodialer 10 Agents','Service','2025-06-20 12:12:35'),(49,'Cloud One Pay As You Go SIP Trunk Subscription','Service','2025-06-20 12:12:35'),(55,'Cloud One Premium Phone Number Subscription','Service','2025-06-20 12:12:36'),(58,'Cloud One SIP Trunk Subscription for International Customer','Service','2025-06-20 12:12:36'),(61,'Cloud One SMB PBX Subscription','Service','2025-06-20 12:12:37'),(67,'Cloud One Service Reconnection Fee','Service','2025-06-20 12:12:37'),(68,'Cloud One Talk Time Top-up','Service','2025-06-20 12:12:37'),(70,'Cloud One Talk Time Top-up - Recurring','Service','2025-06-20 12:12:38'),(72,'Cloud One Toll Free Number Subscription','Service','2025-06-20 12:12:38'),(74,'Cloud One Wholesale SIP Service Subscription','Service','2025-06-20 12:12:38'),(76,'Custom Configuration Addon for Virtual Machine','Service','2025-06-20 12:12:38'),(81,'Premium Support Ticket','Service','2025-06-20 12:12:39'),(82,'Yeastar CloudPBX Subscription','Service','2025-06-20 12:12:39'),(83,'Managed 3CX Phone System Pro Subscription','Service','2025-06-20 12:12:39'),(84,'Virtual Machine','Service','2025-06-20 12:12:39'),(85,'[SIP-T43U] Yealink SIP-T43U IP Phone','Service','2025-06-20 12:12:39'),(86,'[EXP43] Yealink EXP43 Expansion Module','Service','2025-06-20 12:12:39'),(87,'[SIP-T30P] Yealink SIP-T30P IP Phone','Service','2025-06-20 12:12:39'),(88,'Managed Appliance Subscription','Service','2025-06-20 12:12:39'),(89,'Toll Free talk time Top Up','Service','2025-06-20 12:12:39'),(90,'3CX Phone System Pro Edition','Service','2025-06-20 12:12:40'),(91,'Wholesale Talk Time Usage','Service','2025-06-20 12:12:40'),(92,'GSM Line Hosting','Service','2025-06-20 12:12:40'),(93,'Wholesale Bulk Talk-Time Top-Up','Service','2025-06-20 12:12:40'),(94,'Toll Free Usage Billing for Cloud One TFN Subscribers','Service','2025-06-20 12:12:40'),(95,'Managed 3CX Phone System Standard Subscription','Service','2025-06-20 12:12:40'),(96,'[SIP-T31P] Yealink SIP-T31P IP Phone','Service','2025-06-20 12:12:40'),(97,'[PSU-5V-0.60A] Yealink PSU-5V-0.60A Power Adapter','Service','2025-06-20 12:12:40'),(99,'[UH34] Yealink UH34 USB Wired Dual Headset','Service','2025-06-20 12:12:41'),(100,'Yealink PSU-5V-1.2A','Service','2025-06-20 12:12:41'),(101,'Installation of Yealink IP phone','Service','2025-06-20 12:12:41'),(102,'3rd Party SIP Trunk Setup Fee','Service','2025-06-20 12:12:41'),(103,'Yeastar P-series Software Edition','Service','2025-06-20 12:12:41'),(104,'Managed Yeastar P-series software Enterprise Edition','Service','2025-06-20 12:12:41'),(105,'Yeastar TG800 GSM VoIP Gateway','Service','2025-06-20 12:12:41'),(107,'Returnable deposit','Service','2025-06-20 12:12:42'),(108,'Yeastar CloudPBX Subscription (Additional 1 Extension (Requires Initial Pack)','Service','2025-06-20 12:12:42'),(109,'Linkus Pro Cloud Subscription License (S50)','Service','2025-06-20 12:12:42'),(110,'Appliance Subscription License (P570)','Service','2025-06-20 12:12:42'),(111,'UH34 Lite Dual Headsets','Service','2025-06-20 12:12:42'),(112,'Yeastar P570 IP PBX','Service','2025-06-20 12:12:42'),(113,'EX08','Service','2025-06-20 12:12:42'),(114,'GSM Module','Service','2025-06-20 12:12:42'),(115,'Installation of Yeastar IP PBX Baseunit','Service','2025-06-20 12:12:42'),(116,'\"D-Link Cat6 UTP 24 AWG PVC Round Patch Cord - 1m','Service','2025-06-20 12:12:43'),(117,'- Yellow Colour\"','Service','2025-06-20 12:12:43'),(118,'\"D-Link Cat6 UTP 24 AWG PVC Round Patch Cord -','Service','2025-06-20 12:12:43'),(119,'3m - Grey Colour\"','Service','2025-06-20 12:12:44'),(120,'Yeastar TG200 GSM VoIP Gateway','Service','2025-06-20 12:12:44'),(121,'Yealink SIP-T44W','Service','2025-06-20 12:12:44'),(122,'Yealink PSU-5V-2A Power Adapter','Service','2025-06-20 12:12:44'),(123,'International DID Number - Uganda Monthly fee','Service','2025-06-20 12:12:44'),(124,'Yeastar P560 IP PBX','Service','2025-06-20 12:12:45'),(125,'Yeastar EX08','Service','2025-06-20 12:12:45'),(126,'[SIP-T57W] Yealink SIP-T57W IP Phone','Service','2025-06-20 12:12:45'),(127,'DGS-1250-52XMP','Service','2025-06-20 12:12:45'),(128,'3CX Phone System Enterprise Edition','Service','2025-06-20 12:12:45'),(129,'W73P','Service','2025-06-20 12:12:46'),(130,'Usage Billing for International Customers','Service','2025-06-20 12:12:46'),(131,'IVROHP','Service','2025-06-20 12:12:46'),(132,'Cloud One Managed Enterprise Business Communication Suite','Service','2025-06-20 12:12:46'),(133,'Cloud One Self Managed Enterprise Business Communication Suite Subscription','Service','2025-06-20 12:12:46'),(134,'Cloud One Managed Elite Business Communication Suite','Service','2025-06-20 12:12:47'),(135,'Bring Your Own Carrier (BYOC) Interconnect Subscription','Service','2025-06-20 12:12:47'),(136,'Bring Your Own Carrier (BYOC) Setup Fee','Service','2025-06-20 12:12:47'),(137,'GSM Line Hosting Setup fee','Service','2025-06-20 12:12:47'),(138,'Country Presence SIP Trunk Setup fee','Service','2025-06-20 12:12:47'),(139,'Country Presence SIP Trunk Subscription','Service','2025-06-20 12:12:48'),(140,'Country Presence Talk Time Top Up','Service','2025-06-20 12:12:48'),(141,'Cloud One Self Managed SMB Business Communication Suite','Service','2025-06-20 12:12:48'),(142,'SIP-T34W','Service','2025-06-20 12:12:48');
/*!40000 ALTER TABLE `products_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_reports`
--

DROP TABLE IF EXISTS `sales_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_date` date NOT NULL,
  `referral_person_id` int DEFAULT NULL,
  `sales_person_id` int DEFAULT NULL,
  `follow_up_person_id` int DEFAULT NULL,
  `company_name` varchar(100) NOT NULL,
  `product_or_service` text NOT NULL,
  `service_start_date` date DEFAULT NULL,
  `service_active` tinyint(1) DEFAULT NULL,
  `returnable_deposit` decimal(10,2) DEFAULT NULL,
  `vat` decimal(10,2) DEFAULT NULL,
  `sales_amount` decimal(10,2) DEFAULT NULL,
  `document_serial` varchar(50) DEFAULT NULL,
  `note` text,
  `service_note` enum('New','Existing') DEFAULT NULL,
  `month_service_start` varchar(20) DEFAULT NULL,
  `sum_check_status` varchar(20) DEFAULT NULL,
  `sale_category` enum('Good','Service','Talktime') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `recurring` decimal(10,2) DEFAULT NULL,
  `one_off` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_document_serial` (`document_serial`),
  KEY `referral_person_id` (`referral_person_id`),
  KEY `sales_person_id` (`sales_person_id`),
  KEY `follow_up_person_id` (`follow_up_person_id`),
  CONSTRAINT `sales_reports_ibfk_1` FOREIGN KEY (`referral_person_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `sales_reports_ibfk_2` FOREIGN KEY (`sales_person_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `sales_reports_ibfk_3` FOREIGN KEY (`follow_up_person_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_reports`
--

LOCK TABLES `sales_reports` WRITE;
/*!40000 ALTER TABLE `sales_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_reports` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-08 21:39:16
