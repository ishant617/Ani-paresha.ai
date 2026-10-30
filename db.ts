import fs from 'fs/promises';
import path from 'path';

// Define the shape of our local JSON database
export interface DatabaseSchema {
  users: Record<string, {
    name: string;
    agents: any[];
    scorecards: Record<string, any>;
    failureModes: any[];
    versionHistory: any[];
    testScenarios: any[];
    traces: Record<string, any>;
    taskCategoriesReliability: any[];
    versionReleases: any[];
    regressionAlerts: any[];
  }>;
}

const DB_PATH = path.join(process.cwd(), 'local_db.json');

let dbCache: DatabaseSchema | null = null;

export async function getDb(): Promise<DatabaseSchema> {
  if (dbCache) return dbCache;
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    dbCache = JSON.parse(data);
    return dbCache!;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      // If DB doesn't exist, we'll initialize it later.
      dbCache = { users: {} };
      return dbCache;
    }
    throw err;
  }
}

export async function saveDb(db: DatabaseSchema) {
  dbCache = db;
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

