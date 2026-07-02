import { createFileRoute } from "@tanstack/react-router";
import { webhookPayloadSchema, normalizeWebhook } from "@/lib/webhook-payload";

export const Route = createFileRoute("/api/public/webhook/$instance")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204 }),

      POST: async ({ request, params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: instance, error: instErr } = await supabaseAdmin
          .from("instances")
          .select("id, webhook_secret")
          .eq("nome_instancia", params.instance)
          .maybeSingle();

        if (instErr || !instance) {
          return Response.json({ error: "Instance not found" }, { status: 404 });
        }

        const provided =
          request.headers.get("x-webhook-secret") ||
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
          "";

        if (!provided || provided !== instance.webhook_secret) {
          return Response.json({ error: "Invalid webhook secret" }, { status: 401 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const parsed = webhookPayloadSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 422 });
        }

        const { transaction, message } = normalizeWebhook(parsed.data);
        const results: Record<string, unknown> = {};

        if (transaction) {
          const { data: tx, error: txErr } = await supabaseAdmin
            .from("transactions")
            .insert({ instance_id: instance.id, ...transaction })
            .select()
            .single();
          if (txErr) return Response.json({ error: txErr.message }, { status: 500 });
          results.transaction = tx.id;
        }

        if (message) {
          const { data: msg, error: msgErr } = await supabaseAdmin
            .from("messages")
            .insert({ instance_id: instance.id, ...message })
            .select()
            .single();
          if (msgErr) return Response.json({ error: msgErr.message }, { status: 500 });
          results.message = msg.id;
        }

        return Response.json({ ok: true, ...results });
      },
    },
  },
});
