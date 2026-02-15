# 実装レビュー: cec93a33

対象コミット: `cec93a33 feat: implement Keep/Library UI/UX with drafts, scheduling, and display rules`
日付: 2026-02-15

## レビュー方針

- 優先度順（High / Medium / Low）
- 実害が大きい順に、ファイル + 行番号で記載
- 指摘は「なぜ問題か / どう修正すべきか」を短く明示

## High

1. `useManagedOperations` の `removeWithCleanup` が `item.ref.fqid` を前提に `unsubscribe` を実行（`app/src/hooks/useManagedOperations.ts:137-140`）
   - `item.kind === 'user'` でも `managed.watchSubs` を保持しているため、`unkeep` 実行時に `fqid` が `undefined` となり `unsubscribe(undefined, subId)` が呼ばれる。
   - 実害: User の Keep を外しても購読解除が機能せず、購読残留が発生。
   - 対応: `item.kind` 毎に解除対象を分岐。`user` の場合は `item.ref.ccid` からユーザー home timeline を解決して解除する、または `managed.watchSubs` を timeline/item 参照付き構造へ正規化。

2. `KeepButton` の `unkeep` が直接 `removeItem` で終わっている（`app/src/components/KeepButton.tsx:12-13, 19-23`）
   - `Profile/Timeline/Message` の導線からの Unkeep では `removeWithCleanup` が使われず、managed 解除が行われない。
   - 実害: 画面ごとに挙動差が生じ、Keep 解除時に Watch/Ack が残る。
   - 対応: `useKeepToggle` 側で `removeWithCleanup` を既定経路にするか、呼び出し側で必ず cleanup 付きAPIに統一。

## Medium

1. User/Timeline の自動 Watch 先選定が `listedSubscriptions` の先頭固定（`app/src/hooks/useKeepToggle.ts:34-37, 45-52, 60-67`）
   - サブスクリプション一覧の 0 番目に依存すると、意図しない watch 先を選ぶ可能性。
   - 実害: Keep=Watch が実際とは別リストへ飛ぶ、または失敗。
   - 対応: user/homeタイムライン or community.fqid に対して既存の既定ターゲットを確定し、必要なら UI 選択。

2. 予約投稿実行がタブ非表示時に停止（`app/src/hooks/useScheduledPostRunner.ts:18`）
   - `document.hidden` で実行を全面スキップすると、クライアント起動中でも実行漏れしやすい。
   - 実害: 「起動中は投稿」要件と食い違う。
   - 対応: 非表示時は継続実行（visibilitychange で再開時即実行）へ見直し。

3. 投稿失敗時に `scheduledAt` を削除（`app/src/hooks/useScheduledPostRunner.ts:59`）
   - 失敗した予約投稿が再実行不能になる。
   - 実害: 要件の再試行・次回起動再実行との不整合。
   - 対応: 失敗時は `scheduledAt` を維持し、再送回数/最終エラーをメタ情報として保持。

4. Message の `useDisplayRule` が `authorItem.tags` の TagRule のみを参照し、表示制御のタイムライン起点規則を拡張できていない（`app/src/hooks/useDisplayRule.ts:41-49`）
   - 要件でタイムライン/投稿コンテキストを含むルール集約が想定される場合に弱い。
   - 実害: 期待したタグ規則が反映されない。

## Low

1. Message の省略表示が「1行プレースホルダ」仕様としてはある程度成立しているが、`omit` 文言が常時 `mutedByWord` 固定（`app/src/pages/Message/MessageContainer.tsx:336-338`）。
   - 実害: 表示理由を区別しづらい。
   - 対応: `displayRule`/`tag` 由来の理由文字列へ差し替え。

## 補足（現状把握）

- `useDisplayRule` と MessageContainer のループ参照はホットパスでの O(1) Map 化が未実装（要件注記: `app/src/hooks/useDisplayRule.ts`）。
- `app/src/App.tsx` で予約投稿ランナーを全体 Provider 配下に統合済み（`app/src/App.tsx:364-367`）。

## 反映済みの主な成果（高信頼）

- `/library` 画面、Keep 導線、Folder/Tag UI、Drafts、予約投稿、表示制御まで一気通貫で実装済み。
- 多言語追加とルート登録まで一体化。
- ドキュメント側は本レビュー対象コミットを起点に `progress-map` の最新化が必要。
