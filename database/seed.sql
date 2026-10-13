DO $$
DECLARE
    v_dept_pwd UUID := '11111111-1111-1111-1111-111111111101';
    v_dept_water UUID := '11111111-1111-1111-1111-111111111102';
    v_dept_elec UUID := '11111111-1111-1111-1111-111111111103';
    v_dept_waste UUID := '11111111-1111-1111-1111-111111111104';
    v_dept_drain UUID := '11111111-1111-1111-1111-111111111105';
    v_dept_roads UUID := '11111111-1111-1111-1111-111111111106';

    v_cit_1 UUID := '22222222-2222-2222-2222-222222222201';
    v_cit_2 UUID := '22222222-2222-2222-2222-222222222202';
    v_cit_3 UUID := '22222222-2222-2222-2222-222222222203';
    v_cit_4 UUID := '22222222-2222-2222-2222-222222222204';
    v_cit_5 UUID := '22222222-2222-2222-2222-222222222205';

    v_auth_pwd UUID := '33333333-3333-3333-3333-333333333301';
    v_auth_water UUID := '33333333-3333-3333-3333-333333333302';
    v_auth_kp UUID := '33333333-3333-3333-3333-333333333303';
    v_auth_civ UUID := '33333333-3333-3333-3333-333333333304';
    v_auth_pet UUID := '33333333-3333-3333-3333-333333333305';
    v_auth_deeshu UUID := '33333333-3333-3333-3333-333333333306';
    v_auth_like UUID := '33333333-3333-3333-3333-333333333307';

    v_wrk_roads UUID := '44444444-4444-4444-4444-444444444401';
    v_wrk_water UUID := '44444444-4444-4444-4444-444444444402';
    v_wrk_elec UUID := '44444444-4444-4444-4444-444444444403';
    v_wrk_waste UUID := '44444444-4444-4444-4444-444444444404';

    v_admin UUID := '55555555-5555-5555-5555-555555555501';

    v_iss_1 UUID := '66666666-6666-6666-6666-666666666601';
    v_iss_2 UUID := '66666666-6666-6666-6666-666666666602';
    v_iss_3 UUID := '66666666-6666-6666-6666-666666666603';
    v_iss_4 UUID := '66666666-6666-6666-6666-666666666604';
    v_iss_5 UUID := '66666666-6666-6666-6666-666666666605';
    v_iss_6 UUID := '66666666-6666-6666-6666-666666666606';
    v_iss_7 UUID := '66666666-6666-6666-6666-666666666607';
    v_iss_8 UUID := '66666666-6666-6666-6666-666666666608';
    v_iss_9 UUID := '66666666-6666-6666-6666-666666666609';
    v_iss_10 UUID := '66666666-6666-6666-6666-666666666610';
