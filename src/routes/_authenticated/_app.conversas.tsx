import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useInstance } from "@/hooks/use-app-data";
import { useMessages } from "@/hooks/use-transactions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format";
import { MessagesSquare, Search, Bot, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/conversas")({
  head: () => ({
    meta: [
      { title: "Conversas — Julius" },
      { name: "description", content: "Histórico das mensagens trocadas com o Julius pelo WhatsApp." },
    ],
  }),
  component: Conversas,
});

function Conversas() {
  const { data: instance } = useInstance();
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data: messages = [], isLoading } = useMessages(instance?.id, search, from || undefined, to || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conversas</h1>
        <p className="text-sm text-muted-foreground">Mensagens trocadas com o Julius, em tempo real.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-1">
          <Label className="text-xs">De</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Até</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Palavra-chave..."
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando conversas...</p>
      ) : messages.length ? (
        <div className="space-y-4">
          {messages.map((m) => (
            <Card key={m.id}>
              <CardContent className="space-y-3 p-4">
                <div className="text-xs text-muted-foreground">{formatDateTime(m.created_at)}</div>
                {m.conteudo && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">{m.conteudo}</div>
                  </div>
                )}
                {m.resposta && (
                  <div className="flex flex-row-reverse gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl rounded-tr-sm bg-primary/10 px-4 py-2.5 text-sm">{m.resposta}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <MessagesSquare className="h-8 w-8 text-primary" />
            <p className="font-medium text-foreground">Silêncio total por aqui</p>
            <p className="max-w-sm text-sm">
              Quando você conversar com o Julius no WhatsApp, tudo aparece nesta tela automaticamente.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
