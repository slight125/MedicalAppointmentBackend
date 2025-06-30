import { db } from "./config/db";
import { users, doctors } from "./models/schema";
import bcrypt from "bcrypt";

const seed = async () => {
  console.log("🚀 Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  await db.insert(users).values([
    {
      firstname: "Alice",
      lastname: "Otieno",
      email: "alice@example.com",
      password: hashedPassword,
      contact_phone: "0700123456",
      address: "Nairobi, KE",
      role: "user",
    },
    {
      firstname: "Dr. Brian",
      lastname: "Mutua",
      email: "brian@clinic.com",
      password: hashedPassword,
      contact_phone: "0700987654",
      address: "Kisumu",
      role: "doctor",
    },
    {
      firstname: "Admin",
      lastname: "Mugo",
      email: "admin@hospital.com",
      password: hashedPassword,
      contact_phone: "0711002200",
      address: "Thika",
      role: "admin",
    },
  ]);

  await db.insert(doctors).values([
    {
      first_name: "Brian",
      last_name: "Mutua",
      specialization: "General Practitioner",
      contact_phone: "0700987654",
      available_days: "Monday, Wednesday, Friday",
    },
    {
      first_name: "Grace",
      last_name: "Njeri",
      specialization: "Pediatrics",
      contact_phone: "0700111222",
      available_days: "Tuesday, Thursday",
    },
  ]);

  console.log("✅ Seed complete!");
  process.exit();
};

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
