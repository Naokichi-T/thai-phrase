<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { loadSettings } from "$lib/settings";

  let phrases = $state([]); // 未振り分けのフレーズリスト
  let currentIndex = $state(0); // 今表示しているカードの位置
  let phrase = $derived(phrases[currentIndex] ?? null);
  let status = $state(null);
  let isFavorite = $state(false);
  let memoText = $state("");
  let showMemo = $state(false);
  let userId = $state(null);
  let currentAudio = null;
  let isStopped = $state(false);
  let touchStartX = 0;
  let folders = $state([]);
  let selectedFolderIds = $state([]);
  let showFolderPicker = $state(false);

  const STORAGE_BASE_URL = "https://rwimifrjznpyawegcysd.supabase.co/storage/v1/object/public/phrase-audio/";

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;
    if (diff > 50) {
      prevCard();
    } else if (diff < -50) {
      nextCard();
    }
  }

  $effect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  });

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

  function stopAutoAdvance() {
    isStopped = true;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  }

  // フォルダ一覧を取得する
  async function loadFolders() {
    const { data, error } = await supabase.from("folders").select("*").eq("user_id", userId).order("name", { ascending: true });

    if (error) {
      console.error("フォルダ取得エラー:", error);
      return;
    }

    folders = data;
  }

  function buildTree(allFolders, parentId) {
    return allFolders.filter((f) => f.parent_id === parentId).map((f) => ({ ...f, children: buildTree(allFolders, f.id) }));
  }

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

  let flatFolders = $derived(flattenTree(buildTree(folders, null)));

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

    // phrase_foldersに登録されているphrase_idをすべて取得する
    const { data: assigned } = await supabase.from("phrase_folders").select("phrase_id");

    const assignedIds = assigned ? assigned.map((r) => r.phrase_id) : [];

    // フォルダに入っていないフレーズを取得する
    let query = supabase.from("phrases").select("*").order("order_symbol", { ascending: true });

    if (assignedIds.length > 0) {
      query = query.not("id", "in", `(${assignedIds.join(",")})`);
    }

    const { data: phraseData, error: phraseError } = await query;

    if (phraseError) {
      console.error("フレーズ取得エラー:", phraseError);
      return;
    }

    phrases = phraseData;

    if (phrases.length > 0) {
      await loadStatus(phrases[0].id);
    }
  });

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
    if (error) console.error("保存エラー:", error);
  }

  async function setStatus(newStatus) {
    status = newStatus;
    await saveStatus({ status: newStatus });
  }

  async function toggleFavorite() {
    isFavorite = !isFavorite;
    await saveStatus({ is_favorite: isFavorite });
  }

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

    await loadPhraseFolders(phraseId);

    const settings = loadSettings();

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

  async function nextCard() {
    if (currentIndex >= phrases.length - 1) return;
    isStopped = false;
    currentIndex += 1;
    await loadStatus(phrase.id);
  }

  async function prevCard() {
    if (currentIndex <= 0) return;
    isStopped = false;
    currentIndex -= 1;
    await loadStatus(phrase.id);
  }
</script>

<div class="container">
  <h1 class="folder-title">📋 未振り分け</h1>

  {#if phrases.length === 0}
    <p class="empty">未振り分けのフレーズはありません 🎉</p>
  {:else if phrase === null}
    <p>読み込み中...</p>
  {:else}
    <div class="card" role="region" aria-label="フレーズカード">
      <button class="favorite-btn {isFavorite ? 'active' : ''}" onclick={toggleFavorite}>
        {isFavorite ? "★" : "☆"}
      </button>

      <p class="order">{phrase.order_symbol}</p>

      <div class="phrase-row">
        <button class="audio-btn" onclick={() => playAudio(phrase.audio_th, loadSettings().speedThai)}>🔊</button>
        <p class="thai">{phrase.thai}</p>
      </div>

      <hr />

      <div class="phrase-row">
        <button class="audio-btn" onclick={() => playAudio(phrase.audio_ja, loadSettings().speedJapanese)}>🔊</button>
        <p class="japanese">{phrase.japanese}</p>
      </div>

      <div class="status-buttons">
        <button class="status-btn ok {status === 'ok' ? 'active' : ''}" onclick={() => setStatus("ok")}>OK</button>
        <button class="status-btn ng {status === 'ng' ? 'active' : ''}" onclick={() => setStatus("ng")}>NG</button>
        <button class="status-btn pending {status === 'pending' ? 'active' : ''}" onclick={() => setStatus("pending")}>保留</button>
      </div>

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

  .folder-title {
    font-size: 18px;
    margin-bottom: 16px;
    color: #2d2a4a;
  }

  .empty {
    color: #999;
    font-size: 14px;
    margin-top: 40px;
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

  .status-btn.active {
    background: white;
    border-color: #2d2a4a;
    border-width: 2px;
    color: #2d2a4a;
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
    color: #aaa; /* 未お気に入り：グレー */
    line-height: 1;
  }

  .favorite-btn.active {
    color: #2d2a4a;
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
</style>
