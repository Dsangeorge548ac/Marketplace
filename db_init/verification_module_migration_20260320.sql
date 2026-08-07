-- Migration: verification module update (does not modify users table)
-- Date: 2026-03-20

CREATE TABLE IF NOT EXISTS account_verification_process (
  id int NOT NULL AUTO_INCREMENT,
  account_id int NOT NULL,
  status enum('No verificado','Pendiente revision','Verificado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'No verificado',
  feedback text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  submitted_at datetime DEFAULT NULL,
  reviewed_at datetime DEFAULT NULL,
  reviewed_by int DEFAULT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_verification_account (account_id),
  KEY idx_verification_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS account_verification_tax_information (
  id int NOT NULL AUTO_INCREMENT,
  verification_id int NOT NULL,
  business_name varchar(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  tax_address text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  tax_id varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  phone varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tax_information_verification (verification_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS account_verification_documents (
  id int NOT NULL AUTO_INCREMENT,
  verification_id int NOT NULL,
  document_type enum('cbm_alliance_document','tax_id_document','face_photo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  file_path varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_verification_document_type (verification_id, document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE account_verification_process
  ADD CONSTRAINT fk_verification_account FOREIGN KEY (account_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_verification_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE account_verification_tax_information
  ADD CONSTRAINT fk_tax_information_verification FOREIGN KEY (verification_id) REFERENCES account_verification_process (id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE account_verification_documents
  ADD CONSTRAINT fk_verification_documents_process FOREIGN KEY (verification_id) REFERENCES account_verification_process (id) ON DELETE CASCADE ON UPDATE CASCADE;
