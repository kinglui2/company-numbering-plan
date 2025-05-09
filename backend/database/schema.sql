-- Phone Numbers Table
CREATE TABLE IF NOT EXISTS phone_numbers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_number VARCHAR(20) UNIQUE NOT NULL,
    status ENUM('available', 'assigned', 'unassigned', 'cooloff') NOT NULL DEFAULT 'available',
    subscriber_name VARCHAR(255),
    company_name VARCHAR(255),
    gateway VARCHAR(50),
    is_golden BOOLEAN DEFAULT FALSE,
    assignment_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cooloff Numbers Table
CREATE TABLE IF NOT EXISTS cooloff_numbers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone_number_id INT NOT NULL,
    unassigned_date DATETIME NOT NULL,
    previous_subscriber VARCHAR(255),
    previous_company VARCHAR(255),
    previous_gateway VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE CASCADE
);

-- Number History Table
CREATE TABLE IF NOT EXISTS number_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    number_id INT NOT NULL,
    change_type ENUM('assignment', 'unassignment', 'status_change') NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (number_id) REFERENCES phone_numbers(id) ON DELETE CASCADE
); 