<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";

  onMount(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }
    // ログインしていればカードページへ
    window.location.href = "/cards";
  });
</script>

<p>読み込み中...</p>
