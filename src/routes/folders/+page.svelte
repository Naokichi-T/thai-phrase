<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";

  let folders = $state([]); // フォルダのリスト
  let userId = $state(null); // ログイン中のユーザーID
  let newFolderName = $state(""); // 新しいフォルダ名の入力値

  onMount(async () => {
    // ログインしているか確認する
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }

    userId = session.user.id;

    // フォルダ一覧を取得する
    await loadFolders();
  });

  // フォルダ一覧をSupabaseから取得する
  async function loadFolders() {
    const { data, error } = await supabase.from("folders").select("*").eq("user_id", userId).order("name", { ascending: true }); // 名前順に並べる

    if (error) {
      console.error("フォルダ取得エラー:", error);
      return;
    }

    folders = data;
  }

  // フォルダを作成する
  async function createFolder() {
    // 空文字のときは何もしない
    if (!newFolderName.trim()) return;

    const { error } = await supabase.from("folders").insert({
      user_id: userId,
      name: newFolderName.trim(),
      parent_id: null, // トップレベルのフォルダ
    });

    if (error) {
      console.error("フォルダ作成エラー:", error);
      return;
    }

    newFolderName = ""; // 入力欄をリセット
    await loadFolders(); // 一覧を再取得する
  }

  // フォルダを削除する
  async function deleteFolder(folderId) {
    // 確認ダイアログを表示する
    if (!confirm("このフォルダを削除しますか？")) return;

    const { error } = await supabase.from("folders").delete().eq("id", folderId);

    if (error) {
      console.error("フォルダ削除エラー:", error);
      return;
    }

    await loadFolders(); // 一覧を再取得する
  }
</script>

<div class="container">
  <h1 class="title">フォルダ一覧</h1>

  <!-- フォルダ作成エリア -->
  <div class="create-area">
    <input class="folder-input" type="text" placeholder="フォルダ名を入力..." bind:value={newFolderName} />
    <button class="create-btn" onclick={createFolder}>作成</button>
  </div>

  {#if folders.length === 0}
    <p class="empty">フォルダはまだありません</p>
  {:else}
    <ul class="folder-list">
      {#each folders as folder}
        <li class="folder-item">
          <!-- フォルダ名をタップするとそのフォルダのカードページに移動する -->
          <a class="folder-link" href="/folders/{folder.id}">📁 {folder.name}</a>
          <button class="delete-btn" onclick={() => deleteFolder(folder.id)}>削除</button>
        </li>
      {/each}
    </ul>
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

  .empty {
    color: #999;
    font-size: 14px;
  }

  .folder-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .folder-item {
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin-bottom: 8px;
    font-size: 16px;
    background: white;
  }

  /* フォルダ作成エリア */
  .create-area {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  /* フォルダ名入力欄 */
  .folder-input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
  }

  .folder-input:focus {
    outline: none;
    border-color: #aaa;
  }

  /* 作成ボタン */
  .create-btn {
    padding: 10px 20px;
    background: #2d2a4a;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
  }

  .create-btn:hover {
    opacity: 0.85;
  }

  /* フォルダ名と削除ボタンを横並びにする */
  .folder-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* 削除ボタン */
  .delete-btn {
    padding: 4px 12px;
    background: white;
    border: 1px solid #f44336;
    border-radius: 6px;
    color: #f44336;
    font-size: 13px;
    cursor: pointer;
  }

  .delete-btn:hover {
    background: #fdecea;
  }

  /* フォルダ名リンク */
  .folder-link {
    text-decoration: none;
    color: inherit;
    flex: 1;
  }

  .folder-link:hover {
    text-decoration: underline;
  }
</style>
