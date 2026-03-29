<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";

  let folders = $state([]); // 全フォルダのフラットなリスト
  let tree = $state([]); // ツリー構造に変換したフォルダ
  let userId = $state(null); // ログイン中のユーザーID
  let newFolderName = $state(""); // 新しいフォルダ名の入力値
  let openFolderIds = $state(new Set()); // 開いているフォルダIDのセット（Setは重複なしのリスト）
  let creatingUnder = $state(null); // サブフォルダ作成中のフォルダID（nullのときは作成エリアを非表示）
  let newSubFolderName = $state(""); // サブフォルダの名前入力値
  let editingFolderId = $state(null); // 編集中のフォルダID（nullのときは編集エリアを非表示）
  let editingName = $state(""); // 編集中のフォルダ名
  let editingParentId = $state(null); // 編集中の親フォルダID

  onMount(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }

    userId = session.user.id;
    await loadFolders();
  });

  // フォルダ一覧をSupabaseから取得してツリーに変換する
  async function loadFolders() {
    const { data, error } = await supabase.from("folders").select("*").eq("user_id", userId).order("name", { ascending: true });

    if (error) {
      console.error("フォルダ取得エラー:", error);
      return;
    }

    folders = data;
    tree = buildTree(folders, null); // ツリー構造に変換する
  }

  /**
   * フラットなフォルダリストをツリー構造に変換する関数
   * 再帰的に呼び出すことで何階層でも対応できる
   * @param {Array} allFolders - 全フォルダのリスト
   * @param {number|null} parentId - 親フォルダのID（トップレベルはnull）
   * @returns {Array} - ツリー構造のフォルダリスト
   */
  function buildTree(allFolders, parentId) {
    return (
      allFolders
        // 指定した親IDを持つフォルダだけ取り出す
        .filter((f) => f.parent_id === parentId)
        .map((f) => ({
          ...f,
          // 子フォルダを再帰的に取得する
          children: buildTree(allFolders, f.id),
        }))
    );
  }

  // フォルダを作成する（常にトップレベルで作成）
  async function createFolder() {
    if (!newFolderName.trim()) return;

    const { error } = await supabase.from("folders").insert({
      user_id: userId,
      name: newFolderName.trim(),
      parent_id: null, // トップレベル
    });

    if (error) {
      console.error("フォルダ作成エラー:", error);
      return;
    }

    newFolderName = "";
    await loadFolders();
  }

  // フォルダを削除する
  async function deleteFolder(folderId) {
    if (!confirm("このフォルダを削除しますか？")) return;

    const { error } = await supabase.from("folders").delete().eq("id", folderId);

    if (error) {
      console.error("フォルダ削除エラー:", error);
      return;
    }

    await loadFolders();
  }

  // フォルダの開閉を切り替える
  function toggleOpen(folderId) {
    if (openFolderIds.has(folderId)) {
      openFolderIds.delete(folderId);
    } else {
      openFolderIds.add(folderId);
    }
    // Svelteに変更を伝えるために再代入する
    openFolderIds = new Set(openFolderIds);
  }

  // サブフォルダ作成エリアを開く
  function startCreatingUnder(folderId) {
    creatingUnder = folderId;
    newSubFolderName = "";
  }

  // サブフォルダを作成する
  async function createSubFolder(parentId) {
    if (!newSubFolderName.trim()) return;

    const { error } = await supabase.from("folders").insert({
      user_id: userId,
      name: newSubFolderName.trim(),
      parent_id: parentId, // 親フォルダのIDを設定する
    });

    if (error) {
      console.error("サブフォルダ作成エラー:", error);
      return;
    }

    creatingUnder = null;
    newSubFolderName = "";

    // 作成後に親フォルダを開いた状態にする
    openFolderIds.add(parentId);
    openFolderIds = new Set(openFolderIds);

    await loadFolders();
  }

  // 編集モードを開始する
  function startEditing(folder) {
    editingFolderId = folder.id;
    editingName = folder.name;
    editingParentId = folder.parent_id;
  }

  // フォルダ名と親フォルダを保存する
  async function saveFolder() {
    if (!editingName.trim()) return;

    const { error } = await supabase
      .from("folders")
      .update({
        name: editingName.trim(),
        parent_id: editingParentId, // 親フォルダを更新する
      })
      .eq("id", editingFolderId);

    if (error) {
      console.error("フォルダ更新エラー:", error);
      return;
    }

    editingFolderId = null;
    await loadFolders();
  }
</script>

