-- Seed resource definitions
INSERT INTO public.resource_definitions (name, description) VALUES
('metal', 'Main construction material.'),
('crystal', 'Advanced material for high-tech construction.'),
('food', 'Sustains your population.');

-- Seed building types with construction times and requirements
-- Tier 1
INSERT INTO public.building_types (name, tier, cost_metal, cost_crystal, cost_food, requirements, construction_time_seconds) 
VALUES ('Shelter', 1, 50, 10, 20, '{"buildings": []}', 30);

INSERT INTO public.building_types (name, tier, cost_metal, cost_crystal, cost_food, power_usage, requirements, base_production, production_bonus_per_level, construction_time_seconds) 
VALUES ('Mine', 1, 100, 25, 50, 1, '{"buildings": [{"name": "Shelter", "level": 1}]}', 15, 0.15, 60);

INSERT INTO public.building_types (name, tier, cost_metal, cost_crystal, cost_food, power_usage, requirements, base_production, production_bonus_per_level, construction_time_seconds) 
VALUES ('Crystal Mine', 1, 150, 75, 50, 1, '{"buildings": [{"name": "Mine", "level": 2}]}', 10, 0.1, 120);

INSERT INTO public.building_types (name, tier, cost_metal, cost_crystal, cost_food, power_usage, requirements, base_production, production_bonus_per_level, construction_time_seconds) 
VALUES ('Farm', 1, 80, 40, 100, 1, '{"buildings": [{"name": "Shelter", "level": 1}]}', 10, 0.1, 90);

INSERT INTO public.building_types (name, tier, cost_metal, cost_crystal, cost_food, requirements, base_storage, storage_bonus_per_level, construction_time_seconds) 
VALUES ('Storage Tanks', 1, 120, 60, 40, '{"buildings": [{"name": "Shelter", "level": 1}]}', 100, 0.25, 45);

-- Tier 2
INSERT INTO public.building_types (name, tier, cost_metal, cost_crystal, cost_food, requirements, base_power_generation, power_generation_per_level, construction_time_seconds) 
VALUES ('Solar Panels', 2, 200, 100, 0, '{"buildings": [{"name": "Shelter", "level": 1}]}', 0, 10, 180);
