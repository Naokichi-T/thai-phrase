<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { supabase } from "$lib/supabase";
  import { loadSettings } from "$lib/settings";

  // URLの[id]部分を取得する（例：/folders/3 → "3"）
  const folderId = $derived(Number($page.params.id));

  let folderName = $state(""); // フォルダ名
  let phrases = $state([]); // このフォルダのフレーズリスト
  let currentIndex = $state(0); // 今表示しているカードの位置
  let phrase = $derived(phrases[currentIndex] ?? null); // 今表示しているフレーズ
  let status = $state(null); // カードのステータス
  let isFavorite = $state(false); // お気に入り
  let memoText = $state(""); // メモの内容
  let showMemo = $state(false); // メモの開閉状態
  let userId = $state(null); // ログイン中のユーザーID
  let currentAudio = null; // 再生中のAudioオブジェクト
  let isStopped = $state(false); // 自動送りが停止中かどうか
  let touchStartX = 0; // スワイプ開始時のX座標
  let folders = $state([]); // 全フォルダのリスト
  let selectedFolderIds = $state([]); // このフレーズが入っているフォルダIDのリスト
  let showFolderPicker = $state(false); // フォルダ選択エリアの開閉状態

  const STORAGE_BASE_URL = "https://rwimifrjznpyawegcysd.supabase.co/storage/v1/object/public/phrase-audio/";

  // 指が触れたときX座標を記録する
  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
  }

  // 指が離れたときスワイプ距離を計算して前後に移動する
  function handleTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;

    // 50px以上動いたときだけスワイプとみなす
    if (diff > 50) {
      prevCard(); // 右スワイプ → 前へ
    } else if (diff < -50) {
      nextCard(); // 左スワイプ → 次へ
    }
  }

  // ページ全体にタッチイベントを登録する
  $effect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  });

  /**
   * 音声を再生する関数
   * @param {string} filename - 再生するファイル名
   * @param {number} speed - 再生スピード
   */
  function playAudio(filename, speed) {
    return new Promise((resolve) => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }

      const url = STORAGE_BASE_URL + filename;
      const audio = new Audio(url);
      audio.playbackRate = speed;
      audio.onended = () => resolve();
      currentAudio = audio;
      audio.play();
    });
  }

  function autoResize(el) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  // 自動送りを停止する
  function stopAutoAdvance() {
    isStopped = true;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  }

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

    // フォルダ一覧を取得する（一度だけ取得すればOK）
    await loadFolders();

    // フォルダ名を取得する
    const { data: folderData } = await supabase.from("folders").select("name").eq("id", folderId).single();

    if (folderData) {
      folderName = folderData.name;
    }

    // このフォルダに入っているphrase_idの一覧を取得する
    const { data: phraseFolderData, error: phraseFolderError } = await supabase.from("phrase_folders").select("phrase_id").eq("folder_id", folderId);

    if (phraseFolderError) {
      console.error("フレーズフォルダ取得エラー:", phraseFolderError);
      return;
    }

    // phrase_idだけの配列に変換する（例：[1, 3, 5]）
    const phraseIds = phraseFolderData.map((row) => row.phrase_id);

    if (phraseIds.length === 0) {
      // フォルダにフレーズが1件もない場合
      phrases = [];
      return;
    }

    // phrase_idに一致するフレーズをorder_symbol順で取得する
    const { data: phraseData, error: phraseError } = await supabase.from("phrases").select("*").in("id", phraseIds).order("order_symbol", { ascending: true });

    if (phraseError) {
      console.error("フレーズ取得エラー:", phraseError);
      return;
    }

    phrases = phraseData;

    if (phrases.length > 0) {
      await loadStatus(phrases[0].id);
    }
  });

  /**
   * ステータス・お気に入り・メモをSupabaseに保存する
   * @param {object} fields - 更新するフィールド
   */
  async function saveStatus(fields) {
    if (!userId || !phrase) return;

    const { error } = await supabase.from("phrase_status").upsert(
      {
        user_id: userId,
        phrase_id: phrase.id,
        status,
        is_favorite: isFavorite,
        memo: memoText,
        ...fields,
      },
      { onConflict: "user_id,phrase_id" },
    );

    if (error) {
      console.error("保存エラー:", error);
    }
  }

  // ステータスボタンを押したときの処理
  async function setStatus(newStatus) {
    status = newStatus;
    await saveStatus({ status: newStatus });
  }

  // お気に入りボタンを押したときの処理
  async function toggleFavorite() {
    isFavorite = !isFavorite;
    await saveStatus({ is_favorite: isFavorite });
  }

  // フォルダ一覧をSupabaseから取得する
  async function loadFolders() {
    const { data, error } = await supabase.from("folders").select("*").eq("user_id", userId).order("name", { ascending: true });

    if (error) {
      console.error("フォルダ取得エラー:", error);
      return;
    }

    folders = data;
  }

  // このフレーズがどのフォルダに入っているか取得する
  async function loadPhraseFolders(phraseId) {
    selectedFolderIds = [];

    const { data, error } = await supabase.from("phrase_folders").select("folder_id").eq("phrase_id", phraseId);

    if (error) {
      console.error("フレーズフォルダ取得エラー:", error);
      return;
    }

    selectedFolderIds = data.map((row) => row.folder_id);
  }

  // ツリー構造に変換する
  function buildTree(allFolders, parentId) {
    return allFolders
      .filter((f) => f.parent_id === parentId)
      .map((f) => ({
        ...f,
        children: buildTree(allFolders, f.id),
      }));
  }

  // ツリーをインデントレベル付きのフラットなリストに変換する
  function flattenTree(nodes, depth = 0) {
    const result = [];
    for (const node of nodes) {
      result.push({ ...node, depth });
      if (node.children.length > 0) {
        result.push(...flattenTree(node.children, depth + 1));
      }
    }
    return result;
  }

  // 表示用のフォルダリスト
  let flatFolders = $derived(flattenTree(buildTree(folders, null)));

  // チェックボックスを切り替えたときの処理
  async function toggleFolder(folderId) {
    if (selectedFolderIds.includes(folderId)) {
      await supabase.from("phrase_folders").delete().eq("phrase_id", phrase.id).eq("folder_id", folderId);

      selectedFolderIds = selectedFolderIds.filter((id) => id !== folderId);
    } else {
      await supabase.from("phrase_folders").insert({
        phrase_id: phrase.id,
        folder_id: folderId,
      });

      selectedFolderIds = [...selectedFolderIds, folderId];
    }
  }

  /**
   * 指定したフレーズIDのステータスをSupabaseから取得して画面に反映する
   * @param {number} phraseId - フレーズのID
   */
  async function loadStatus(phraseId) {
    status = null;
    isFavorite = false;
    memoText = "";
    showMemo = false;
    showFolderPicker = false;

    const { data: statusData } = await supabase.from("phrase_status").select("*").eq("user_id", userId).eq("phrase_id", phraseId).single();

    if (statusData) {
      status = statusData.status;
      isFavorite = statusData.is_favorite;
      memoText = statusData.memo ?? "";
    }

    // このフレーズがどのフォルダに入っているか取得する
    await loadPhraseFolders(phraseId);

    // 設定を読み込む
    const settings = loadSettings();

    // 自動再生・自動送りの処理
    (async () => {
      if (isStopped) return;

      const playThai = async () => {
        if (settings.autoPlayThai && phrase?.audio_th) {
          await playAudio(phrase.audio_th, settings.speedThai);
        }
      };
      const playJapanese = async () => {
        if (settings.autoPlayJapanese && phrase?.audio_ja) {
          await playAudio(phrase.audio_ja, settings.speedJapanese);
        }
      };

      if (settings.autoPlayOrder === "japanese_first") {
        await playJapanese();
        await playThai();
      } else {
        await playThai();
        await playJapanese();
      }

      if (isStopped) return;

      if (settings.autoAdvanceEnabled && (settings.autoPlayThai || settings.autoPlayJapanese)) {
        await new Promise((resolve) => setTimeout(resolve, settings.autoAdvance * 1000));

        if (isStopped) return;

        if (currentIndex >= phrases.length - 1) {
          if (settings.loopEnabled) {
            currentIndex = 0;
            await loadStatus(phrases[0].id);
          }
          return;
        }

        nextCard();
      }
    })();
  }

  // 次のカードに移動する
  async function nextCard() {
    if (currentIndex >= phrases.length - 1) return;
    isStopped = false;
    currentIndex += 1;
    await loadStatus(phrase.id);
  }

  // 前のカードに移動する
  async function prevCard() {
    if (currentIndex <= 0) return;
    isStopped = false;
    currentIndex -= 1;
    await loadStatus(phrase.id);
  }
