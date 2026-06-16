import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

// openDatabaseSync uses expo-sqlite's synchronous API, which drizzle wraps
// with prepareSync/executeSync so all queries are sync on the JS side.
// Internally expo-sqlite runs on a dedicated thread — safe for the UI.
const expo = SQLite.openDatabaseSync("adaptive-tutor.db");

export const db = drizzle(expo, { schema });
