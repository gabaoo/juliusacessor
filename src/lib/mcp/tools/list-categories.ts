import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_categories",
  title: "List categories",
  description: "List the signed-in user's transaction categories, optionally filtered by type.",
  inputSchema: {
    tipo: z
      .enum(["receita", "despesa"])
      .optional()
      .describe("Filter categories by type: 'receita' or 'despesa'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ tipo }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("categories")
      .select("id, nome, tipo, cor, icone")
      .order("nome", { ascending: true });
    if (tipo) query = query.eq("tipo", tipo);

    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: "Could not load categories." }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { categories: data ?? [] },
    };
  },
});
