# Keep/Library リファクタリング 進捗マップ

最終更新: 2026-02-15

## 参照元

- 仕様基準: `concurrent-arakoshi-world.md`
- 実装順: `phase-roadmap-full.md`
- エントリーテンプレ: `phase-03-keep-entrypoints.md` など

## 全体状況

### 完了
- Phase0: 現状把握と共通前提の固定
- Phase1: Library モデルとコンテキスト基盤

### 進行中
- Phase2: /keep ルートと Keep 画面（行内アクション一部残）
- Phase4: Keep→Watch/Ack 同時操作（基盤済み、既定結合は未着手）
- Phase5: Unkeep 安全解除（基盤済み、失敗時 UX は未着手）
- Phase8: Draft 複数化（基盤準備済み、一覧UIは未着手）
- Phase11: 品質固め（基盤の一部実施、移行スクリプトと受け入れテストは未着手）

### 未着手
- Phase3: 各画面への Keep 導線追加
- Phase6: フォルダ/タグ/一括操作
- Phase7: 表示制御（blur/omit/hide）
- Phase9: 予約投稿
- Phase10: ホーム/Watch 表現の整合

## 進捗表現

- `未着手`: まだ未実装
- `一部`: 一部実装済み、残課題あり
- `完了`: 受け入れ条件を満たしている

## 更新ルール（状態変更時）

- 完了条件（DoD）が満たされた時点で `完了` へ更新。
- 機能追加の前提条件（依存）が変わった場合は、下の「未着手/注意点」セクションへ追記。

## Phase2 残タスク
- Keep 行の Watch/Ack トグル追加（User/Community）
- メモ編集 UI（タグ/フォルダ/メモ）

## Phase3 残タスク
- `Profile.tsx` への Keep 導線
- `TimelineHeader.tsx` への Keep 導線
- `MessageActions.tsx` への Keep 導線

## Phase4 残タスク
- Kind 別の既定動作設計
  - user: Keep + Watch、必要時 Ack
  - timeline: Keep + Watch
  - message: Keep のみ（追加 Watch は任意）
- 既定オプションのUI

## Phase5 残タスク
- removeWithCleanup の部分失敗ハンドリング
- 再試行・エラー表示

## Phase6~10: 注意点

- Phase6: `Folder`/`TagRule` はデータ層あり。UI整備と一括操作の副作用ログが必要
- Phase7: Message 描画のホットパス。O(1) Map 化を優先
- Phase9: `usePostAction` からの再利用を前提にスケジューラ実装
- Phase10: UI 文言と導線をWatch観点に寄せる（既存List構造は維持）

## 更新手順

1. 担当エージェントは更新時に該当Phaseの状態だけを編集
2. 変更内容を「完了条件」「未着手」「リスク」の3項目で追記
3. 他Phaseへ影響が出る場合は、リンク先ファイル名を追記
