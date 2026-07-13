-- scripts/alter_routes_add_polyline.sql
-- Add a JSONB column to store route polyline (GeoJSON LineString)

ALTER TABLE routes ADD COLUMN IF NOT EXISTS polyline jsonb;

-- Optional: create a GIST index for spatial queries (PostGIS not required for simple JSONB)
-- CREATE INDEX idx_routes_polyline ON routes USING GIST (polyline);
