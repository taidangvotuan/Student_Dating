-- Enforce .edu.vn email domain, validate required signup metadata, and auto-provision students + profiles

-- 1. Validate signup on auth.users before insert (enforce .edu.vn email, non-empty fullname, and valid birthdate)
CREATE OR REPLACE FUNCTION public.validate_auth_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_birth_date_text text;
  v_birth_date date;
BEGIN
  -- 1.1 Enforce .uit.edu.vn email domain
  IF NEW.email IS NULL OR LOWER(NEW.email) NOT LIKE '%.uit.edu.vn' THEN
    RAISE EXCEPTION 'Only .uit.edu.vn university email addresses are accepted.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 1.2 Validate full name (must be provided and non-empty)
  v_full_name := btrim(COALESCE(
    NEW.raw_user_meta_data->>'fullname',
    NEW.raw_user_meta_data->>'full_name',
    ''
  ));

  IF v_full_name = '' THEN
    RAISE EXCEPTION 'Full name is required and cannot be empty.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 1.3 Validate birth date (must be provided, format YYYY-MM-DD, valid date in the past)
  v_birth_date_text := btrim(COALESCE(
    NEW.raw_user_meta_data->>'birthdate',
    NEW.raw_user_meta_data->>'birthday',
    NEW.raw_user_meta_data->>'birth_date',
    ''
  ));

  IF v_birth_date_text = '' THEN
    RAISE EXCEPTION 'Birth date is required and cannot be empty.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_birth_date_text !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Birth date must be in YYYY-MM-DD format.'
      USING ERRCODE = 'check_violation';
  END IF;

  BEGIN
    v_birth_date := v_birth_date_text::date;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Birth date is not a valid calendar date.'
      USING ERRCODE = 'check_violation';
  END;

  IF v_birth_date >= CURRENT_DATE THEN
    RAISE EXCEPTION 'Birth date must be in the past.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_before_insert ON auth.users;
CREATE TRIGGER on_auth_user_before_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_auth_user_signup();

-- 2. Automatically create students, profiles (with signup metadata), and verifications
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_birth_date_text text;
  v_birth_date date;
  v_gender text;
  v_faculty text;
  v_cohort text;
  v_student_number text;
BEGIN
  -- Extract validated full name
  v_full_name := btrim(COALESCE(
    NEW.raw_user_meta_data->>'fullname',
    NEW.raw_user_meta_data->>'full_name',
    ''
  ));
  IF v_full_name = '' THEN
    RAISE EXCEPTION 'Full name is required and cannot be empty.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Extract validated birth date
  v_birth_date_text := btrim(COALESCE(
    NEW.raw_user_meta_data->>'birthdate',
    NEW.raw_user_meta_data->>'birthday',
    NEW.raw_user_meta_data->>'birth_date',
    ''
  ));
  IF v_birth_date_text = '' OR v_birth_date_text !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Birth date is required and must be in YYYY-MM-DD format.'
      USING ERRCODE = 'check_violation';
  END IF;

  BEGIN
    v_birth_date := v_birth_date_text::date;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Birth date is not a valid calendar date.'
      USING ERRCODE = 'check_violation';
  END;

  IF v_birth_date >= CURRENT_DATE THEN
    RAISE EXCEPTION 'Birth date must be in the past.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Extract optional metadata
  v_gender  := NEW.raw_user_meta_data->>'gender';
  v_faculty := NEW.raw_user_meta_data->>'faculty';
  v_cohort  := NEW.raw_user_meta_data->>'cohort';

  -- Extract student ID (first 8 characters of email before @, e.g. 24521234 from 24521234@gm.uit.edu.vn)
  v_student_number := substring(split_part(NEW.email, '@', 1) from 1 for 8);

  -- 2.1 Ensure student account exists
  INSERT INTO public.students (id, account_status)
  VALUES (NEW.id, 'HOAT_DONG')
  ON CONFLICT (id) DO NOTHING;

  -- 2.2 Create profile with validated data from frontend signup
  INSERT INTO public.profiles (
    student_id,
    full_name,
    birth_date,
    gender,
    faculty,
    cohort,
    visibility
  )
  VALUES (
    NEW.id,
    v_full_name,
    v_birth_date,
    v_gender,
    v_faculty,
    v_cohort,
    'BI_AN'
  )
  ON CONFLICT (student_id) DO UPDATE SET
    full_name  = EXCLUDED.full_name,
    birth_date = EXCLUDED.birth_date,
    gender     = COALESCE(EXCLUDED.gender, profiles.gender),
    faculty    = COALESCE(EXCLUDED.faculty, profiles.faculty),
    cohort     = COALESCE(EXCLUDED.cohort, profiles.cohort);

  -- 2.3 Provision verification record with extracted student ID
  IF v_student_number IS NOT NULL AND btrim(v_student_number) <> '' THEN
    INSERT INTO public.verifications (
      student_id,
      student_number,
      university_name,
      status
    )
    VALUES (
      NEW.id,
      v_student_number,
      'UIT',
      'CHUA_XAC_THUC'
    )
    ON CONFLICT (student_id) DO UPDATE SET
      student_number = COALESCE(EXCLUDED.student_number, verifications.student_number);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
