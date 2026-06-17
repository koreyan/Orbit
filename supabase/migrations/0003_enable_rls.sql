-- 1. z_knowledge_base 테이블 RLS 활성화 및 조회 권한 설정
ALTER TABLE public.z_knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.z_knowledge_base;
CREATE POLICY "Enable read access for all users" ON public.z_knowledge_base
FOR SELECT USING (true);


-- 2. users 테이블 RLS 활성화 및 본인 데이터 접근 정책 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for owners" ON public.users;
CREATE POLICY "Allow select for owners" ON public.users
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow update for owners" ON public.users;
CREATE POLICY "Allow update for owners" ON public.users
FOR UPDATE USING (auth.uid() = id);


-- 3. orders 테이블 RLS 활성화 및 본인 주문 접근 정책 설정
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for owners" ON public.orders;
CREATE POLICY "Allow select for owners" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert for owners" ON public.orders;
CREATE POLICY "Allow insert for owners" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update for owners" ON public.orders;
CREATE POLICY "Allow update for owners" ON public.orders
FOR UPDATE USING (auth.uid() = user_id);


-- 4. payments 테이블 RLS 활성화 및 본인 결제 조회 정책 설정
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for owners" ON public.payments;
CREATE POLICY "Allow select for owners" ON public.payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()
  )
);


-- 5. reports 테이블 RLS 강제 활성화 및 정책 설정 (0002 마이그레이션 정책 보강)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_policy" ON public.reports;
CREATE POLICY "reports_select_policy" ON public.reports
FOR SELECT USING (
  is_public = true OR 
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = reports.order_id AND orders.user_id = auth.uid()
  )
);
