import { z } from "zod";
import { parseValor } from "./finance";

export const webhookPayloadSchema = z.object({
  tipo: z.enum(["receita", "despesa"]).optional(),
  valor: z.union([z.number(), z.string().max(50)]).optional(),
  categoria: z.string().max(100).nullable().optional(),
  metodo_pagamento: z.string().max(100).nullable().optional(),
  descricao: z.string().max(500).nullable().optional(),
  data: z.string().max(50).nullable().optional(),
  hora: z.string().max(50).nullable().optional(),
  resposta_usuario: z.string().max(2000).nullable().optional(),
  mensagem: z.string().max(2000).nullable().optional(),
  conteudo: z.string().max(2000).nullable().optional(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

export interface NormalizedWebhook {
  transaction: {
    tipo: string;
    valor: number;
    categoria: string | null;
    metodo_pagamento: string | null;
    descricao: string | null;
    data: string | undefined;
    hora: string | null;
    resposta_usuario: string | null;
  } | null;
  message: { conteudo: string | null; resposta: string | null } | null;
}

/** Turn a validated payload into DB-ready transaction/message rows. */
export function normalizeWebhook(p: WebhookPayload): NormalizedWebhook {
  const transaction = p.tipo
    ? {
        tipo: p.tipo,
        valor: parseValor(p.valor),
        categoria: p.categoria ?? null,
        metodo_pagamento: p.metodo_pagamento ?? null,
        descricao: p.descricao ?? null,
        data: p.data || undefined,
        hora: p.hora ?? null,
        resposta_usuario: p.resposta_usuario ?? null,
      }
    : null;

  const conteudo = p.conteudo ?? p.mensagem ?? p.descricao ?? null;
  const message = conteudo || p.resposta_usuario ? { conteudo, resposta: p.resposta_usuario ?? null } : null;

  return { transaction, message };
}
