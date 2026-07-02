import { createFileRoute } from "@tanstack/react-router";

// Internal automation-only endpoint. Lets a trusted server-to-server caller
// (e.g. an N8N flow) resolve an instance's webhook_secret from its name,
// avoiding manual copy/paste per instance. Protected by a master automation
// key (N8N_MASTER_KEY), never exposed in any UI.
export const Route = createFileRoute("/api/public/instance-config/$instance")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const masterKey = process.env.N8N_MASTER_KEY;
        if (!masterKey) {
          console.error("[instance-config] N8N_MASTER_KEY is not configured");
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const provided =
          request.headers.get("x-master-key") ||
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
          "";

        // Validate the master key before any read. Generic 401 with no detail.
        if (!provided || provided !== masterKey) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: instance, error } = await supabaseAdmin
          .from("instances")
          .select("id, webhook_secret")
          .eq("nome_instancia", params.instance)
          .maybeSingle();

        // Generic 404: no enumeration, no reason detail.
        if (error || !instance) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        return Response.json({
          instance_id: instance.id,
          webhook_secret: instance.webhook_secret,
        });
      },
    },
  },
});
