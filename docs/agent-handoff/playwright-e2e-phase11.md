# Playwright E2E 指示書（Phase 11）

最終目的: `manual-acceptance.md` の20項目を Playwright で再現できる範囲で実行し、結果を記録する。

## 0) 事前準備

- ローカル起動: `pnpm --filter concrnt-world dev`（または `pnpm dev`）
- テスト実行: `pnpm --filter concrnt-world test`（既定で Playwright）
- タイムアウト対策: テスト失敗時は `playwright.config.ts` の `retries` を一時的に 1–2 へ増やして再実行
- テストアカウント/鍵を事前に準備
  - 最低1人ユーザー + 1コミュニティ(タイムライン) + 1投稿が見える状態
  - プロジェクトルートの `.env` に以下の変数をセットすること（`.gitignore` 済み）
    ```
    TEST_SERVER="zyouya.concrnt.net"
    TEST_MASTER_KEY="<ニーモニック12語>"
    TEST_SUBKEY="<concurrent-subkey ...>"
    ```
  - 実際の値はチームメンバーから受け取るか、テスト用アカウントを新規作成する
  - 利用可能なテストデータ（`zyouya.concrnt.net`）
    - コミュニティ: `tz3s5amz6jvxtz0g406bkcb6ym0@zyouya.concrnt.net` (name: "test")
    - コミュニティオーナー: `con1yluxfzeghkf0v462925fxf2d9ksq3ufhudajzc`
    - テストアカウント: `con124hdty8q735t4sxdn5g7205n2h7hnj7t74w4nc` (alaska)
- Local URL: `http://localhost:5173/`

## 1) 実行フロー（重要）

1. `smoketest.spec.ts` で基本導線を事前確認
2. `manual-acceptance.md` の順番に沿って実行（推奨順）

- 推奨順: `1-5 → 6-7 → 12-14 → 8 → 15 → 9-11 → 16 → 17 → 18 → 19 → 20 → Migration Log`

## 2) 実行コマンド

### 2-1. 全件実行（失敗許容）

```bash
cd /Users/orange/git/concurrent-arakoshi-world
pnpm --filter concrnt-world test --reporter=html
```

### 2-2. 1件ずつ実行（安定再現）

```bash
# 例: 現在の最小既存スモークを絞り込み
pnpm --filter concrnt-world test app/tests/smoketest.spec.ts -g "smoke-guest" --project=chromium --headed
pnpm --filter concrnt-world test app/tests/smoketest.spec.ts -g "smoke-loggedin" --project=chromium --headed
```

### 2-3. 視覚デバッグ用（片手実行）

```bash
pnpm --filter concrnt-world exec playwright test app/tests/smoketest.spec.ts --project=chromium --headed --debug
```

## 3) Playwright-cli（半自動）での補助手順

```bash
playwright-cli open http://localhost:5173/
playwright-cli snapshot
playwright-cli console error
playwright-cli click <ref>
playwright-cli fill <ref> "..."
playwright-cli screenshot /tmp/<label>.png
```

## 4) 対象ケース実行指示（20項目）

以下の観点を各ケースで取得し、`manual-acceptance.md` の実行ログへ反映。

### ケース01-05（Keep基礎）
- User Keep/Unkeep（Profile経由）
- Timeline Keep/Unkeep（TimelinePageヘッダ経由）
- Message Keep + Watch Author + Unkeep

### ケース06-07（Keep管理）
- Folder CRUD・振り分け・フィルタ
- Tag/TagRule 作成→表示制御反映（blur）

### ケース08-11（Draft & Schedule）
- Draft一覧作成/Pin/並び/編集
- スケジュール即時・遅延・復帰時送信
- 失敗再試行上限（retry 3）

### ケース12-14（表示制御）
- omit（tap to show）
- hide（非表示）
- ordered sort（pinned > marked > updatedAt）

### ケース15-20（耐久/整合）
- 15: Draft編集がlocalStorage永続化される
- 16: 重複送信防止（inFlight）
- 17: Unkeep部分失敗→cleanupFailed表示→Retry
- 18: Message Watch Author がmessage itemのmanagedに反映
- 19: Draft削除時 localStorageキー削除（draft/draftEmojis/draftMedias）
- 20: User Keep時、subId非解決でもAck独立発火

### Migration Log（Hard Gate）
- DevTools Console で以下ログを確認
  - `[Library] Migrated watchSubs → watchTargets...`
  - `[Library] Dropped legacy watchSubs...`
  - namespace違反ログなし

## 5) 検証観点（合格基準）

- `managed` 限定のUnkeep cleanup が成立すること
- `keep` 処理で副作用（Watch/Ack/Pin/Mark）との整合が壊れないこと
- `manual-acceptance.md` の `Execution Log` へ PASS を埋めること
- 失敗時は `Notes` に
  - 再現手順
  - 画面ID（またはURL）
  - スクショ
  - console error/ネットワークエラー

## 6) 失敗時の最小再試行（最速トリアージ）

1) locator待機不足なら `locator` を増やす（`toBeVisible({ timeout: 30000 })`）
2) セッション維持失敗なら LocalStorage seed の再投入（PrivateKey/Domain/Preference）
3) API連携で不安定なら `--retries=2 --headed` で再実行
4) 依然再現なら該当ケースを `Skip` し、再現手順を最短ログ化
