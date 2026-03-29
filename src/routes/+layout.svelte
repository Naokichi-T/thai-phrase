<script>
  import { goto } from "$app/navigation";
  // childrenは各ページのコンテンツを受け取る（Svelte5の書き方）
  let { children } = $props();

  // メニューの開閉状態
  let isMenuOpen = $state(false);

  // メニュー項目の定義
  const menuItems = [
    { icon: "📖", label: "カードを見る", href: "/cards" },
    { icon: "📁", label: "フォルダ", href: "/folders" },
    { icon: "🔍", label: "検索", href: "/search" },
    { icon: "⚙️", label: "設定", href: "/settings" },
  ];

  // メニューを閉じる
  function closeMenu() {
    isMenuOpen = false;
  }

  async function goToCards() {
    closeMenu();
    await goto("/cards", { replaceState: true });
    window.location.href = "/cards";
  }
</script>

<!-- 上部ナビゲーションバー -->
<header class="navbar">
  <!-- ハンバーガーボタン -->
  <button class="hamburger" onclick={() => (isMenuOpen = !isMenuOpen)} aria-label="メニューを開く">
    {isMenuOpen ? "✕" : "≡"}
  </button>

  <!-- アプリタイトル -->
  <span class="navbar-title">フレーズ集</span>
</header>

<!-- メニューが開いているときオーバーレイを表示 -->
{#if isMenuOpen}
  <!-- 背景を暗くする：タップしたらメニューを閉じる -->
  <div class="overlay" role="button" aria-label="メニューを閉じる" tabindex="-1" onclick={closeMenu} onkeydown={closeMenu}></div>

  <!-- ドロワーメニュー -->
  <nav class="drawer">
    {#each menuItems as item}
      {#if item.href === "/cards"}
        <button class="drawer-item" onclick={goToCards}>
          <span class="drawer-icon">{item.icon}</span>
          <span class="drawer-label">{item.label}</span>
        </button>
      {:else}
        <a class="drawer-item" href={item.href} onclick={closeMenu}>
          <span class="drawer-icon">{item.icon}</span>
          <span class="drawer-label">{item.label}</span>
        </a>
      {/if}
    {/each}
  </nav>
{/if}

<!-- 各ページのコンテンツ -->
<main>
  {@render children()}
</main>

<style>
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 52px;
    background: white;
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 16px;
    z-index: 100;
  }

  .hamburger {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    color: #333;
    line-height: 1;
  }

  .navbar-title {
    font-family: "Sarabun", sans-serif;
    font-size: 18px;
    color: #333;
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 200;
  }

  .drawer {
    position: fixed;
    top: 0;
    left: 0;
    width: 260px;
    height: 100%;
    background: white;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    z-index: 300;
    padding-top: 60px;
    display: flex;
    flex-direction: column;
  }

  .drawer-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    text-decoration: none;
    color: #333;
    font-family: "Sarabun", sans-serif;
    font-size: 17px;
  }

  .drawer-item:hover {
    background: #f5f5f5;
  }

  .drawer-icon {
    font-size: 22px;
    width: 28px;
    text-align: center;
  }

  main {
    padding-top: 52px;
  }

  button.drawer-item {
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
  }
</style>
