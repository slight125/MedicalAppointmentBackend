import { db } from "./src/config/db.js";

async function addPaidColumn() {
  try {
    console.log("🔧 Adding 'paid' column to appointments table...");
    
    // Add the paid column
    await db.execute(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE
    `);
    
    // Update existing records
    await db.execute(`
      UPDATE appointments 
      SET paid = FALSE 
      WHERE paid IS NULL
    `);
    
    console.log("✅ Successfully added 'paid' column to appointments table");
    console.log("✅ Updated existing appointments to paid = false");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

addPaidColumn();
