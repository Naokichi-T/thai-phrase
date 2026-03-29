<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { loadSettings, saveSettings } from "$lib/settings";

  // 設定値
  let settings = $state(loadSettings());

  // 設定が変わるたびに自動でlocalStorageに保存する
  $effect(() => {
    saveSettings(settings);
  });

  // ログアウト処理
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
</script>

<div class="container">
  <!-- 戻るボタン -->
  <h1 class="title">設定</h1>

  <div class="settings-list">
    <!-- タイ語の再生スピード -->
    <div class="setting-item">
      <p class="setting-label">
        タイ語の再生スピード
        <span class="speed-value">{settings.speedThai.toFixed(2)}x</span>
      </p>
      <!-- min:最小値 max:最大値 step:刻み幅 -->
      <input type="range" class="slider" min={0.7} max={1.3} step={0.05} bind:value={settings.speedThai} />
      <div class="slider-labels">
        <span>0.70</span>
        <span>1.00</span>
        <span>1.30</span>
      </div>
    </div>

    <hr />

    <!-- 日本語の再生スピード -->
    <div class="setting-item">
      <p class="setting-label">
        日本語の再生スピード
        <span class="speed-value">{settings.speedJapanese.toFixed(2)}x</span>
      </p>
      <input type="range" class="slider" min={0.7} max={1.3} step={0.05} bind:value={settings.speedJapanese} />
      <div class="slider-labels">
        <span>0.70</span>
        <span>1.00</span>
        <span>1.30</span>
      </div>
    </div>

    <hr />

    <!-- カードを開いたら自動再生 -->
    <div class="setting-item">
      <p class="setting-label">カードを開いたら自動再生</p>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" class="toggle" bind:checked={settings.autoPlayThai} />
          タイ語
        </label>
        <label class="checkbox-label">
          <input type="checkbox" class="toggle" bind:checked={settings.autoPlayJapanese} />
          日本語
        </label>
      </div>

      <!-- タイ語・日本語どちらもONのときだけ再生順を表示 -->
      {#if settings.autoPlayThai && settings.autoPlayJapanese}
        <div class="radio-group" style="margin-top: 12px">
          <!-- ラジオボタン（再生順） -->
          <p class="setting-label" style="font-size: 14px; color: #999; margin: 0 0 8px 0">再生順</p>
          <label class="radio-label">
            <input type="radio" bind:group={settings.autoPlayOrder} value="thai_first" />
            タイ語 → 日本語
          </label>
          <label class="radio-label">
            <input type="radio" bind:group={settings.autoPlayOrder} value="japanese_first" />
            日本語 → タイ語
          </label>
        </div>

        <!-- 間隔設定 -->
        <div class="setting-row" style="margin-top: 12px">
          <p class="setting-label" style="font-size: 14px; color: #999; margin: 0">タイ語・日本語間の間隔</p>
          <div class="number-input">
            <button onclick={() => (settings.intervalBetweenAudio = Math.max(0, settings.intervalBetweenAudio - 0.5))}>−</button>
            <span>{settings.intervalBetweenAudio.toFixed(1)}秒</span>
            <button onclick={() => (settings.intervalBetweenAudio = Math.min(5, settings.intervalBetweenAudio + 0.5))}>＋</button>
          </div>
        </div>
      {/if}
    </div>

    <hr />

    <div class="setting-item">
      <!-- 自動送りのON/OFF -->
      <div class="setting-row">
        <p class="setting-label" style="margin: 0">自動送り</p>
        <input type="checkbox" class="toggle" bind:checked={settings.autoAdvanceEnabled} />
      </div>

      <!-- 自動送りがONのときだけ秒数を表示 -->
      {#if settings.autoAdvanceEnabled}
        <div class="setting-row" style="margin-top: 12px">
          <p class="setting-label" style="margin: 0; color: #999; font-size: 14px">音声終了後の待機秒数</p>
          <div class="number-input">
            <button onclick={() => (settings.autoAdvance = Math.max(1, settings.autoAdvance - 1))}>−</button>
            <span>{settings.autoAdvance}秒</span>
            <button onclick={() => (settings.autoAdvance = Math.min(30, settings.autoAdvance + 1))}>＋</button>
          </div>
        </div>
      {/if}
    </div>

    <!-- ループ -->
    <div class="setting-item setting-row">
      <p class="setting-label" style="margin: 0">ループ再生</p>
      <input type="checkbox" class="toggle" bind:checked={settings.loopEnabled} />
    </div>

    <hr />

    <!-- ログアウト -->
    <div class="setting-item">
      <button class="logout-btn" onclick={logout}>ログアウト</button>
    </div>
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 16px;
  }

  /* ヘッダー（タイトル） */
  .title {
    font-family: "Sarabun", sans-serif;
    font-size: 20px;
    margin: 0;
  }

  /* 設定リスト全体 */
  .settings-list {
    width: 100%;
    max-width: 400px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 8px 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  /* 設定項目1つ */
  .setting-item {
    padding: 16px 0;
  }

  /* 横並びの設定項目（ラベル＋コントロール） */
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .setting-label {
    font-family: "Sarabun", sans-serif;
    font-size: 16px;
    margin: 0 0 10px 0;
    color: #333;
  }

  .setting-row .setting-label {
    margin: 0; /* 横並びのときはmarginなし */
  }

  hr {
    border: none;
    border-top: 1px solid #eee;
    margin: 0;
  }

  /* スピード表示（ラベルの右側に現在値） */
  .setting-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .speed-value {
    font-size: 14px;
    color: #999;
    font-weight: normal;
  }

  /* スライダー */
  .slider {
    width: 100%;
    accent-color: #4caf50; /* スライダーの色 */
    margin: 8px 0 4px 0;
  }

  /* スライダーの目盛りラベル */
  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #bbb;
  }

  /* チェックボックス（トグル風） */
  .toggle {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  /* 秒数の増減ボタン */
  .number-input {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .number-input button {
    width: 32px;
    height: 32px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: white;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .number-input button:hover {
    background: #f0f0f0;
  }

  .number-input span {
    font-size: 16px;
    min-width: 40px;
    text-align: center;
  }

  /* ログアウトボタン */
  .logout-btn {
    width: 100%;
    padding: 12px;
    background: white;
    border: 1px solid #f44336;
    border-radius: 8px;
    color: #f44336;
    font-size: 16px;
    font-family: "Sarabun", sans-serif;
    cursor: pointer;
  }

  .logout-btn:hover {
    background: #fdecea;
  }

  /* チェックボックスのグループ */
  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    color: #555;
    cursor: pointer;
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    color: #555;
    cursor: pointer;
  }
</style>
