<script>
  // ダミーデータ（あとでSupabaseから取得するデータのイメージ）
  const phrase = {
    id: 1,
    order_symbol: "A-001", // 表示順を管理する記号
    thai: "ใครๆก็อยากมีความสุข", // タイ語フレーズ
    japanese: "誰もが幸せになりたい。", // 日本語フレーズ
    audio_th: "00001_th.mp3", // タイ語音声ファイル名
    audio_ja: "00001_ja.mp3", // 日本語音声ファイル名
  };
</script>

<!-- ページ全体のコンテナ -->
<div class="container">
  <!-- カード本体 -->
  <div class="card">
    <!-- 表示順の記号 -->
    <p class="order">{phrase.order_symbol}</p>

    <!-- タイ語フレーズ -->
    <p class="thai">{phrase.thai}</p>

    <!-- タイ語の音声ボタン（まだ動かない） -->
    <button class="audio-btn">🔊 タイ語</button>

    <!-- 区切り線 -->
    <hr />

    <!-- 日本語フレーズ -->
    <p class="japanese">{phrase.japanese}</p>

    <!-- 日本語の音声ボタン（まだ動かない） -->
    <button class="audio-btn">🔊 日本語</button>
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

  /* タイ語：仕様通り18px、Sarabunフォント */
  .thai {
    font-family: "Sarabun", sans-serif;
    font-size: 18px;
    margin: 0 0 8px 0;
    line-height: 1.6;
  }

  /* 日本語：仕様通り16px */
  .japanese {
    font-family: "Sarabun", sans-serif;
    font-size: 16px;
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
