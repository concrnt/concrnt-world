# Phase 3 引き継ぎテンプレ（Keep 導線追加）

以下をコピーして使ってください。

## 1) 依頼タイトル

`[Phase3] Profile/TimelineHeader/MessageActions へのKeep導線追加`

## 2) 目的

ユーザー画面・タイムラインヘッダ・メッセージアクションから、Keep を1操作で起動できる導線を追加する。
既存の Watch/Ack 機能と衝突しない形で `managed` 連携を維持する。

## 3) 対象範囲

- 触って良いファイル
  - `app/src/components/Profile.tsx`
  - `app/src/components/TimelineHeader.tsx`
  - `app/src/components/Message/MessageActions.tsx`
  - 必要に応じて `app/src/hooks/` 既存 Hook（`useManagedOperations`）の利用
- 絶対触らないファイル
  - （本依頼で未指定のデータ層・ルーティング・設定系）

## 4) 依存前提

- `LibraryContext` が有効
- `useManagedOperations` で `watchManaged`, `ackManaged`, `unwatchManaged`, `unackManaged` が利用可能
- `WatchButton`, `AckButton` は `managed` prop 対応済み

## 5) 実装内容

1. `Profile.tsx`
    - 対象ユーザーIDやHintを取得し Keep/Unkeep を実装
    - 既存の Watch/Ack エリアと同居させる
2. `TimelineHeader.tsx`
    - `secondaryAction` / `useRawSecondaryAction` の既存構造を使い Watch/Keep を並列化
3. `MessageActions.tsx`
    - メニュー項目として Keep/Unkeep を追加
    - メッセージ種別が Keep 対応対象かを判定

## 6) 完了条件（DoD）

- 3ファイルすべてで Keep が動作する
- Keep 追加時に `managed` が必要なら追記される（watchTargets / ack）
- Unkeep 時に managed 由来だけが解除対象になる
- 既存の Watch/Ack ボタン挙動が壊れていない

## 7) 受け入れ確認手順

1. Userプロフィールで Keep 追加/解除
2. TimelineHeader で Keep 追加/解除
3. メッセージアクションで Keep 追加/解除
4. 手動で Watch/Ack した対象がある状態で Keep を解除し、手動副作用が残ることを確認

## 8) 想定リスク

- `timeline.fqid` と投稿先 timelines の参照先違い
- 既存ヘッダアクションとのレイアウト崩れ
- メッセージの種別判定不一致

## 9) 補足（必要なら）

- 追加のUI仕様（アイコン/文言）があればこの項目に追記
- TODO と保留が発生した場合は明示的に `保留理由` を添付
