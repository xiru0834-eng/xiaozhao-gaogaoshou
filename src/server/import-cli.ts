import { importProfile } from "./profile-migration.ts";
const args = process.argv.slice(2);
if (args.length !== 4 || args[0] !== "--source" || args[2] !== "--data-dir") {
  console.error(
    "Usage: npm run profile:import -- --source <absolute database> --data-dir <absolute empty profile>",
  );
  process.exitCode = 1;
} else {
  try {
    console.log(JSON.stringify(await importProfile(args[1], args[3]), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Import failed");
    process.exitCode = 1;
  }
}
