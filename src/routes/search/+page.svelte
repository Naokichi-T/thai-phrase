<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  let userId = $state(null);
  let searchQuery = $state("");
  let searchTarget = $state("thai"); // "thai" | "japanese" | "memo"
  let results = $state([]); // 検索結果のフレーズリスト
  let isSearched = $state(false); // 一度でも検索したか
  let isLoading = $state(false); // 検索中かどうか

  onMount(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }
    userId = session.user.id;

    // URLにパラメータがあれば入力欄を復元して自動的に検索する
    const q = $page.url.searchParams.get("q") ?? "";
    const target = $page.url.searchParams.get("target") ?? "thai";
    if (q) {
      searchQuery = q;
      searchTarget = target;
      await search();
    }
  });

  // 検索を実行する
  async function search() {
    const q = searchQuery.trim();
    if (!q || !userId) return;

    // URLに検索条件を反映する（ブラウザバックで戻ったとき復元できるようにする）
    goto(`/search?q=${encodeURIComponent(q)}&target=${searchTarget}`, { replaceState: false, noScroll: true });

    isLoading = true;
    isSearched = false;
    results = [];

    if (searchTarget === "thai" || searchTarget === "japanese") {
      // phrases テーブルの列で部分一致検索する
      const { data, error } = await supabase.from("phrases").select("*").ilike(searchTarget, `%${q}%`).order("order_symbol", { ascending: true });

      if (error) {
        console.error("検索エラー:", error);
      } else {
        results = data ?? [];
      }
    } else if (searchTarget === "memo") {
      // phrase_status のメモで検索して、該当する phrases を取得する
      const { data: memoData, error: memoError } = await supabase.from("phrase_status").select("phrase_id, memo").eq("user_id", userId).ilike("memo", `%${q}%`);

      if (memoError) {
        console.error("メモ検索エラー:", memoError);
      } else if (memoData && memoData.length > 0) {
        const phraseIds = memoData.map((r) => r.phrase_id);

        const { data: phraseData, error: phraseError } = await supabase.from("phrases").select("*").in("id", phraseIds).order("order_symbol", { ascending: true });

        if (phraseError) {
          console.error("フレーズ取得エラー:", phraseError);
        } else {
          results = phraseData ?? [];
        }
      }
    }

    isLoading = false;
    isSearched = true;
  }

  // 検索対象のラベルを返す
  function targetLabel(target) {
    if (target === "thai") return "タイ語";
    if (target === "japanese") return "日本語";
    return "メモ";
  }

  // カードページへのリンクを作る
  // /cards?q=...&target=...&phraseId=... という形でフレーズIDも渡す
  function cardLink(phraseId) {
    const q = encodeURIComponent(searchQuery.trim());
    return `/cards?q=${q}&target=${searchTarget}&phraseId=${phraseId}&from=search`;
  }
</script>

<div class="container">
  <h1 class="title">検索</h1>

  <!-- 検索フォーム -->
  <div class="search-form">
    <!-- 検索対象の選択 -->
    <div class="target-tabs">
      {#each [{ key: "thai", label: "タイ語" }, { key: "japanese", label: "日本語" }, { key: "memo", label: "メモ" }] as tab}
        <button class="target-tab {searchTarget === tab.key ? 'active' : ''}" onclick={() => (searchTarget = tab.key)}>
          {tab.label}
        </button>
      {/each}
    </div>

    <!-- 入力欄と検索ボタン -->
    <div class="input-row">
      <input class="search-input" type="text" placeholder="{targetLabel(searchTarget)}で検索..." bind:value={searchQuery} onkeydown={(e) => e.key === "Enter" && search()} />
      <button class="search-btn" onclick={search} disabled={isLoading}>
        {isLoading ? "検索中..." : "検索"}
      </button>
    </div>
  </div>

  <!-- 検索結果 -->
  {#if isSearched}
    <p class="result-count">
      「{searchQuery}」（{targetLabel(searchTarget)}）：{results.length}件見つかりました
    </p>

    {#if results.length === 0}
      <p class="empty">該当するフレーズはありません</p>
    {:else}
      <ul class="result-list">
        {#each results as phrase}
          <li>
            <a class="result-item" href={cardLink(phrase.id)}>
              <p class="result-thai">{phrase.thai}</p>
              <p class="result-japanese">{phrase.japanese}</p>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .container {
    padding: 24px 16px;
    max-width: 800px;
    margin: 0 auto;
  }

  .title {
    font-size: 20px;
    margin-bottom: 16px;
  }

  /* 検索フォーム全体 */
  .search-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  /* 対象選択タブ */
  .target-tabs {
    display: flex;
    gap: 6px;
  }

  .target-tab {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
    font-size: 14px;
    cursor: pointer;
    font-family: "Sarabun", sans-serif;
  }

  .target-tab.active {
    background: white;
    border-color: #2d2a4a;
    border-width: 2px;
    color: #2d2a4a;
    font-weight: bold;
  }

  /* 入力欄と検索ボタンの行 */
  .input-row {
    display: flex;
    gap: 8px;
  }

  .search-input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    font-family: "Sarabun", sans-serif;
  }

  .search-input:focus {
    outline: none;
    border-color: #aaa;
  }

  .search-btn {
    padding: 10px 20px;
    background: #2d2a4a;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    white-space: nowrap;
  }

  .search-btn:hover:not(:disabled) {
    opacity: 0.85;
  }

  .search-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  /* 検索結果件数 */
  .result-count {
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
  }

  /* 結果なし */
  .empty {
    color: #999;
    font-size: 14px;
  }

  /* 結果リスト */
  .result-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* 結果の各アイテム */
  .result-item {
    display: block;
    padding: 14px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
    text-decoration: none;
    color: inherit;
  }

  .result-item:hover {
    background: #f5f5f5;
  }

  .result-thai {
    font-family: "Sarabun", sans-serif;
    font-size: 18px;
    margin: 0 0 4px 0;
    line-height: 1.5;
  }

  .result-japanese {
    font-family: "Sarabun", sans-serif;
    font-size: 15px;
    color: #666;
    margin: 0;
    line-height: 1.5;
  }
</style>
