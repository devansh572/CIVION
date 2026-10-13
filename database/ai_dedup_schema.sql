-- ==============================================================================
-- Civion AI Deduplication & Aggregation Agent Schema
-- PostGIS (Spatial GIST) + pgvector (Vector Cosine ivfflat)
-- ==============================================================================

-- Enable PostGIS and pgvector extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- Master issues table (The authoritative tickets sent to authorities)
CREATE TABLE IF NOT EXISTS master_issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    category VARCHAR(50),
    severity VARCHAR(20) DEFAULT 'Medium',
    geom GEOMETRY(Point, 4326) NOT NULL,
    embedding VECTOR(1536), -- Dimension for text-embedding-3-small
    report_count INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Individual resident reports linked to a master issue
CREATE TABLE IF NOT EXISTS citizen_reports (
    id SERIAL PRIMARY KEY,
    master_issue_id INT REFERENCES master_issues(id) ON DELETE CASCADE,
    resident_name VARCHAR(100),
    resident_contact VARCHAR(100),
    raw_text TEXT NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial and vector indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_master_issues_geom ON master_issues USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_master_issues_embedding ON master_issues USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_master_id ON citizen_reports(master_issue_id);

-- ==============================================================================
-- 1. Spatial Pre-Filter Query Stored Procedure (Radius <= 100m)
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_spatial_candidate_issues(
    p_resident_lat DOUBLE PRECISION,
    p_resident_lng DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION DEFAULT 100.0
)
RETURNS TABLE (
    id INT,
    title VARCHAR(255),
    summary TEXT,
    embedding VECTOR(1536),
    category VARCHAR(50),
    severity VARCHAR(20),
    report_count INT,
    distance_meters DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        id, 
        title, 
        summary, 
        embedding,
        category,
        severity,
        report_count,
        ROUND(ST_Distance(
            geom::geography, 
            ST_SetSRID(ST_MakePoint(p_resident_lng, p_resident_lat), 4326)::geography
        )::numeric, 2)::DOUBLE PRECISION AS distance_meters
    FROM master_issues 
    WHERE status = 'open'
      AND ST_DWithin(
            geom::geography, 
            ST_SetSRID(ST_MakePoint(p_resident_lng, p_resident_lat), 4326)::geography, 
            p_radius_meters
          )
    ORDER BY distance_meters ASC;
$$;

-- ==============================================================================
-- 4a. Merge Into Master Issue Procedure
-- ==============================================================================
CREATE OR REPLACE FUNCTION merge_into_master_issue(
    p_master_issue_id INT,
    p_resident_name VARCHAR(100),
    p_resident_contact VARCHAR(100),
    p_raw_text TEXT,
    p_resident_lat DOUBLE PRECISION,
    p_resident_lng DOUBLE PRECISION,
    p_new_summary TEXT DEFAULT NULL,
    p_photo_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_report_id INT;
    v_updated_count INT;
BEGIN
    -- 1. Insert into citizen_reports
    INSERT INTO citizen_reports (
        master_issue_id,
        resident_name,
        resident_contact,
        raw_text,
        geom,
        photo_url
    ) VALUES (
        p_master_issue_id,
        p_resident_name,
        p_resident_contact,
        p_raw_text,
        ST_SetSRID(ST_MakePoint(p_resident_lng, p_resident_lat), 4326),
        p_photo_url
    ) RETURNING id INTO v_new_report_id;

    -- 2. Increment report_count and optionally update summary
    UPDATE master_issues
    SET report_count = report_count + 1,
        summary = COALESCE(p_new_summary, summary),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_master_issue_id
    RETURNING report_count INTO v_updated_count;

    RETURN jsonb_build_object(
        'success', true,
        'action', 'merged',
        'master_issue_id', p_master_issue_id,
        'citizen_report_id', v_new_report_id,
        'new_report_count', v_updated_count
    );
END;
$$;
