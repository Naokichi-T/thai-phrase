<script>
  // ダミーデータ（あとでSupabaseから取得するデータのイメージ）
  const phrase = {
    id: 1,
    order_symbol: "A-001",
    thai: "สวัสดีครับ",
    japanese: "こんにちは",
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
</style>
