import { describe, it, expect } from "vitest";
import { webhookPayloadSchema, normalizeWebhook } from "../src/lib/webhook-payload";

describe("webhook payload validation", () => {
  it("accepts the canonical N8N payload", () => {
    const res = webhookPayloadSchema.safeParse({
      tipo: "receita",
      valor: 700,
      categoria: "serviços",
      metodo_pagamento: null,
      descricao: "Recebimento de cliente",
      data: "2026-06-24",
      hora: "10:58:15",
      resposta_usuario: "Registrei sua receita de R$ 700!",
    });
    expect(res.success).toBe(true);
  });

  it("rejects an invalid tipo", () => {
    const res = webhookPayloadSchema.safeParse({ tipo: "outro", valor: 10 });
    expect(res.success).toBe(false);
  });

  it("allows a message-only payload (no transaction)", () => {
    const res = webhookPayloadSchema.safeParse({ conteudo: "oi", resposta_usuario: "olá!" });
    expect(res.success).toBe(true);
  });
});

describe("normalizeWebhook", () => {
  it("builds transaction + message rows from a financial payload", () => {
    const { transaction, message } = normalizeWebhook({
      tipo: "receita",
      valor: 700,
      categoria: "serviços",
      descricao: "Recebimento de cliente",
      data: "2026-06-24",
      hora: "10:58:15",
      resposta_usuario: "Registrei!",
    });
    expect(transaction).toMatchObject({ tipo: "receita", valor: 700, categoria: "serviços" });
    expect(message).toEqual({ conteudo: "Recebimento de cliente", resposta: "Registrei!" });
  });

  it("returns no transaction when tipo is absent", () => {
    const { transaction, message } = normalizeWebhook({ conteudo: "só uma pergunta", resposta_usuario: "resposta" });
    expect(transaction).toBeNull();
    expect(message).toEqual({ conteudo: "só uma pergunta", resposta: "resposta" });
  });

  it("coerces string amounts to numbers", () => {
    const { transaction } = normalizeWebhook({ tipo: "despesa", valor: "42,90" });
    expect(transaction?.valor).toBeCloseTo(42.9);
  });
});
