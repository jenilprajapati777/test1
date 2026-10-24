-- Museum of Us: Production Database Schema & Security
-- Idempotent migration for Postgres / Supabase & PGlite

DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Ensure auth schema & uid() helper exist (for PGlite test compatibility)
CREATE SCHEMA IF NOT EXISTS auth;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'uid' AND n.nspname = 'auth'
  ) THEN
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $fn$;
  END IF;
END $$;

-- 1. Museums Table
CREATE TABLE IF NOT EXISTS museums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  slug text UNIQUE NOT NULL CHECK (length(slug) BETWEEN 10 AND 16),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  title text NOT NULL DEFAULT 'Our Museum' CHECK (length(title) <= 40),
  from_name text NOT NULL CHECK (length(from_name) <= 30),
  to_name text NOT NULL CHECK (length(to_name) <= 30),
  plaque_eyebrow text NOT NULL DEFAULT 'A PERMANENT COLLECTION' CHECK (length(plaque_eyebrow) <= 40),
  plaque_title text NOT NULL CHECK (length(plaque_title) <= 60),
  plaque_body text NOT NULL CHECK (length(plaque_body) <= 280),
  plaque_signoff text NOT NULL DEFAULT '' CHECK (length(plaque_signoff) <= 60),
  host_name text NOT NULL DEFAULT 'Host' CHECK (length(host_name) <= 20),
  host_avatar jsonb NOT NULL DEFAULT '{}'::jsonb,
  host_lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme text NOT NULL DEFAULT 'winter-gallery',
  share_preview boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Artworks Table
CREATE TABLE IF NOT EXISTS artworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'photo' CHECK (kind IN ('photo', 'video')),
  storage_path text NOT NULL,
  poster_path text,
  title text CHECK (title IS NULL OR length(title) <= 60),
  caption text CHECK (caption IS NULL OR length(caption) <= 200),
  taken_on text CHECK (taken_on IS NULL OR length(taken_on) <= 30),
  width integer CHECK (width IS NULL OR width > 0),
  height integer CHECK (height IS NULL OR height > 0),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN 0 AND 23),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Constraint Trigger: Max 24 photos and max 1 video per museum
CREATE OR REPLACE FUNCTION check_artwork_limits() RETURNS trigger AS $$
DECLARE
  v_photo_count integer;
  v_video_count integer;
BEGIN
  IF NEW.kind = 'photo' THEN
    SELECT count(*) INTO v_photo_count FROM artworks
    WHERE museum_id = NEW.museum_id AND kind = 'photo' AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    IF v_photo_count >= 24 THEN
      RAISE EXCEPTION 'Maximum 24 photos allowed per museum.';
    END IF;
  ELSIF NEW.kind = 'video' THEN
    SELECT count(*) INTO v_video_count FROM artworks
    WHERE museum_id = NEW.museum_id AND kind = 'video' AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    IF v_video_count >= 1 THEN
      RAISE EXCEPTION 'Maximum 1 video allowed per museum.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_artwork_limits ON artworks;
CREATE TRIGGER trg_artwork_limits
BEFORE INSERT OR UPDATE ON artworks
FOR EACH ROW EXECUTE FUNCTION check_artwork_limits();

-- 3. Replies Table
CREATE TABLE IF NOT EXISTS replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  visitor_name text NOT NULL CHECK (length(visitor_name) <= 20),
  message text NOT NULL CHECK (length(message) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  reason text NOT NULL CHECK (length(reason) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Rate limit tracking table for replies
CREATE TABLE IF NOT EXISTS reply_rate_limits (
  id serial PRIMARY KEY,
  museum_id uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Clean up rate limits older than 1 hour automatically
CREATE INDEX IF NOT EXISTS idx_reply_rate_limits_ts ON reply_rate_limits(museum_id, created_at);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE museums ENABLE ROW LEVEL SECURITY;
ALTER TABLE museums FORCE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks FORCE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies FORCE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports FORCE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "museums_owner_all" ON museums;
DROP POLICY IF EXISTS "artworks_owner_all" ON artworks;
DROP POLICY IF EXISTS "replies_owner_all" ON replies;
DROP POLICY IF EXISTS "reports_no_anon_select" ON reports;

-- Policy: Only owner can view, insert, update, or delete their museums
CREATE POLICY "museums_owner_all" ON museums
  FOR ALL
  USING (auth.uid() IS NOT NULL AND auth.uid() = owner_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = owner_id);

-- Policy: Only owner of parent museum can view/manage artworks
CREATE POLICY "artworks_owner_all" ON artworks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = artworks.museum_id AND museums.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = artworks.museum_id AND museums.owner_id = auth.uid()
    )
  );

-- Policy: Only museum owner can view/manage replies
CREATE POLICY "replies_owner_all" ON replies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = replies.museum_id AND museums.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = replies.museum_id AND museums.owner_id = auth.uid()
    )
  );

