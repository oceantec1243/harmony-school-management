-- Script d'insertion des attributions de matières aux classes
-- Ce script insère toutes les attributions matières-classes-enseignants avec les coefficients

-- D'abord, vider la table class_subjects pour éviter les doublons
DELETE FROM class_subjects;

-- Créer une table temporaire pour mapper les noms d'enseignants aux IDs
CREATE TEMP TABLE teacher_mapping AS
SELECT id, TRIM(UPPER(first_name || ' ' || last_name)) as full_name
FROM teachers;

-- Insérer toutes les attributions
-- Note: Le fichier CSV contient: class_id, class_name, academic_year, level_id, level_name, subject_id, subject_name, teacher_name, coefficient

-- Fonction pour obtenir l'ID de l'enseignant par son nom
CREATE OR REPLACE FUNCTION get_teacher_id(teacher_name TEXT) RETURNS UUID AS $$
DECLARE
    teacher_id UUID;
    clean_name TEXT;
BEGIN
    clean_name := TRIM(UPPER(teacher_name));
    SELECT id INTO teacher_id FROM teachers 
    WHERE UPPER(TRIM(first_name || ' ' || last_name)) ILIKE '%' || clean_name || '%'
       OR UPPER(TRIM(last_name || ' ' || first_name)) ILIKE '%' || clean_name || '%'
       OR UPPER(TRIM(first_name)) ILIKE '%' || clean_name || '%'
       OR UPPER(TRIM(last_name)) ILIKE '%' || clean_name || '%'
    LIMIT 1;
    RETURN teacher_id;
END;
$$ LANGUAGE plpgsql;

