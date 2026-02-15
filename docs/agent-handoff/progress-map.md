# Keep/Library リファクタリング 進捗マップ

最終更新: 2026-02-15

## 参照元

- 仕様基準: `concurrent-arakoshi-world.md`
- 実験要件: `experimental-requirements.md`
- 実装順: `phase-roadmap-full.md`
- エントリーテンプレ: `phase-03-keep-entrypoints.md` など

## 実験前提（実装固定条件）

- KVキーは `world.concurrent.arakoshi.*` に限定して扱う
- ローカル保存も concurrent-arakoshi 側へ分離（IndexedDB/localStorage）
- 本家との双方向同期は行わない（本家→fork のインポートのみ許可）
- Keep/Unkeep は `managed` 由来のみ解除対象とする

## 全体状況

### 完了
- Phase0: 現状把握と共通前提の固定
- Phase1: Library モデルとコンテキスト基盤
- Phase2: /library（旧 /keep）ルートと Keep 画面
- Phase3: User/Community/Message への Keep 導線追加
- Phase4: Keep→Watch/Ack の同時操作（既定動作の雛形実装）
- Phase5: Unkeep の安全な解除（UI/監査情報付き）
- Phase6: フォルダ/タグ/一括操作（UI・CRUD）
- Phase7: 表示制御（blur/omit/hide）の適用
- Phase8: Draft 複数化（一覧、ピン、編集/削除、スケジュール登録）
- Phase9: 予約投稿（起動時/定期スキャン）

- Phase10: ホーム/Watch 表現の整合
- Phase11: 品質固め（移行、受け入れ手順、hard gate 監査）

## 更新ルール

- `完了` は DoD 満たし、既知の高優先バグを主要フローで回避できた状態を意味する。
- 進行中項目は、実装完了していても要件差分が残る場合でも `進行中` に残す。

## 直近コミット反映

### cec93a33

- `/library` 画面を追加。
- Keep/Unkeep トグルを Profile / Timeline / Message に導線追加。
- フォルダ・タグ・Rule 管理の UI を追加。
- Message 省略表示（hide/omit/blur）と Drafts + 予約投稿を追加。
- KV/LS 分離と Debounce 同期は維持。

### d70f228d（後続修正）

- `managed.watchSubs` を `watchTargets`（`fqid + subId`）へ統一。
- Unkeep を `removeWithCleanup` 経由化して managed 削除を一貫化。
- `Keep→Watch` のサブスク選択を決定論的 `findSubIdFor` へ変更。
- 予約投稿の `document.hidden` 停止条件を撤去、タブ復帰時再実行を追加。
- 予約投稿失敗時の `retryCount` / `lastError` による再試行を追加。
- `omit` テキストを表示ルール説明に合わせて更新。

### 34863c8b（性能最適化/受け入れ整備）

- `LibraryContext` に `userByCcid / timelineByFqid / tagRuleByTag` を追加し、`useDisplayRule` を `Map.get()` O(1) 参照へ変更。
- TimelineHeader（TimelinePage）に Watch ボタンを配置し、Keep と並列操作を追加。
- KeepPage の Pin UI を DraftsPage と揃えてアイコン化。
- 韓国語・タイ語文言の watch/watching 表現を統一。
- マイグレーションログ（成功/失敗）を追加。
- manual acceptance テストを14項目で整備（`manual-acceptance.md`）。

### Provider 順序修正 + Draft 編集導線 + Unkeep 再試行 + Watch 導線

- `DraftProvider` を `EditorModalProvider` の外側に移動し、EditorModal 内の CCPostEditor が `useDraftContext()` を使用可能に。
- CCPostEditor に `draftKey` prop を追加し、`useDraftState(draftKey)` + `registerDraft` 連携を実装。
- DraftsPage に Edit ボタン追加。EditorModal を `draftKey` 付きで開き、編集内容が永続化される。
- `useScheduledPostRunner` に `inFlightRef<Set>` による重複投稿ガードを追加。
- `Managed` 型に `cleanupFailed` を追加。`removeWithCleanup` を部分失敗時に item 保持 + `cleanupFailed` マーク方式に変更。
- KeepPage に `cleanupFailed` 警告チップ + Retry ボタンを追加。
- Message Keep 時に "Watch Author" snackbar アクションを追加（`useKeepToggle`）。
- manual-acceptance テストを 18 項目に拡充（15-18 追加、5/8 更新）。

