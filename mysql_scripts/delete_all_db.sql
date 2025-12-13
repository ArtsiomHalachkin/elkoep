USE inels_air_db;
CALL UpdateDevice(12313123, 1, 'RFTC8','1', Null,Null,Null,Null,Null,Null);

	
call GetRoomAccounts(17);
CALL GetAllTemperaturePlans();
call GetAllTemperaturePlanSlots(5);

USE inels_air_db;
DELETE FROM temperatureplan;

DELETE FROM Room_Device;
DELETE FROM Account_Room;
DELETE FROM Device;
DELETE FROM Account;
DELETE FROM Room;
SET SQL_SAFE_UPDATES = 1;