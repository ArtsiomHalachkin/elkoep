DELIMITER $$
CREATE PROCEDURE GetAllDevices()
BEGIN
    SELECT 
        d.device_id,
        d.dev_eui,
        'RFTC8' AS device_type,
        d.description,
        d.room_id,
        NULL AS heating,
        NULL AS refresh_interval,
        NULL AS temperature_hysteresis,
        NULL AS freezing_temperature,
        NULL AS window_sensitivity,
        NULL AS window_time
    FROM RFTC8_Device d

    UNION ALL

    SELECT 
        d.device_id,
        d.dev_eui,
        'RFATV8' AS device_type,
        d.description,
        d.room_id,
        d.heating,
        d.refresh_interval,
        d.temperature_hysteresis,
        d.freezing_temperature,
        d.window_sensitivity,
        d.window_time
    FROM RFATV8_Device d;
END$$
DELIMITER ;


DELIMITER $$
CREATE PROCEDURE AddDevice(
    IN p_dev_eui BIGINT,
    IN p_device_type ENUM('RFTC8','RFATV8'),
    IN p_description VARCHAR(100),
    IN p_heating ENUM('Enabled','Disabled - valve closed','Disabled - valve open'),
    IN p_refresh_interval DECIMAL(5,2),
    IN p_temperature_hysteresis DECIMAL(5,2),
    IN p_freezing_temperature DECIMAL(5,2),
    IN p_window_sensitivity DECIMAL(5,2),
    IN p_window_time DECIMAL(5,2)
)
BEGIN
    IF p_device_type = 'RFTC8' THEN
        INSERT INTO RFTC8_Device(dev_eui, description)
        VALUES(p_dev_eui, p_description);
		COMMIT;
    ELSEIF p_device_type = 'RFATV8' THEN
        INSERT INTO RFATV8_Device(
            dev_eui, description, heating, refresh_interval, temperature_hysteresis, 
            freezing_temperature, window_sensitivity, window_time
        )
        VALUES(
            p_dev_eui, p_description, p_heating, p_refresh_interval, p_temperature_hysteresis,
            p_freezing_temperature, p_window_sensitivity, p_window_time
        );
        COMMIT;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE DeleteDevice(
	IN p_deviceType ENUM('RFTC8', 'RFATV8'), 
	IN p_devEUI BIGINT)
BEGIN
    IF p_deviceType = 'RFTC8' THEN
        DELETE FROM RFTC8_Device WHERE dev_eui = p_devEUI;
        COMMIT;
    ELSEIF p_deviceType = 'RFATV8' THEN
        DELETE FROM RFATV8_Device WHERE dev_eui = p_devEUI;
        COMMIT;
    END IF;
END$$
DELIMITER ;


DELIMITER $$
CREATE PROCEDURE UpdateDevice(
    IN p_origin_dev_eui BIGINT,
    IN p_new_dev_eui BIGINT,
    IN p_device_type ENUM('RFTC8','RFATV8'),
    IN p_description VARCHAR(100),
    IN p_heating ENUM('Enabled','Disabled - valve closed','Disabled - valve open'),
    IN p_refresh_interval DECIMAL(5,2),
    IN p_temperature_hysteresis DECIMAL(5,2),
    IN p_freezing_temperature DECIMAL(5,2),
    IN p_window_sensitivity DECIMAL(5,2),
    IN p_window_time DECIMAL(5,2)
)
BEGIN
    IF p_device_type = 'RFTC8' THEN
        UPDATE RFTC8_Device
        SET 
            dev_eui = p_new_dev_eui,
            description = p_description
        WHERE dev_eui = p_origin_dev_eui;
        COMMIT;

    ELSEIF p_device_type = 'RFATV8' THEN
        UPDATE RFATV8_Device
        SET 
            dev_eui = p_new_dev_eui,
            description = p_description,
            heating = p_heating,
            refresh_interval = p_refresh_interval,
            temperature_hysteresis = p_temperature_hysteresis,
            freezing_temperature = p_freezing_temperature,
            window_sensitivity = p_window_sensitivity,
            window_time = p_window_time
        WHERE dev_eui = p_origin_dev_eui;
        COMMIT;
    END IF;
END$$
DELIMITER ;

DELIMITER $$

CREATE PROCEDURE GetDeviceByDevEUI(IN p_dev_eui BIGINT)
BEGIN

    IF EXISTS (SELECT 1 FROM RFTC8_Device WHERE dev_eui = p_dev_eui) THEN
        SELECT 
            'RFTC8' AS device_type,
            device_id,
            dev_eui,
            description,
            room_id,
            NULL AS heating,
            NULL AS refresh_interval,
            NULL AS temperature_hysteresis,
            NULL AS freezing_temperature,
            NULL AS window_sensitivity,
            NULL AS window_time
        FROM RFTC8_Device
        WHERE dev_eui = p_dev_eui;

    ELSEIF EXISTS (SELECT 1 FROM RFATV8_Device WHERE dev_eui = p_dev_eui) THEN
        SELECT 
            'RFATV8' AS device_type,
            device_id,
            dev_eui,
            description,
            room_id,
            heating,
            refresh_interval,
            temperature_hysteresis,
            freezing_temperature,
            window_sensitivity,
            window_time
        FROM RFATV8_Device
        WHERE dev_eui = p_dev_eui;
        
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Device with specified dev_eui not found.';
    END IF;
END$$
DELIMITER ;



