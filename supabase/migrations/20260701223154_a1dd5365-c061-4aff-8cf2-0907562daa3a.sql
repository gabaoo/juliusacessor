
-- Profiles table (mirrors auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  theme TEXT NOT NULL DEFAULT 'system',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Instances: the link to the N8N/Evolution WhatsApp instance
CREATE TABLE public.instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_instancia TEXT NOT NULL UNIQUE,
  whatsapp_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  webhook_secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instances TO authenticated;
GRANT ALL ON public.instances TO service_role;
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own instances" ON public.instances FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Helper: does the current user own this instance?
CREATE OR REPLACE FUNCTION public.owns_instance(_instance_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.instances WHERE id = _instance_id AND user_id = auth.uid());
$$;

-- Categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#6366f1',
  icone TEXT NOT NULL DEFAULT 'tag',
  tipo TEXT NOT NULL DEFAULT 'despesa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transactions
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  categoria TEXT,
  metodo_pagamento TEXT,
  descricao TEXT,
  data DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  hora TIME,
  resposta_usuario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own transactions" ON public.transactions FOR SELECT USING (public.owns_instance(instance_id));
CREATE POLICY "Users insert own transactions" ON public.transactions FOR INSERT WITH CHECK (public.owns_instance(instance_id));
CREATE POLICY "Users update own transactions" ON public.transactions FOR UPDATE USING (public.owns_instance(instance_id)) WITH CHECK (public.owns_instance(instance_id));
CREATE POLICY "Users delete own transactions" ON public.transactions FOR DELETE USING (public.owns_instance(instance_id));

-- Messages (raw WhatsApp conversation log)
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  conteudo TEXT,
  resposta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own messages" ON public.messages FOR SELECT USING (public.owns_instance(instance_id));
CREATE POLICY "Users insert own messages" ON public.messages FOR INSERT WITH CHECK (public.owns_instance(instance_id));
CREATE POLICY "Users delete own messages" ON public.messages FOR DELETE USING (public.owns_instance(instance_id));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_instances_updated BEFORE UPDATE ON public.instances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_transactions_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default categories on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.categories (user_id, nome, cor, icone, tipo) VALUES
    (NEW.id, 'Alimentação', '#f97316', 'utensils', 'despesa'),
    (NEW.id, 'Transporte', '#0ea5e9', 'car', 'despesa'),
    (NEW.id, 'Moradia', '#8b5cf6', 'home', 'despesa'),
    (NEW.id, 'Lazer', '#ec4899', 'gamepad-2', 'despesa'),
    (NEW.id, 'Saúde', '#ef4444', 'heart-pulse', 'despesa'),
    (NEW.id, 'Compras', '#eab308', 'shopping-bag', 'despesa'),
    (NEW.id, 'Serviços', '#14b8a6', 'wrench', 'receita'),
    (NEW.id, 'Salário', '#22c55e', 'wallet', 'receita'),
    (NEW.id, 'Investimentos', '#3b82f6', 'trending-up', 'receita'),
    (NEW.id, 'Outros', '#64748b', 'tag', 'despesa');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.instances REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.instances;

-- Indexes
CREATE INDEX idx_transactions_instance ON public.transactions(instance_id);
CREATE INDEX idx_transactions_data ON public.transactions(data);
CREATE INDEX idx_messages_instance ON public.messages(instance_id);
