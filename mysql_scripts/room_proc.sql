USE inels_air_db;

DELIMITER $$
CREATE PROCEDURE AddRoom(
    IN p_name VARCHAR(50),
    IN p_description VARCHAR(100)
)
BEGIN
	INSERT INTO Room (name, description)
	VALUES (p_name, p_description);
	COMMIT;
END$$
DELIMITER $$ 

DELIMITER $$
CREATE PROCEDURE GetAllRooms(
)
BEGIN
	SELECT * FROM Room;
END$$
DELIMITER $$ 

DELIMITER $$
CREATE PROCEDURE DeleteRoom(
	IN p_room_id INT
)
BEGIN
	IF EXISTS (SELECT 1 FROM Room WHERE room_id = p_room_id) THEN
		DELETE FROM Room WHERE room_id = p_room_id;
        COMMIT;
	ELSE
		SIGNAL SQLSTATE '45000'
		SET MESSAGE_TEXT = 'Room for deleting not found';
	END IF;
END$$
DELIMITER $$ 


DELIMITER $$
CREATE PROCEDURE UpdateRoom(
	IN p_room_id INT,
	IN p_name VARCHAR(50),
    IN p_description VARCHAR(100)
)
BEGIN
IF EXISTS (SELECT 1 FROM Room WHERE room_id = p_room_id) THEN
    UPDATE Room
    SET 
        name = p_name,
        description = p_description
    WHERE room_id = p_room_id;
    COMMIT;
ELSE
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Room for updating not found';
END IF;
END$$
DELIMITER ;



DELIMITER $$
CREATE PROCEDURE GetRoomById(IN p_room_id INT)
BEGIN
	IF EXISTS (SELECT 1 FROM Room WHERE room_id = p_room_id) THEN
		SELECT 
			name,
			description
		FROM Room
		WHERE room_id = p_room_id;
	ELSE
		SIGNAL SQLSTATE '45000'
		SET MESSAGE_TEXT = 'Room with this id not found';
	END IF;
END$$
DELIMITER ;



DELIMITER $$
CREATE PROCEDURE GetRoomDevices(IN p_room_id INT)
BEGIN	
    
    SELECT 
        'RFTC8' as device_type,
        device_id,
        dev_eui,
        description,
        room_id
    FROM RFTC8_Device
    WHERE room_id = p_room_id

    UNION ALL

    
    SELECT 
        'RFATV8' as device_type,
        device_id,
        dev_eui,
        description,
        room_id
    FROM RFATV8_Device
    WHERE room_id = p_room_id;
END$$
DELIMITER ;



DELIMITER $$
CREATE PROCEDURE GetRoomAccounts(IN p_room_id INT)
BEGIN
    SELECT a.account_id, a.username, a.description, a.enable
    FROM Account a
    JOIN Account_Room ar ON a.account_id = ar.account_id
    WHERE ar.room_id = p_room_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE GetRoomTemperaturePlan(IN p_room_id INT)
BEGIN
    SELECT plan_id, room_id, name, description, min_temp, attenuation_temp, normal_temp, comfort_temp
    FROM TemperaturePlan
    WHERE room_id = p_room_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE AssignRoomAccounts(
    IN p_room_id INT,
    IN p_account_id INT
)
BEGIN
    DECLARE room_exists INT;
    DECLARE acc_exists INT;

    SELECT COUNT(*) INTO room_exists FROM Room WHERE room_id = p_room_id;
    SELECT COUNT(*) INTO acc_exists FROM Account WHERE account_id = p_account_id;

    IF room_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room does not exist.';
    END IF;
    IF acc_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Account does not exist.';
    END IF;

    INSERT IGNORE INTO Account_Room (account_id, room_id)
    VALUES (p_account_id, p_room_id);
    COMMIT;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE AssignRoomPlan(
    IN p_room_id INT,
    IN p_plan_id INT
)
BEGIN
    DECLARE room_exists INT;
    DECLARE plan_exists INT;

    SELECT COUNT(*) INTO room_exists FROM Room WHERE room_id = p_room_id;
    SELECT COUNT(*) INTO plan_exists FROM TemperaturePlan WHERE plan_id = p_plan_id;

    IF room_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room does not exist.';
    END IF;
    IF plan_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Temperature plan does not exist.';
    END IF;

    UPDATE TemperaturePlan
    SET room_id = p_room_id
    WHERE plan_id = p_plan_id;
    COMMIT;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE AssignRoomThermostat(
    IN p_room_id INT,
    IN p_rftc8_dev_eui BIGINT
)
BEGIN
    DECLARE room_exists INT;
    DECLARE rftc8_exists INT;

    SELECT COUNT(*) INTO room_exists FROM Room WHERE room_id = p_room_id;
    SELECT COUNT(*) INTO rftc8_exists FROM RFTC8_Device WHERE dev_eui = p_rftc8_dev_eui;

    IF room_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room does not exist.';
    END IF;
    IF rftc8_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RFTC8 device does not exist.';
    END IF;

    UPDATE RFTC8_Device
    SET room_id = p_room_id
    WHERE dev_eui = p_rftc8_dev_eui;
    COMMIT;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE AssignRoomValve(
    IN p_room_id INT,
    IN p_rfatv8_dev_eui BIGINT
)
BEGIN
    DECLARE room_exists INT;
    DECLARE rfatv8_exists INT;

    SELECT COUNT(*) INTO room_exists FROM Room WHERE room_id = p_room_id;
    SELECT COUNT(*) INTO rfatv8_exists FROM RFATV8_Device WHERE dev_eui = p_rfatv8_dev_eui;

    IF room_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room does not exist.';
    END IF;
    IF rfatv8_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RFATV8 device does not exist.';
    END IF;

    UPDATE RFATV8_Device
    SET room_id = p_room_id
    WHERE dev_eui = p_rfatv8_dev_eui;
    COMMIT;
END$$
DELIMITER ;



DELIMITER $$
CREATE PROCEDURE RemoveDeviceFromRoom(
    IN p_room_id INT,
    IN p_dev_eui BIGINT,
    IN p_device_type ENUM('RFTC8','RFATV8')
)
BEGIN
	IF p_device_type = 'RFTC8' THEN 
		UPDATE RFTC8_Device
		SET room_id = NULL
		WHERE dev_eui = p_dev_eui AND room_id = p_room_id;
		COMMIT;
    ELSEIF p_device_type = 'RFATV8' THEN
		UPDATE RFATV8_Device
		SET room_id = NULL
		WHERE dev_eui = p_dev_eui AND room_id = p_room_id;
		COMMIT;
	END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE RemoveAccountFromRoom(
    IN p_room_id INT,
    IN p_account_id INT
)
BEGIN
    DELETE FROM Account_Room
    WHERE account_id = p_account_id AND room_id = p_room_id;
    COMMIT;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE RemovePlanFromRoom(
    IN p_room_id INT,
    IN p_plan_id INT
)
BEGIN
    UPDATE TemperaturePlan
    SET room_id = NULL
    WHERE plan_id = p_plan_id AND room_id = p_room_id;
    COMMIT;
END$$
DELIMITER ;






