-- Sample Seed Data SQL (optional manual execution if needed)
-- Note: Replace 'YOUR_USER_ID_HERE' with your actual Supabase auth.users UUID

-- Insert initial dummy transactions for testing
/*
DO $$
DECLARE
    v_user_id uuid := 'YOUR_USER_ID_HERE';
    v_pocket_utama uuid;
    v_pocket_makan uuid;
    v_pocket_kesehatan uuid;
    v_pocket_laptop uuid;
    v_cat_gaji uuid;
    v_cat_freelance uuid;
    v_cat_makanan uuid;
    v_cat_belanja uuid;
BEGIN
    SELECT id INTO v_pocket_utama FROM public.pockets WHERE user_id = v_user_id AND name = 'Dana Utama' LIMIT 1;
    SELECT id INTO v_pocket_makan FROM public.pockets WHERE user_id = v_user_id AND name = 'Dana Makan' LIMIT 1;
    SELECT id INTO v_pocket_kesehatan FROM public.pockets WHERE user_id = v_user_id AND name = 'Dana Kesehatan' LIMIT 1;
    SELECT id INTO v_pocket_laptop FROM public.pockets WHERE user_id = v_user_id AND name = 'Tabungan Laptop' LIMIT 1;

    SELECT id INTO v_cat_gaji FROM public.categories WHERE user_id = v_user_id AND name = 'Gaji Pokok' LIMIT 1;
    SELECT id INTO v_cat_freelance FROM public.categories WHERE user_id = v_user_id AND name = 'Freelance & Side Job' LIMIT 1;
    SELECT id INTO v_cat_makanan FROM public.categories WHERE user_id = v_user_id AND name = 'Makanan & Minuman' LIMIT 1;
    SELECT id INTO v_cat_belanja FROM public.categories WHERE user_id = v_user_id AND name = 'Belanja Kebutuhan' LIMIT 1;

    -- Income: Gaji Rp 8.000.000 ke Dana Utama
    INSERT INTO public.transactions (user_id, pocket_id, category_id, type, amount, title, description, transaction_date)
    VALUES (v_user_id, v_pocket_utama, v_cat_gaji, 'income', 8000000, 'Gaji Bulanan', 'Gaji masuk bulan ini', CURRENT_DATE - INTERVAL '5 days');

    -- Transfer: Alokasi Dana Utama -> Dana Makan Rp 1.500.000
    INSERT INTO public.transfers (user_id, from_pocket_id, to_pocket_id, amount, title, description, transfer_date)
    VALUES (v_user_id, v_pocket_utama, v_pocket_makan, 1500000, 'Alokasi Uang Makan', 'Budget konsumsi bulanan', CURRENT_DATE - INTERVAL '4 days');

    -- Transfer: Menabung Dana Utama -> Tabungan Laptop Rp 1.000.000
    INSERT INTO public.transfers (user_id, from_pocket_id, to_pocket_id, amount, title, description, transfer_date)
    VALUES (v_user_id, v_pocket_utama, v_pocket_laptop, 1000000, 'Menabung untuk Laptop', 'Cicilan tabungan laptop', CURRENT_DATE - INTERVAL '3 days');

    -- Expense: Makan Rp 45.000 dari Dana Makan
    INSERT INTO public.transactions (user_id, pocket_id, category_id, type, amount, title, description, transaction_date)
    VALUES (v_user_id, v_pocket_makan, v_cat_makanan, 'expense', 45000, 'Makan Siang Resto', 'Makan siang bersama rekan kerja', CURRENT_DATE - INTERVAL '2 days');

    -- Expense: Belanja Rp 120.000 dari Dana Utama
    INSERT INTO public.transactions (user_id, pocket_id, category_id, type, amount, title, description, transaction_date)
    VALUES (v_user_id, v_pocket_utama, v_cat_belanja, 'expense', 120000, 'Belanja Mingguan', 'Kebutuhan pokok rumah tangga', CURRENT_DATE - INTERVAL '1 day');
END $$;
*/
