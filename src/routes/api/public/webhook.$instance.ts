import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const payloadSchema = z.object({
  tipo: z.enum(["receita", "despesa"]).optional(),
  valor: z.union([z.number(), z.string()]).optional(),
  categoria: z.string().nullable().optional(),
  metodo_pagamento: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  data: z.string().nullable().optional(),
  hora: z.string().nullable().optional(),
  resposta_usuario: z.string().nullable().optional(),
  // Optional raw message content for the conversation log:
  mensagem: z.string().nullable().optional(),
  conteudo: z.string().nullable().optional(),
});

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^\d.,-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export const Route = createFileRoute("/api/public/webhook/$instance")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204 }),

      POST: async ({ request, params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Find instance by name
        const { data: instance, error: instErr } = await supabaseAdmin
          .from("instances")
          .select("id, webhook_secret")
          .eq("nome_instancia", params.instance)
          .maybeSingle();

        if (instErr || !instance) {
          return Response.json({ error: "Instance not found" }, { status: 404 });
        }

        // Validate secret (header or query param)
        const url = new URL(request.url);
        const provided =
          request.headers.get("x-webhook-secret") ||
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
          url.searchParams.get("secret") ||
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

        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 422 });
        }
        const p = parsed.data;

        const results: Record<string, unknown> = {};

        // Persist financial transaction when a type is present
        if (p.tipo) {
          const { data: tx, error: txErr } = await supabaseAdmin
            .from("transactions")
            .insert({
              instance_id: instance.id,
              tipo: p.tipo,
              valor: toNumber(p.valor),
              categoria: p.categoria ?? null,
              metodo_pagamento: p.metodo_pagamento ?? null,
              descricao: p.descricao ?? null,
              data: p.data || undefined,
              hora: p.hora ?? null,
              resposta_usuario: p.resposta_usuario ?? null,
            })
            .select()
            .single();
          if (txErr) return Response.json({ error: txErr.message }, { status: 500 });
          results.transaction = tx.id;
        }

        // Always log the conversation exchange
        const conteudo = p.conteudo ?? p.mensagem ?? p.descricao ?? null;
        if (conteudo || p.resposta_usuario) {
          const { data: msg, error: msgErr } = await supabaseAdmin
            .from("messages")
            .insert({
              instance_id: instance.id,
              conteudo,
              resposta: p.resposta_usuario ?? null,
            })
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
