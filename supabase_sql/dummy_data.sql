- Seed resource definitions
INSERT INTO public.resource_definitions (name, description) VALUES
('Oxygen', 'Essential for survival.'),
('Food', 'Sustains colonists.'),
('Metal', 'Main construction material.'),
('Energy', 'Powers all advanced structures.'),
('Artifacts', 'Rare alien relics with unique properties.');

-- Seed building types with construction times and requirements
-- Tier 1
INSERT INTO public.building_types (name, cost, tier, requirements, construction_time_seconds) 
VALUES ('Shelter', 50, 1, '{"buildings": []}', 10);

INSERT INTO public.building_types (name, cost, tier, power_usage, requirements, base_production, production_bonus_per_level, construction_time_seconds) 
VALUES ('Oxygen Extractor', 100, 1, 1, '{"buildings": [{"name": "Shelter", "level": 1}]}', 10, 0.1, 20);

INSERT INTO public.building_types (name, cost, tier, power_usage, requirements, base_production, production_bonus_per_level, construction_time_seconds) 
VALUES ('Mine', 120, 1, 1, '{"buildings": [{"name": "Shelter", "level": 1}]}', 15, 0.15, 25);

INSERT INTO public.building_types (name, cost, tier, power_usage, requirements, base_production, production_bonus_per_level, construction_time_seconds) 
VALUES ('Farm', 100, 1, 1, '{"buildings": [{"name": "Shelter", "level": 1}]}', 10, 0.1, 20);

INSERT INTO public.building_types (name, cost, tier, requirements, base_storage, storage_bonus_per_level, construction_time_seconds) 
VALUES ('Storage Tanks', 80, 1, '{"buildings": [{"name": "Shelter", "level": 1}]}', 100, 0.25, 15);

-- Tier 2
INSERT INTO public.building_types (name, tier, requirements, base_power_generation, power_generation_per_level, construction_time_seconds) 
VALUES ('Solar Panels', 2, '{"buildings": [{"name": "Shelter", "level": 1}]}', 0, 10, 30);
