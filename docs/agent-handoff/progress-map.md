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

### 進行中
- Phase10: ホーム/Watch 表現の整合（導線は整備、言語・導線の最終調整残）
- Phase11: 品質固め（移行、受け入れ手順）

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

## 残タスク（重要）

1. Phase11: 既存データ移行（watchSubs の残存検出/洗い替え）の実運用確認と、再起動耐性の検証ログ整備。
2. Phase10/11: Home/Watch 表現の言語・導線の最終整合（最終運用前データ）
