import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_transactions",
  title: "List transactions",
  description:
    "List the signed-in user's financial transactions (receitas/despesas), optionally filtered by type and date range.",
  inputSchema: {
    tipo: z
      .enum(["receita", "despesa"])
      .optional()
      .describe("Filter by transaction type: 'receita' (income) or 'despesa' (expense)."),
    from: z.string().optional().describe("Start date (inclusive), format YYYY-MM-DD."),
    to: z.string().optional().describe("End date (inclusive), format YYYY-MM-DD."),
    limit: z.number().int().optional().describe("Max rows to return (default 50, max 200)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ tipo, from, to, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const max = Math.min(Math.max(limit ?? 50, 1), 200);
    let query = supabaseForUser(ctx)
      .from("transactions")
      .select("id, tipo, valor, categoria, descricao, data, hora, metodo_pagamento")
      .order("data", { ascending: false })
      .limit(max);
    if (tipo) query = query.eq("tipo", tipo);
    if (from) query = query.gte("data", from);
    if (to) query = query.lte("data", to);

    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: "Could not load transactions." }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { transactions: data ?? [] },
    };
  },
});