<div class="container">
  <h1 class="title">フォルダ一覧</h1>

  <!-- フォルダ作成エリア -->
  <div class="create-area">
    <input class="folder-input" type="text" placeholder="フォルダ名を入力..." bind:value={newFolderName} />
    <button class="create-btn" onclick={createFolder}>作成</button>
  </div>

  {#if tree.length === 0}
    <p class="empty">フォルダはまだありません</p>
  {:else}
    <!-- ツリーを再帰的に表示するsnippet -->
    {#snippet folderTree(nodes)}
      <ul class="folder-list">
        {#each nodes as folder}
          <li class="folder-item">
            {#if editingFolderId === folder.id}
              <!-- 編集モード -->
              <div class="edit-area">
                <!-- フォルダ名の入力欄 -->
                <input class="folder-input" type="text" bind:value={editingName} />
                <!-- 親フォルダの選択 -->
                <select class="parent-select" bind:value={editingParentId}>
                  <option value={null}>トップレベル</option>
                  {#each folders.filter((f) => f.id !== folder.id) as f}
                    <option value={f.id}>📁 {f.name}</option>
                  {/each}
                </select>
                <button class="create-btn" onclick={saveFolder}>保存</button>
                <button class="cancel-btn" onclick={() => (editingFolderId = null)}>キャンセル</button>
              </div>
            {:else}
              <!-- 通常モード -->
              <div class="folder-row">
                {#if folder.children.length > 0}
                  <button class="folder-arrow open-btn" onclick={() => toggleOpen(folder.id)}>
                    {openFolderIds.has(folder.id) ? "▼" : "▶"}
                  </button>
                {:else}
                  <span class="folder-arrow"> </span>
                {/if}

                <a class="folder-link" href="/folders/{folder.id}">📁 {folder.name}</a>

                <!-- 編集ボタン -->
                <button class="edit-btn" onclick={() => startEditing(folder)}>編集</button>

                <!-- サブフォルダ追加ボタン -->
                <button class="add-btn" onclick={() => startCreatingUnder(folder.id)}>＋</button>

                <!-- 削除ボタン -->
                <button class="delete-btn" onclick={() => deleteFolder(folder.id)}>削除</button>
              </div>

              <!-- サブフォルダ作成エリア -->
              {#if creatingUnder === folder.id}
                <div class="sub-create-area">
                  <input class="folder-input" type="text" placeholder="サブフォルダ名を入力..." bind:value={newSubFolderName} />
                  <button class="create-btn" onclick={() => createSubFolder(folder.id)}>作成</button>
                  <button class="cancel-btn" onclick={() => (creatingUnder = null)}>キャンセル</button>
                </div>
              {/if}
            {/if}

            <!-- 子フォルダがあって、開いているときだけ表示する -->
            {#if folder.children.length > 0 && openFolderIds.has(folder.id)}
              {@render folderTree(folder.children)}
            {/if}
          </li>
        {/each}
      </ul>
    {/snippet}

    <!-- トップレベルのツリーを表示する -->
    {@render folderTree(tree)}
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
    margin-bottom: 4px;
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

  /* フォルダの行（矢印・名前・削除ボタンを横並び） */
  .folder-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
  }

  /* 開閉矢印 */
  .folder-arrow {
    font-size: 12px;
    color: #999;
    width: 16px;
    flex-shrink: 0;
  }

  /* サブフォルダはインデントで表現する */
  .folder-list .folder-list {
    padding-left: 24px;
  }

  /* サブフォルダ追加ボタン */
  .add-btn {
    background: none;
    border: 1px solid #aaa;
    border-radius: 4px;
    color: #666;
    font-size: 14px;
    cursor: pointer;
    padding: 2px 8px;
    line-height: 1;
  }

  .add-btn:hover {
    background: #f0f0f0;
  }

  /* キャンセルボタン */
  .cancel-btn {
    padding: 10px 16px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
  }

  .cancel-btn:hover {
    background: #f0f0f0;
  }

  /* サブフォルダ作成エリア */
  .sub-create-area {
    display: flex;
    gap: 8px;
    margin-top: 4px;
    padding-left: 24px; /* 少しインデントする */
  }

  /* 開閉ボタン（▶/▼）*/
  .open-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-size: 12px;
    color: #999;
    width: 16px;
    flex-shrink: 0;
  }

  /* 編集エリア */
  .edit-area {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 12px;
    border: 1px solid #aaa;
    border-radius: 8px;
    background: #f9f9f9;
  }

  /* 親フォルダ選択 */
  .parent-select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    background: white;
  }

  /* 編集ボタン */
  .edit-btn {
    background: none;
    border: 1px solid #aaa;
    border-radius: 4px;
    color: #666;
    font-size: 13px;
    cursor: pointer;
    padding: 2px 8px;
  }

  .edit-btn:hover {
    background: #f0f0f0;
  }
</style>
