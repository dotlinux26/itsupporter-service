ALTER TABLE service_packages ADD COLUMN name_en TEXT NOT NULL DEFAULT '';
ALTER TABLE service_packages ADD COLUMN description_en TEXT NOT NULL DEFAULT '';
ALTER TABLE service_packages ADD COLUMN features_en TEXT NOT NULL DEFAULT '';

UPDATE service_packages
SET name_en = name,
    description_en = COALESCE(description, ''),
    features_en = features
WHERE name_en = '' AND description_en = '' AND features_en = '';

ALTER TABLE voucher_programs ADD COLUMN name_en TEXT NOT NULL DEFAULT '';
ALTER TABLE voucher_programs ADD COLUMN description_en TEXT NOT NULL DEFAULT '';

UPDATE voucher_programs
SET name_en = name,
    description_en = COALESCE(description, '')
WHERE name_en = '' AND description_en = '';
