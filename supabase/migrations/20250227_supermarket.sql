-- Create shopping_lists table
CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_account_id UUID REFERENCES public.shared_accounts(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'completed')) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create shopping_list_items table
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    quantity NUMERIC DEFAULT 1,
    unit TEXT,
    estimated_price NUMERIC,
    actual_price NUMERIC,
    is_checked BOOLEAN DEFAULT false,
    assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shopping_lists
CREATE POLICY "Users can manage their own shopping lists"
    ON public.shopping_lists
    FOR ALL
    TO authenticated
    USING (
        owner_user_id = auth.uid()
        OR 
        shared_account_id IN (
            SELECT sam.shared_account_id 
            FROM public.shared_account_members sam
            WHERE sam.user_id = auth.uid()
        )
    )
    WITH CHECK (
        owner_user_id = auth.uid()
        OR 
        shared_account_id IN (
            SELECT sam.shared_account_id 
            FROM public.shared_account_members sam
            WHERE sam.user_id = auth.uid()
        )
    );

-- RLS Policies for shopping_list_items (inheriting from shopping_lists)
CREATE POLICY "Users can manage items of lists they have access to"
    ON public.shopping_list_items
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = public.shopping_list_items.shopping_list_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = public.shopping_list_items.shopping_list_id
        )
    );

-- Grant access to authenticated users
GRANT ALL ON TABLE public.shopping_lists TO authenticated;
GRANT ALL ON TABLE public.shopping_list_items TO authenticated;
