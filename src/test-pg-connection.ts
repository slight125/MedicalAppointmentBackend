import { Pool } from "pg";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config({ override: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    console.log('Loaded DATABASE_URL:', process.env.DATABASE_URL);
    console.log("Testing database connection...");
    const result = await pool.query('SELECT current_database() as db, current_user as user, inet_server_addr() as host');
    console.log("Raw result:", result);
    if (result.rows && result.rows.length > 0) {
      console.log("Connected to:", result.rows[0]);
    } else {
      console.log("Query ran, but no rows returned.");
    }
  } catch (err) {
    console.error("Connection test failed:", err);
  } finally {
    await pool.end();
    process.exit();
  }
})(); 