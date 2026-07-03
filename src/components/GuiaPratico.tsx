import { useInstance, useCategories } from "@/hooks/use-app-data";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  LayoutDashboard,
  Tag,
  AlertCircle,
  Wifi,
  ChevronRight,
} from "lucide-react";

/** Formata um número de WhatsApp para exibição amigável */
function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "seu número cadastrado";
  // Remove tudo que não for dígito
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13) {
    // +55 (xx) 9xxxx-xxxx
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return raw;
}

/** Balão de mensagem estilo WhatsApp */
function MessageBubble({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative ml-4 rounded-2xl rounded-tl-sm bg-[#dcf8c6] px-4 py-2.5 text-sm text-gray-800 shadow-sm dark:bg-[#005c4b] dark:text-gray-100 max-w-full",
        className,
      )}
    >
      {/* Tail do balão */}
      <span className="absolute -left-2 top-0 h-4 w-4 overflow-hidden">
        <span className="block h-4 w-4 rounded-br-full bg-[#dcf8c6] dark:bg-[#005c4b]" />
      </span>
      {children}
    </div>
  );
}

/** Título de seção com ícone */
function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b pb-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <h2 className="text-sm font-semibold text-foreground">{children}</h2>
    </div>
  );
}

interface GuiaPraticoProps {
  /** Quando fornecido, exibe um botão de ação no final (ex: "Ir para o Dashboard") */
  onAction?: () => void;
  /** Label do botão de ação */
  actionLabel?: string;
}

