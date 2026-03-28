// SvelteKitから環境変数を読み込む仕組み
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";

// Supabaseのライブラリからクライアントを作る関数を読み込む
import { createClient } from "@supabase/supabase-js";

// Supabaseクライアントを作成してエクスポートする
// このファイルをimportするだけでどのページからでもSupabaseが使える
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
