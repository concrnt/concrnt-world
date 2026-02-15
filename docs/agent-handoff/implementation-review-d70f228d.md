# 実装レビュー: d70f228d

対象コミット: `d70f228d fix: address cec93a33 review — watchTargets, cleanup unkeep, scheduled post reliability`
日付: 2026-02-15

## 要約

`cec93a33` の重要課題を解消するための追従修正。High/Medium で指摘していた主原因を収束させ、実装の一貫性を回復している。

## High

1. `LibraryContext.tsx` と `useManagedOperations.ts` で `Managed` を `watchSubs` ではなく `watchTargets: Array<{ fqid, subId }>` 化
   - 影響: User タイプの managed 解放で参照不整合が起きる事故を防止。

2. `useKeepToggle.ts` の `unkeep` を `removeWithCleanup` 経由へ統一
   - 影響: Keep 解除時に managed 由来の Watch/Ack クリーンアップが画面間で一貫実行される。

## Medium

3. `firstSubId` 依存から `findSubIdFor` に置換
   - 影響: Keep 時の既定 watch 先が不定にならない。

4. `document.hidden` 条件削除 + `visibilitychange` で再実行
   - 影響: クライアント稼働時の予約投稿スキップを解消。

5. 予約投稿失敗時の再試行ロジック追加（`retryCount`, `lastError`, `MAX_RETRIES=3`）
   - 影響: 失敗投稿が即消失しない。

6. `MessageContainer.tsx` の omit 表示文言をルール名に合わせて更新

## 残課題（現時点）

- `useDisplayRule` 側の検索最適化（`items.find` / `tagRules.find` の複数ループ）を必要に応じて Map 化。
- `/library` 画面/ホーム整合の最終仕様（文言・挙動）を Phase10/11 で最終確定。
