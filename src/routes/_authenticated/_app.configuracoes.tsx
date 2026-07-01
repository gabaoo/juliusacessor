import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProfile, useCategories, type Category } from "@/hooks/use-app-data";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/configuracoes")({
  component: Configuracoes,
});

const CURRENCIES = ["BRL", "USD", "EUR", "GBP"];
const TIMEZONES = ["America/Sao_Paulo", "America/New_York", "Europe/London", "Europe/Lisbon", "UTC"];

function Configuracoes() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { data: categories = [] } = useCategories();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setCurrency(profile.currency ?? "BRL");
      setTimezone(profile.timezone ?? "America/Sao_Paulo");
    }
  }, [profile]);

  async function saveProfile() {
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name, currency, timezone })
      .eq("id", profile!.id);
    if (error) return toast.error(error.message);
    toast.success("Preferências salvas.");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Ajuste sua conta, aparência e categorias.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conta</CardTitle>
          <CardDescription>Dados da sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={profile?.email ?? ""} readOnly disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Moeda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fuso horário</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={saveProfile}>
            <Save className="mr-2 h-4 w-4" /> Salvar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aparência</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Tema escuro</p>
            <p className="text-sm text-muted-foreground">Alterna entre claro e escuro.</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
        </CardContent>
      </Card>

      <CategoriesManager categories={categories} userId={profile?.id} />
    </div>
  );
}

function CategoriesManager({ categories, userId }: { categories: Category[]; userId?: string }) {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [newTipo, setNewTipo] = useState("despesa");

  async function addCategory() {
    if (!newName.trim() || !userId) return;
    const { error } = await supabase.from("categories").insert({
      user_id: userId,
      nome: newName.trim(),
      cor: newColor,
      tipo: newTipo,
    });
    if (error) return toast.error(error.message);
    setNewName("");
    toast.success("Categoria criada.");
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  async function updateCategory(id: string, patch: Partial<Category>) {
    const { error } = await supabase.from("categories").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  async function deleteCategory(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Categoria removida.");
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Categorias</CardTitle>
        <CardDescription>Crie, renomeie e defina cores.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Nova categoria</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome" className="w-44" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cor</Label>
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={newTipo} onValueChange={setNewTipo}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addCategory}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </div>

        <div className="divide-y rounded-lg border">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <input
                type="color"
                value={c.cor}
                onChange={(e) => updateCategory(c.id, { cor: e.target.value })}
                className="h-7 w-9 cursor-pointer rounded border"
              />
              <Input
                defaultValue={c.nome}
                onBlur={(e) => e.target.value !== c.nome && updateCategory(c.id, { nome: e.target.value })}
                className="max-w-xs"
              />
              <Select value={c.tipo} onValueChange={(v) => updateCategory(c.id, { tipo: v })}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="ml-auto" onClick={() => deleteCategory(c.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
