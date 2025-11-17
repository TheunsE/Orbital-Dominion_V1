CREATE OR REPLACE FUNCTION update_player_resources()
RETURNS void AS $$
DECLARE
    player_record RECORD;
    building_record RECORD;
    new_metal_quantity INT;
    new_food_quantity INT;
    new_oxygen_quantity INT;
    new_energy_quantity INT;
BEGIN
    FOR player_record IN SELECT id FROM public.players LOOP
        new_metal_quantity := 0;
        new_food_quantity := 0;
        new_oxygen_quantity := 0;
        new_energy_quantity := 0;

        FOR building_record IN 
            SELECT 
                b.level, 
                bt.name,
                bt.base_production,
                bt.production_bonus_per_level,
                bt.base_power_generation,
                bt.power_generation_per_level
            FROM public.player_buildings b
            JOIN public.building_types bt ON b.building_type_id = bt.id
            WHERE b.player_id = player_record.id
        LOOP
            IF building_record.name = 'Mine' THEN
                new_metal_quantity := new_metal_quantity + (building_record.base_production * (1 + (building_record.level - 1) * building_record.production_bonus_per_level));
            ELSIF building_record.name = 'Farm' THEN
                new_food_quantity := new_food_quantity + (building_record.base_production * (1 + (building_record.level - 1) * building_record.production_bonus_per_level));
            ELSIF building_record.name = 'Oxygen Extractor' THEN
                new_oxygen_quantity := new_oxygen_quantity + (building_record.base_production * (1 + (building_record.level - 1) * building_record.production_bonus_per_level));
            ELSIF building_record.name = 'Solar Panels' THEN
                new_energy_quantity := new_energy_quantity + (building_record.level * building_record.power_generation_per_level);
            END IF;
        END LOOP;
        
        -- Update resources
        UPDATE public.resources SET quantity = quantity + new_metal_quantity WHERE player_id = player_record.id AND resource_type = 'Metal';
        UPDATE public.resources SET quantity = quantity + new_food_quantity WHERE player_id = player_record.id AND resource_type = 'Food';
        UPDATE public.resources SET quantity = quantity + new_oxygen_quantity WHERE player_id = player_record.id AND resource_type = 'Oxygen';
        UPDATE public.resources SET quantity = quantity + new_energy_quantity WHERE player_id = player_record.id AND resource_type = 'Energy';
        
    END LOOP;
END;
$$ LANGUAGE plpgsql;
