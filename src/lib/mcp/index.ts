import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTransactions from "./tools/list-transactions";
import financialSummary from "./tools/financial-summary";
import listCategories from "./tools/list-categories";

// The OAuth issuer MUST be the direct Supabase host. On publish, SUPABASE_URL is
// rewritten to the .lovable.cloud proxy, which mcp-js rejects (issuer mismatch).
// The project ref survives publish unchanged; VITE_SUPABASE_PROJECT_ID is inlined
// by Vite at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "julius-mcp",
  title: "Julius Finance MCP",
  version: "0.1.0",
  instructions:
    "Tools for Julius, a personal finance assistant. Use `financial_summary` for totals and top expenses, `list_transactions` to browse receitas/despesas, and `list_categories` to see the user's categories. All data is scoped to the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [financialSummary, listTransactions, listCategories],
});
