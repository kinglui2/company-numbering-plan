-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category ENUM('system', 'security') NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_setting (category, setting_key),
    INDEX idx_category (category),
    INDEX idx_setting_key (setting_key)
);

-- Insert default system settings
INSERT INTO system_settings (category, setting_key, setting_value) VALUES
-- System settings
('system', 'cooloffPeriod', '90'),
('system', 'defaultGateway', 'CS01'),
('system', 'numberFormat', 'standard'),
('system', 'enableNotifications', 'true'),

-- Security settings
('security', 'passwordMinLength', '8'),
('security', 'requireSpecialChars', 'true'),
('security', 'requireNumbers', 'true'),
('security', 'requireUppercase', 'true'),
('security', 'sessionTimeout', '30'),
('security', 'enableTwoFactor', 'false'),
('security', 'maxLoginAttempts', '5')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value); 