-- SECURITY DEFINER RPCS

-- 1. get_museum: Public safe retrieval (strips owner_id, requires published & not expired)
CREATE OR REPLACE FUNCTION get_museum(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_museum record;
  v_artworks jsonb;
BEGIN
  SELECT * INTO v_museum FROM museums
  WHERE slug = p_slug;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Must be published and not expired
  IF v_museum.status != 'published' THEN
    RETURN NULL;
  END IF;

  IF v_museum.expires_at IS NOT NULL AND v_museum.expires_at < now() THEN
    RETURN NULL;
  END IF;

  -- Fetch artworks ordered by sort_order
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'museum_id', a.museum_id,
        'kind', a.kind,
        'storage_path', a.storage_path,
        'poster_path', a.poster_path,
        'title', a.title,
        'caption', a.caption,
        'taken_on', a.taken_on,
        'width', a.width,
        'height', a.height,
        'sort_order', a.sort_order,
        'created_at', a.created_at
      ) ORDER BY a.sort_order ASC
    ),
    '[]'::jsonb
  ) INTO v_artworks
  FROM artworks a
  WHERE a.museum_id = v_museum.id;

  -- Return public object WITHOUT owner_id
  RETURN jsonb_build_object(
    'id', v_museum.id,
    'slug', v_museum.slug,
    'status', v_museum.status,
    'title', v_museum.title,
    'from_name', v_museum.from_name,
    'to_name', v_museum.to_name,
    'plaque_eyebrow', v_museum.plaque_eyebrow,
    'plaque_title', v_museum.plaque_title,
    'plaque_body', v_museum.plaque_body,
    'plaque_signoff', v_museum.plaque_signoff,
    'host_name', v_museum.host_name,
    'host_avatar', v_museum.host_avatar,
    'host_lines', v_museum.host_lines,
    'theme', v_museum.theme,
    'share_preview', v_museum.share_preview,
    'expires_at', v_museum.expires_at,
    'view_count', v_museum.view_count,
    'created_at', v_museum.created_at,
    'updated_at', v_museum.updated_at,
    'artworks', v_artworks
  );
END;
$$;

-- 2. track_visit: Increment view count for published museum
CREATE OR REPLACE FUNCTION track_visit(p_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE museums
  SET view_count = view_count + 1
  WHERE slug = p_slug AND status = 'published';
END;
$$;

-- 3. post_reply: Public guestbook post with <= 3/min/museum rate limit
CREATE OR REPLACE FUNCTION post_reply(p_slug text, p_name text, p_message text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_museum_id uuid;
  v_recent_count integer;
BEGIN
  SELECT id INTO v_museum_id FROM museums
  WHERE slug = p_slug AND status = 'published';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Museum not found or closed.');
  END IF;

  -- Rate limit check (max 3 replies per minute per museum)
  SELECT count(*) INTO v_recent_count
  FROM reply_rate_limits
  WHERE museum_id = v_museum_id AND created_at > now() - interval '1 minute';

  IF v_recent_count >= 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rate limit exceeded. Please wait a moment.');
  END IF;

  -- Record rate limit hit
  INSERT INTO reply_rate_limits (museum_id) VALUES (v_museum_id);

  -- Insert reply
  INSERT INTO replies (museum_id, visitor_name, message)
  VALUES (v_museum_id, substr(trim(p_name), 1, 20), substr(trim(p_message), 1, 500));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- 4. post_report: Public content flag
CREATE OR REPLACE FUNCTION post_report(p_slug text, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO reports (slug, reason)
  VALUES (p_slug, substr(trim(p_reason), 1, 500));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
