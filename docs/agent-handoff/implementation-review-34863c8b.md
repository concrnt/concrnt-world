# 実装レビュー: 34863c8b

対象コミット: `34863c8b feat: optimize display rule lookups, unify Watch/Pin UI, and finalize acceptance tests`
日付: 2026-02-15

## 要約

`d70f228d` の残件として残っていた「表示制御の最適化」「Timeline 側の Watch 導線」「Pin UI 統一」「受け入れ手順整備」を一括で解消したコミット。

## High

1. `LibraryContext.tsx` に `userByCcid / timelineByFqid / tagRuleByTag` の Map を導入し、`LibraryContextState` から `useDisplayRule` が O(1) 参照できる基盤を追加
- 影響: メッセージ描画ホットパスの `items.find` 繰り返し参照リスクを低減。

2. `useDisplayRule` で Map 参照へ置換
- 影響: 表示ルール適用の主要コストを削減し、既存優先順位（author → timeline → tagRules）を維持。

## Medium

1. TimelinePage ヘッダに WatchButton を追加
- 影響: コミュニティ画面で Watch 一発起動の導線が明確化。

2. KeepPage の Pin を KeepButton ではなく IconButton 化
- 影響: DraftsPage との UI 一貫性が改善。意図しない誤操作が減少。

3. ko/th ロケールの Watching 文言を統一
- 影響: 表示文脈の一貫性向上（common.watching と齟齬解消）。

4. マイグレーションログ追加
- 影響: 古い `watchSubs` から `watchTargets` への移行可視化。

5. manual-acceptance.md 追加
- 影響: 実行・再現手順の明文化。

## 残課題

- `Phase10` 〜 `Phase11` の最終仕様固め（主に Home/Watch の運用表現整合）
- 手順はそろっているため、実環境実施レビュー（実装済みテストケースの実行）を残し。
