import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { refreshConnection, regenerateQr } from "@/lib/evolution.functions";
import { useInstance, signOutClean } from "@/hooks/use-app-data";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, RefreshCw, CheckCircle2, Smartphone, LogOut } from "lucide-react";
import { GuiaPraticoScrollable } from "@/components/GuiaPratico";

export const Route = createFileRoute("/_authenticated/conectar")({
  component: Conectar,
});

function Conectar() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: instance, isLoading } = useInstance();
  const refresh = useServerFn(refreshConnection);
  const regen = useServerFn(regenerateQr);
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState("connecting");
  const [regenLoading, setRegenLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !instance) navigate({ to: "/onboarding" });
  }, [isLoading, instance, navigate]);

  useEffect(() => {
    const stored = sessionStorage.getItem("julius-qr");
    if (stored) setQr(stored);
  }, []);

  useEffect(() => {
    if (instance?.status === "connected") setStatus("connected");
  }, [instance?.status]);

  const poll = useCallback(async () => {
    try {
      const res = await refresh({});
      setStatus(res.status);
      if (res.status === "connected") {
        sessionStorage.removeItem("julius-qr");
        await qc.invalidateQueries({ queryKey: ["instance"] });
      }
    } catch {
      /* silent poll error */
    }
  }, [refresh, qc]);

  useEffect(() => {
    if (status === "connected") return;
    const id = setInterval(poll, 4000);
    return () => clearInterval(id);
  }, [status, poll]);

  async function handleRegen() {
    setRegenLoading(true);
    try {
      const res = await regen({});
      if (res.qrcode) {
        setQr(res.qrcode);
        sessionStorage.setItem("julius-qr", res.qrcode);
        toast.success("Novo QR Code gerado.");
      } else if (res.providerError === "provider_not_configured") {
        toast.warning("Configure as credenciais da Evolution API na tela de Integração.");
      } else {
        toast.error("Não consegui gerar o QR Code agora.");
      }
    } finally {
      setRegenLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-accent/40 px-4 py-10">
      <div className={`w-full transition-all duration-300 ${status === "connected" ? "max-w-2xl" : "max-w-md"}`}>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Conecte seu WhatsApp</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Instância <span className="font-medium text-foreground">{instance?.nome_instancia}</span>
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-5 py-8">
            {status === "connected" ? (
              <div className="w-full space-y-5">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                    <CheckCircle2 className="h-9 w-9 text-success" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">Tudo certo! 🎉</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Seu WhatsApp está conectado ao Julius. Veja abaixo como começar a usar.
                    </p>
                  </div>
                </div>
                <div className="h-[60vh] overflow-hidden rounded-xl border bg-card">
                  <GuiaPraticoScrollable
                    onAction={() => navigate({ to: "/dashboard" })}
                    actionLabel="Ir para o Dashboard"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex h-64 w-64 items-center justify-center overflow-hidden rounded-xl border bg-white p-2">
                  {qr ? (
                    <img
                      src={qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`}
                      alt="QR Code para conectar o WhatsApp"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 px-4 text-center text-muted-foreground">
                      <Smartphone className="h-10 w-10" />
                      <p className="text-sm">
                        QR Code indisponível. Verifique as credenciais da Evolution API em Integração e gere um novo.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Escaneie para conectar — aguardando leitura...
                </div>

                <p className="max-w-xs text-center text-xs text-muted-foreground">
                  Abra o WhatsApp → Aparelhos conectados → Conectar um aparelho, e aponte para o código.
                </p>

                <Button variant="outline" className="w-full" onClick={handleRegen} disabled={regenLoading}>
                  {regenLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Gerar novo QR Code
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => signOutClean(navigate)}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