BEGIN
    INSERT INTO public.departments (id, name, description) VALUES
    (v_dept_pwd, 'Public Works', 'Road maintenance, public infrastructure, and civil works'),
    (v_dept_water, 'Water & Sanitation', 'Water supply lines, sewage systems, and leak repairs'),
    (v_dept_elec, 'Electrical', 'Streetlights, power distribution, and hazardous electric wiring'),
    (v_dept_waste, 'Waste Management', 'Garbage collection, illegal dumping, and sanitary landfill operations'),
    (v_dept_drain, 'Drainage', 'Stormwater drains, flood prevention, and desilting'),
    (v_dept_roads, 'Roads & Highways', 'Major asphalt repairs, flyovers, and arterial transit corridors')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    VALUES
    (v_cit_1, '00000000-0000-0000-0000-000000000000', 'ramesh.citizen@civion.demo', '$2a$10$demo_hash_not_for_production', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ramesh Kumar","role":"citizen"}', now(), now(), 'authenticated', 'authenticated'),
    (v_cit_2, '00000000-0000-0000-0000-000000000000', 'priya.citizen@civion.demo', '$2a$10$demo_hash_not_for_production', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Sharma","role":"citizen"}', now(), now(), 'authenticated', 'authenticated'),
    (v_cit_3, '00000000-0000-0000-0000-000000000000', 'ananya.citizen@civion.demo', '$2a$10$demo_hash_not_for_production', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ananya Deshmukh","role":"citizen"}', now(), now(), 'authenticated', 'authenticated'),
    (v_cit_4, '00000000-0000-0000-0000-000000000000', 'vikram.citizen@civion.demo', '$2a$10$demo_hash_not_for_production', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Vikram Rao","role":"citizen"}', now(), now(), 'authenticated', 'authenticated'),
    (v_cit_5, '00000000-0000-0000-0000-000000000000', 'karthik.citizen@civion.demo', '$2a$10$demo_hash_not_for_production', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Karthik Iyer","role":"citizen"}', now(), now(), 'authenticated', 'authenticated'),
    (v_auth_pwd, '00000000-0000-0000-0000-000000000000', 'suresh.bbmp@civion.demo', '$2a$10$demo_hash_not_for_production', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Suresh Gowda (BBMP)","role":"authority"}', now(), now(), 'authenticated', 'authenticated'),
    (v_auth_water, '00000000-0000-0000-0000-000000000000', 'meera.bwssb@civion.demo', '$2a$10$demo_hash_not_for_production', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Meera Nair (BWSSB)","role":"authority"}', now(), now(), 'authenticated', 'authenticated'),
    (v_auth_kp, '00000000-0000-0000-0000-000000000000', 'kaushkipriya2006@gmail.com', 'kaushiki@2006', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Kaushiki Priya","role":"authority"}', now(), now(), 'authenticated', 'authenticated'),
    (v_auth_civ, '00000000-0000-0000-0000-000000000000', 'civion00@gmail.com', 'civion2026', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Civion Command Admin","role":"authority"}', now(), now(), 'authenticated', 'authenticated'),
    (v_auth_pet, '00000000-0000-0000-0000-000000000000', 'petalspines3@gmail.com', 'PETALS2006', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Petals Pines Authority","role":"authority"}', now(), now(), 'authenticated', 'authenticated'),
    (v_auth_deeshu, '00000000-0000-0000-0000-000000000000', 'deeshukumar975@gmail.com', 'deeshu', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Deeshu Kumar","role":"field_worker"}', now(), now(), 'authenticated', 'authenticated'),
    (v_auth_like, '00000000-0000-0000-0000-000000000000', 'likeplease8989@gmail.com', 'likeplz', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Like Please Worker","role":"field_worker"}', now(), now(), 'authenticated', 'authenticated'),
    (v_wrk_roads, '00000000-0000-0000-0000-000000000000', 'raju.worker@civion.demo', '$2a$10$demo_hash_not_for_production', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Raju K (Road Inspector)","role":"field_worker"}', now(), now(), 'authenticated', 'authenticated'),
    (v_wrk_water, '00000000-0000-0000-0000-000000000000', 'manjunath.worker@civion.demo', '$2a$10$demo_hash_not_for_production', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Manjunath B (Water Specialist)","role":"field_worker"}', now(), now(), 'authenticated', 'authenticated'),
    (v_wrk_elec, '00000000-0000-0000-0000-000000000000', 'deepa.worker@civion.demo', '$2a$10$demo_hash_not_for_production', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Deepa V (BESCOM Lineman)","role":"field_worker"}', now(), now(), 'authenticated', 'authenticated'),
    (v_wrk_waste, '00000000-0000-0000-0000-000000000000', 'santosh.worker@civion.demo', '$2a$10$demo_hash_not_for_production', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Santosh M (Sanitation Lead)","role":"field_worker"}', now(), now(), 'authenticated', 'authenticated'),
    (v_admin, '00000000-0000-0000-0000-000000000000', 'admin@civion.demo', '$2a$10$demo_hash_not_for_production', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Civion System Admin","role":"admin"}', now(), now(), 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, full_name, email, phone, role, department_id) VALUES
    (v_cit_1, 'Ramesh Kumar', 'ramesh.citizen@civion.demo', '+91-9876543210', 'citizen', NULL),
    (v_cit_2, 'Priya Sharma', 'priya.citizen@civion.demo', '+91-9876543211', 'citizen', NULL),
    (v_cit_3, 'Ananya Deshmukh', 'ananya.citizen@civion.demo', '+91-9876543212', 'citizen', NULL),
    (v_cit_4, 'Vikram Rao', 'vikram.citizen@civion.demo', '+91-9876543213', 'citizen', NULL),
    (v_cit_5, 'Karthik Iyer', 'karthik.citizen@civion.demo', '+91-9876543214', 'citizen', NULL),
    (v_auth_pwd, 'Suresh Gowda (BBMP)', 'suresh.bbmp@civion.demo', '+91-9844001122', 'authority', v_dept_pwd),
    (v_auth_water, 'Meera Nair (BWSSB)', 'meera.bwssb@civion.demo', '+91-9844001133', 'authority', v_dept_water),
    (v_auth_kp, 'Kaushiki Priya', 'kaushkipriya2006@gmail.com', '+91-9844001144', 'authority', v_dept_pwd),
    (v_auth_civ, 'Civion Command Admin', 'civion00@gmail.com', '+91-9844001155', 'authority', v_dept_roads),
    (v_auth_pet, 'Petals Pines Authority', 'petalspines3@gmail.com', '+91-9844001166', 'authority', v_dept_pwd),
    (v_auth_deeshu, 'Deeshu Kumar', 'deeshukumar975@gmail.com', '+91-9876543233', 'field_worker', v_dept_roads),
    (v_auth_like, 'Like Please Worker', 'likeplease8989@gmail.com', '+91-9876543234', 'field_worker', v_dept_pwd),
    (v_wrk_roads, 'Raju K (Road Inspector)', 'raju.worker@civion.demo', '+91-9845002201', 'field_worker', v_dept_roads),
    (v_wrk_water, 'Manjunath B (Water Specialist)', 'manjunath.worker@civion.demo', '+91-9845002202', 'field_worker', v_dept_water),
    (v_wrk_elec, 'Deepa V (BESCOM Lineman)', 'deepa.worker@civion.demo', '+91-9845002203', 'field_worker', v_dept_elec),
    (v_wrk_waste, 'Santosh M (Sanitation Lead)', 'santosh.worker@civion.demo', '+91-9845002204', 'field_worker', v_dept_waste),
    (v_admin, 'Civion System Admin', 'admin@civion.demo', '+91-9800000000', 'admin', NULL)
    ON CONFLICT (id) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department_id = EXCLUDED.department_id;

    INSERT INTO public.issues (
        id, issue_code, title, description, category, severity, status, 
        priority_score, latitude, longitude, department_id, assigned_worker_id, 
        created_by, support_count, created_at, resolved_at, closed_at
    ) VALUES
    (
        v_iss_1, 'CIV-1001', 'Deep hazardous pothole near Indiranagar Metro Station',
        'Large crater on 100ft Road right under the metro pillar causing severe traffic slowdown and vehicle rim damage.',
        'pothole', 'critical', 'in_progress', 92, 12.9784, 77.6408,
        v_dept_roads, v_wrk_roads, v_cit_1, 4, now() - INTERVAL '3 days', NULL, NULL
    ),
    (
        v_iss_2, 'CIV-1002', 'High-pressure clean water pipe leakage on 80ft Road Koramangala',
        'Thousands of liters of potable water gushing onto the street from a cracked main conduit.',
        'water_leakage', 'high', 'open', 85, 12.9352, 77.6245,
        v_dept_water, NULL, v_cit_2, 1, now() - INTERVAL '6 hours', NULL, NULL
    ),
    (
        v_iss_3, 'CIV-1003', 'Flickering and dangling streetlight pole near 27th Main HSR',
        'Streetlight damaged during storm, live wires exposed near pedestrian sidewalk.',
        'broken_streetlight', 'high', 'assigned', 78, 12.9121, 77.6446,
        v_dept_elec, v_wrk_elec, v_cit_3, 1, now() - INTERVAL '1 day', NULL, NULL
    ),
    (
        v_iss_4, 'CIV-1004', 'Illegal garbage dumping spot near ECC Road Whitefield',
        'Commercial construction debris and mixed plastic waste accumulated on vacant municipal plot.',
        'illegal_dumping', 'medium', 'resolved', 65, 12.9698, 77.7499,
        v_dept_waste, v_wrk_waste, v_cit_4, 1, now() - INTERVAL '4 days', now() - INTERVAL '1 day', NULL
    ),
    (
        v_iss_5, 'CIV-1005', 'Clogged stormwater drain overflowing onto 4th Block Jayanagar',
        'Pre-monsoon blockage resulting in foul water accumulation at bus stop.',
        'drainage', 'medium', 'verified', 60, 12.9299, 77.5824,
        v_dept_drain, v_wrk_water, v_cit_5, 1, now() - INTERVAL '7 days', now() - INTERVAL '3 days', now() - INTERVAL '2 days'
    ),
    (
        v_iss_6, 'CIV-1006', 'Sunken asphalt manhole cover near Trinity Circle MG Road',
        'Manhole cover is sunken 4 inches below tarmac, creating extreme hazard for two-wheelers.',
        'road_damage', 'high', 'open', 82, 12.9756, 77.6066,
        v_dept_roads, NULL, v_cit_1, 1, now() - INTERVAL '12 hours', NULL, NULL
    ),
    (
        v_iss_7, 'CIV-1007', 'Unattended commercial waste overflowing near 8th Cross Malleshwaram',
        'Stray animals scattering food waste around market periphery.',
        'garbage', 'medium', 'assigned', 58, 13.0031, 77.5643,
        v_dept_waste, v_wrk_waste, v_cit_2, 1, now() - INTERVAL '1 day', NULL, NULL
    ),
    (
        v_iss_8, 'CIV-1008', 'Series of continuous potholes near BTM 2nd Stage Ring Road',
        'Rough surface after recent underground cabling work.',
        'pothole', 'medium', 'open', 50, 12.9166, 77.6101,
        v_dept_pwd, NULL, v_cit_3, 1, now() - INTERVAL '2 days', NULL, NULL
    ),
    (
        v_iss_9, 'CIV-1009', 'Dark corridor of 4 consecutive non-functional streetlights in Bellandur',
        'Pedestrian walkway pitch dark between 8pm and 5am.',
        'broken_streetlight', 'high', 'in_progress', 72, 12.9260, 77.6762,
        v_dept_elec, v_wrk_elec, v_cit_4, 1, now() - INTERVAL '2 days', NULL, NULL
    ),
    (
        v_iss_10, 'CIV-1010', 'Desilting required for culvert near Hebbal Flyover service road',
        'Silt build-up will cause severe waterlogging during rain showers.',
        'drainage', 'low', 'open', 40, 13.0358, 77.5970,
        v_dept_drain, NULL, v_cit_5, 1, now() - INTERVAL '5 days', NULL, NULL
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.reports (
        id, issue_id, reported_by, description, image_url, latitude, longitude, created_at
    ) VALUES
    (
        '77777777-7777-7777-7777-777777777701', v_iss_1, v_cit_1,
        'Deep pothole right after metro station entrance. Hit my car wheel.',
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        12.9784, 77.6408, now() - INTERVAL '3 days'
    ),
    (
        '77777777-7777-7777-7777-777777777702', v_iss_1, v_cit_2,
        'Dangerous pothole under metro pillar 42. Saw a scooter skid here this morning.',
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
        12.9785, 77.6409, now() - INTERVAL '2 days 18 hours'
    ),
    (
        '77777777-7777-7777-7777-777777777703', v_iss_1, v_cit_4,
        'Pothole getting wider after light rain. Traffic bottleneck on 100ft road.',
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
        12.9783, 77.6407, now() - INTERVAL '2 days'
    ),
    (
        '77777777-7777-7777-7777-777777777704', v_iss_1, v_cit_3,
        'Confirming huge road crater outside Indiranagar metro station.',
        'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80',
        12.9786, 77.6410, now() - INTERVAL '1 day 12 hours'
    ),
    ('77777777-7777-7777-7777-777777777705', v_iss_2, v_cit_2, 'Water main ruptured in front of supermarket.', 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800', 12.9352, 77.6245, now() - INTERVAL '6 hours'),
    ('77777777-7777-7777-7777-777777777706', v_iss_3, v_cit_3, 'Light pole bent and sparking at night.', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800', 12.9121, 77.6446, now() - INTERVAL '1 day'),
    ('77777777-7777-7777-7777-777777777707', v_iss_4, v_cit_4, 'Debris dump attracting stray cattle.', 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800', 12.9698, 77.7499, now() - INTERVAL '4 days'),
    ('77777777-7777-7777-7777-777777777708', v_iss_5, v_cit_5, 'Black sewage water backing up on road.', 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=800', 12.9299, 77.5824, now() - INTERVAL '7 days'),
    ('77777777-7777-7777-7777-777777777709', v_iss_6, v_cit_1, 'Manhole dip is dangerous for bikes.', 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800', 12.9756, 77.6066, now() - INTERVAL '12 hours'),
    ('77777777-7777-7777-7777-777777777710', v_iss_7, v_cit_2, 'Garbage not picked up for 3 days.', 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800', 13.0031, 77.5643, now() - INTERVAL '1 day')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.assignments (
        id, issue_id, department_id, worker_id, assigned_by, status, notes, assigned_at, accepted_at, completed_at
    ) VALUES
    (
        '88888888-8888-8888-8888-888888888801', v_iss_1, v_dept_roads, v_wrk_roads, v_auth_pwd,
        'in_progress', 'High priority: 4 citizen reports logged. Mobilize cold mix asphalt crew.',
        now() - INTERVAL '2 days', now() - INTERVAL '1 day 20 hours', NULL
    ),
    (
        '88888888-8888-8888-8888-888888888802', v_iss_3, v_dept_elec, v_wrk_elec, v_auth_pwd,
        'assigned', 'Inspect pole cabling and isolate circuit if shorted.',
        now() - INTERVAL '12 hours', NULL, NULL
    ),
    (
        '88888888-8888-8888-8888-888888888803', v_iss_4, v_dept_waste, v_wrk_waste, v_auth_pwd,
        'completed', 'Deploy tipper truck and clean plot perimeter.',
        now() - INTERVAL '3 days', now() - INTERVAL '2 days 20 hours', now() - INTERVAL '1 day'
    ),
    (
        '88888888-8888-8888-8888-888888888804', v_iss_5, v_dept_drain, v_wrk_water, v_auth_water,
        'completed', 'Jetting machine deployed to clear silt.',
        now() - INTERVAL '6 days', now() - INTERVAL '5 days', now() - INTERVAL '3 days'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.evidence (
        id, issue_id, uploaded_by, image_url, description, created_at
    ) VALUES
    (
        '99999999-9999-9999-9999-999999999901', v_iss_4, v_wrk_waste,
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
        'Plot cleared of 4.5 tons of construction debris and warning banner erected.',
        now() - INTERVAL '1 day'
    ),
    (
        '99999999-9999-9999-9999-999999999902', v_iss_5, v_wrk_water,
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
        'Culvert thoroughly desilted and water flowing unobstructed.',
        now() - INTERVAL '3 days'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.verifications (
        id, issue_id, verified_by, status, comment, created_at
    ) VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', v_iss_5, v_cit_5,
        'approved', 'Drain is completely cleared. No smell or water stagnation. Great job BBMP team!',
        now() - INTERVAL '2 days'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.issue_history (
        issue_id, changed_by, action, old_status, new_status, description, created_at
    ) VALUES
    (v_iss_1, v_cit_1, 'issue_created', NULL, 'open', 'Master issue logged by Ramesh Kumar', now() - INTERVAL '3 days'),
    (v_iss_1, v_cit_2, 'duplicate_linked', 'open', 'open', 'Duplicate report linked by Priya Sharma. Total support: 2', now() - INTERVAL '2 days 18 hours'),
    (v_iss_1, v_cit_4, 'duplicate_linked', 'open', 'open', 'Duplicate report linked by Vikram Rao. Total support: 3', now() - INTERVAL '2 days'),
    (v_iss_1, v_auth_pwd, 'assigned', 'open', 'assigned', 'Issue assigned to worker Raju K by Suresh Gowda (BBMP)', now() - INTERVAL '2 days'),
    (v_iss_1, v_wrk_roads, 'worker_started', 'assigned', 'in_progress', 'Field worker Raju accepted task and moved to site', now() - INTERVAL '1 day 20 hours'),
    (v_iss_1, v_cit_3, 'duplicate_linked', 'in_progress', 'in_progress', 'Duplicate report linked by Ananya Deshmukh. Total support: 4', now() - INTERVAL '1 day 12 hours'),
    (v_iss_4, v_cit_4, 'issue_created', NULL, 'open', 'Issue logged by Vikram Rao', now() - INTERVAL '4 days'),
    (v_iss_4, v_auth_pwd, 'assigned', 'open', 'assigned', 'Assigned to Santosh M', now() - INTERVAL '3 days'),
    (v_iss_4, v_wrk_waste, 'marked_resolved', 'in_progress', 'resolved', 'Debris cleared and completion photos uploaded', now() - INTERVAL '1 day'),
    (v_iss_5, v_cit_5, 'issue_created', NULL, 'open', 'Reported by Karthik Iyer', now() - INTERVAL '7 days'),
    (v_iss_5, v_auth_water, 'assigned', 'open', 'assigned', 'Assigned to Manjunath B', now() - INTERVAL '6 days'),
    (v_iss_5, v_wrk_water, 'marked_resolved', 'in_progress', 'resolved', 'Jetting completed', now() - INTERVAL '3 days'),
    (v_iss_5, v_cit_5, 'citizen_verified', 'resolved', 'verified', 'Citizen verified resolution and closed ticket', now() - INTERVAL '2 days');

END $$;
