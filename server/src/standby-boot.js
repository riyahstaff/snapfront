// Runs before the server on the backup host (render.yaml: npm run start:render). On a copy
// (STANDBY=true) it fetches a fresh database from the main server and puts it in place; if the main
// server can't be reached, the last copy is used. Anywhere else it does nothing.
import { config } from "./config.js";
import { pullDb, restoreDb } from "./backup.js";

if (config.standby) {
  try {
    const bytes = await pullDb();
    console.log(`[standby] database copied from the main server (${Math.round(bytes / 1024)} KB)`);
  } catch (e) {
    console.warn(`[standby] couldn't copy the database (${e.message}); using the last copy`);
  }
  console.log(restoreDb() ? "[standby] database copy loaded" : "[standby] no database copy yet");
}
