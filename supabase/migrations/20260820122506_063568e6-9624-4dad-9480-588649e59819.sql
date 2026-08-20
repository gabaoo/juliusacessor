-- 1. Orçamentos
CREATE TABLE public.orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria text NOT NULL,
  valor_limite numeric NOT NULL DEFAULT 0,
  recorrente boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, categoria)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamentos TO authenticated;
GRANT ALL ON public.orcamentos TO service_role;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own orcamentos" ON public.orcamentos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_orcamentos_updated BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Origem nas transações
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'whatsapp';

-- 3. Lançamentos recorrentes
CREATE TABLE public.lancamentos_recorrentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'despesa',
  valor numeric NOT NULL DEFAULT 0,
  categoria text,
  metodo_pagamento text,
  descricao text,
  dia_do_mes integer NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  ultimo_mes_gerado date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos_recorrentes TO authenticated;
GRANT ALL ON public.lancamentos_recorrentes TO service_role;
ALTER TABLE public.lancamentos_recorrentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recorrentes" ON public.lancamentos_recorrentes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_recorrentes_updated BEFORE UPDATE ON public.lancamentos_recorrentes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_recorrente()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.dia_do_mes < 1 OR NEW.dia_do_mes > 28 THEN
    RAISE EXCEPTION 'dia_do_mes deve estar entre 1 e 28';
  END IF;
  IF NEW.tipo NOT IN ('receita','despesa') THEN
    RAISE EXCEPTION 'tipo invalido';
  END IF;
  IF NEW.valor < 0 THEN
    RAISE EXCEPTION 'valor invalido';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_recorrentes_validate BEFORE INSERT OR UPDATE ON public.lancamentos_recorrentes
  FOR EACH ROW EXECUTE FUNCTION public.validate_recorrente();

-- 4. Metas de economia
CREATE TABLE public.metas_economia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  valor_alvo numeric NOT NULL DEFAULT 0,
  valor_atual numeric NOT NULL DEFAULT 0,
  data_alvo date,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas_economia TO authenticated;
GRANT ALL ON public.metas_economia TO service_role;
ALTER TABLE public.metas_economia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own metas" ON public.metas_economia FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_metas_updated BEFORE UPDATE ON public.metas_economia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Geração automática de recorrentes
CREATE OR REPLACE FUNCTION public.gerar_lancamentos_recorrentes()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  mes_atual date := date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo'))::date;
  criados integer := 0;
  alvo date;
BEGIN
  FOR r IN SELECT * FROM public.lancamentos_recorrentes
           WHERE ativo = true
             AND (ultimo_mes_gerado IS NULL OR ultimo_mes_gerado < mes_atual)
  LOOP
    alvo := mes_atual + (LEAST(r.dia_do_mes, 28) - 1);
    IF alvo <= hoje THEN
      INSERT INTO public.transactions (instance_id, tipo, valor, categoria, metodo_pagamento, descricao, data, origem)
      VALUES (r.instance_id, r.tipo, r.valor, r.categoria, r.metodo_pagamento, r.descricao, alvo, 'recorrente');
      UPDATE public.lancamentos_recorrentes SET ultimo_mes_gerado = mes_atual WHERE id = r.id;
      criados := criados + 1;
    END IF;
  END LOOP;
  RETURN criados;
END; $$;
GRANT EXECUTE ON FUNCTION public.gerar_lancamentos_recorrentes() TO authenticated, service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('gerar-lancamentos-recorrentes', '10 3 * * *', $$SELECT public.gerar_lancamentos_recorrentes();$$);

-- 6. Visão mensal por categoria (insights)
CREATE VIEW public.v_resumo_mensal_categoria WITH (security_invoker = true) AS
SELECT
  t.instance_id,
  date_trunc('month', t.data)::date AS mes,
  t.tipo,
  COALESCE(NULLIF(btrim(t.categoria), ''), 'Sem categoria') AS categoria,
  SUM(t.valor)::numeric AS total,
  COUNT(*)::bigint AS qtd
FROM public.transactions t
GROUP BY 1,2,3,4;
GRANT SELECT ON public.v_resumo_mensal_categoria TO authenticated;
GRANT ALL ON public.v_resumo_mensal_categoria TO service_role;