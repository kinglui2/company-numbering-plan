-- Create database if not exists
CREATE DATABASE IF NOT EXISTS numbering_plan_db;
USE numbering_plan_db;

-- Phone numbers table
CREATE TABLE IF NOT EXISTS phone_numbers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_number VARCHAR(15) NOT NULL UNIQUE,
    national_code VARCHAR(3) NOT NULL,
    area_code VARCHAR(2) NOT NULL,
    network_code VARCHAR(3) NOT NULL,
    subscriber_number VARCHAR(4) NOT NULL,
    is_golden BOOLEAN DEFAULT FALSE,
    status ENUM('assigned', 'unassigned', 'cooloff') NOT NULL DEFAULT 'unassigned',
    subscriber_name VARCHAR(255),
    company_name VARCHAR(255),
    assignment_date DATETIME,
    gateway VARCHAR(10),
    gateway_username VARCHAR(100),
    assigned_by VARCHAR(100),
    unassignment_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_full_number (full_number),
    INDEX idx_status (status),
    INDEX idx_gateway (gateway),
    INDEX idx_subscriber (subscriber_name),
    INDEX idx_company (company_name)
);

-- Number history table
CREATE TABLE IF NOT EXISTS number_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    number_id INT NOT NULL,
    previous_status ENUM('assigned', 'unassigned', 'cooloff'),
    new_status ENUM('assigned', 'unassigned', 'cooloff'),
    previous_subscriber VARCHAR(255),
    new_subscriber VARCHAR(255),
    previous_company VARCHAR(255),
    new_company VARCHAR(255),
    previous_gateway VARCHAR(10),
    new_gateway VARCHAR(10),
    previous_gateway_username VARCHAR(100),
    new_gateway_username VARCHAR(100),
    changed_by VARCHAR(100),
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (number_id) REFERENCES phone_numbers(id),
    INDEX idx_number_id (number_id),
    INDEX idx_change_date (change_date)
); 