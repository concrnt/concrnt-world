# AGENT_BRIEF（最短実行版）

この文書は、担当エージェントへ渡す最短の運用要件です。

## 守ること（固定）

- `world.concurrent.arakoshi.*` namespaceのみを使用する  
- localStorage / IndexedDB のキーも `concurrent-arakoshi` 系で分離する  
- `upstream` への書き戻しは行わない（逆方向同期は保留）

## 各対象種別の既定動作

- User Keep: Ack は Watch と独立して実行する（subId 未解決時でも Ack は発火）
- Timeline Keep: Watch を managed として記録する
- Message Keep: Keep 後に Watch Author snackbar を表示。Watch 実行時は message アイテムの `managed.watchTargets` に記録し、Unkeep cleanup 対象とする
- `watchManaged` は既存アイテムの managed 更新のみ行い、不要な timeline エントリの自動生成は行わない
- Unkeep で外すのは `managed` に起因した Watch/Ack のみとする

## 画面追加

- `/library`（実装上のルート名）を追加（User / Community / Message のタブ切替）
- 旧要件では `/keep` 表記のため、`/library` を実体として扱う
- Message は「省略・展開」表示を必須とする

## 下書き・予約投稿

- 下書きは複数管理
- Pin をサポート
- 作成日・更新日ソート
- 予約投稿は次回起動時再実行を行う
- /drafts 画面にホーム同等のインライン `CCPostEditor` を追加（その場で下書き保存）
- インライン投稿は同一ページ上で完結し、送信ボタンは下書きの新規作成/更新として扱う
- 保存時は既存エントリと連動して `draftKey` ベースで永続化し、入力欄は保存後に初期化して連続入力しやすくする
- Draft 削除時は `draftKey` 単位の localStorage キー（draft/draftEmojis/draftMedias）を全て破棄する
- 予約投稿は `inFlightRef` で重複送信を防止する

## エラーハンドリング

- Keep解除時の Watch/Ack 解除は部分失敗を許容
- 失敗分は `cleanupFailed` フラグ付きでアイテムを保持し、再試行可能な状態で残す

## i18n

- Keep/Unkeep スナックバー文言は全て `ui.messageActions` 配下の i18n キーで管理する（6 言語対応済み）
- ハードコード文字列は残さない

## Phase 11 完了条件

- watchSubs → watchTargets マイグレーションが起動時に再現的にログ出力される
- 主要シナリオで二重購読・欠損購読がないこと（manual-acceptance 20 項目 Pass）
- `world.concurrent.arakoshi.*` namespace 以外への KV 書き込みがないこと

## 次フェーズ追加条件（提案）

- `/drafts` にホーム同等のエディタを追加し、`draftKey` 起点のその場保存（下書き追加/更新）を実装
- `Case 21`（DraftsPage インライン投稿）を manual-acceptance に追加・合格
