-- HARMONY - Seed Students Data
-- This creates sample students for testing

-- Generate 35 students for 6ème A
INSERT INTO students (matricule, first_name, last_name, date_of_birth, place_of_birth, gender, class_id, father_name, father_phone, mother_name, mother_phone, address, status, enrollment_date)
VALUES
  ('2024-FR-001', 'Amadou', 'Bello', '2012-03-15', 'Yaoundé', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Ibrahim Bello', '+237 677 123 001', 'Fatou Bello', '+237 699 123 001', 'Quartier Bastos, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-002', 'Aïcha', 'Cameroun', '2012-05-22', 'Douala', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Paul Cameroun', '+237 677 123 002', 'Marie Cameroun', '+237 699 123 002', 'Quartier Akwa, Douala', 'Active', '2024-09-02'),
  ('2024-FR-003', 'Bernard', 'Dongmo', '2012-01-10', 'Bafoussam', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Jean Dongmo', '+237 677 123 003', 'Claire Dongmo', '+237 699 123 003', 'Quartier Banengo, Bafoussam', 'Active', '2024-09-02'),
  ('2024-FR-004', 'Christelle', 'Etoga', '2012-07-08', 'Yaoundé', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Pierre Etoga', '+237 677 123 004', 'Anne Etoga', '+237 699 123 004', 'Quartier Mvan, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-005', 'Daniel', 'Fotso', '2012-11-30', 'Bamenda', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Samuel Fotso', '+237 677 123 005', 'Ruth Fotso', '+237 699 123 005', 'Up Station, Bamenda', 'Active', '2024-09-02'),
  ('2024-FR-006', 'Elisabeth', 'Gueye', '2012-02-14', 'Garoua', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Abdou Gueye', '+237 677 123 006', 'Aminata Gueye', '+237 699 123 006', 'Quartier Nord, Garoua', 'Active', '2024-09-02'),
  ('2024-FR-007', 'François', 'Happi', '2012-09-25', 'Yaoundé', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Martin Happi', '+237 677 123 007', 'Jeanne Happi', '+237 699 123 007', 'Quartier Nlongkak, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-008', 'Grace', 'Ibrahima', '2012-04-18', 'Maroua', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Ousmane Ibrahima', '+237 677 123 008', 'Halima Ibrahima', '+237 699 123 008', 'Quartier Kakataré, Maroua', 'Active', '2024-09-02'),
  ('2024-FR-009', 'Henri', 'Jato', '2012-06-05', 'Buea', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Emmanuel Jato', '+237 677 123 009', 'Esther Jato', '+237 699 123 009', 'Great Soppo, Buea', 'Active', '2024-09-02'),
  ('2024-FR-010', 'Irène', 'Kamga', '2012-12-20', 'Yaoundé', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Alain Kamga', '+237 677 123 010', 'Brigitte Kamga', '+237 699 123 010', 'Quartier Biyem-Assi, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-011', 'Jules', 'Lobe', '2012-08-12', 'Kribi', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Marc Lobe', '+237 677 123 011', 'Sophie Lobe', '+237 699 123 011', 'Quartier Mpalla, Kribi', 'Active', '2024-09-02'),
  ('2024-FR-012', 'Karine', 'Mbarga', '2012-10-03', 'Yaoundé', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Jacques Mbarga', '+237 677 123 012', 'Nicole Mbarga', '+237 699 123 012', 'Quartier Essos, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-013', 'Léon', 'Ndongo', '2012-03-28', 'Ebolowa', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Charles Ndongo', '+237 677 123 013', 'Pauline Ndongo', '+237 699 123 013', 'Quartier Nko''ovos, Ebolowa', 'Active', '2024-09-02'),
  ('2024-FR-014', 'Marie-Claire', 'Onana', '2012-05-15', 'Yaoundé', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Joseph Onana', '+237 677 123 014', 'Thérèse Onana', '+237 699 123 014', 'Quartier Nkol-Eton, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-015', 'Narcisse', 'Pokam', '2012-07-20', 'Dschang', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Victor Pokam', '+237 677 123 015', 'Berthe Pokam', '+237 699 123 015', 'Quartier Foto, Dschang', 'Active', '2024-09-02'),
  ('2024-FR-016', 'Olive', 'Quentin', '2012-01-25', 'Yaoundé', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Roger Quentin', '+237 677 123 016', 'Hélène Quentin', '+237 699 123 016', 'Quartier Elig-Edzoa, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-017', 'Patrick', 'Rossa', '2012-09-08', 'Ngaoundéré', 'M', 'cccc0001-0001-0001-0001-000000000001', 'André Rossa', '+237 677 123 017', 'Mireille Rossa', '+237 699 123 017', 'Quartier Joli Soir, Ngaoundéré', 'Active', '2024-09-02'),
  ('2024-FR-018', 'Rachel', 'Simo', '2012-11-12', 'Yaoundé', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Denis Simo', '+237 677 123 018', 'Florence Simo', '+237 699 123 018', 'Quartier Mvog-Mbi, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-019', 'Serge', 'Talom', '2012-04-02', 'Bafoussam', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Gaston Talom', '+237 677 123 019', 'Cécile Talom', '+237 699 123 019', 'Quartier Tamdja, Bafoussam', 'Active', '2024-09-02'),
  ('2024-FR-020', 'Tatiana', 'Uba', '2012-06-18', 'Douala', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Simon Uba', '+237 677 123 020', 'Dorothée Uba', '+237 699 123 020', 'Quartier Bonapriso, Douala', 'Active', '2024-09-02'),
  ('2024-FR-021', 'Urbain', 'Voundi', '2012-08-30', 'Yaoundé', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Lucien Voundi', '+237 677 123 021', 'Angèle Voundi', '+237 699 123 021', 'Quartier Mendong, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-022', 'Vanessa', 'Wandji', '2012-02-22', 'Nkongsamba', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Gilles Wandji', '+237 677 123 022', 'Martine Wandji', '+237 699 123 022', 'Quartier Mbo, Nkongsamba', 'Active', '2024-09-02'),
  ('2024-FR-023', 'Xavier', 'Yetna', '2012-12-05', 'Yaoundé', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Oscar Yetna', '+237 677 123 023', 'Véronique Yetna', '+237 699 123 023', 'Quartier Nkolbisson, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-024', 'Yolande', 'Zame', '2012-10-15', 'Sangmélima', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Thomas Zame', '+237 677 123 024', 'Yvonne Zame', '+237 699 123 024', 'Quartier Centre, Sangmélima', 'Active', '2024-09-02'),
  ('2024-FR-025', 'Zacharie', 'Abanda', '2012-03-10', 'Yaoundé', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Philippe Abanda', '+237 677 123 025', 'Christine Abanda', '+237 699 123 025', 'Quartier Obili, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-026', 'Alice', 'Bella', '2012-05-28', 'Edéa', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Robert Bella', '+237 677 123 026', 'Jacqueline Bella', '+237 699 123 026', 'Quartier Bilolo, Edéa', 'Active', '2024-09-02'),
  ('2024-FR-027', 'Bruno', 'Essomba', '2012-07-14', 'Yaoundé', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Michel Essomba', '+237 677 123 027', 'Marguerite Essomba', '+237 699 123 027', 'Quartier Mimboman, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-028', 'Carine', 'Fouda', '2012-01-30', 'Mbalmayo', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Henri Fouda', '+237 677 123 028', 'Rosalie Fouda', '+237 699 123 028', 'Quartier Centre, Mbalmayo', 'Active', '2024-09-02'),
  ('2024-FR-029', 'David', 'Nguema', '2012-09-18', 'Yaoundé', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Ernest Nguema', '+237 677 123 029', 'Solange Nguema', '+237 699 123 029', 'Quartier Nsimeyong, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-030', 'Emma', 'Tabi', '2012-11-25', 'Bertoua', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Blaise Tabi', '+237 677 123 030', 'Eugénie Tabi', '+237 699 123 030', 'Quartier Haoussa, Bertoua', 'Active', '2024-09-02'),
  ('2024-FR-031', 'Ferdinand', 'Ngo', '2012-04-08', 'Yaoundé', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Célestin Ngo', '+237 677 123 031', 'Béatrice Ngo', '+237 699 123 031', 'Quartier Nkomkana, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-032', 'Gabrielle', 'Owona', '2012-06-22', 'Bafia', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Antoine Owona', '+237 677 123 032', 'Antoinette Owona', '+237 699 123 032', 'Quartier Centre, Bafia', 'Active', '2024-09-02'),
  ('2024-FR-033', 'Hervé', 'Tamba', '2012-08-05', 'Yaoundé', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Félix Tamba', '+237 677 123 033', 'Germaine Tamba', '+237 699 123 033', 'Quartier Emana, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-034', 'Isabelle', 'Mvondo', '2012-10-28', 'Ebolowa', 'F', 'cccc0001-0001-0001-0001-000000000001', 'Stéphane Mvondo', '+237 677 123 034', 'Sylvie Mvondo', '+237 699 123 034', 'Quartier Mekalat, Ebolowa', 'Active', '2024-09-02'),
  ('2024-FR-035', 'Jean-Marc', 'Ateba', '2012-12-12', 'Yaoundé', 'M', 'cccc0001-0001-0001-0001-000000000001', 'Raymond Ateba', '+237 677 123 035', 'Laurence Ateba', '+237 699 123 035', 'Quartier Omnisport, Yaoundé', 'Active', '2024-09-02')
ON CONFLICT (matricule) DO NOTHING;

-- Generate students for 6ème B
INSERT INTO students (matricule, first_name, last_name, date_of_birth, place_of_birth, gender, class_id, father_name, father_phone, mother_name, mother_phone, address, status, enrollment_date)
VALUES
  ('2024-FR-036', 'Aimée', 'Nkoulou', '2012-02-15', 'Yaoundé', 'F', 'cccc0001-0001-0001-0001-000000000002', 'Gilbert Nkoulou', '+237 677 124 001', 'Monique Nkoulou', '+237 699 124 001', 'Quartier Bastos, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-037', 'Alain', 'Biyong', '2012-04-22', 'Douala', 'M', 'cccc0001-0001-0001-0001-000000000002', 'Patrick Biyong', '+237 677 124 002', 'Linda Biyong', '+237 699 124 002', 'Quartier Akwa, Douala', 'Active', '2024-09-02'),
  ('2024-FR-038', 'Béatrice', 'Ekani', '2012-06-10', 'Bafoussam', 'F', 'cccc0001-0001-0001-0001-000000000002', 'Claude Ekani', '+237 677 124 003', 'Josiane Ekani', '+237 699 124 003', 'Quartier Tamdja, Bafoussam', 'Active', '2024-09-02'),
  ('2024-FR-039', 'Cédric', 'Ngassa', '2012-08-08', 'Yaoundé', 'M', 'cccc0001-0001-0001-0001-000000000002', 'Valentin Ngassa', '+237 677 124 004', 'Odette Ngassa', '+237 699 124 004', 'Quartier Mvan, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-040', 'Danielle', 'Meka', '2012-10-30', 'Bamenda', 'F', 'cccc0001-0001-0001-0001-000000000002', 'Bernard Meka', '+237 677 124 005', 'Elise Meka', '+237 699 124 005', 'Commercial Avenue, Bamenda', 'Active', '2024-09-02'),
  ('2024-FR-041', 'Émile', 'Awono', '2012-01-14', 'Garoua', 'M', 'cccc0001-0001-0001-0001-000000000002', 'Francis Awono', '+237 677 124 006', 'Gertrude Awono', '+237 699 124 006', 'Quartier Nord, Garoua', 'Active', '2024-09-02'),
  ('2024-FR-042', 'Félicité', 'Tchinda', '2012-03-25', 'Yaoundé', 'F', 'cccc0001-0001-0001-0001-000000000002', 'Hyppolite Tchinda', '+237 677 124 007', 'Irène Tchinda', '+237 699 124 007', 'Quartier Nlongkak, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-043', 'Gaël', 'Nana', '2012-05-18', 'Maroua', 'M', 'cccc0001-0001-0001-0001-000000000002', 'Jules Nana', '+237 677 124 008', 'Katia Nana', '+237 699 124 008', 'Quartier Domayo, Maroua', 'Active', '2024-09-02'),
  ('2024-FR-044', 'Hortense', 'Djomo', '2012-07-05', 'Buea', 'F', 'cccc0001-0001-0001-0001-000000000002', 'Laurent Djomo', '+237 677 124 009', 'Madeleine Djomo', '+237 699 124 009', 'Molyko, Buea', 'Active', '2024-09-02'),
  ('2024-FR-045', 'Igor', 'Tsanga', '2012-09-20', 'Yaoundé', 'M', 'cccc0001-0001-0001-0001-000000000002', 'Norbert Tsanga', '+237 677 124 010', 'Odile Tsanga', '+237 699 124 010', 'Quartier Biyem-Assi, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-046', 'Joséphine', 'Eloundou', '2012-11-12', 'Kribi', 'F', 'cccc0001-0001-0001-0001-000000000002', 'Pascal Eloundou', '+237 677 124 011', 'Quentin Eloundou', '+237 699 124 011', 'Grand Batanga, Kribi', 'Active', '2024-09-02'),
  ('2024-FR-047', 'Kevin', 'Ndjock', '2012-02-03', 'Yaoundé', 'M', 'cccc0001-0001-0001-0001-000000000002', 'Raymond Ndjock', '+237 677 124 012', 'Sabine Ndjock', '+237 699 124 012', 'Quartier Essos, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-048', 'Laure', 'Engono', '2012-04-28', 'Ebolowa', 'F', 'cccc0001-0001-0001-0001-000000000002', 'Théodore Engono', '+237 677 124 013', 'Ursule Engono', '+237 699 124 013', 'Quartier Angale, Ebolowa', 'Active', '2024-09-02'),
  ('2024-FR-049', 'Maurice', 'Bodo', '2012-06-15', 'Yaoundé', 'M', 'cccc0001-0001-0001-0001-000000000002', 'Victor Bodo', '+237 677 124 014', 'Wenceslas Bodo', '+237 699 124 014', 'Quartier Nkol-Eton, Yaoundé', 'Active', '2024-09-02'),
  ('2024-FR-050', 'Nadine', 'Sop', '2012-08-20', 'Dschang', 'F', 'cccc0001-0001-0001-0001-000000000002', 'Xavier Sop', '+237 677 124 015', 'Yvette Sop', '+237 699 124 015', 'Quartier Foto, Dschang', 'Active', '2024-09-02')
ON CONFLICT (matricule) DO NOTHING;
