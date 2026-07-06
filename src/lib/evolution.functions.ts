import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { INSTANCE_NAME_REGEX, INSTANCE_NAME_ERROR } from "@/lib/instance-name";

const FIXED_WEBHOOK_URL = "https://webhook.dev.gabotics.com/webhook/meu-assessor";

function evoConfig() {
  const url = process.env.EVOLUTION_API_URL?.replace(/\/$/, "");
  const key = process.env.EVOLUTION_API_KEY;
  return { url, key, configured: Boolean(url && key) };
}

async function fetchWithTimeout(input: string, init: RequestInit = {}, ms = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface ProviderResult {
  qrcode: string | null;
  status: string;
  providerError: string | null;
}

/** Extract a base64 QR from the various shapes Evolution returns. */
function extractQr(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const qr = (p.qrcode ?? p.qr) as Record<string, unknown> | string | undefined;
  if (typeof qr === "string") return qr;
  if (qr && typeof qr === "object") {
    const base64 = qr.base64 ?? qr.code;
    if (typeof base64 === "string") return base64;
  }
  if (typeof p.base64 === "string") return p.base64;
  return null;
}

function mapState(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "disconnected";
  const p = payload as Record<string, unknown>;
  const state =
    (p.state as string) ||
    ((p.instance as Record<string, unknown>)?.state as string) ||
    "";
  if (state === "open") return "connected";
  if (state === "connecting" || state === "close") return "connecting";
  return "disconnected";
}

async function providerCreate(instanceName: string): Promise<ProviderResult> {
  const { url, key, configured } = evoConfig();
  if (!configured) {
    return { qrcode: null, status: "connecting", providerError: "provider_not_configured" };
  }
  try {
    const res = await fetchWithTimeout(`${url}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key! },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
        groupsIgnore: true,
        webhook: {
          url: FIXED_WEBHOOK_URL,
          base64: true,
          events: ["MESSAGES_UPSERT"],
        },
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Instance may already exist on the provider — try to fetch its QR via connect.
      return await providerConnect(instanceName);
    }
    return { qrcode: extractQr(json), status: "connecting", providerError: null };
  } catch (e) {
    return { qrcode: null, status: "connecting", providerError: (e as Error).message };
  }
}

async function providerConnect(instanceName: string): Promise<ProviderResult> {
  const { url, key, configured } = evoConfig();
  if (!configured) return { qrcode: null, status: "connecting", providerError: "provider_not_configured" };
  try {
    const res = await fetchWithTimeout(`${url}/instance/connect/${encodeURIComponent(instanceName)}`, {
      headers: { apikey: key! },
    });
    const json = await res.json().catch(() => ({}));
    return { qrcode: extractQr(json), status: "connecting", providerError: res.ok ? null : "connect_failed" };
  } catch (e) {
    return { qrcode: null, status: "connecting", providerError: (e as Error).message };
  }
}

async function providerState(instanceName: string): Promise<{ status: string; providerError: string | null }> {
  const { url, key, configured } = evoConfig();
  if (!configured) return { status: "connecting", providerError: "provider_not_configured" };
  try {
    const res = await fetchWithTimeout(`${url}/instance/connectionState/${encodeURIComponent(instanceName)}`, {
      headers: { apikey: key! },
    });
    const json = await res.json().catch(() => ({}));
    return { status: mapState(json), providerError: res.ok ? null : "state_failed" };
  } catch (e) {
    return { status: "disconnected", providerError: (e as Error).message };
  }
}

export const createInstance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { nome_instancia: string; whatsapp_number: string }) =>
    z
      .object({
        nome_instancia: z
          .string()
          .trim()
          .min(3, "Nome muito curto")
          .max(60)
          .regex(/^[a-zA-Z0-9_-]+$/, "Use apenas letras, números, - e _"),
        whatsapp_number: z.string().trim().min(8).max(20),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase.from("instances").select("id").eq("user_id", userId).maybeSingle();
    if (existing) throw new Error("Você já possui uma instância cadastrada.");

    const { data: inserted, error } = await supabase
      .from("instances")
      .insert({
        user_id: userId,
        nome_instancia: data.nome_instancia,
        whatsapp_number: data.whatsapp_number,
        status: "connecting",
      })
      .select()
      .single();
    if (error) {
      console.error("[createInstance] insert error:", error);
      throw new Error("Não foi possível criar a instância. Tente novamente.");
    }

    const provider = await providerCreate(data.nome_instancia);
    await supabase.from("instances").update({ status: provider.status }).eq("id", inserted.id);

    return { instance: inserted, qrcode: provider.qrcode, providerError: provider.providerError };
  });

export const refreshConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: instance } = await supabase.from("instances").select("*").eq("user_id", userId).maybeSingle();
    if (!instance) throw new Error("Nenhuma instância encontrada.");

    const state = await providerState(instance.nome_instancia);
    if (state.status !== instance.status) {
      await supabase.from("instances").update({ status: state.status }).eq("id", instance.id);
    }
    return { status: state.status, providerError: state.providerError };
  });

export const regenerateQr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: instance } = await supabase.from("instances").select("*").eq("user_id", userId).maybeSingle();
    if (!instance) throw new Error("Nenhuma instância encontrada.");

    const provider = await providerConnect(instance.nome_instancia);
    await supabase.from("instances").update({ status: "connecting" }).eq("id", instance.id);
    return { qrcode: provider.qrcode, providerError: provider.providerError };
  });
