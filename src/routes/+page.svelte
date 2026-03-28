<script>
  // --- 状態変数 ---
  let status = $state(null); // カードのステータス（null / "ok" / "ng" / "pending"）
  let isFavorite = $state(false); // trueのとき★、falseのとき☆

  // ダミーデータ（あとでSupabaseから取得するデータのイメージ）
  const phrase = {
    id: 1,
    order_symbol: "A-001",
    thai: "ใครๆก็อยากมีความสุข",
    japanese: "誰もが幸せになりたい。",
    audio_th: "00001_th.mp3",
    audio_ja: "00001_ja.mp3",
  };

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
</script>

<!-- ページ全体のコンテナ -->
<div class="container">
  <!-- カード本体 -->
  <div class="card">
    <!-- お気に入りボタン：カード右上に配置 -->
    <button class="favorite-btn" onclick={() => (isFavorite = !isFavorite)}>
      {isFavorite ? "★" : "☆"}
    </button>
    <!-- 表示順の記号 -->
    <p class="order">{phrase.order_symbol}</p>

    <!-- タイ語フレーズ -->
    <p class="thai">{phrase.thai}</p>

    <!-- タイ語の音声ボタン -->
    <button class="audio-btn" onclick={() => playAudio(phrase.audio_th)}> 🔊 タイ語 </button>

    <!-- 区切り線 -->
    <hr />

    <!-- 日本語フレーズ -->
    <p class="japanese">{phrase.japanese}</p>

    <!-- 日本語の音声ボタン -->
    <button class="audio-btn" onclick={() => playAudio(phrase.audio_ja)}> 🔊 日本語 </button>

    <!-- ステータスボタン -->
    <div class="status-buttons">
      <!-- 押したボタンに応じてactiveクラスをつける -->
      <button class="status-btn ok {status === 'ok' ? 'active' : ''}" onclick={() => (status = "ok")}>OK</button>

      <button class="status-btn ng {status === 'ng' ? 'active' : ''}" onclick={() => (status = "ng")}>NG</button>

      <button class="status-btn pending {status === 'pending' ? 'active' : ''}" onclick={() => (status = "pending")}>保留</button>
    </div>
  </div>
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

  /* タイ語：20px、Sarabunフォント */
  .thai {
    font-family: "Sarabun", sans-serif;
    font-size: 20px;
    margin: 0 0 8px 0;
    line-height: 1.6;
  }

  /* 日本語：18px */
  .japanese {
    font-family: "Sarabun", sans-serif;
    font-size: 18px;
    margin: 0 0 8px 0;
    line-height: 1.6;
  }

  /* 音声ボタン */
  .audio-btn {
    background: #f0f0f0;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .audio-btn:hover {
    background: #e0e0e0;
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
</style>
