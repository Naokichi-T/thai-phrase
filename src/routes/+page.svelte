<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";

  // ログインチェック
  onMount(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login";
    }
  });

  // メニュー項目の定義
  const menuItems = [
    {
      icon: "📖",
      label: "カードを見る",
      href: "/cards",
    },
    {
      icon: "🔍",
      label: "検索",
      href: "/search",
    },
    {
      icon: "⚙️",
      label: "設定",
      href: "/settings",
    },
  ];
</script>

<div class="container">
  <h1 class="title">フレーズ集</h1>

  <!-- メニューボタンを縦に並べる -->
  <nav class="menu">
    {#each menuItems as item}
      <a class="menu-item" href={item.href}>
        <span class="menu-icon">{item.icon}</span>
        <span class="menu-label">{item.label}</span>
        <span class="menu-arrow">›</span>
      </a>
    {/each}
  </nav>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 16px;
  }

  /* アプリタイトル */
  .title {
    font-family: "Sarabun", sans-serif;
    font-size: 24px;
    margin: 0 0 32px 0;
    color: #333;
  }

  /* メニュー全体 */
  .menu {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* メニューボタン1つ */
  .menu-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 12px;
    text-decoration: none;
    color: #333;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .menu-item:hover {
    background: #f9f9f9;
  }

  /* アイコン */
  .menu-icon {
    font-size: 24px;
    width: 32px;
    text-align: center;
  }

  /* ラベル */
  .menu-label {
    font-family: "Sarabun", sans-serif;
    font-size: 18px;
    flex: 1; /* 残りのスペースを全部使う */
  }

  /* 右矢印 */
  .menu-arrow {
    font-size: 20px;
    color: #ccc;
  }
</style>
