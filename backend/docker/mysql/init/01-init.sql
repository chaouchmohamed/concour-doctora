CREATE DATABASE IF NOT EXISTS concours_nominative CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS concours_anonymization CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'concours_user'@'%' IDENTIFIED BY 'concours_password';
CREATE USER IF NOT EXISTS 'anonymization_user'@'%' IDENTIFIED BY 'anonymization_password';

GRANT ALL PRIVILEGES ON concours_nominative.* TO 'concours_user'@'%';
GRANT ALL PRIVILEGES ON concours_anonymization.* TO 'anonymization_user'@'%';

FLUSH PRIVILEGES;
