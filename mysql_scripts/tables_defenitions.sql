USE inels_air_db;

CREATE TABLE Account (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    description VARCHAR(100),
    enable BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

CREATE TABLE Room (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE Account_Room (
    account_id INT NOT NULL,
    room_id INT NOT NULL,
    PRIMARY KEY (account_id, room_id),
    CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES Account(account_id) ON DELETE CASCADE,
    CONSTRAINT fk_room FOREIGN KEY (room_id) REFERENCES Room(room_id) ON DELETE CASCADE
) ENGINE=InnoDB;



CREATE TABLE RFTC8_Device (
    device_id INT AUTO_INCREMENT PRIMARY KEY,
    dev_eui BIGINT NOT NULL UNIQUE,
    description VARCHAR(100),
    room_id INT UNIQUE NULL, 
    CONSTRAINT fk_rftc8_room FOREIGN KEY (room_id) REFERENCES Room(room_id) ON DELETE SET NULL
) ENGINE=InnoDB;



CREATE TABLE RFATV8_Device (
    device_id INT AUTO_INCREMENT PRIMARY KEY,
    dev_eui BIGINT NOT NULL UNIQUE,
    description VARCHAR(100),
    heating ENUM('Enabled', 'Disabled - valve closed', 'Disabled - valve open'),
    refresh_interval DECIMAL(5,2),
    temperature_hysteresis DECIMAL(5,2),
    freezing_temperature DECIMAL(5,2),
    window_sensitivity DECIMAL(5,2),
    window_time DECIMAL(5,2),
    room_id INT NULL,
    CONSTRAINT fk_rfatv_room FOREIGN KEY (room_id) REFERENCES Room(room_id) ON DELETE SET NULL,
    CHECK (
        (heating = 'Enabled' AND refresh_interval IS NOT NULL AND temperature_hysteresis IS NOT NULL)
        OR heating IN ('Disabled - valve closed', 'Disabled - valve open')
    )
) ENGINE=InnoDB;


CREATE TABLE TemperaturePlan (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT UNIQUE NULL,  
    name VARCHAR(50) NOT NULL,
    description VARCHAR(100),
    min_temp DECIMAL(5,2) NOT NULL,
    attenuation_temp DECIMAL(5,2)NOT NULL,
    normal_temp DECIMAL(5,2)NOT NULL,
    comfort_temp DECIMAL(5,2)NOT NULL,
    CONSTRAINT fk_plan_room FOREIGN KEY (room_id) REFERENCES Room(room_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE TemperaturePlanSlot (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    day_of_week ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type ENUM('Minimum','Attenuation','Normal','Comfort') NOT NULL,
    CONSTRAINT fk_slot_plan FOREIGN KEY (plan_id) REFERENCES TemperaturePlan(plan_id) ON DELETE CASCADE,
    CONSTRAINT chk_time CHECK (start_time < end_time)
) ENGINE=InnoDB;





