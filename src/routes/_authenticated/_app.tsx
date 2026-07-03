import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useInstance, useProfile, signOutClean } from "@/hooks/use-app-data";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  MessagesSquare,
  Wallet,
  Settings,
  Moon,
  Sun,
  LogOut,
  Loader2,
  Menu,
  HelpCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { GuiaPraticoScrollable } from "@/components/GuiaPratico";

export const Route = createFileRoute("/_authenticated/_app")({
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/conversas", label: "Conversas", icon: MessagesSquare },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function AppLayout() {
  const navigate = useNavigate();
  const { data: instance, isLoading } = useInstance();
  const { data: profile } = useProfile();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isLoading && !instance) {
      navigate({ to: "/onboarding" });
    }
  }, [isLoading, instance, navigate]);

  if (isLoading || !instance) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">O Julius está separando os papéis...</p>
        </div>
      </div>
    );
  }

  const connected = instance.status === "connected";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none">Julius</p>
            <p className="text-xs text-sidebar-foreground/60">assessor financeiro</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="mb-3 flex items-center gap-2 text-xs">
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                connected ? "bg-success" : "bg-muted-foreground/50",
              )}
            />
            <span className="text-sidebar-foreground/70">
              {connected ? "WhatsApp conectado" : "WhatsApp desconectado"}
            </span>
          </div>
          <div className="mb-3 truncate text-sm font-medium">{profile?.display_name ?? "Você"}</div>
          <div className="flex gap-2">
            {/* Botão de ajuda */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setHelpOpen(true)}
              aria-label="Guia prático de uso"
              title="Guia prático de uso"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" aria-label="Alternar tema" className="flex-1 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={toggle}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Sair da conta"
              className="flex-1 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => signOutClean(navigate)}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" aria-label="Abrir menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold">Julius</span>
          {/* Botão de ajuda no header mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setHelpOpen(true)}
            aria-label="Guia prático de uso"
            title="Guia prático de uso"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      {/* Sheet de ajuda */}
      <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-lg">
          <SheetHeader className="shrink-0 border-b px-6 py-4">
            <SheetTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="h-4 w-4 text-primary" />
              Guia prático de uso
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden px-6 py-4">
            <GuiaPraticoScrollable />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
