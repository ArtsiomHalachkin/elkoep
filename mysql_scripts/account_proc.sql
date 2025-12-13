DELIMITER $$
CREATE PROCEDURE AddAccount(
    IN p_username VARCHAR(50),
    IN p_password VARCHAR(100),
    IN p_description VARCHAR(100),
    IN p_enable BOOLEAN
)
BEGIN
    IF EXISTS (SELECT 1 FROM Account WHERE username = p_username) THEN
        SIGNAL SQLSTATE '45000'
			SET MESSAGE_TEXT = 'Username already exists';
    ELSE
        INSERT INTO Account (username, password, description, enable)
        VALUES (p_username, p_password, p_description, p_enable);
        	COMMIT;
    END IF;
END$$
DELIMITER $$

DELIMITER $$
CREATE PROCEDURE GetAccountByUsername(IN p_username VARCHAR(50))
BEGIN
    SELECT 
        account_id,
        username,
        password,
        description,
        enable
    FROM Account
    WHERE username = p_username;
END$$
DELIMITER $$


DELIMITER $$
CREATE PROCEDURE GetAllAccounts()
BEGIN
    SELECT * FROM Account;
END$$
DELIMITER $$


DELIMITER $$
CREATE PROCEDURE DeleteAccount(IN p_username VARCHAR(50))
BEGIN
IF EXISTS (SELECT 1 FROM Account WHERE username = p_username) THEN
    DELETE FROM Account WHERE username = p_username;
    COMMIT;
ELSE
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Username for deleting not found';
END IF;
END$$
DELIMITER $$


DELIMITER $$
CREATE PROCEDURE UpdateAccount(
    IN p_old_username VARCHAR(50),
    IN p_new_username VARCHAR(50),
    IN p_password VARCHAR(100),
    IN p_description VARCHAR(100),
    IN p_enable BOOLEAN
)
BEGIN
IF EXISTS (SELECT 1 FROM Account WHERE username = p_old_username) THEN
    UPDATE Account
    SET 
        username = p_new_username,
        password = p_password,
        description = p_description,
        enable = p_enable
    WHERE username = p_old_username;
    COMMIT;
ELSE
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Username for updating not found';
END IF;
END$$
DELIMITER $$