export function GuiaPratico({ onAction, actionLabel = "Ir para o Dashboard" }: GuiaPraticoProps) {
  const { data: instance } = useInstance();
  const { data: categories = [] } = useCategories();

  const phone = formatPhone(instance?.whatsapp_number);

  // Separa categorias por tipo
  const catDespesa = categories.filter((c) => c.tipo === "despesa").map((c) => c.nome);
  const catReceita = categories.filter((c) => c.tipo === "receita").map((c) => c.nome);

  const PAYMENT_METHODS = [
    "Pix",
    "Cartão de débito",
    "Cartão de crédito",
    "Dinheiro",
    "Boleto",
    "Transferência",
  ];

  return (
    <div className="flex flex-col gap-8 px-1 pb-4">

      {/* ── Seção 1: Como registrar ─────────────────────── */}
      <section className="space-y-3">
        <SectionTitle icon={MessageCircle}>Como registrar uma despesa ou receita</SectionTitle>
        <p className="text-sm text-muted-foreground">
          Nenhum formulário, nenhuma digitação no painel. Todo lançamento nasce de uma{" "}
          <strong className="text-foreground">mensagem de texto no WhatsApp</strong> é como anotar numa conversa
          com você mesmo.
        </p>
        <div className="rounded-xl border bg-muted/40 p-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground mb-2">Como fazer:</p>
          <ol className="space-y-1.5 text-sm list-none">
            {[
              "Abra o WhatsApp no celular",
              `Encontre o contato do seu próprio número: ${phone}`,
              "Mande uma mensagem descrevendo o lançamento",
              "O Julius processa e registra automaticamente ✨",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Seção 2: Exemplos de mensagens ──────────────── */}
      <section className="space-y-3">
        <SectionTitle icon={MessageCircle}>Exemplos de mensagens que funcionam</SectionTitle>
        <p className="text-sm text-muted-foreground">
          Quanto mais detalhes você der, mais organizado fica no dashboard. Mas mensagens curtas também
          funcionam a IA infere o que puder.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">💸 Despesas</p>
          {[
            "Gastei 45 reais hoje com almoço, categoria alimentação, cartão de débito",
            "Paguei 120 de conta de luz, categoria moradia, boleto",
            "Gastei 35 no uber", // exemplo simplificado
            "Comprei tênis por 280 reais, cartão de crédito",
          ].map((msg, i) => (
            <MessageBubble key={i}>{msg}</MessageBubble>
          ))}
        </div>

        <div className="space-y-2 mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">💰 Receitas</p>
          {[
            "Recebi 700 de um cliente hoje, categoria serviços, via Pix",
            "Entrada de 2500 de salário, categoria salário",
            "Recebi 150 de freela de design",
          ].map((msg, i) => (
            <MessageBubble key={i}>{msg}</MessageBubble>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">💡 Dica:</strong> Mensagens simples como{" "}
          <em>"gastei 20 no uber"</em> funcionam o Julius tenta inferir categoria e método automaticamente.
          Mas citar os dois explicitamente garante dados mais limpos nos filtros e gráficos.
        </div>
      </section>

      {/* ── Seção 3: Categorias e formas de pagamento ───── */}
      <section className="space-y-3">
        <SectionTitle icon={Tag}>Categorias e formas de pagamento</SectionTitle>
        <p className="text-sm text-muted-foreground">
          Quando você cita a <strong className="text-foreground">categoria</strong> e o{" "}
          <strong className="text-foreground">método de pagamento</strong> na mensagem, esses dados aparecem
          direto nos filtros e gráficos do Dashboard sem precisar editar depois.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Categorias de despesa */}
          {catDespesa.length > 0 && (
            <div className="rounded-xl border bg-expense/5 p-3">
              <p className="mb-2 text-xs font-medium text-expense">📂 Categorias de despesa</p>
              <div className="flex flex-wrap gap-1.5">
                {catDespesa.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-expense/20 bg-expense/10 px-2 py-0.5 text-xs text-expense"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Categorias de receita */}
          {catReceita.length > 0 && (
            <div className="rounded-xl border bg-income/5 p-3">
              <p className="mb-2 text-xs font-medium text-income">📂 Categorias de receita</p>
              <div className="flex flex-wrap gap-1.5">
                {catReceita.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-income/20 bg-income/10 px-2 py-0.5 text-xs text-income"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {catDespesa.length === 0 && catReceita.length === 0 && (
            <p className="col-span-2 text-xs text-muted-foreground">
              Nenhuma categoria cadastrada ainda. Crie em{" "}
              <strong className="text-foreground">Configurações → Categorias</strong>.
            </p>
          )}
        </div>

        {/* Formas de pagamento */}
        <div className="rounded-xl border bg-muted/40 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">💳 Formas de pagamento reconhecidas</p>
          <div className="flex flex-wrap gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <span
                key={m}
                className="rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Seção 4: Corrigir erros ──────────────────────── */}
      <section className="space-y-3">
        <SectionTitle icon={AlertCircle}>O que fazer se algo for registrado errado</SectionTitle>
        <p className="text-sm text-muted-foreground">
          Nada é permanente. Na tela de{" "}
          <strong className="text-foreground">Financeiro</strong>, você vê todos os lançamentos e pode{" "}
          <strong className="text-foreground">editar</strong> ou{" "}
          <strong className="text-foreground">excluir</strong> qualquer um deles manualmente sem depender do
          WhatsApp.
        </p>
        <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-3 text-sm">
          <LayoutDashboard className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            Menu → <strong className="text-foreground">Financeiro</strong> → clique no lápis para editar ou na
            lixeira para excluir
          </span>
        </div>
      </section>

      {/* ── Seção 5: Status da conexão ───────────────────── */}
      <section className="space-y-3">
        <SectionTitle icon={Wifi}>Status da conexão com o WhatsApp</SectionTitle>
        <p className="text-sm text-muted-foreground">
          O Julius só processa mensagens enquanto o WhatsApp estiver conectado. Se parar de funcionar:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Veja o indicador na parte inferior da barra lateral (verde = conectado)",
            "Acesse Configurações → Integração para verificar o status",
            'Clique em "Reconectar (novo QR)" e escaneie novamente',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Botão de ação final (opcional) ──────────────── */}
      {onAction && (
        <div className="pt-2">
          <Button className="w-full" size="lg" onClick={onAction}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Wrapper com ScrollArea — usado tanto no modal pós-conexão quanto no Sheet de ajuda */
export function GuiaPraticoScrollable(props: GuiaPraticoProps) {
  return (
    <ScrollArea className="h-full">
      <div className="px-1 py-2">
        <GuiaPratico {...props} />
      </div>
    </ScrollArea>
  );
}
