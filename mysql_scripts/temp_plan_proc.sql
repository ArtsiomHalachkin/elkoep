DELIMITER $$
CREATE PROCEDURE AddTemperaturePlan(
    IN p_room_id INT,
    IN p_name VARCHAR(50),
    IN p_description VARCHAR(100),
    IN p_min_temp DECIMAL(5,2),
    IN p_attenuation_temp DECIMAL(5,2),
    IN p_normal_temp DECIMAL(5,2),
    IN p_comfort_temp DECIMAL(5,2)
)
BEGIN
    INSERT INTO TemperaturePlan (room_id, name, description, min_temp, attenuation_temp, normal_temp, comfort_temp)
    VALUES (p_room_id, p_name, p_description, p_min_temp, p_attenuation_temp, p_normal_temp, p_comfort_temp);
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE AddTemperaturePlanSlot(
    IN p_plan_id INT,
    IN p_day_of_week ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun'),
    IN p_start_time TIME,
    IN p_end_time TIME,
    IN p_type ENUM('Minimum','Attenuation','Normal','Comfort')
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM TemperaturePlan WHERE plan_id = p_plan_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: The specified temperature plan does not exist.';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM TemperaturePlanSlot
        WHERE plan_id = p_plan_id
          AND day_of_week = p_day_of_week
          AND (
              (p_start_time BETWEEN start_time AND end_time)
              OR (p_end_time BETWEEN start_time AND end_time)
              OR (p_start_time <= start_time AND p_end_time >= end_time)
          )
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Time slot overlaps with an existing slot.';
    END IF;

    INSERT INTO TemperaturePlanSlot (
        plan_id, day_of_week, start_time, end_time, type
    )
    VALUES (
        p_plan_id, p_day_of_week, p_start_time, p_end_time, p_type
    );
    COMMIT;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE GetLastTemperaturePlanId()
BEGIN
    DECLARE last_id INT;

    SELECT plan_id
    INTO last_id
    FROM TemperaturePlan
    ORDER BY plan_id DESC
    LIMIT 1;
    SELECT last_id AS plan_id;
END$$
DELIMITER ;


USE inels_air_db;
DELIMITER $$
CREATE PROCEDURE GetAllTemperaturePlans()
BEGIN
    SELECT 
        plan_id,
        room_id,
        name,
        description,
        min_temp,
        attenuation_temp,
        normal_temp,
        comfort_temp
    FROM TemperaturePlan
    ORDER BY plan_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE GetAllTemperaturePlanSlots(IN p_plan_id INT)
BEGIN
    SELECT 
        slot_id,
        plan_id,
        day_of_week,
        start_time,
        end_time,
        type AS slot_type
    FROM TemperaturePlanSlot
    WHERE plan_id = p_plan_id OR p_plan_id IS NULL
    ORDER BY plan_id, day_of_week, start_time;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE GetTemperatureSlotsByPlan(IN p_plan_id INT)
BEGIN
    SELECT 
        slot_id,
        plan_id,
        day_of_week,
        start_time,
        end_time,
        type AS slot_type
    FROM TemperaturePlanSlot
    WHERE plan_id = p_plan_id
    ORDER BY plan_id, day_of_week, start_time;
END$$
DELIMITER ;



DELIMITER //
CREATE PROCEDURE GetTemperaturePlanById(IN p_plan_id INT)
BEGIN
    SELECT * FROM TemperaturePlan WHERE plan_id = p_plan_id;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE DeleteTemperaturePlan(IN p_plan_id INT)
BEGIN
	DELETE FROM TemperaturePlan WHERE plan_id = p_plan_id;
	COMMIT;
END //
DELIMITER ;


DELIMITER $$
CREATE PROCEDURE UpdateTemperaturePlan(
    IN p_plan_id INT,
    IN p_name VARCHAR(50),
    IN p_description VARCHAR(100),
    IN p_min_temp DECIMAL(5,2),
    IN p_attenuation_temp DECIMAL(5,2),
    IN p_normal_temp DECIMAL(5,2),
    IN p_comfort_temp DECIMAL(5,2)
)
BEGIN
    UPDATE TemperaturePlan
    SET 
        name = p_name,
        description = p_description,
        min_temp = p_min_temp,
        attenuation_temp = p_attenuation_temp,
        normal_temp = p_normal_temp,
        comfort_temp = p_comfort_temp
    WHERE plan_id = p_plan_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE DeleteTemperaturePlanSlot(
    IN p_slot_id INT
)
BEGIN
    DECLARE slot_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO slot_exists
    FROM TemperaturePlanSlot
    WHERE slot_id = p_slot_id;

    IF slot_exists > 0 THEN
        DELETE FROM TemperaturePlanSlot
        WHERE slot_id = p_slot_id;
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Slot does not exist.';
    END IF;
    COMMIT;
END$$
DELIMITER ;






