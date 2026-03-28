// 設定のデフォルト値
const DEFAULTS = {
  speedThai: 1.0, // タイ語の再生スピード 0.7〜1.3の範囲
  speedJapanese: 1.0, // 日本語の再生スピード 0.7〜1.3の範囲
  autoPlayThai: false, // タイ語を自動再生するか
  autoPlayJapanese: false, // 日本語を自動再生するか
  autoAdvance: 5, // 自動送りの表示秒数
};

// localStorageのキー名
const STORAGE_KEY = "phrase-settings";

/**
 * 設定を読み込む
 * localStorageに保存された値があればそれを、なければデフォルト値を返す
 */
export function loadSettings() {
  if (typeof window === "undefined") return DEFAULTS; // SSR対策

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return { ...DEFAULTS };

  // 保存された値とデフォルト値をマージする
  // （新しい設定項目が増えたときにデフォルト値が補完される）
  return { ...DEFAULTS, ...JSON.parse(saved) };
}

/**
 * 設定を保存する
 * @param {object} settings - 保存する設定値
 */
export function saveSettings(settings) {
  if (typeof window === "undefined") return; // SSR対策
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
