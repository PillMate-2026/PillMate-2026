SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `pillmate_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `pillmate_db`;

ALTER DATABASE `pillmate_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- ===== DROP (외래키 의존성 역순) =====
DROP TABLE IF EXISTS `INGREDIENT_SYMPTOM`;
DROP TABLE IF EXISTS `MEDICINE_INGREDIENT`;
DROP TABLE IF EXISTS `NOTIFICATION`;
DROP TABLE IF EXISTS `MEDICINE_WARNING`;
DROP TABLE IF EXISTS `MEDICINE`;
DROP TABLE IF EXISTS `INVITE_CODE`;
DROP TABLE IF EXISTS `USER`;
DROP TABLE IF EXISTS `MEDICINE_WASTE_BIN`;
DROP TABLE IF EXISTS `INGREDIENT`;
DROP TABLE IF EXISTS `SYMPTOM`;
DROP TABLE IF EXISTS `FAMILY`;

-- ===== CREATE =====

-- 1. FAMILY
CREATE TABLE `FAMILY` (
  `family_id` INT NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`family_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. SYMPTOM
CREATE TABLE `SYMPTOM` (
  `symptom_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`symptom_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. INGREDIENT
CREATE TABLE `INGREDIENT` (
  `ingredient_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`ingredient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. MEDICINE_WASTE_BIN
CREATE TABLE `MEDICINE_WASTE_BIN` (
  `bin_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `latitude` DECIMAL(10,7) NOT NULL,
  `longitude` DECIMAL(10,7) NOT NULL,
  PRIMARY KEY (`bin_id`),
  CONSTRAINT `chk_latitude` CHECK (`latitude` BETWEEN -90 AND 90),
  CONSTRAINT `chk_longitude` CHECK (`longitude` BETWEEN -180 AND 180)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. USER
CREATE TABLE `USER` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `family_id` INT NULL,
  `name` VARCHAR(20) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `age` INT NULL,
  `gender` VARCHAR(10) NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_family`
    FOREIGN KEY (`family_id`)
    REFERENCES `FAMILY` (`family_id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_age`
    CHECK (`age` IS NULL OR `age` >= 0),
  CONSTRAINT `chk_gender`
    CHECK (
      `gender` IS NULL
      OR `gender` COLLATE utf8mb4_unicode_ci IN (
        _utf8mb4'여성' COLLATE utf8mb4_unicode_ci,
        _utf8mb4'남성' COLLATE utf8mb4_unicode_ci
      )
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. INVITE_CODE
CREATE TABLE `INVITE_CODE` (
  `code` CHAR(6) NOT NULL,
  `family_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`code`),
  CONSTRAINT `fk_invite_family`
    FOREIGN KEY (`family_id`)
    REFERENCES `FAMILY` (`family_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. MEDICINE
-- status는 expiration_date 기준으로 조회 시 계산하므로 컬럼으로 저장하지 않음
CREATE TABLE `MEDICINE` (
  `medicine_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `family_id` INT NULL,
  `name` VARCHAR(50) NOT NULL,
  `expiration_date` DATE NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `item_seq` VARCHAR(20) NOT NULL, --품목코드 추가
  `entp_name` VARCHAR(100) NULL, --회사명 추가
  `item_image` TEXT NULL, --사진 추가
  `efficacy` TEXT NULL, --효과효능 추가
  `use_method` TEXT NULL,
  `precaution` TEXT NULL, --주의사항 추가
  `interaction` TEXT NULL, --상호작용 추가
  `side_effect` TEXT NULL, --부작용 추가
  `version` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`medicine_id`),
  CONSTRAINT `fk_medicine_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `USER` (`user_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_medicine_family`
    FOREIGN KEY (`family_id`)
    REFERENCES `FAMILY` (`family_id`)
    ON DELETE CASCADE,
  CONSTRAINT `chk_medicine_owner`
    CHECK ((`user_id` IS NULL) <> (`family_id` IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. MEDICINE_WARNING
CREATE TABLE `MEDICINE_WARNING` (
  `warning_id` INT NOT NULL AUTO_INCREMENT,
  `medicine_id` INT NOT NULL,
  `content` VARCHAR(255) NOT NULL,
  `type` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`warning_id`),
  CONSTRAINT `fk_warning_medicine`
    FOREIGN KEY (`medicine_id`)
    REFERENCES `MEDICINE` (`medicine_id`)
    ON DELETE CASCADE,
  CONSTRAINT `chk_warning_type`
    CHECK (
      `type` COLLATE utf8mb4_unicode_ci IN (
        _utf8mb4'주의사항' COLLATE utf8mb4_unicode_ci,
        _utf8mb4'상호작용' COLLATE utf8mb4_unicode_ci,
        _utf8mb4'부작용' COLLATE utf8mb4_unicode_ci,
        _utf8mb4'경고' COLLATE utf8mb4_unicode_ci
      )
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. NOTIFICATION
CREATE TABLE `NOTIFICATION` (
  `notification_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `medicine_id` INT NULL,
  `medicine_name` VARCHAR(50) NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`notification_id`),
  CONSTRAINT `fk_notif_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `USER` (`user_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_notif_medicine`
    FOREIGN KEY (`medicine_id`)
    REFERENCES `MEDICINE` (`medicine_id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. MEDICINE_INGREDIENT
CREATE TABLE `MEDICINE_INGREDIENT` (
  `medicine_id` INT NOT NULL,
  `ingredient_id` INT NOT NULL,
  PRIMARY KEY (`medicine_id`, `ingredient_id`),
  CONSTRAINT `fk_mi_medicine`
    FOREIGN KEY (`medicine_id`)
    REFERENCES `MEDICINE` (`medicine_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_mi_ingredient`
    FOREIGN KEY (`ingredient_id`)
    REFERENCES `INGREDIENT` (`ingredient_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. INGREDIENT_SYMPTOM
CREATE TABLE `INGREDIENT_SYMPTOM` (
  `ingredient_id` INT NOT NULL,
  `symptom_id` INT NOT NULL,
  PRIMARY KEY (`ingredient_id`, `symptom_id`),
  CONSTRAINT `fk_is_ingredient`
    FOREIGN KEY (`ingredient_id`)
    REFERENCES `INGREDIENT` (`ingredient_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_is_symptom`
    FOREIGN KEY (`symptom_id`)
    REFERENCES `SYMPTOM` (`symptom_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;