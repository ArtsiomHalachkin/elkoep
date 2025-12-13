from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException, Body
import pymysql  # Keep for MySQLError and cursors
import aiomysql  # The async library
from fastapi.staticfiles import StaticFiles
import os
from dotenv import dotenv_values
from datetime import datetime, timedelta


# --- ---------------- --- 
# ---  CONFIGURATION ---
# --- ---------------- ---

config = dotenv_values(".env")

DB_HOST = config.get("DATABASE_HOST")
DB_USER = config.get("DATABASE_USER")
DB_PASS = config.get("DATABASE_PASSWORD")
DB_NAME = config.get("DATABASE_NAME")
DB_PORT = int(config.get("DATABASE_PORT", 3306)) 

if not all([DB_HOST, DB_USER, DB_PASS, DB_NAME]):
    print("FATAL ERROR: Database configuration is missing from .env file.")


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "../inels_air_v2")

app = FastAPI(title="Inels Air API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# --- ---------------- --- 
# ---   HELPERS       ---
# --- ---------------- ---

def process_rfatv8_settings(settings: dict) -> dict:
    """
    Ensures that if heating is disabled, all dependent fields are None.
    """
    if not settings:
        return {}

    heating = settings.get("heating")
    disabled_values = ["Disabled - valve closed", "Disabled - valve open"]

    if heating in disabled_values:
        return {
            "heating": heating,
            "refresh_interval": None,
            "temperature_hysteresis": None,
            "freezing_temperature": None,
            "window_sensitivity": None,
            "window_time": None,
        }
    
    return settings

def convert_string_to_time(start_time: str, end_time: str) -> tuple:
    """
    Converts a string in "HH:MM" format to a time object.
    """
    try:
        start_time_obj = datetime.strptime(start_time, "%H:%M").time()
        end_time_obj = datetime.strptime(end_time, "%H:%M").time() 
    except ValueError:
        return None, None
    return start_time_obj, end_time_obj


def seconds_to_hhmm(td: int) -> str:

    total_seconds = int(td.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    return f"{hours:02d}:{minutes:02d}"


# --- ------------------------- ---
# ---   DATABASE CONNECTION ---
# --- ------------------------- ---

async def get_connection():
    """
    Creates a new async database connection.
    This replaces your original synchronous get_connection().
    """
    try:
        conn = await aiomysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS,
            db=DB_NAME,
            autocommit=False, 
            cursorclass=aiomysql.cursors.DictCursor 
        )
        return conn
    except pymysql.MySQLError as err:
        print(f"Failed to connect to database: {err}")
        raise HTTPException(status_code=500, detail="Database connection error")


@app.get("/")
async def test():
    return {"message": "Welcome to the Inels Air API"}

# --- ---------------- --- 
# --- ROOM ENDPOINTS ---
# --- ---------------- ---

@app.delete("/room/{room_id}/device/{dev_type}/{dev_eui}")
async def remove_device_from_room(room_id: int, dev_type: str, dev_eui: int):
    
    conn = await get_connection() 

    try:
        async with conn.cursor() as cursor: 
            
            await cursor.execute("CALL RemoveDeviceFromRoom(%s, %s, %s)", (room_id, dev_eui, dev_type)) 
            await conn.commit() 
                
        return {"message": "Room device removing completed"}

    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.delete("/room/{room_id}/account/{account_id}")
async def remove_account_from_room(room_id: int, account_id: int):
    conn = await get_connection() 

    try:
        async with conn.cursor() as cursor: 
                
            await cursor.execute("CALL RemoveAccountFromRoom(%s, %s)", (room_id, account_id)) 
            await conn.commit() 

        return {"message": "Room account removing completed"}

    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.delete("/room/{room_id}/plan/{plan_id}")
async def remove_plan_from_room(room_id: int, plan_id: int):

    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            
            await cursor.execute("CALL RemovePlanFromRoom(%s, %s)", (room_id, plan_id)) 
            await conn.commit() 

        return {"message": "Room plan removing completed"}

    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()   

@app.post("/room/setup/add/{room_id}")
async def assign_room_entities(room_id: int, payload: dict):
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            
            for account_id in payload.get("account_id", []):
                await cursor.execute("CALL AssignRoomAccounts(%s, %s)", (room_id, account_id)) 

            if payload.get("plan_id"):
                await cursor.execute("CALL AssignRoomPlan(%s, %s)", (room_id, payload["plan_id"])) 
            
            if payload.get("rftc8_dev_eui"):
                await cursor.execute("CALL AssignRoomThermostat(%s, %s)", (room_id, payload["rftc8_dev_eui"])) 

            for dev_eui in payload.get("rfatv8_dev_eui", []):
                await cursor.execute("CALL AssignRoomValve(%s, %s)", (room_id, dev_eui)) 
        
            await conn.commit() 
        return {"message": "Room setup completed"}

    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.get("/room/{room_id}/devices")
async def get_room_devices(room_id: int):
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL GetRoomDevices(%s)", (room_id,)) 
            devices = await cursor.fetchall() 
        return {"devices": devices}

    except pymysql.MySQLError as err:
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.get("/room/{room_id}/accounts")
async def get_room_accounts(room_id: int):
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL GetRoomAccounts(%s)", (room_id,)) 
            accounts = await cursor.fetchall() 
        return {"accounts": accounts}

    except pymysql.MySQLError as err:
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.get("/room/{room_id}/temp-plan")
async def get_room_temp_plan(room_id: int):
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL GetRoomTemperaturePlan(%s)", (room_id,)) 
            plan = await cursor.fetchall() 
            
        return {"plan": plan[0] if plan else None}

    except pymysql.MySQLError as err:
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.post("/room/add")
async def add_room(payload: dict):
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL AddRoom(%s, %s)", 
                             (payload.get("name", ""),
                              payload.get("description", ""),)
                                   )
            await conn.commit() 
        return {"message": "Room added successfully"}
    
    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=500, detail=str(err))
        
    finally:
        conn.close()

