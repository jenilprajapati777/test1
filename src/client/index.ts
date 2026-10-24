import { DataClient } from "../types/client";
import { demoClient, DemoClient } from "./demoClient";
import { SupabaseDataClient } from "./supabaseClient";
import { APP_CONFIG } from "../lib/config";

let clientInstance: DataClient | null = null;

export function getClient(): DataClient {
  if (!clientInstance) {
    if (APP_CONFIG.isDemoMode) {
      clientInstance = demoClient;
    } else {
      clientInstance = new SupabaseDataClient();
    }
  }
  return clientInstance;
}

export { demoClient, DemoClient, SupabaseDataClient };
