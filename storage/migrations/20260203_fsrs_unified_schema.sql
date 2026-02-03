-- [FSRS 통합 DB 구축 마이그레이션]
-- 실행 방법: 아래 코드를 전체 복사하여 Supabase SQL Editor에 붙여넣고 실행하세요.

-- 1. 통합 학습 기록 테이블 생성 (learning_records)
CREATE TABLE IF NOT EXISTS public.learning_records (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_id uuid NOT NULL,
    item_type text NOT NULL CHECK (item_type IN ('kana', 'vocabulary', 'grammar')),
    
    stability float DEFAULT 0.0 NOT NULL,
    difficulty float DEFAULT 0.0 NOT NULL,
    elapsed_days float DEFAULT 0.0 NOT NULL,
    scheduled_days float DEFAULT 0.0 NOT NULL,
    lapses int DEFAULT 0 NOT NULL,
    state int DEFAULT 0 NOT NULL, -- 0:New, 1:Learning, 2:Review, 3:Relearning
    
    last_review_at timestamptz,
    next_review_at timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,

    UNIQUE(user_id, item_id, item_type)
);

-- 2. SRS 로그 테이블 생성 (srs_logs)
CREATE TABLE IF NOT EXISTS public.srs_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_id uuid NOT NULL,
    rating int NOT NULL, -- 1:Again, 2:Hard, 3:Good, 4:Easy
    
    stability float NOT NULL,
    difficulty float NOT NULL,
    elapsed_days float NOT NULL,
    scheduled_days float NOT NULL,
    
    review_at timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_learning_records_due ON public.learning_records(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_srs_logs_history ON public.srs_logs(user_id, item_id);

-- 4. RLS(Row Level Security) 설정
ALTER TABLE public.learning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.srs_logs ENABLE ROW LEVEL SECURITY;

-- 5. 보안 정책 생성 (기존 정책이 있을 경우를 대비하여 삭제 후 생성)
DROP POLICY IF EXISTS "Users can manage their own learning records" ON public.learning_records;
CREATE POLICY "Users can manage their own learning records" 
ON public.learning_records FOR ALL 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own srs logs" ON public.srs_logs;
CREATE POLICY "Users can manage their own srs logs" 
ON public.srs_logs FOR ALL 
USING (auth.uid() = user_id);