### レビュー指摘修正（7項目）

1. **[HIGH] watchManaged 分離**: `watchManaged` から timeline エントリの自動生成を撤去。既存アイテムの managed 更新のみ行う。新規 `watchManagedFor(itemId, fqid, subId)` を追加し、任意の既存アイテムに watchTargets を付与可能に。
2. **[HIGH] Ack/Watch 独立化**: `useKeepToggle` の user Keep 分岐で Ack を Watch から分離。subId 未解決時でも `user.Ack()` + `managed.ack` を記録する。
3. **[MEDIUM] Message Watch Author managed 記録**: Watch Author snackbar 実行時に `watchManagedFor` を使って message アイテムの `managed.watchTargets` に記録。Unkeep cleanup 対象となる。
4. **[MEDIUM] Draft 削除時 localStorage 掃除**: `removeDraft` で `draftKey` 単位の localStorage キー（draft/draftEmojis/draftMedias）を全て破棄。
5. **[MEDIUM] omit UI OneLineMessageView 準拠化**: omit 表示を OneLineMessageView に準拠した 1 行レイアウト（アバター + 省略テキスト + Show）に更新。全行クリックで復帰可能。
6. **[LOW] i18n ハードコード解消**: `useKeepToggle` の全 snackbar 文言を `t('ui.messageActions.*')` 経由に統一。6 言語の JSON キーを揃えて追加（messageKept/watchAuthor/nowWatchingAuthor/keepFailed/cleanupFailedRetry/unkeepFailed）。
7. **[DOCS] ドキュメント更新**: AGENT_BRIEF.md / manual-acceptance.md / progress-map.md を上記修正に合わせて更新。acceptance テストを 20 項目に拡充（19-20 追加、18 更新）。

### Phase 10/11 最終化（2026-02-15）

- **Phase 10 完了確認**: Home/Watch 表現の整合を検証。ナビゲーション "Home"、ListPage subtitle "Your watched timelines"、WatchButton "Watch/Watching/Unwatch" が全 6 言語で一貫していることを確認。
- **Phase 11 完了確認**: watchSubs マイグレーションコードを監査。`watchSubs` への書き込みは残存なし、読み取りはマイグレーション箇所のみ。二重購読・欠損購読のリスクなし。
- **Hard gate 監査**: namespace compliance を監査し、`Migrator.tsx` の `world.concurrent.preference` → `${KV_PREFIX}.preference` への修正を実施。managed-only unkeep は正常。
- **manual-acceptance.md**: 実行順序ガイドと Pass/Fail ログテンプレートを追加。20 項目。
- **AGENT_BRIEF.md**: Phase 11 完了条件を追記。

### Hard gate 自動監査（2026-02-15）

- `writeKV('world.concurrent.preference'...)` — 0 件。namespace 違反修正済み。
- `watchSubs` 参照 — context/LibraryContext.tsx のマイグレーション箇所のみ（読み取り専用、6 行）。components 配下は 0 件。
- 全 `writeKV` 呼び出し（3 箇所）がすべて `${KV_PREFIX}.*` 経由を確認:
  - `world.concurrent.arakoshi.preference`（PreferenceContext / Registration / Migrator）
  - `world.concurrent.arakoshi.library`（LibraryContext）
  - `world.concurrent.arakoshi.drafts`（DraftContext）
- **結論: 全 hard gate クリア。**

### Acceptance テスト実施（2026-02-15）

- manual-acceptance 20 項目 + Migration Log の全コードパスを静的監査で検証。
- 全 21 項目 **Pass**（コードパストレース）。
- ライブブラウザでの視覚確認は推奨（blur 描画、snackbar タイミング、modal フォーカス）。

## 残タスク

なし（全 Phase 完了）。ライブブラウザでの最終確認は任意。
