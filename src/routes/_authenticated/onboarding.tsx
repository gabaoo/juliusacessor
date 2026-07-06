import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createInstance } from "@/lib/evolution.functions";
import { useInstance } from "@/hooks/use-app-data";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Wallet, ShieldCheck } from "lucide-react";
import { sanitizeInstanceName, validateInstanceName } from "@/lib/instance-name";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: instance, isLoading } = useInstance();
  const create = useServerFn(createInstance);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);
  const [nomeError, setNomeError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && instance) navigate({ to: "/conectar" });
  }, [isLoading, instance, navigate]);

  function handleNomeChange(value: string) {
    const sanitized = sanitizeInstanceName(value);
    setNome(sanitized);
    setNomeError(sanitized.length > 0 ? validateInstanceName(sanitized) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nomeErr = validateInstanceName(nome);
    if (nomeErr) {
      setNomeError(nomeErr);
      toast.error(nomeErr);
      return;
    }
    if (!/^\d{8,20}$/.test(whatsapp)) {
      toast.error("O número de WhatsApp deve conter apenas dígitos (DDI + DDD + número).");
      return;
    }
    setSaving(true);
    try {
      const res = await create({ data: { nome_instancia: nome.trim(), whatsapp_number: whatsapp.trim() } });
      if (res.qrcode) sessionStorage.setItem("julius-qr", res.qrcode);
      if (res.providerError === "provider_not_configured") {
        toast.warning("Instância criada. Configure as credenciais da Evolution API na tela de Integração para gerar o QR Code.");
      } else {
        toast.success("Instância criada! Vamos conectar seu WhatsApp.");
      }
      await qc.invalidateQueries({ queryKey: ["instance"] });
      navigate({ to: "/conectar" });
    } catch (err) {
      toast.error((err as Error).message || "Não consegui criar a instância.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/40 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Wallet className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Vamos configurar o Julius</h1>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Como diria o pai do Chris: cada centavo conta. Primeiro, conecte sua instância do WhatsApp.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuração inicial</CardTitle>
            <CardDescription>
              Esses dados vinculam sua conta à instância do WhatsApp e{" "}
              <strong>não podem ser alterados depois</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da instância</Label>
                <Input
                  id="nome"
                  required
                  value={nome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  placeholder="meu-assessor"
                  aria-invalid={!!nomeError}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {nomeError ? (
                  <p className="text-xs text-destructive">{nomeError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Apenas letras sem acento, números e hífens. Espaços e acentos são convertidos
                    automaticamente.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">Número de WhatsApp</Label>
                <Input
                  id="whatsapp"
                  required
                  inputMode="numeric"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                  placeholder="5511999999999"
                />
                <p className="text-xs text-muted-foreground">Com DDI e DDD, apenas números.</p>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  Esses campos são imutáveis porque representam o vínculo com a instância no provedor
                  (Evolution API / N8N).
                </span>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar instância e conectar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