-- Insérer les attributions de la classe "1ere année comé"
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GERALDINE%EBAMU%' OR UPPER(last_name || ' ' || first_name) LIKE '%GERALDINE%EBAMU%' LIMIT 1), 3),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', '0d52ac4d-6aca-47cb-837e-33bc0ff6dda8', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' OR UPPER(last_name || ' ' || first_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', '0fef4171-fd80-4140-ac8f-cfb866d4d77f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%POUMA%NGO%' OR UPPER(last_name || ' ' || first_name) LIKE '%POUMA%NGO%' LIMIT 1), 3),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', '797252b3-3779-4615-9a84-277b85176264', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%POUMA%NGO%' OR UPPER(last_name || ' ' || first_name) LIKE '%POUMA%NGO%' LIMIT 1), 5),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', 'b5ee481b-54fd-432f-9fb6-f04abe4ef33f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%POUMA%NGO%' OR UPPER(last_name || ' ' || first_name) LIKE '%POUMA%NGO%' LIMIT 1), 2),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', '564becc8-9eca-4a1c-94b5-e8e007b152bf', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%POUMA%NGO%' OR UPPER(last_name || ' ' || first_name) LIKE '%POUMA%NGO%' LIMIT 1), 2),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' OR UPPER(last_name || ' ' || first_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' OR UPPER(last_name || ' ' || first_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', '7fbf2210-4b2e-49e6-abef-9c7fb736a2d1', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' OR UPPER(last_name || ' ' || first_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', '4705f860-1462-4279-8ef5-52f3ed6c1730', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' OR UPPER(last_name || ' ' || first_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 2),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', 'f2a6e46f-25a9-4ba6-88fb-60baa8ca0438', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' OR UPPER(last_name || ' ' || first_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ETIENNE%EFFILA%' OR UPPER(last_name || ' ' || first_name) LIKE '%ETIENNE%EFFILA%' LIMIT 1), 2),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', 'c7bb6f30-0967-44b1-aa58-3de8aba21f8f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' OR UPPER(last_name || ' ' || first_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 1),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%NESTOR%TOUKEA%' OR UPPER(last_name || ' ' || first_name) LIKE '%NESTOR%TOUKEA%' LIMIT 1), 2),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ZE%MBALLA%' OR UPPER(last_name || ' ' || first_name) LIKE '%ZE%MBALLA%' LIMIT 1), 4),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', '8c46e84f-1537-47e5-95d9-2c272b1c040b', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%POUMA%NGO%' OR UPPER(last_name || ' ' || first_name) LIKE '%POUMA%NGO%' LIMIT 1), 1),
('4572cab8-879c-42a0-9d10-7191a2f9e8fc', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' OR UPPER(last_name || ' ' || first_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1)
ON CONFLICT DO NOTHING;

-- Insérer les attributions de la classe "1ere année elec"
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
('e63e93d4-1c51-4350-8303-b50d4456546c', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GERALDINE%EBAMU%' LIMIT 1), 3),
('e63e93d4-1c51-4350-8303-b50d4456546c', '0d52ac4d-6aca-47cb-837e-33bc0ff6dda8', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('e63e93d4-1c51-4350-8303-b50d4456546c', '564becc8-9eca-4a1c-94b5-e8e007b152bf', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 4),
('e63e93d4-1c51-4350-8303-b50d4456546c', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('e63e93d4-1c51-4350-8303-b50d4456546c', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('e63e93d4-1c51-4350-8303-b50d4456546c', '7fbf2210-4b2e-49e6-abef-9c7fb736a2d1', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('e63e93d4-1c51-4350-8303-b50d4456546c', '4705f860-1462-4279-8ef5-52f3ed6c1730', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 2),
('e63e93d4-1c51-4350-8303-b50d4456546c', 'f2a6e46f-25a9-4ba6-88fb-60baa8ca0438', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('e63e93d4-1c51-4350-8303-b50d4456546c', 'c7bb6f30-0967-44b1-aa58-3de8aba21f8f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 1),
('e63e93d4-1c51-4350-8303-b50d4456546c', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%NESTOR%TOUKEA%' LIMIT 1), 2),
('e63e93d4-1c51-4350-8303-b50d4456546c', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ZE%MBALLA%' LIMIT 1), 4),
('e63e93d4-1c51-4350-8303-b50d4456546c', 'b239639f-e2fe-4999-b05e-92600d5fa5b5', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 1),
('e63e93d4-1c51-4350-8303-b50d4456546c', '8c46e84f-1537-47e5-95d9-2c272b1c040b', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ZE%MBALLA%' LIMIT 1), 4),
('e63e93d4-1c51-4350-8303-b50d4456546c', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1),
('e63e93d4-1c51-4350-8303-b50d4456546c', 'ad64719c-0a85-4795-840b-fa90b6ff106d', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 1)
ON CONFLICT DO NOTHING;

-- Insérer les attributions de la classe "1ere année esf"
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
('43cf6dce-b16f-41ed-9453-e77ef384f27c', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GERALDINE%EBAMU%' LIMIT 1), 3),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', '0d52ac4d-6aca-47cb-837e-33bc0ff6dda8', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', 'e71c77a0-bb59-4254-bf52-e5dac8b8d151', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ELVINE%CHE%NONO%' LIMIT 1), 3),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', '7fbf2210-4b2e-49e6-abef-9c7fb736a2d1', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', '4705f860-1462-4279-8ef5-52f3ed6c1730', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 2),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', 'f2a6e46f-25a9-4ba6-88fb-60baa8ca0438', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', '21de496f-281c-41e0-b370-ac9a161ed5eb', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', 'c7bb6f30-0967-44b1-aa58-3de8aba21f8f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 1),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%NESTOR%TOUKEA%' LIMIT 1), 2),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', '55d19d27-7721-406d-8cec-87b06074a595', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 1),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ZE%MBALLA%' LIMIT 1), 4),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', '249b635b-60ec-4327-ae60-bd31a967e382', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ELVINE%CHE%NONO%' LIMIT 1), 1),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', '78eb6495-59a9-467e-b548-0cc567e89fab', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ELVINE%CHE%NONO%' LIMIT 1), 4),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', 'c73d540f-7724-466b-85fe-bfd8c488d6e1', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ELVINE%CHE%NONO%' LIMIT 1), 4),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', '3080e93a-622b-4499-ab64-6d9906b84b63', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ELVINE%CHE%NONO%' LIMIT 1), 4),
('43cf6dce-b16f-41ed-9453-e77ef384f27c', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1)
ON CONFLICT DO NOTHING;

-- Insérer les attributions de la classe "1ere année méca"
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
('e5cf4a3c-35b4-4db0-a769-0f5447b39ba0', 'c7bb6f30-0967-44b1-aa58-3de8aba21f8f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 1),
('e5cf4a3c-35b4-4db0-a769-0f5447b39ba0', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%NESTOR%TOUKEA%' LIMIT 1), 2)
ON CONFLICT DO NOTHING;

-- Insérer les attributions de la classe "1ere année menu/maco"
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GERALDINE%EBAMU%' LIMIT 1), 3),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', '0d52ac4d-6aca-47cb-837e-33bc0ff6dda8', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', '564becc8-9eca-4a1c-94b5-e8e007b152bf', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 4),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', '7fbf2210-4b2e-49e6-abef-9c7fb736a2d1', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', '4705f860-1462-4279-8ef5-52f3ed6c1730', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 2),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', 'f2a6e46f-25a9-4ba6-88fb-60baa8ca0438', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', '21de496f-281c-41e0-b370-ac9a161ed5eb', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%NESTOR%TOUKEA%' LIMIT 1), 2),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ZE%MBALLA%' LIMIT 1), 4),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', 'b239639f-e2fe-4999-b05e-92600d5fa5b5', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 1),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', '8c46e84f-1537-47e5-95d9-2c272b1c040b', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 3),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', '8ff3c82e-f6bf-4ac0-b161-bd25dc0ef760', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 3),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1),
('7cecdd20-265a-41b2-bd08-7ce5c6e9793a', 'ad64719c-0a85-4795-840b-fa90b6ff106d', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 4)
ON CONFLICT DO NOTHING;

-- Insérer les attributions de la classe "6eme" (Francophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
('221b1bf4-3f70-47de-8d2e-8e58209bef35', 'cf0de5f3-ad19-477b-9df3-66b794aa30d5', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%BRANDON%CHE%' LIMIT 1), 1),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GERALDINE%EBAMU%' LIMIT 1), 3),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', '0d52ac4d-6aca-47cb-837e-33bc0ff6dda8', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', '631063cc-12f4-43c6-ba83-fb6430e4e721', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ELVINE%CHE%NONO%' LIMIT 1), 1),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', 'c763c0ff-f908-4bca-8e94-a02d177fc1e1', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ELIANE%DJUIDJEU%' LIMIT 1), 1),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', '7fbf2210-4b2e-49e6-abef-9c7fb736a2d1', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', '4705f860-1462-4279-8ef5-52f3ed6c1730', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 2),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', 'f2a6e46f-25a9-4ba6-88fb-60baa8ca0438', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ETIENNE%EFFILA%' LIMIT 1), 2),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', '21de496f-281c-41e0-b370-ac9a161ed5eb', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%NESTOR%TOUKEA%' LIMIT 1), 2),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ZE%MBALLA%' LIMIT 1), 4),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', 'f42bf78f-437b-4187-ba0b-3dc239e628fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ZE%MBALLA%' LIMIT 1), 3),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', 'a13e5df8-9751-48ba-b7ec-5a3e9fbb6495', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('221b1bf4-3f70-47de-8d2e-8e58209bef35', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1)
ON CONFLICT DO NOTHING;

-- Insérer les attributions des classes Form 1 (Anglophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
-- Form 1 Building and Construction (BC)
('937745d4-6048-4641-80a1-3e308b416116', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 1),
('937745d4-6048-4641-80a1-3e308b416116', 'bc028d8c-11ce-4997-b93d-ca87cf81a7b6', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 1),
('937745d4-6048-4641-80a1-3e308b416116', 'fd151429-bc2a-451c-b85f-197acce9d5bd', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%BRANDON%CHE%' LIMIT 1), 1),
('937745d4-6048-4641-80a1-3e308b416116', '564becc8-9eca-4a1c-94b5-e8e007b152bf', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 1),
('937745d4-6048-4641-80a1-3e308b416116', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 1),
('937745d4-6048-4641-80a1-3e308b416116', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 1),
('937745d4-6048-4641-80a1-3e308b416116', '469ae2ca-3e93-4655-b31c-82dc6ad50f6f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('937745d4-6048-4641-80a1-3e308b416116', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 1),
('937745d4-6048-4641-80a1-3e308b416116', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%KERRY%CYNDY%' LIMIT 1), 1),
('937745d4-6048-4641-80a1-3e308b416116', '43dfc7d7-ed46-43b2-a3ec-449cdc0dc1f3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 1),
('937745d4-6048-4641-80a1-3e308b416116', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 3),
('937745d4-6048-4641-80a1-3e308b416116', '702f5231-79b6-4235-9b42-0a39730de609', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 3),
('937745d4-6048-4641-80a1-3e308b416116', '2fdcfffd-a592-45e2-89c9-6fa35a308800', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%BRANDON%CHE%' LIMIT 1), 1),
('937745d4-6048-4641-80a1-3e308b416116', '8c46e84f-1537-47e5-95d9-2c272b1c040b', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 1),
('937745d4-6048-4641-80a1-3e308b416116', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1),
('937745d4-6048-4641-80a1-3e308b416116', 'ad64719c-0a85-4795-840b-fa90b6ff106d', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 1),
-- Form 1 Commercial
('7cfe1b22-c54a-4094-8723-becb2c9c956e', '7cf4f972-ff28-4cf3-9037-50bd5525836a', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%EMELDA%BUTOH%' LIMIT 1), 1),
('7cfe1b22-c54a-4094-8723-becb2c9c956e', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 1),
('7cfe1b22-c54a-4094-8723-becb2c9c956e', '065c0a32-f8ac-457e-aa66-86a58a462056', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%THEODORE%NGUETCHOUAN%' LIMIT 1), 1),
('7cfe1b22-c54a-4094-8723-becb2c9c956e', 'c9017e7d-9612-4670-9c56-50037302d2b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%THEODORE%NGUETCHOUAN%' LIMIT 1), 1),
('7cfe1b22-c54a-4094-8723-becb2c9c956e', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 1),
('7cfe1b22-c54a-4094-8723-becb2c9c956e', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 1),
('7cfe1b22-c54a-4094-8723-becb2c9c956e', '469ae2ca-3e93-4655-b31c-82dc6ad50f6f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('7cfe1b22-c54a-4094-8723-becb2c9c956e', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 1),
('7cfe1b22-c54a-4094-8723-becb2c9c956e', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%KERRY%CYNDY%' LIMIT 1), 1),
('7cfe1b22-c54a-4094-8723-becb2c9c956e', '43dfc7d7-ed46-43b2-a3ec-449cdc0dc1f3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 1),
('7cfe1b22-c54a-4094-8723-becb2c9c956e', 'ab920557-6f23-48b8-b79a-5e1d2eb63c52', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%EMELDA%BUTOH%' LIMIT 1), 1),
('7cfe1b22-c54a-4094-8723-becb2c9c956e', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 1),
('7cfe1b22-c54a-4094-8723-becb2c9c956e', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1),
-- Form 1 General
('1e049f0d-e65b-4986-9054-15c3fe7f9fff', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 2),
('1e049f0d-e65b-4986-9054-15c3fe7f9fff', '45c64d71-a07b-4afb-99d5-33ac396e3538', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 2),
('1e049f0d-e65b-4986-9054-15c3fe7f9fff', 'bc028d8c-11ce-4997-b93d-ca87cf81a7b6', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 2),
('1e049f0d-e65b-4986-9054-15c3fe7f9fff', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 2),
('1e049f0d-e65b-4986-9054-15c3fe7f9fff', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('1e049f0d-e65b-4986-9054-15c3fe7f9fff', '469ae2ca-3e93-4655-b31c-82dc6ad50f6f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 4),
('1e049f0d-e65b-4986-9054-15c3fe7f9fff', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 2),
('1e049f0d-e65b-4986-9054-15c3fe7f9fff', '21de496f-281c-41e0-b370-ac9a161ed5eb', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 2),
('1e049f0d-e65b-4986-9054-15c3fe7f9fff', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%KERRY%CYNDY%' LIMIT 1), 2),
('1e049f0d-e65b-4986-9054-15c3fe7f9fff', '257d06a5-fd7e-4e05-a2cf-f9d67969c364', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 2),
('1e049f0d-e65b-4986-9054-15c3fe7f9fff', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 4),
('1e049f0d-e65b-4986-9054-15c3fe7f9fff', '702f5231-79b6-4235-9b42-0a39730de609', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 2),
('1e049f0d-e65b-4986-9054-15c3fe7f9fff', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1)
ON CONFLICT DO NOTHING;

-- Form 1 Home Economics (HE)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
('b11aeabf-58b1-46a1-bdbd-845bea011a1d', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 1),
('b11aeabf-58b1-46a1-bdbd-845bea011a1d', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 1),
('b11aeabf-58b1-46a1-bdbd-845bea011a1d', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 1),
('b11aeabf-58b1-46a1-bdbd-845bea011a1d', '469ae2ca-3e93-4655-b31c-82dc6ad50f6f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('b11aeabf-58b1-46a1-bdbd-845bea011a1d', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 1),
('b11aeabf-58b1-46a1-bdbd-845bea011a1d', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%KERRY%CYNDY%' LIMIT 1), 1),
('b11aeabf-58b1-46a1-bdbd-845bea011a1d', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 1),
('b11aeabf-58b1-46a1-bdbd-845bea011a1d', 'b239639f-e2fe-4999-b05e-92600d5fa5b5', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%BRANDON%CHE%' LIMIT 1), 1),
('b11aeabf-58b1-46a1-bdbd-845bea011a1d', '249b635b-60ec-4327-ae60-bd31a967e382', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%BRANDON%CHE%' LIMIT 1), 1),
('b11aeabf-58b1-46a1-bdbd-845bea011a1d', '867d3831-7735-4d9a-9882-3099c0cd9dd8', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%BRANDON%CHE%' LIMIT 1), 1),
('b11aeabf-58b1-46a1-bdbd-845bea011a1d', '2fdcfffd-a592-45e2-89c9-6fa35a308800', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%BRANDON%CHE%' LIMIT 1), 1),
('b11aeabf-58b1-46a1-bdbd-845bea011a1d', 'f02f41e7-af3d-4f4b-812a-636e8eb6a797', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 1),
('b11aeabf-58b1-46a1-bdbd-845bea011a1d', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1),
('b11aeabf-58b1-46a1-bdbd-845bea011a1d', '5a8d1d29-f46e-4d5a-9186-1ebc3b1ebf66', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GERALDINE%EBAMU%' LIMIT 1), 1)
ON CONFLICT DO NOTHING;

-- Form 1 Electrical and Power System (EPS)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
('866ef4d7-cce0-4c72-90cb-eb2b92197976', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 1),
('866ef4d7-cce0-4c72-90cb-eb2b92197976', 'bc028d8c-11ce-4997-b93d-ca87cf81a7b6', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 1),
('866ef4d7-cce0-4c72-90cb-eb2b92197976', 'fd151429-bc2a-451c-b85f-197acce9d5bd', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%BRANDON%CHE%' LIMIT 1), 1),
('866ef4d7-cce0-4c72-90cb-eb2b92197976', '564becc8-9eca-4a1c-94b5-e8e007b152bf', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 1),
('866ef4d7-cce0-4c72-90cb-eb2b92197976', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 1),
('866ef4d7-cce0-4c72-90cb-eb2b92197976', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 1),
('866ef4d7-cce0-4c72-90cb-eb2b92197976', '469ae2ca-3e93-4655-b31c-82dc6ad50f6f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('866ef4d7-cce0-4c72-90cb-eb2b92197976', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 1),
('866ef4d7-cce0-4c72-90cb-eb2b92197976', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%KERRY%CYNDY%' LIMIT 1), 1),
('866ef4d7-cce0-4c72-90cb-eb2b92197976', '43dfc7d7-ed46-43b2-a3ec-449cdc0dc1f3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 1),
('866ef4d7-cce0-4c72-90cb-eb2b92197976', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 1),
('866ef4d7-cce0-4c72-90cb-eb2b92197976', '702f5231-79b6-4235-9b42-0a39730de609', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 1),
('866ef4d7-cce0-4c72-90cb-eb2b92197976', '2fdcfffd-a592-45e2-89c9-6fa35a308800', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%BRANDON%CHE%' LIMIT 1), 1),
('866ef4d7-cce0-4c72-90cb-eb2b92197976', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1)
ON CONFLICT DO NOTHING;

-- Form 1 Motor Mechanics (MM)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
('eb44202c-2397-4aa6-878f-eb8a3137ed50', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 1),
('eb44202c-2397-4aa6-878f-eb8a3137ed50', 'bc028d8c-11ce-4997-b93d-ca87cf81a7b6', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 1),
('eb44202c-2397-4aa6-878f-eb8a3137ed50', 'fd151429-bc2a-451c-b85f-197acce9d5bd', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%BRANDON%CHE%' LIMIT 1), 1),
('eb44202c-2397-4aa6-878f-eb8a3137ed50', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 1),
('eb44202c-2397-4aa6-878f-eb8a3137ed50', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 1),
('eb44202c-2397-4aa6-878f-eb8a3137ed50', '469ae2ca-3e93-4655-b31c-82dc6ad50f6f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('eb44202c-2397-4aa6-878f-eb8a3137ed50', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 1),
('eb44202c-2397-4aa6-878f-eb8a3137ed50', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%KERRY%CYNDY%' LIMIT 1), 1),
('eb44202c-2397-4aa6-878f-eb8a3137ed50', '43dfc7d7-ed46-43b2-a3ec-449cdc0dc1f3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 1),
('eb44202c-2397-4aa6-878f-eb8a3137ed50', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 1),
('eb44202c-2397-4aa6-878f-eb8a3137ed50', '702f5231-79b6-4235-9b42-0a39730de609', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 1),
('eb44202c-2397-4aa6-878f-eb8a3137ed50', '2fdcfffd-a592-45e2-89c9-6fa35a308800', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1),
('eb44202c-2397-4aa6-878f-eb8a3137ed50', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1)
ON CONFLICT DO NOTHING;

-- Classes de 2e année (5ème)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
-- 2e année menu
('5c812745-2d08-4096-ab21-f96b6198c657', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GERALDINE%EBAMU%' LIMIT 1), 3),
('5c812745-2d08-4096-ab21-f96b6198c657', 'bb930624-0116-4229-a917-08781c65a615', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 2),
('5c812745-2d08-4096-ab21-f96b6198c657', '6a1a6f7a-483d-4f09-923c-161650a59ed5', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 2),
('5c812745-2d08-4096-ab21-f96b6198c657', '0d52ac4d-6aca-47cb-837e-33bc0ff6dda8', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('5c812745-2d08-4096-ab21-f96b6198c657', '564becc8-9eca-4a1c-94b5-e8e007b152bf', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 4),
('5c812745-2d08-4096-ab21-f96b6198c657', '678988e8-c965-4563-b1bb-575e634287f7', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 1),
('5c812745-2d08-4096-ab21-f96b6198c657', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('5c812745-2d08-4096-ab21-f96b6198c657', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('5c812745-2d08-4096-ab21-f96b6198c657', '7fbf2210-4b2e-49e6-abef-9c7fb736a2d1', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('5c812745-2d08-4096-ab21-f96b6198c657', '4705f860-1462-4279-8ef5-52f3ed6c1730', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 2),
('5c812745-2d08-4096-ab21-f96b6198c657', 'f2a6e46f-25a9-4ba6-88fb-60baa8ca0438', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('5c812745-2d08-4096-ab21-f96b6198c657', 'c7bb6f30-0967-44b1-aa58-3de8aba21f8f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 1),
('5c812745-2d08-4096-ab21-f96b6198c657', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%NESTOR%TOUKEA%' LIMIT 1), 2),
('5c812745-2d08-4096-ab21-f96b6198c657', '43dfc7d7-ed46-43b2-a3ec-449cdc0dc1f3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 1),
('5c812745-2d08-4096-ab21-f96b6198c657', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ZE%MBALLA%' LIMIT 1), 4),
('5c812745-2d08-4096-ab21-f96b6198c657', '8c46e84f-1537-47e5-95d9-2c272b1c040b', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 2),
('5c812745-2d08-4096-ab21-f96b6198c657', '3eb11fe1-14b7-4aa3-88a5-c1e2fe3067fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 2),
('5c812745-2d08-4096-ab21-f96b6198c657', '8ff3c82e-f6bf-4ac0-b161-bd25dc0ef760', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 3),
('5c812745-2d08-4096-ab21-f96b6198c657', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1),
('5c812745-2d08-4096-ab21-f96b6198c657', 'ad64719c-0a85-4795-840b-fa90b6ff106d', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PHILIPPE%NGUMU%' LIMIT 1), 4)
ON CONFLICT DO NOTHING;

-- 5eme (Francophone)
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
('b5801a93-6c67-47d1-a85b-5d4feb63609c', 'cf0de5f3-ad19-477b-9df3-66b794aa30d5', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%BRANDON%CHE%' LIMIT 1), 1),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GERALDINE%EBAMU%' LIMIT 1), 3),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', '0d52ac4d-6aca-47cb-837e-33bc0ff6dda8', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', '631063cc-12f4-43c6-ba83-fb6430e4e721', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ELVINE%CHE%NONO%' LIMIT 1), 1),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', 'c763c0ff-f908-4bca-8e94-a02d177fc1e1', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ELIANE%DJUIDJEU%' LIMIT 1), 1),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', '7fbf2210-4b2e-49e6-abef-9c7fb736a2d1', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', '4705f860-1462-4279-8ef5-52f3ed6c1730', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 2),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', 'f2a6e46f-25a9-4ba6-88fb-60baa8ca0438', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 1),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ETIENNE%EFFILA%' LIMIT 1), 2),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', '21de496f-281c-41e0-b370-ac9a161ed5eb', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%NESTOR%TOUKEA%' LIMIT 1), 2),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ZE%MBALLA%' LIMIT 1), 4),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', 'f42bf78f-437b-4187-ba0b-3dc239e628fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ZE%MBALLA%' LIMIT 1), 4),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', 'a13e5df8-9751-48ba-b7ec-5a3e9fbb6495', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('b5801a93-6c67-47d1-a85b-5d4feb63609c', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1)
ON CONFLICT DO NOTHING;

-- Form 2 Commercial
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
('8980b90e-440a-485a-917a-85982bed9172', '7cf4f972-ff28-4cf3-9037-50bd5525836a', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%EMELDA%BUTOH%' LIMIT 1), 3),
('8980b90e-440a-485a-917a-85982bed9172', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 4),
('8980b90e-440a-485a-917a-85982bed9172', '065c0a32-f8ac-457e-aa66-86a58a462056', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%THEODORE%NGUETCHOUAN%' LIMIT 1), 2),
('8980b90e-440a-485a-917a-85982bed9172', 'c9017e7d-9612-4670-9c56-50037302d2b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%EMELDA%BUTOH%' LIMIT 1), 3),
('8980b90e-440a-485a-917a-85982bed9172', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 2),
('8980b90e-440a-485a-917a-85982bed9172', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('8980b90e-440a-485a-917a-85982bed9172', '469ae2ca-3e93-4655-b31c-82dc6ad50f6f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 4),
('8980b90e-440a-485a-917a-85982bed9172', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 2),
('8980b90e-440a-485a-917a-85982bed9172', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%KERRY%CYNDY%' LIMIT 1), 2),
('8980b90e-440a-485a-917a-85982bed9172', '43dfc7d7-ed46-43b2-a3ec-449cdc0dc1f3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 1),
('8980b90e-440a-485a-917a-85982bed9172', 'ab920557-6f23-48b8-b79a-5e1d2eb63c52', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%EMELDA%BUTOH%' LIMIT 1), 3),
('8980b90e-440a-485a-917a-85982bed9172', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 4),
('8980b90e-440a-485a-917a-85982bed9172', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1)
ON CONFLICT DO NOTHING;

-- Form 2 General
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
('1616d4af-062b-479c-8416-c3dc3363b4d5', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 4),
('1616d4af-062b-479c-8416-c3dc3363b4d5', '45c64d71-a07b-4afb-99d5-33ac396e3538', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 2),
('1616d4af-062b-479c-8416-c3dc3363b4d5', 'bc028d8c-11ce-4997-b93d-ca87cf81a7b6', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 2),
('1616d4af-062b-479c-8416-c3dc3363b4d5', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 2),
('1616d4af-062b-479c-8416-c3dc3363b4d5', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('1616d4af-062b-479c-8416-c3dc3363b4d5', '469ae2ca-3e93-4655-b31c-82dc6ad50f6f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%HARLAND%MBIDA%' LIMIT 1), 4),
('1616d4af-062b-479c-8416-c3dc3363b4d5', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 2),
('1616d4af-062b-479c-8416-c3dc3363b4d5', '21de496f-281c-41e0-b370-ac9a161ed5eb', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 2),
('1616d4af-062b-479c-8416-c3dc3363b4d5', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%KERRY%CYNDY%' LIMIT 1), 2),
('1616d4af-062b-479c-8416-c3dc3363b4d5', '257d06a5-fd7e-4e05-a2cf-f9d67969c364', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ALTESS%OBIYIHA%' LIMIT 1), 2),
('1616d4af-062b-479c-8416-c3dc3363b4d5', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 4),
('1616d4af-062b-479c-8416-c3dc3363b4d5', '702f5231-79b6-4235-9b42-0a39730de609', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GAMALIEL%SOP%' LIMIT 1), 2),
('1616d4af-062b-479c-8416-c3dc3363b4d5', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1)
ON CONFLICT DO NOTHING;

-- Classes de 4eme et Form 3
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
-- 4eme esp
('6aa9a434-51e4-4c5f-ad50-e57664135109', 'cf0de5f3-ad19-477b-9df3-66b794aa30d5', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%BRANDON%CHE%' LIMIT 1), 3),
('6aa9a434-51e4-4c5f-ad50-e57664135109', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GERALDINE%EBAMU%' LIMIT 1), 3),
('6aa9a434-51e4-4c5f-ad50-e57664135109', '0d52ac4d-6aca-47cb-837e-33bc0ff6dda8', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GOTHARD%MIFOUMA%' LIMIT 1), 1),
('6aa9a434-51e4-4c5f-ad50-e57664135109', '631063cc-12f4-43c6-ba83-fb6430e4e721', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ELVINE%CHE%NONO%' LIMIT 1), 1),
('6aa9a434-51e4-4c5f-ad50-e57664135109', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('6aa9a434-51e4-4c5f-ad50-e57664135109', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('6aa9a434-51e4-4c5f-ad50-e57664135109', 'c763c0ff-f908-4bca-8e94-a02d177fc1e1', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ELIANE%DJUIDJEU%' LIMIT 1), 3),
('6aa9a434-51e4-4c5f-ad50-e57664135109', '7fbf2210-4b2e-49e6-abef-9c7fb736a2d1', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GOTHARD%MIFOUMA%' LIMIT 1), 1),
('6aa9a434-51e4-4c5f-ad50-e57664135109', '4705f860-1462-4279-8ef5-52f3ed6c1730', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GOTHARD%MIFOUMA%' LIMIT 1), 2),
('6aa9a434-51e4-4c5f-ad50-e57664135109', 'f2a6e46f-25a9-4ba6-88fb-60baa8ca0438', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GOTHARD%MIFOUMA%' LIMIT 1), 1),
('6aa9a434-51e4-4c5f-ad50-e57664135109', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ETIENNE%EFFILA%' LIMIT 1), 2),
('6aa9a434-51e4-4c5f-ad50-e57664135109', '21de496f-281c-41e0-b370-ac9a161ed5eb', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('6aa9a434-51e4-4c5f-ad50-e57664135109', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%NESTOR%TOUKEA%' LIMIT 1), 2),
('6aa9a434-51e4-4c5f-ad50-e57664135109', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ZE%MBALLA%' LIMIT 1), 4),
('6aa9a434-51e4-4c5f-ad50-e57664135109', 'f42bf78f-437b-4187-ba0b-3dc239e628fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ZE%MBALLA%' LIMIT 1), 3),
('6aa9a434-51e4-4c5f-ad50-e57664135109', 'a13e5df8-9751-48ba-b7ec-5a3e9fbb6495', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('6aa9a434-51e4-4c5f-ad50-e57664135109', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1),
-- Form 3
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%CHARLOTTE%BUMA%' LIMIT 1), 4),
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', '45c64d71-a07b-4afb-99d5-33ac396e3538', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 2),
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', 'bc028d8c-11ce-4997-b93d-ca87cf81a7b6', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%THIERRIEL%FONYA%' LIMIT 1), 2),
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', '065c0a32-f8ac-457e-aa66-86a58a462056', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%THEODORE%NGUETCHOUAN%' LIMIT 1), 2),
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', '35747683-666c-4c78-a92e-7bf5dc815acf', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%EMELDA%BUTOH%' LIMIT 1), 2),
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 2),
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', '469ae2ca-3e93-4655-b31c-82dc6ad50f6f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GOTHARD%MIFOUMA%' LIMIT 1), 4),
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 2),
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', '21de496f-281c-41e0-b370-ac9a161ed5eb', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 2),
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%KERRY%CYNDY%' LIMIT 1), 3),
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', '257d06a5-fd7e-4e05-a2cf-f9d67969c364', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%CHARLOTTE%BUMA%' LIMIT 1), 2),
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%THEODORE%NGUETCHOUAN%' LIMIT 1), 4),
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', '702f5231-79b6-4235-9b42-0a39730de609', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%EMMANUEL%RACHIDY%' LIMIT 1), 2),
('2eafc13f-7975-4aeb-b1fe-8c738ebc81ef', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1)
ON CONFLICT DO NOTHING;

-- Classes de 3eme et Form 4
INSERT INTO class_subjects (class_id, subject_id, teacher_id, coefficient) VALUES
-- 3e ALL
('c563bd16-dff3-418e-ac02-02f17eab9f35', 'cf0de5f3-ad19-477b-9df3-66b794aa30d5', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%BRANDON%CHE%' LIMIT 1), 3),
('c563bd16-dff3-418e-ac02-02f17eab9f35', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GERALDINE%EBAMU%' LIMIT 1), 3),
('c563bd16-dff3-418e-ac02-02f17eab9f35', '0d52ac4d-6aca-47cb-837e-33bc0ff6dda8', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GOTHARD%MIFOUMA%' LIMIT 1), 1),
('c563bd16-dff3-418e-ac02-02f17eab9f35', '631063cc-12f4-43c6-ba83-fb6430e4e721', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ELVINE%CHE%NONO%' LIMIT 1), 1),
('c563bd16-dff3-418e-ac02-02f17eab9f35', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GOTHARD%MIFOUMA%' LIMIT 1), 2),
('c563bd16-dff3-418e-ac02-02f17eab9f35', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('c563bd16-dff3-418e-ac02-02f17eab9f35', 'c763c0ff-f908-4bca-8e94-a02d177fc1e1', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ELIANE%DJUIDJEU%' LIMIT 1), 3),
('c563bd16-dff3-418e-ac02-02f17eab9f35', '7fbf2210-4b2e-49e6-abef-9c7fb736a2d1', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GOTHARD%MIFOUMA%' LIMIT 1), 1),
('c563bd16-dff3-418e-ac02-02f17eab9f35', '4705f860-1462-4279-8ef5-52f3ed6c1730', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GOTHARD%MIFOUMA%' LIMIT 1), 2),
('c563bd16-dff3-418e-ac02-02f17eab9f35', 'f2a6e46f-25a9-4ba6-88fb-60baa8ca0438', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GOTHARD%MIFOUMA%' LIMIT 1), 1),
('c563bd16-dff3-418e-ac02-02f17eab9f35', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ETIENNE%EFFILA%' LIMIT 1), 2),
('c563bd16-dff3-418e-ac02-02f17eab9f35', '21de496f-281c-41e0-b370-ac9a161ed5eb', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('c563bd16-dff3-418e-ac02-02f17eab9f35', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%NESTOR%TOUKEA%' LIMIT 1), 2),
('c563bd16-dff3-418e-ac02-02f17eab9f35', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ZE%MBALLA%' LIMIT 1), 4),
('c563bd16-dff3-418e-ac02-02f17eab9f35', 'f42bf78f-437b-4187-ba0b-3dc239e628fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ZE%MBALLA%' LIMIT 1), 3),
('c563bd16-dff3-418e-ac02-02f17eab9f35', 'a13e5df8-9751-48ba-b7ec-5a3e9fbb6495', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%DIANE%AVOMO%' LIMIT 1), 2),
('c563bd16-dff3-418e-ac02-02f17eab9f35', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1),
-- 3e ESP (seulement géographie)
('caaec3ff-d96f-406d-b12e-044355ea68ae', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ETIENNE%EFFILA%' LIMIT 1), 2),
-- Form 4 Art
('6eca9cd6-4fa8-4a07-959d-a3166ea1880c', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%CHARLOTTE%BUMA%' LIMIT 1), 4),
('6eca9cd6-4fa8-4a07-959d-a3166ea1880c', 'ef64ae18-abe4-4d35-a8e9-a64829e68d52', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%THIERRIEL%FONYA%' LIMIT 1), 3),
('6eca9cd6-4fa8-4a07-959d-a3166ea1880c', '065c0a32-f8ac-457e-aa66-86a58a462056', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%EMELDA%BUTOH%' LIMIT 1), 2),
('6eca9cd6-4fa8-4a07-959d-a3166ea1880c', '35747683-666c-4c78-a92e-7bf5dc815acf', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%EMELDA%BUTOH%' LIMIT 1), 3),
('6eca9cd6-4fa8-4a07-959d-a3166ea1880c', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 3),
('6eca9cd6-4fa8-4a07-959d-a3166ea1880c', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('6eca9cd6-4fa8-4a07-959d-a3166ea1880c', '469ae2ca-3e93-4655-b31c-82dc6ad50f6f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GOTHARD%MIFOUMA%' LIMIT 1), 4),
('6eca9cd6-4fa8-4a07-959d-a3166ea1880c', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 3),
('6eca9cd6-4fa8-4a07-959d-a3166ea1880c', '21de496f-281c-41e0-b370-ac9a161ed5eb', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 3),
('6eca9cd6-4fa8-4a07-959d-a3166ea1880c', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%KERRY%CYNDY%' LIMIT 1), 3),
('6eca9cd6-4fa8-4a07-959d-a3166ea1880c', '257d06a5-fd7e-4e05-a2cf-f9d67969c364', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%CHARLOTTE%BUMA%' LIMIT 1), 2),
('6eca9cd6-4fa8-4a07-959d-a3166ea1880c', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%THEODORE%NGUETCHOUAN%' LIMIT 1), 4),
('6eca9cd6-4fa8-4a07-959d-a3166ea1880c', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1),
-- Form 4 Science
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', '85ecfb74-4a8a-4bd8-a5db-718827b53682', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%CHARLOTTE%BUMA%' LIMIT 1), 4),
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', '45c64d71-a07b-4afb-99d5-33ac396e3538', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 3),
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', 'ef64ae18-abe4-4d35-a8e9-a64829e68d52', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%THIERRIEL%FONYA%' LIMIT 1), 3),
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', 'bc028d8c-11ce-4997-b93d-ca87cf81a7b6', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%THIERRIEL%FONYA%' LIMIT 1), 3),
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', '065c0a32-f8ac-457e-aa66-86a58a462056', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%EMELDA%BUTOH%' LIMIT 1), 2),
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', '35747683-666c-4c78-a92e-7bf5dc815acf', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%EMELDA%BUTOH%' LIMIT 1), 3),
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', '1b6bf64b-9ded-4d59-a7ce-31cfcd9e19b9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 3),
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', '0d720016-843a-4e14-8cb8-effc6cb78379', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%ADEBO%PLATINI%' LIMIT 1), 2),
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', '469ae2ca-3e93-4655-b31c-82dc6ad50f6f', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%GOTHARD%MIFOUMA%' LIMIT 1), 4),
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', '47296533-72af-4456-8006-63e400bb36a3', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%PAMOLINE%NGENUE%' LIMIT 1), 3),
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', 'c9f5bde7-41ab-4c15-825b-59983af9d593', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%KERRY%CYNDY%' LIMIT 1), 3),
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', '0513f518-e8ab-4bc7-a58f-06989850b6fc', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%THEODORE%NGUETCHOUAN%' LIMIT 1), 4),
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', 'c8c1643c-86c9-4e2e-b986-34c7e5f1498b', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%EMMANUEL%RACHIDY%' LIMIT 1), 2),
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', '702f5231-79b6-4235-9b42-0a39730de609', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%EMMANUEL%RACHIDY%' LIMIT 1), 3),
('9e89b204-5d9b-4bac-8fdf-974fa00dd21a', '2a2bc5dd-83cb-4d96-a83c-4efc0454fcf9', (SELECT id FROM teachers WHERE UPPER(first_name || ' ' || last_name) LIKE '%MELENGUE%SANGONG%' LIMIT 1), 1)
ON CONFLICT DO NOTHING;

-- Nettoyage de la fonction temporaire
DROP FUNCTION IF EXISTS get_teacher_id(TEXT);

-- Récapitulatif
SELECT 
  c.name as class_name,
  COUNT(cs.id) as nb_subjects
FROM classes c
LEFT JOIN class_subjects cs ON cs.class_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;
