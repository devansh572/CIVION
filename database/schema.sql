CREATE EXTENSION IF NOT EXISTS postgis;

CREATE SEQUENCE IF NOT EXISTS issue_code_seq START WITH 1001;

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('citizen', 'authority', 'field_worker', 'admin')),
    department_id UUID NULL REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_code TEXT UNIQUE NOT NULL DEFAULT ('CIV-' || nextval('issue_code_seq')::text),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (
        category IN (
            'pothole',
            'garbage',
            'broken_streetlight',
            'water_leakage',
            'drainage',
            'road_damage',
            'illegal_dumping',
            'other'
        )
    ),
    severity TEXT NULL CHECK (
        severity IS NULL OR severity IN ('low', 'medium', 'high', 'critical')
    ),
    status TEXT NOT NULL DEFAULT 'open' CHECK (
        status IN (
            'open',
            'assigned',
            'in_progress',
            'resolved',
            'verified',
            'closed',
            'rejected'
        )
    ),
    priority_score INTEGER NOT NULL DEFAULT 0 CHECK (
        priority_score >= 0 AND priority_score <= 100
    ),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location GEOGRAPHY(Point, 4326),
    department_id UUID NULL REFERENCES public.departments(id) ON DELETE SET NULL,
    assigned_worker_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    support_count INTEGER NOT NULL DEFAULT 0 CHECK (support_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ NULL,
    closed_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT,
    image_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location GEOGRAPHY(Point, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (
        status IN ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled')
    ),
    notes TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS public.evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    verified_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('approved', 'rejected')),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.issue_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    changed_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    old_status TEXT NULL,
    new_status TEXT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_issues_location_gist ON public.issues USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_reports_location_gist ON public.reports USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues (status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON public.issues (category);
CREATE INDEX IF NOT EXISTS idx_issues_priority_score ON public.issues (priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_issues_department_id ON public.issues (department_id);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_worker_id ON public.issues (assigned_worker_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON public.issues (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_issue_id ON public.reports (issue_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_by ON public.reports (reported_by);

CREATE INDEX IF NOT EXISTS idx_assignments_worker_id ON public.assignments (worker_id);
CREATE INDEX IF NOT EXISTS idx_assignments_issue_id ON public.assignments (issue_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments (status);

CREATE INDEX IF NOT EXISTS idx_evidence_issue_id ON public.evidence (issue_id);
CREATE INDEX IF NOT EXISTS idx_verifications_issue_id ON public.verifications (issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_history_issue_id ON public.issue_history (issue_id);

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_issues_updated_at ON public.issues;
CREATE TRIGGER trg_issues_updated_at
BEFORE UPDATE ON public.issues
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE FUNCTION public.fn_sync_point_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    ELSIF NEW.location IS NOT NULL THEN
        NEW.latitude := ST_Y(NEW.location::geometry);
        NEW.longitude := ST_X(NEW.location::geometry);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_issues_sync_location ON public.issues;
CREATE TRIGGER trg_issues_sync_location
BEFORE INSERT OR UPDATE OF latitude, longitude, location ON public.issues
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_point_location();

DROP TRIGGER IF EXISTS trg_reports_sync_location ON public.reports;
CREATE TRIGGER trg_reports_sync_location
BEFORE INSERT OR UPDATE OF latitude, longitude, location ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_point_location();

CREATE OR REPLACE FUNCTION public.fn_generate_issue_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.issue_code IS NULL OR TRIM(NEW.issue_code) = '' THEN
        NEW.issue_code := 'CIV-' || nextval('issue_code_seq')::text;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_issues_generate_code ON public.issues;
CREATE TRIGGER trg_issues_generate_code
BEFORE INSERT ON public.issues
FOR EACH ROW
EXECUTE FUNCTION public.fn_generate_issue_code();

CREATE OR REPLACE FUNCTION public.fn_sync_support_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.issues
        SET support_count = (
            SELECT COUNT(*) FROM public.reports WHERE issue_id = NEW.issue_id
        )
        WHERE id = NEW.issue_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.issues
        SET support_count = (
            SELECT COUNT(*) FROM public.reports WHERE issue_id = OLD.issue_id
        )
        WHERE id = OLD.issue_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.issue_id <> NEW.issue_id THEN
            UPDATE public.issues
            SET support_count = (
                SELECT COUNT(*) FROM public.reports WHERE issue_id = OLD.issue_id
            )
            WHERE id = OLD.issue_id;

            UPDATE public.issues
            SET support_count = (
                SELECT COUNT(*) FROM public.reports WHERE issue_id = NEW.issue_id
            )
            WHERE id = NEW.issue_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reports_sync_support_count ON public.reports;
CREATE TRIGGER trg_reports_sync_support_count
AFTER INSERT OR UPDATE OR DELETE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_support_count();

CREATE OR REPLACE FUNCTION public.fn_log_issue_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status <> NEW.status) THEN
        INSERT INTO public.issue_history (
            issue_id,
            changed_by,
            action,
            old_status,
            new_status,
            description
        ) VALUES (
            NEW.id,
            auth.uid(),
            'status_changed',
            OLD.status,
            NEW.status,
            'Status transitioned from ' || OLD.status || ' to ' || NEW.status
        );

        IF NEW.status = 'resolved' AND OLD.status <> 'resolved' THEN
            NEW.resolved_at = now();
        END IF;

        IF NEW.status IN ('closed', 'rejected') AND OLD.status NOT IN ('closed', 'rejected') THEN
            NEW.closed_at = now();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_issues_status_audit ON public.issues;
CREATE TRIGGER trg_issues_status_audit
BEFORE UPDATE OF status ON public.issues
FOR EACH ROW
EXECUTE FUNCTION public.fn_log_issue_status_change();

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_history ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_department_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT department_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE POLICY "Departments are viewable by authenticated users"
    ON public.departments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage departments"
    ON public.departments FOR ALL
    TO authenticated
    USING (public.get_auth_role() = 'admin')
    WITH CHECK (public.get_auth_role() = 'admin');

CREATE POLICY "Profiles viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR public.get_auth_role() = 'admin');

CREATE POLICY "Issues viewable by authenticated users"
    ON public.issues FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create issues"
    ON public.issues FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authorities and assigned workers can update issues"
    ON public.issues FOR UPDATE
    TO authenticated
    USING (
        public.get_auth_role() = 'admin'
        OR (public.get_auth_role() = 'authority' AND (department_id = public.get_auth_department_id() OR department_id IS NULL))
        OR (public.get_auth_role() = 'field_worker' AND assigned_worker_id = auth.uid())
    );

CREATE POLICY "Reports viewable by relevant users"
    ON public.reports FOR SELECT
    TO authenticated
    USING (
        reported_by = auth.uid()
        OR public.get_auth_role() IN ('authority', 'admin')
        OR EXISTS (
            SELECT 1 FROM public.issues i
            WHERE i.id = reports.issue_id
            AND i.assigned_worker_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own reports"
    ON public.reports FOR INSERT
    TO authenticated
    WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Assignments viewable by workers and authorities"
    ON public.assignments FOR SELECT
    TO authenticated
    USING (
        worker_id = auth.uid()
        OR public.get_auth_role() IN ('authority', 'admin')
    );

CREATE POLICY "Authorities and Admins can create assignments"
    ON public.assignments FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_auth_role() IN ('authority', 'admin')
        AND assigned_by = auth.uid()
    );

CREATE POLICY "Workers and Authorities can update assignments"
    ON public.assignments FOR UPDATE
    TO authenticated
    USING (
        worker_id = auth.uid()
        OR public.get_auth_role() IN ('authority', 'admin')
    );

CREATE POLICY "Evidence viewable by authenticated users"
    ON public.evidence FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Field workers and Authorities can upload evidence"
    ON public.evidence FOR INSERT
    TO authenticated
    WITH CHECK (
        uploaded_by = auth.uid()
        AND public.get_auth_role() IN ('field_worker', 'authority', 'admin')
    );

CREATE POLICY "Verifications viewable by authenticated users"
    ON public.verifications FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Citizens can submit resolution verification"
    ON public.verifications FOR INSERT
    TO authenticated
    WITH CHECK (
        verified_by = auth.uid()
        AND public.get_auth_role() IN ('citizen', 'admin')
    );

CREATE POLICY "Issue history viewable by authenticated users"
    ON public.issue_history FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can record history events"
    ON public.issue_history FOR INSERT
    TO authenticated
    WITH CHECK (changed_by = auth.uid() OR changed_by IS NULL);

-- ==============================================================================
-- AI Deduplication & Aggregation Tables
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.master_issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    category VARCHAR(50),
    severity VARCHAR(20) DEFAULT 'Medium',
    geom GEOMETRY(Point, 4326) NOT NULL,
    embedding VECTOR(1536),
    report_count INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.citizen_reports (
    id SERIAL PRIMARY KEY,
    master_issue_id INT REFERENCES public.master_issues(id) ON DELETE CASCADE,
    resident_name VARCHAR(100),
    resident_contact VARCHAR(100),
    raw_text TEXT NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_master_issues_geom ON public.master_issues USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_master_issues_embedding ON public.master_issues USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_citizen_reports_master_id ON public.citizen_reports(master_issue_id);