# Removed duplicate add_setup_to_room endpoint

@app.delete("/room/delete/{room_id}")
async def delete_room(room_id: int): 
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL DeleteRoom(%s)", 
                             (int(room_id),)
                                   )
            await conn.commit() 
        return {"message": "Room deleted successfully"}
    
    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))
        
    finally:
        conn.close()

@app.put("/room/update/{room_id}")
async def update_room(room_id: int, payload: dict): 
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL UpdateRoom(%s, %s, %s)", 
                             (
                             int(room_id), 
                             payload.get("name", ""), 
                             payload.get("description", ""),
                             )
                           )
            await conn.commit() 
        return {"message": "Room updated successfully"}
    
    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))
        
    finally:
        conn.close()

@app.get("/room/details/{room_id}")
async def get_room_by_id(room_id: int) : 

    conn = await get_connection() 

    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL GetRoomById(%s)", ( 
                int(room_id),
            ))
            rows = await cursor.fetchall() 
            if not rows:
                raise HTTPException(status_code=404, detail="Room not found")
        return {"room": rows[0]}
    
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.get("/room/setup/{room_id}")
async def get_room_setup(room_id: int) : 

    conn = await get_connection() 

    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL GetRoomSetup(%s)", ( 
                int(room_id),
            ))
            rows = await cursor.fetchall() 
            if not rows:
                raise HTTPException(status_code=404, detail="Room setup not found")
        return {"room": rows[0]}
    
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.get("/room/all")
async def get_all_rooms() :

    conn = await get_connection() 

    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL GetAllRooms()") 
            rows = await cursor.fetchall() 
        return {"rooms": rows}
    
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

# --- ------------------------------- --- 
# --- TEMPERATURE PLAN ENDPOINTS ---
# --- ------------------------------- ---

@app.put("/temp-plan/update/{plan_id}")
async def update_plan(plan_id: int, payload: dict): 
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            
            settings = payload.get("settings", {})
            slots = payload.get("plan", []) 

            

            print("Received settings for update:", settings)
            print("Received slots for update:", slots)



            await cursor.execute( 
                "CALL UpdateTemperaturePlan(%s, %s, %s, %s, %s, %s, %s)",
                (
                    int(plan_id),
                    settings.get("name"),
                    settings.get("description", ""),
                    settings.get("min_temp", None),
                    settings.get("attenuation_temp", None),
                    settings.get("normal_temp", None),
                    settings.get("comfort_temp", None),
                ),
            )


            await cursor.execute("CALL DeleteAllTemperaturePlanSlotsByPlanId(%s)", (int(plan_id),))

            

            if slots:
                for slot in slots:
                    await cursor.execute( 
                        "CALL AddTemperaturePlanSlot(%s, %s, %s, %s, %s)",
                        (
                            int(plan_id),
                            slot.get("day"),
                            slot.get("start_time"),
                            slot.get("end_time"),
                            slot.get("mode").capitalize(),
                        ),
                    )
            
            await conn.commit() 
                
        return {"message": "Temperature plan and all slots updated successfully"}

    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.delete("/temp-plan/slot/delete/{slot_id}")