</script>

<div class="container">
  <!-- フォルダ名をタイトルとして表示する -->
  <h1 class="folder-title">📁 {folderName}</h1>

  {#if phrases.length === 0}
    <p class="empty">このフォルダにフレーズはまだありません</p>
  {:else if phrase === null}
    <p>読み込み中...</p>
  {:else}
    <!-- カード本体 -->
    <div class="card" role="region" aria-label="フレーズカード">
      <!-- お気に入りボタン -->
      <button class="favorite-btn" onclick={toggleFavorite}>
        {isFavorite ? "★" : "☆"}
      </button>

      <p class="order">{phrase.order_symbol}</p>

      <!-- 音声ボタンとタイ語フレーズ -->
      <div class="phrase-row">
        <button class="audio-btn" onclick={() => playAudio(phrase.audio_th, loadSettings().speedThai)}>🔊</button>
        <p class="thai">{phrase.thai}</p>
      </div>

      <hr />

      <!-- 音声ボタンと日本語フレーズ -->
      <div class="phrase-row">
        <button class="audio-btn" onclick={() => playAudio(phrase.audio_ja, loadSettings().speedJapanese)}>🔊</button>
        <p class="japanese">{phrase.japanese}</p>
      </div>

      <!-- ステータスボタン -->
      <div class="status-buttons">
        <button class="status-btn ok {status === 'ok' ? 'active' : ''}" onclick={() => setStatus("ok")}>OK</button>
        <button class="status-btn ng {status === 'ng' ? 'active' : ''}" onclick={() => setStatus("ng")}>NG</button>
        <button class="status-btn pending {status === 'pending' ? 'active' : ''}" onclick={() => setStatus("pending")}>保留</button>
      </div>

      <!-- メモエリア -->
      <div class="memo-area">
        <button class="memo-toggle" onclick={() => (showMemo = !showMemo)}>
          ✏️ {showMemo ? "メモを閉じる" : "メモを開く"}
        </button>
        {#if showMemo}
          <textarea class="memo-input" placeholder="メモを入力..." bind:value={memoText} oninput={(e) => autoResize(e.target)} onblur={() => saveStatus({ memo: memoText })}></textarea>
        {/if}
      </div>

      <!-- フォルダ選択エリア -->
      <div class="folder-area">
        <button class="folder-toggle" onclick={() => (showFolderPicker = !showFolderPicker)}>
          📁 {showFolderPicker ? "フォルダを閉じる" : "フォルダに追加"}
          {#if selectedFolderIds.length > 0}
            <span class="folder-badge">{selectedFolderIds.length}</span>
          {/if}
        </button>

        {#if showFolderPicker}
          {#if folders.length === 0}
            <p class="folder-empty">フォルダがありません。<a href="/folders">フォルダを作る</a></p>
          {:else}
            <ul class="folder-check-list">
              {#each flatFolders as folder}
                <li>
                  <label class="folder-check-item" style="padding-left: {folder.depth * 20}px">
                    <input type="checkbox" checked={selectedFolderIds.includes(folder.id)} onchange={() => toggleFolder(folder.id)} />
                    📁 {folder.name}
                  </label>
                </li>
              {/each}
            </ul>
          {/if}
        {/if}
      </div>
    </div>

    <!-- 前後移動ボタン -->
    <div class="navigation">
      <button class="nav-btn" onclick={prevCard} disabled={currentIndex === 0}>← 前へ</button>

      <div class="nav-center">
        <span class="nav-count">{currentIndex + 1} / {phrases.length}</span>
        {#if loadSettings().autoAdvanceEnabled && !isStopped}
          <button class="stop-btn" onclick={stopAutoAdvance}>⏹ 停止</button>
        {/if}
      </div>

      <button class="nav-btn" onclick={nextCard} disabled={currentIndex === phrases.length - 1}>次へ →</button>
    </div>
  {/if}
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 16px;
  }

  /* フォルダ名タイトル */
  .folder-title {
    font-size: 18px;
    margin-bottom: 16px;
    color: #2d2a4a;
  }

  .empty {
    color: #999;
    font-size: 14px;
  }

  .card {
    position: relative;
    width: 100%;
    max-width: 800px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .order {
    font-size: 12px;
    color: #999;
    margin: 0 0 12px 0;
  }

  .thai {
    font-family: "Sarabun", sans-serif;
    font-size: 20px;
    margin: 0;
    line-height: 1.6;
  }

  .japanese {
    font-family: "Sarabun", sans-serif;
    font-size: 18px;
    margin: 0;
    line-height: 1.6;
  }

  .audio-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
    flex-shrink: 0;
  }

  .audio-btn:hover {
    transform: scale(1.2);
  }

  .phrase-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
  }

  hr {
    border: none;
    border-top: 1px solid #eee;
    margin: 16px 0;
  }

  .status-buttons {
    display: flex;
    gap: 8px;
    margin: 16px 0;
  }

  .status-btn {
    flex: 1;
    padding: 10px;
    border: 2px solid #ddd;
    border-radius: 8px;
    background: white;
    font-size: 16px;
    cursor: pointer;
    font-family: "Sarabun", sans-serif;
  }

  .status-btn.ok.active {
    background: #e6f4ea;
    border-color: #4caf50;
    color: #2e7d32;
    font-weight: bold;
  }

  .status-btn.ng.active {
    background: #fdecea;
    border-color: #f44336;
    color: #c62828;
    font-weight: bold;
  }

  .status-btn.pending.active {
    background: #fff3e0;
    border-color: #ff9800;
    color: #e65100;
    font-weight: bold;
  }

  .favorite-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #f5a623;
    line-height: 1;
  }

  .favorite-btn:hover {
    transform: scale(1.2);
  }

  .memo-area {
    margin-top: 16px;
  }

  .memo-toggle {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #999;
    padding: 0;
  }

  .memo-toggle:hover {
    color: #666;
  }

  .memo-input {
    width: 100%;
    margin-top: 8px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-family: "Sarabun", sans-serif;
    font-size: 18px;
    line-height: 1.6;
    resize: none;
    box-sizing: border-box;
    min-height: 60px;
  }

  .memo-input:focus {
    outline: none;
    border-color: #aaa;
  }

  .navigation {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 16px;
    width: 100%;
    max-width: 800px;
  }

  .nav-btn {
    padding: 10px 20px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 15px;
    cursor: pointer;
    font-family: "Sarabun", sans-serif;
  }

  .nav-btn:hover:not(:disabled) {
    background: #f0f0f0;
  }

  .nav-btn:disabled {
    color: #ccc;
    cursor: default;
  }

  .nav-count {
    font-size: 14px;
    color: #999;
    min-width: 60px;
    text-align: center;
  }

  .nav-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .stop-btn {
    padding: 4px 12px;
    background: white;
    border: 1px solid #f44336;
    border-radius: 6px;
    color: #f44336;
    font-size: 13px;
    cursor: pointer;
  }

  .stop-btn:hover {
    background: #fdecea;
  }

  /* フォルダエリア全体 */
  .folder-area {
    margin-top: 12px;
  }

  .folder-toggle {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #999;
    padding: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .folder-toggle:hover {
    color: #666;
  }

  .folder-badge {
    background: #2d2a4a;
    color: white;
    border-radius: 10px;
    padding: 1px 7px;
    font-size: 12px;
  }

  .folder-empty {
    font-size: 13px;
    color: #999;
    margin-top: 8px;
  }

  .folder-check-list {
    list-style: none;
    padding: 0;
    margin: 8px 0 0 0;
  }

  .folder-check-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    font-size: 15px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
  }
</style>
