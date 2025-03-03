-- Add url_gestionale, login_gestionale, and password_gestionale columns to clienti_service_paghe table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti_service_paghe' AND column_name = 'url_gestionale'
  ) THEN
    ALTER TABLE clienti_service_paghe ADD COLUMN url_gestionale TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti_service_paghe' AND column_name = 'login_gestionale'
  ) THEN
    ALTER TABLE clienti_service_paghe ADD COLUMN login_gestionale TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti_service_paghe' AND column_name = 'password_gestionale'
  ) THEN
    ALTER TABLE clienti_service_paghe ADD COLUMN password_gestionale TEXT;
  END IF;
END $$;