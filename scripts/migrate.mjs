import fs from "fs";
import path from "path";
import pg from "pg";

const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error("Error: SUPABASE_DB_URL environment variable is not defined.");
  console.error(
    "Usage: SUPABASE_DB_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres npm run db:migrate",
  );
  process.exit(1);
}

const migrationsDir = path.resolve("supabase/migrations");
if (!fs.existsSync(migrationsDir)) {
  console.error(`Error: Migrations directory not found at ${migrationsDir}`);
  process.exit(1);
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("No migration files found to apply.");
  process.exit(0);
}

async function run() {
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log(
      "Connected to database at:",
      dbUrl.replace(/:[^:@]+@/, ":****@"),
    );

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`Applying migration: ${file}...`);
      const sql = fs.readFileSync(filePath, "utf-8");
      await client.query(sql);
      console.log(`Successfully applied: ${file}`);
    }

    console.log("All migrations applied successfully.");
  } catch (err) {
    console.error("Migration failed with error:", err.message || err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

run();
