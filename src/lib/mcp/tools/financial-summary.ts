import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { computeTotals, groupByCategory, type TxLike } from "@/lib/finance";

export default defineTool({
  name: "financial_summary",
  title: "Financial summary",
  description:
    "Summarize the signed-in user's finances: total income, expenses, balance, and top expense categories for an optional date range.",
  inputSchema: {
    from: z.string().optional().describe("Start date (inclusive), format YYYY-MM-DD."),
    to: z.string().optional().describe("End date (inclusive), format YYYY-MM-DD."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("transactions")
      .select("tipo, valor, categoria, descricao, data");
    if (from) query = query.gte("data", from);
    if (to) query = query.lte("data", to);

    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: "Could not load summary." }], isError: true };
    }
    const txns = (data ?? []) as TxLike[];
    const totals = computeTotals(txns);
    const topExpenses = groupByCategory(txns, "despesa").slice(0, 5);
    const summary = { ...totals, topExpenses, count: txns.length };
    return {
      content: [{ type: "text", text: JSON.stringify(summary) }],
      structuredContent: summary,
    };
  },
});
