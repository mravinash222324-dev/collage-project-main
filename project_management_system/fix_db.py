import sqlite3
import os

try:
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    
    # 1. Add status column
    try:
        print("Adding 'status' column...")
        cursor.execute("ALTER TABLE authentication_progressupdate ADD COLUMN status varchar(20) DEFAULT 'Pending'")
    except Exception as e:
        print(f"Status column error (maybe exists?): {e}")

    # 2. Add ai_analysis_result column
    try:
        print("Adding 'ai_analysis_result' column...")
        cursor.execute("ALTER TABLE authentication_progressupdate ADD COLUMN ai_analysis_result text")
    except Exception as e:
        print(f"AI Analysis column error (maybe exists?): {e}")

    conn.commit()
    print("Database patched successfully.")
    conn.close()

except Exception as e:
    print(f"Critical Error: {e}")
