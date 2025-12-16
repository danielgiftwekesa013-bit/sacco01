export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

const CRON_NAME = "daily_savings_fine_job";

export default {
  /**
   * Manual testing endpoint (via curl)
   * Only runs when hitting /run
   */
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname !== "/run") {
      return new Response("Not Found", { status: 404 });
    }

    try {
      await runCron(env);
      return new Response(
        JSON.stringify({ success: true, mode: "manual" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },

  /**
   * Scheduled cron handler
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(runCron(env));
  },
};

async function runCron(env: Env): Promise<void> {
  const headers = {
    "Content-Type": "application/json",
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
  };

  try {
    /**
     * 1️⃣ Call your Postgres function
     */
    const rpcRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/rpc/apply_daily_savings_fines`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      }
    );

    if (!rpcRes.ok) {
      const errorText = await rpcRes.text();
      throw new Error(errorText);
    }

    /**
     * 2️⃣ Log success
     */
    await logActivity(env, {
      cron_job_name: CRON_NAME,
      activity_type: "apply_fines",
      related_table: "deductions",
      details: { message: "Daily savings fines applied successfully" },
      status: "success",
    });

    console.log("✅ Daily savings fines applied successfully");
  } catch (error: any) {
    console.error("❌ Fine cron failed:", error.message);

    /**
     * 3️⃣ Log failure
     */
    await logActivity(env, {
      cron_job_name: CRON_NAME,
      activity_type: "apply_fines",
      details: { error: error.message },
      status: "failed",
    });

    throw error;
  }
}

/**
 * Activity logger
 */
async function logActivity(
  env: Env,
  payload: {
    cron_job_name: string;
    activity_type: string;
    related_table?: string;
    related_id?: string;
    details?: any;
    status: "success" | "failed" | "partial";
  }
) {
  await fetch(`${env.SUPABASE_URL}/rest/v1/activity_logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
}
