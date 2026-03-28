<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";

  // --- 状態変数 ---
  let status = $state(null); // カードのステータス（null / "ok" / "ng" / "pending"）
  let isFavorite = $state(false); // trueのとき★、falseのとき☆
  let showMemo = $state(false); // メモの開閉状態
  let memoText = $state(""); // メモの内容
  let phrase = $state(null); // 表示するフレーズ（最初はnull、Supabaseから取得したら入る）

  // ページが表示されたときにSupabaseからフレーズを取得する
  // 変更後
  onMount(async () => {
    // ログインしているか確認する
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // ログインしていなければログインページに移動
    if (!session) {
      window.location.href = "/login";
      return;
    }

    // ログインしていればフレーズを取得する
    const { data, error } = await supabase.from("phrases").select("*").eq("id", 1).single();

    if (error) {
      console.error("取得エラー:", error);
      return;
    }

    phrase = data;
  });

  // Supabase StorageのベースURL
  // ファイル名をつなげるだけで音声のURLが完成する
  const STORAGE_BASE_URL = "https://rwimifrjznpyawegcysd.supabase.co/storage/v1/object/public/phrase-audio/";

  /**
   * 音声を再生する関数
   * @param {string} filename - 再生するファイル名（例：00001_th.mp3）
   */
  function playAudio(filename) {
    // URLを組み立てる
    const url = STORAGE_BASE_URL + filename;

    // Audioオブジェクトを作って再生する
    const audio = new Audio(url);
    audio.play();
  }

  /**
   * テキストエリアの高さを内容に合わせて自動調整する関数
   * @param {HTMLTextAreaElement} el - テキストエリアの要素
   */
  function autoResize(el) {
    el.style.height = "auto"; // 一度リセットしてから
    el.style.height = el.scrollHeight + "px"; // 実際の高さに合わせる
  }
</script>

<!-- ページ全体のコンテナ -->
<div class="container">
  <!-- phraseがnullのあいだは「読み込み中」を表示する -->
  {#if phrase === null}
    <p>読み込み中...</p>
  {:else}
    <!-- カード本体 -->
    <div class="card">
      <!-- お気に入りボタン：カード右上に配置 -->
      <button class="favorite-btn" onclick={() => (isFavorite = !isFavorite)}>
        {isFavorite ? "★" : "☆"}
      </button>
      <!-- 表示順の記号 -->
      <p class="order">{phrase.order_symbol}</p>

      <!-- 音声ボタンとタイ語フレーズ -->
      <div class="phrase-row">
        <button class="audio-btn" onclick={() => playAudio(phrase.audio_th)}> 🔊 </button>
        <p class="thai">{phrase.thai}</p>
      </div>

      <!-- 区切り線 -->
      <hr />

      <!-- 音声ボタンと日本語フレーズ -->
      <!-- 変更後 -->
      <div class="phrase-row">
        <button class="audio-btn" onclick={() => playAudio(phrase.audio_ja)}> 🔊 </button>
        <p class="japanese">{phrase.japanese}</p>
      </div>

      <!-- ステータスボタン -->
      <div class="status-buttons">
        <!-- 押したボタンに応じてactiveクラスをつける -->
        <button class="status-btn ok {status === 'ok' ? 'active' : ''}" onclick={() => (status = "ok")}>OK</button>

        <button class="status-btn ng {status === 'ng' ? 'active' : ''}" onclick={() => (status = "ng")}>NG</button>

        <button class="status-btn pending {status === 'pending' ? 'active' : ''}" onclick={() => (status = "pending")}>保留</button>
      </div>

      <!-- メモエリア -->
      <div class="memo-area">
        <!-- ✏️ボタン：押すと入力欄が開閉する -->
        <button class="memo-toggle" onclick={() => (showMemo = !showMemo)}>
          ✏️ {showMemo ? "メモを閉じる" : "メモを開く"}
        </button>

        <!-- showMemoがtrueのときだけ表示する -->
        {#if showMemo}
          <textarea class="memo-input" placeholder="メモを入力..." bind:value={memoText} oninput={(e) => autoResize(e.target)}></textarea>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  /* ページ全体：中央寄せ・余白 */
  .container {
    display: flex;
    justify-content: center;
    padding: 24px 16px;
  }

  /* カード：スマホは画面幅いっぱい、PCは800px */
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

  /* 表示順記号：小さめグレー */
  .order {
    font-size: 12px;
    color: #999;
    margin: 0 0 12px 0;
  }

  /* タイ語 */
  .thai {
    font-family: "Sarabun", sans-serif;
    font-size: 20px;
    margin: 0;
    line-height: 1.6;
  }

  /* 日本語 */
  .japanese {
    font-family: "Sarabun", sans-serif;
    font-size: 18px;
    margin: 0;
    line-height: 1.6;
  }

  /* 音声ボタン */
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
    transform: scale(1.2); /* ホバーで少し大きくなる */
  }

  /* フレーズとボタンを横並びにするコンテナ */
  .phrase-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
  }

  /* 区切り線 */
  hr {
    border: none;
    border-top: 1px solid #eee;
    margin: 16px 0;
  }

  /* ステータスボタンのエリア */
  .status-buttons {
    display: flex;
    gap: 8px;
    margin: 16px 0;
  }

  /* ステータスボタン共通 */
  .status-btn {
    flex: 1; /* 3つを均等幅に */
    padding: 10px;
    border: 2px solid #ddd;
    border-radius: 8px;
    background: white;
    font-size: 16px;
    cursor: pointer;
    font-family: "Sarabun", sans-serif;
  }

  /* OK：緑 */
  .status-btn.ok.active {
    background: #e6f4ea;
    border-color: #4caf50;
    color: #2e7d32;
    font-weight: bold;
  }

  /* NG：赤 */
  .status-btn.ng.active {
    background: #fdecea;
    border-color: #f44336;
    color: #c62828;
    font-weight: bold;
  }

  /* 保留：オレンジ */
  .status-btn.pending.active {
    background: #fff3e0;
    border-color: #ff9800;
    color: #e65100;
    font-weight: bold;
  }

  /* お気に入りボタン：カード右上に固定 */
  .favorite-btn {
    position: absolute; /* カードの中で位置を指定する */
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #f5a623; /* オレンジ系の黄色 */
    line-height: 1;
  }

  .favorite-btn:hover {
    transform: scale(1.2); /* ホバーで少し大きくなる */
  }

  /* メモエリア全体 */
  .memo-area {
    margin-top: 16px;
  }

  /* メモ開閉ボタン */
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

  /* メモ入力欄 */
  .memo-input {
    width: 100%;
    margin-top: 8px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-family: "Sarabun", sans-serif;
    font-size: 18px;
    line-height: 1.6;
    resize: none; /* 手動リサイズを無効にする（自動調整するため） */
    box-sizing: border-box; /* paddingを含めた幅にする */
    min-height: 60px;
  }

  .memo-input:focus {
    outline: none;
    border-color: #aaa;
  }
</style>
