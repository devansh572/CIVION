CREATE OR REPLACE FUNCTION public.get_nearby_open_issues(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION DEFAULT 100.0
)
RETURNS TABLE (
    id UUID,
    issue_code TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    severity TEXT,
    status TEXT,
    priority_score INTEGER,
    support_count INTEGER,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        i.id,
        i.issue_code,
        i.title,
        i.description,
        i.category,
        i.severity,
        i.status,
        i.priority_score,
        i.support_count,
        i.latitude,
        i.longitude,
        ROUND(ST_Distance(
            i.location,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        )::numeric, 2)::DOUBLE PRECISION AS distance_meters,
        i.created_at
    FROM public.issues i
    WHERE i.status NOT IN ('closed', 'rejected', 'resolved')
      AND i.location IS NOT NULL
      AND ST_DWithin(
            i.location,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
            p_radius_meters
      )
    ORDER BY distance_meters ASC;
$$;

CREATE OR REPLACE FUNCTION public.create_issue_with_report(
    p_title TEXT,
    p_description TEXT,
    p_category TEXT,
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_image_url TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'medium',
    p_priority_score INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_issue RECORD;
    v_report RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO public.issues (
        title,
        description,
        category,
        severity,
        priority_score,
        latitude,
        longitude,
        created_by
    ) VALUES (
        p_title,
        p_description,
        p_category,
        p_severity,
        p_priority_score,
        p_latitude,
        p_longitude,
        v_user_id
    )
    RETURNING * INTO v_issue;

    INSERT INTO public.reports (
        issue_id,
        reported_by,
        description,
        image_url,
        latitude,
        longitude
    ) VALUES (
        v_issue.id,
        v_user_id,
        p_description,
        p_image_url,
        p_latitude,
        p_longitude
    )
    RETURNING * INTO v_report;

    INSERT INTO public.issue_history (
        issue_id,
        changed_by,
        action,
        old_status,
        new_status,
        description
    ) VALUES (
        v_issue.id,
        v_user_id,
        'issue_created',
        NULL,
        v_issue.status,
        'Issue and initial report created by citizen'
    );

    RETURN jsonb_build_object(
        'success', true,
        'issue_id', v_issue.id,
        'issue_code', v_issue.issue_code,
        'report_id', v_report.id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.link_duplicate_report(
    p_issue_id UUID,
    p_description TEXT,
    p_image_url TEXT DEFAULT NULL,
    p_latitude DOUBLE PRECISION DEFAULT NULL,
    p_longitude DOUBLE PRECISION DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_report_id UUID;
    v_issue_code TEXT;
    v_new_support_count INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT issue_code INTO v_issue_code FROM public.issues WHERE id = p_issue_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Master issue not found';
    END IF;

    INSERT INTO public.reports (
        issue_id,
        reported_by,
        description,
        image_url,
        latitude,
        longitude
    ) VALUES (
        p_issue_id,
        v_user_id,
        p_description,
        p_image_url,
        p_latitude,
        p_longitude
    )
    RETURNING id INTO v_report_id;

    SELECT support_count INTO v_new_support_count FROM public.issues WHERE id = p_issue_id;

    UPDATE public.issues
    SET priority_score = LEAST(100, priority_score + 5)
    WHERE id = p_issue_id;

    INSERT INTO public.issue_history (
        issue_id,
        changed_by,
        action,
        description
    ) VALUES (
        p_issue_id,
        v_user_id,
        'duplicate_linked',
        'Duplicate report linked by citizen. Total support: ' || v_new_support_count
    );

    RETURN jsonb_build_object(
        'success', true,
        'report_id', v_report_id,
        'issue_id', p_issue_id,
        'issue_code', v_issue_code,
        'support_count', v_new_support_count
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_issue_to_worker(
    p_issue_id UUID,
    p_department_id UUID,
    p_worker_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_role TEXT;
    v_assignment_id UUID;
BEGIN
    SELECT public.get_auth_role() INTO v_user_role;
    IF v_user_role NOT IN ('authority', 'admin') THEN
        RAISE EXCEPTION 'Only authority or admin can assign workers';
    END IF;

    UPDATE public.issues
    SET 
        department_id = p_department_id,
        assigned_worker_id = p_worker_id,
        status = 'assigned'
    WHERE id = p_issue_id;

    INSERT INTO public.assignments (
        issue_id,
        department_id,
        worker_id,
        assigned_by,
        status,
        notes
    ) VALUES (
        p_issue_id,
        p_department_id,
        p_worker_id,
        v_user_id,
        'assigned',
        p_notes
    )
    RETURNING id INTO v_assignment_id;

    INSERT INTO public.issue_history (
        issue_id,
        changed_by,
        action,
        new_status,
        description
    ) VALUES (
        p_issue_id,
        v_user_id,
        'assigned',
        'assigned',
        'Issue assigned to worker ' || p_worker_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'assignment_id', v_assignment_id,
        'issue_id', p_issue_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_issue_with_evidence(
    p_issue_id UUID,
    p_image_url TEXT,
    p_description TEXT DEFAULT 'Work completed'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_evidence_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO public.evidence (
        issue_id,
        uploaded_by,
        image_url,
        description
    ) VALUES (
        p_issue_id,
        v_user_id,
        p_image_url,
        p_description
    )
    RETURNING id INTO v_evidence_id;

    UPDATE public.assignments
    SET 
        status = 'completed',
        completed_at = now()
    WHERE issue_id = p_issue_id AND worker_id = v_user_id;

    UPDATE public.issues
    SET 
        status = 'resolved',
        resolved_at = now()
    WHERE id = p_issue_id;

    INSERT INTO public.issue_history (
        issue_id,
        changed_by,
        action,
        old_status,
        new_status,
        description
    ) VALUES (
        p_issue_id,
        v_user_id,
        'marked_resolved',
        'in_progress',
        'resolved',
        'Worker uploaded resolution evidence and marked resolved'
    );

    RETURN jsonb_build_object(
        'success', true,
        'evidence_id', v_evidence_id,
        'issue_id', p_issue_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_issue_verification(
    p_issue_id UUID,
    p_status TEXT,
    p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_verification_id UUID;
    v_current_status TEXT;
    v_next_status TEXT;
    v_action TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Status must be approved or rejected';
    END IF;

    SELECT status INTO v_current_status FROM public.issues WHERE id = p_issue_id;
    IF v_current_status <> 'resolved' THEN
        RAISE EXCEPTION 'Only resolved issues can be verified (current status: %)', v_current_status;
    END IF;

    INSERT INTO public.verifications (
        issue_id,
        verified_by,
        status,
        comment
    ) VALUES (
        p_issue_id,
        v_user_id,
        p_status,
        p_comment
    )
    RETURNING id INTO v_verification_id;

    IF p_status = 'approved' THEN
        v_next_status := 'verified';
        v_action := 'citizen_verified';
        
        UPDATE public.issues
        SET status = 'verified', closed_at = now()
        WHERE id = p_issue_id;
    ELSE
        v_next_status := 'in_progress';
        v_action := 'citizen_rejected';

        UPDATE public.issues
        SET status = 'in_progress', resolved_at = NULL
        WHERE id = p_issue_id;

        UPDATE public.assignments
        SET status = 'in_progress', completed_at = NULL
        WHERE issue_id = p_issue_id AND status = 'completed';
    END IF;

    INSERT INTO public.issue_history (
        issue_id,
        changed_by,
        action,
        old_status,
        new_status,
        description
    ) VALUES (
        p_issue_id,
        v_user_id,
        v_action,
        v_current_status,
        v_next_status,
        'Citizen verification submitted: ' || p_status || COALESCE('. Comment: ' || p_comment, '')
    );

    RETURN jsonb_build_object(
        'success', true,
        'verification_id', v_verification_id,
        'status', v_next_status
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone,
        role
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Civic Citizen'),
        NEW.email,
        NEW.phone,
        COALESCE(NEW.raw_user_meta_data->>'role', 'citizen')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone;
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 1. Spatial Pre-Filter Query Stored Procedure (Radius <= 100m)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_spatial_candidate_issues(
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
    FROM public.master_issues 
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
CREATE OR REPLACE FUNCTION public.merge_into_master_issue(
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
    INSERT INTO public.citizen_reports (
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

    UPDATE public.master_issues
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

