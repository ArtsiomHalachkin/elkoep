CREATE DATABASE inels_air_db;

CREATE USER 'artsiom'@'%' IDENTIFIED BY '3841036Art@';
GRANT ALL PRIVILEGES ON inels_air_db.* TO 'artsiom'@'%';
FLUSH PRIVILEGES;