async def delete_plan_slot(slot_id: int): 
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
              await cursor.execute( 
                "CALL DeleteTemperaturePlanSlot(%s)",
                (
                    int(slot_id),
                ),
            )
        await conn.commit() 

    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.get("/temp-plan/all")
async def get_all_plans():
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL GetAllTemperaturePlans()") 
            rows = await cursor.fetchall() 
        return {"plans": rows}
    
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.delete("/temp-plan/delete/{plan_id}")
async def delete_plan(plan_id: int):
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL DeleteTemperaturePlan(%s)", (plan_id,)) 
            await conn.commit() 
        return {"message": "Temperature plan deleted successfully"}
    
    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.get("/temp-plan/{plan_id}")
async def get_temp_plan_by_id(plan_id: int):
    conn = await get_connection() 
    try:
        response = {}
        async with conn.cursor() as cursor: 
            
            await cursor.execute("CALL GetTemperaturePlanById(%s)", (plan_id,)) 
            plan = await cursor.fetchone() 
            if not plan:
                raise HTTPException(status_code=404, detail="Temperature plan not found")
            response["plan"] = plan

            await cursor.execute("CALL GetTemperatureSlotsByPlan(%s)", (plan_id,)) 
            slots = await cursor.fetchall() 

            for slot in slots:
                # Assuming seconds_to_hhmm is a sync helper
                slot["start_time"] = seconds_to_hhmm(slot["start_time"])
                slot["end_time"] = seconds_to_hhmm(slot["end_time"])
            response["slots"] = slots
            
        return response
    
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.post("/temp-plan/add")
async def add_temp_plan(payload: dict):
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            
            settings = payload.get("settings", {})
            slots = payload.get("plan", [])  

            print("Received settings:", settings)
            print("Received slots:", slots)

            await cursor.execute( 
                "CALL AddTemperaturePlan(%s, %s, %s, %s, %s, %s, %s)",
                (
                    settings.get("room_id", None),
                    settings.get("name"),
                    settings.get("description", ""),
                    settings.get("min_temp", None),
                    settings.get("attenuation_temp", None),
                    settings.get("normal_temp", None),
                    settings.get("comfort_temp", None),
                ),
            )
            await cursor.execute("CALL GetLastTemperaturePlanId();") 
            last_result = await cursor.fetchone() 
            if not last_result or "plan_id" not in last_result:
                 raise HTTPException(status_code=500, detail="Could not retrieve new plan ID")
            last = last_result["plan_id"]


            print("Last inserted plan ID:", last )

            for slot in slots:
                print("Inserting slot:", slot)
                #start_time_obj, end_time_obj = convert_string_to_time(slot.get("start_time"), slot.get("end_time"))
                await cursor.execute( 
                    "CALL AddTemperaturePlanSlot(%s, %s, %s, %s, %s)",
                    (
                        int(last),
                        slot.get("day"),
                        slot.get("start_time"),
                        slot.get("end_time"),
                        slot.get("mode").capitalize(),
                    ),
                )
            await conn.commit() 

        return {"message": "Temperature plan and all slots added successfully"}

    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

# --- -------------------- --- 
# --- DEVICE ENDPOINTS ---
# --- -------------------- ---

@app.get("/device/eui/{dev_eui}")
async def get_device_by_dev_eui(dev_eui: str):
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL GetDeviceByDevEUI(%s)", (dev_eui,)) 
            device = await cursor.fetchone() 

        if not device:
            raise HTTPException(status_code=404, detail="Device not found")

        return {"device": device}

    except pymysql.MySQLError as err:
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.get("/device/all")
async def get_all_devices():
    
    conn = await get_connection() 

    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL GetAllDevices()") 
            rows = await cursor.fetchall() 
        return {"devices": rows}
    
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()    

@app.delete("/device/delete/{device_type}/{dev_eui}")
async def delete_device(device_type: str, dev_eui: str):
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL DeleteDevice(%s, %s)", (device_type, dev_eui)) 
            await conn.commit() 
        return {"message": "Device deleted successfully"}

    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))

    finally:
        conn.close()

