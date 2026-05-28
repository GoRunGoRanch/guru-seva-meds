import { createServiceClient } from "@/lib/supabase/server";
import { FALLBACK_TZ } from "@/lib/timezones";

export { FALLBACK_TZ, COMMON_TIMEZONES } from "@/lib/timezones";

export async function getCurrentTimezone(): Promise<string> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "current_timezone")
    .maybeSingle();
  return data?.value || FALLBACK_TZ;
}
