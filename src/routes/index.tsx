import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Wallet, MessageCircle, BarChart3, ShieldCheck } from "lucide-react";

const SITE_URL = "https://juliusacessor.lovable.app";
const OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7795b07d-4ee5-44ff-8cfa-48b96d55ed94/id-preview-eda93b54--9fe4e0c9-238c-4bce-b86e-927181d57a3a.lovable.app-1782945797274.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Julius - Assessor financeiro pessoal no WhatsApp" },
      {
        name: "description",
        content:
          "Registre receitas e despesas conversando pelo WhatsApp e acompanhe tudo num painel claro e em tempo real. O Julius organiza suas finanças por você.",
      },
      { property: "og:title", content: "Julius - Assessor financeiro pessoal no WhatsApp" },
      {
        property: "og:description",
        content:
          "Converse pelo WhatsApp, o Julius organiza suas finanças em um painel claro e em tempo real.",
      },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Julius",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web, WhatsApp",
          description:
            "Assessor financeiro pessoal que registra receitas e despesas por conversa no WhatsApp e organiza tudo em um painel.",
        }),
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Registre pelo WhatsApp",
    text: "Mande uma mensagem e o Julius entende, categoriza e guarda o lançamento por você.",
  },
  {
    icon: BarChart3,
    title: "Painel em tempo real",
    text: "Veja receitas, despesas e saldos organizados num dashboard claro e preciso.",
  },
  {
    icon: ShieldCheck,
    title: "Seguro e privado",
    text: "Seus dados ficam protegidos, com cada conta isolada da outra.",
  },
];

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-accent/40">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">Julius</span>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4">
        <section className="flex flex-col items-center py-16 text-center sm:py-24">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Seu assessor financeiro pessoal, direto do WhatsApp
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Converse com o Julius para registrar cada receita e despesa. Ele organiza tudo num
            painel financeiro claro, preciso e em tempo real.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Começar agora</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/dashboard">Acessar painel</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 text-left shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-8 text-center text-xs text-muted-foreground">
        Feito com carinho e um pouquinho de inspiração no pai do Chris. 💸
      </footer>
    </div>
  );
}
