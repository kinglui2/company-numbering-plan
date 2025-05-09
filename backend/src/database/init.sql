-- Create phone_numbers table
CREATE TABLE IF NOT EXISTS phone_numbers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_number VARCHAR(20) NOT NULL UNIQUE,
    national_code VARCHAR(5),
    area_code VARCHAR(5),
    network_code VARCHAR(5),
    subscriber_number VARCHAR(10),
    is_golden BOOLEAN DEFAULT FALSE,
    status ENUM('available', 'assigned', 'cooloff') DEFAULT 'available',
    subscriber_name VARCHAR(255),
    company_name VARCHAR(255),
    gateway VARCHAR(255),
    gateway_username VARCHAR(255),
    assignment_date DATETIME,
    unassigned_date DATETIME,
    previous_company VARCHAR(255),
    previous_assignment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create number_history table
CREATE TABLE IF NOT EXISTS number_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    number_id INT NOT NULL,
    change_type ENUM('assignment', 'unassignment', 'update') NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (number_id) REFERENCES phone_numbers(id)
);

-- Create cooloff_numbers table
CREATE TABLE IF NOT EXISTS cooloff_numbers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    number_id INT NOT NULL,
    unassigned_date DATETIME NOT NULL,
    previous_subscriber VARCHAR(255),
    previous_company VARCHAR(255),
    previous_gateway VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (number_id) REFERENCES phone_numbers(id)
); 