<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";

  // ページが表示されたらセッションを確認してトップページに移動
  onMount(async () => {
    await supabase.auth.getSession();
    window.location.href = "/";
  });
</script>

<p>ログイン中...</p>
