<script>
  import { supabase } from "$lib/supabase";

  // フォームの入力値
  let email = $state("");
  let password = $state("");

  // エラーメッセージ
  let errorMessage = $state("");

  // ログインボタンを押したときの処理
  async function login() {
    errorMessage = "";

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      errorMessage = "ログインに失敗しました：" + error.message;
      return;
    }

    // ログイン成功したらトップページに移動
    window.location.href = "/";
  }
</script>

<div class="container">
  <div class="login-card">
    <h1>ログイン</h1>

    <!-- エラーメッセージ -->
    {#if errorMessage}
      <p class="error">{errorMessage}</p>
    {/if}

    <!-- メールアドレス入力 -->
    <label>
      メールアドレス
      <input type="email" bind:value={email} />
    </label>

    <!-- パスワード入力 -->
    <label>
      パスワード
      <input type="password" bind:value={password} />
    </label>

    <!-- ログインボタン -->
    <button onclick={login}>ログイン</button>
  </div>
</div>

<style>
  .container {
    display: flex;
    justify-content: center;
    padding: 48px 16px;
  }

  .login-card {
    width: 100%;
    max-width: 400px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  h1 {
    font-size: 20px;
    margin: 0;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
    color: #666;
  }

  input {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    font-family: "Sarabun", sans-serif;
  }

  button {
    padding: 12px;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    font-family: "Sarabun", sans-serif;
  }

  button:hover {
    background: #43a047;
  }

  .error {
    color: #c62828;
    font-size: 14px;
    margin: 0;
  }
</style>