@app.post("/device/add")
async def add_device(payload: dict):
    device = payload.get("device")
    rfatv8 = payload.get("rfatv8_settings", {})

    conn = await get_connection() 

    try:
        async with conn.cursor() as cursor: 
            if device["device_type"] == "RFTC8":
                
                await cursor.execute( 
                    "CALL AddDevice(%s, %s, %s, NULL, NULL, NULL, NULL, NULL, NULL)",
                    (
                        device["dev_eui"],
                        device["device_type"],
                        device.get("description", "")
                    )
                )
            elif device["device_type"] == "RFATV8":
                
                await cursor.execute( 
                    "CALL AddDevice(%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (
                        device["dev_eui"],
                        device["device_type"],
                        device.get("description", ""),
                        rfatv8.get("heating"),
                        rfatv8.get("refresh_interval"),
                        rfatv8.get("temperature_hysteresis"),
                        rfatv8.get("freezing_temperature"),
                        rfatv8.get("window_sensitivity"),
                        rfatv8.get("window_time")
                    )
                )
            else:
                raise HTTPException(status_code=400, detail="Unknown device type")
            
            await conn.commit() 
        return {"message": "Device added successfully"}

    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.put("/device/update/{device_type}/{origin_dev_eui}")
async def update_device(
    device_type: str,
    origin_dev_eui: str,
    payload: dict
):
    conn = await get_connection() 

    try:
        async with conn.cursor() as cursor: 
            if device_type == "RFTC8":
                deviceRFTC8 = payload.get("device", {})
                await cursor.execute( 
                    "CALL UpdateDevice(%s, %s, %s, %s, NULL, NULL, NULL, NULL, NULL, NULL)",
                    (
                        origin_dev_eui,
                        deviceRFTC8.get("dev_eui", origin_dev_eui),
                        device_type,
                        deviceRFTC8.get("description", None),
                    )
                )
            elif device_type == "RFATV8":
                deviceRFATV8 = payload.get("device", {})
                deviceRFATV8Settings = payload.get("rfatv8_settings", {})

                deviceRFATV8Settings = process_rfatv8_settings(deviceRFATV8Settings)

                await cursor.execute( 
                    "CALL UpdateDevice(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (
                        origin_dev_eui,
                        deviceRFATV8.get("dev_eui", origin_dev_eui),
                        device_type,
                        deviceRFATV8.get("description", None),
                        deviceRFATV8Settings.get("heating", None),
                        deviceRFATV8Settings.get("refresh_interval", None),
                        deviceRFATV8Settings.get("temperature_hysteresis", None),
                        deviceRFATV8Settings.get("freezing_temperature", None),
                        deviceRFATV8Settings.get("window_sensitivity", None),
                        deviceRFATV8Settings.get("window_time", None),
                    )
                )
            else:
                raise HTTPException(status_code=400, detail="Invalid device type")
            
            await conn.commit() 
        return {"message": "Device updated successfully"}

    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))

    finally:
        conn.close()

# --- --------------------- --- 
# --- ACCOUNT ENDPOINTS ---
# --- --------------------- ---

@app.get("/account/username/{username}")
async def get_account_by_username(username: str):
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL GetAccountByUsername(%s)", (username,)) 
            result = await cursor.fetchall() 
            if not result:
                raise HTTPException(status_code=404, detail="Account not found")
        return {"account": result[0]}
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.post("/account/add")
async def add_account(payload: dict):
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL AddAccount(%s, %s, %s, %s)", 
                             (payload["username"], 
                              payload["password"],
                              payload.get("description", ""),
                              payload.get("enable", False))   )
            await conn.commit() 
        return {"message": "Account added successfully"}
    
    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))
        
    finally:
        conn.close()

@app.get("/account/all")
async def get_all_accounts() :
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL GetAllAccounts()") 
            rows = await cursor.fetchall() 
        return {"accounts": rows}
    
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

# Removed the duplicate add_account function

@app.delete("/account/delete/{username}")
async def delete_account(username: str):
    conn = await get_connection() 
    try:
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL DeleteAccount(%s)", (username,)) 
            await conn.commit() 
        return {"message": f"Account '{username}' deleted successfully"}
    
    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()

@app.put("/account/update/{username}")
async def update_account(username: str, payload: dict):
    conn = await get_connection() 
    try:    
        async with conn.cursor() as cursor: 
            await cursor.execute("CALL UpdateAccount(%s,%s,%s,%s,%s)", 
                             (username,
                              payload["username"],
                              payload["password"],
                              payload.get("description", ""),
                              payload.get("enable", False)                       
                              ))
            await conn.commit() 
        return {"message": f"Account '{username}' updated successfully"}
    
    except pymysql.MySQLError as err:
        await conn.rollback() 
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        conn.close()