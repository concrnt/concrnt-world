# Keep/Library 改造 1フェーズ実行指示（保存版）

pnpm workspace（app/client/cfm）前提、`pnpm i` → `pnpm dev` で起動可能状態を維持しながら進める。

（本書は `concurrent-arakoshi-world.md` の実装指向版）

## 全体ルール

1. 破壊的変更を避け、常に動作する状態を保って次フェーズへ進む。  
2. Keep/Bookmark は内部データを `Library` で統一し、画面ラベルだけを使い分ける。  
3. Watch/Ack の解除は「原因追跡 (`managed`)」ありのみ実施し、手動操作は保持する。  
4. KV 書き込みは集中処理（デバウンス or 差分）して負荷を抑える。  
5. 各フェーズで DoD を満たしてから次へ進む。  

## フェーズ0: 現状把握と共通前提の固定

1. 対象ファイルの責務を確認し、既存 API の呼び出しを明文化する。  
   - WatchButton/AckButton の呼び出し条件を維持しつつ再利用する。  
   - CCPostEditor の下書き永続化 (`usePersistent`) と投稿フロー抽出方針を決める。  
   - PreferenceContext の KV 書き込み方式を Library 保存方針（同期 or ローカル）へ分離する設計を決定する。  
2. DoD: 主要既存コンポーネントの既存挙動を壊さず、画面遷移と保存先方針をチーム内で合意。  

## フェーズ1: Library モデルとコンテキスト基盤

1. `LibraryItem` 型定義（`kind`, `ref`, `pinned`, `marked`, `folderId`, `tags`, `memo`, `display`, `managed`）を追加し `LibraryContext` を作成。  
2. 永続化インターフェースを `get/set` で抽象化し将来の保存先切替に備える。  
3. `keep`, `unkeep`, `updateItem`, `togglePin`, `toggleMark`, `moveFolder`, `setTags`, `setMemo` を実装。  
4. DoD: `LibraryContext` 単体で追加・更新・削除ができ、UI なしで型整合が崩れない。  

## フェーズ2: /library ルートと Keep 画面

1. `App.tsx` に `/library` を追加し、`Users / Communities / Messages` タブ付き画面を作る。  
2. 表示順を `pinned` → `marked` → `keptAt/updatedAt` 降順に統一。  
3. 各行に `Keep解除`, `Watchトグル(User/Community)`, `Ackトグル(User)`, `Mark`, `Pin`, `編集(タグ/フォルダ/メモ)` を配置。  
4. DoD: 画面遷移し、対象別一覧とアクションが既存 API で動作する。  

## フェーズ3: User/Community/Message への Keep 導線追加

1. `Profile.tsx` の既存アクションに Keep を追加（Watch/Ack がある画面に近接）。  
2. `TimelineHeader.tsx` の `useRawSecondaryAction` を使って Watch トグルと Keep トグルをヘッダへ追加。  
3. `MessageActions.tsx` に Keep メニュー項目を追加し、メッセージ単位での Keep/Unkeep を実現。  
4. DoD: 既存ボタンの文言・挙動を壊さず、Keep が各画面から操作可能。  

## フェーズ4: Keep→Watch/Ack のデフォルト同時操作

1. `kind` に応じた既定オプションを定義。  
   - Community/User: Keep + Watch を主ボタン、User は Ack 併用も可能。  
   - Message: Keep のみを基本、必要時に Watch 先の選択肢（投稿者 home / postedTimelines）を付与。  
2. Keep 時に `LibraryItem.managed` を記録（`watchTargets`, `ack`）。  
3. DoD: Keep 時に Watch/Ack 連動が実行され、`managed` が保存される。  

## フェーズ5: Unkeep の安全な解除（managed 働いているもののみ）

1. Unkeep 時に `managed.watchTargets` があれば unsubscribe、`managed.ack === true` なら `user.UnAck()` を実行。  
2. 手動で付けた Watch/Ack を残すため、`managed` 未設定は解除対象外。  
3. 例外時のロールバックと失敗通知（どの watch を外せなかったか）を最小実装。  
4. DoD: Keep 解除時に手動 Watch/Ack が消えないことを再現テスト。  

## フェーズ6: フォルダ/タグ/一括操作導線

1. `Folder` と `TagRule` を導入（`folderId === null` が未分類）。  
2. Keep 画面か設定画面で「フォルダ作成」「タグ付与」「未分類」UI を追加。  
3. タグ/フォルダ単位で Watch 一括 `subscribe/unsubscribe`（User は `homeTimeline`, Community は `timeline.fqid`）。  
4. タグ単位 Ack は User のみ一括実行。  
5. DoD: 一括対象数と結果ステータスを UI で確認。  

## フェーズ7: 表示制御の適用（blur/omit/hide）

1. Message 描画入口（`MessageContainer` / `MessageViewBase`）で display 判定を追加。  
2. `author` と `postedTimelines` から `Library/TagRule` を O(1) 参照する Map 正規化。  
3. `omit/hide/blur` を反映し、`OneLineMessageView` を基準形として組み込む。  
4. DoD: Hot path での再計算増加を抑えた表示差分を再現。  

## フェーズ8: Draft の複数化（案B）

1. `CCPostEditor` の永続キーを `draftId` 引数で切替可能にし、`usePersistent('draft')` を `usePersistent('draft:'+draftId)` 化。  
2. Draft 一覧（id+メタ）画面/パネルを追加し、作成/更新時刻ソート、編集、削除、ピンを実装。  
3. `EditorModal.open({ draft })` で編集開始を統一。  
4. DoD: 既存単一下書き互換を壊さず複数下書きを作成/再開。  

## フェーズ9: 予約投稿

1. `ScheduledPost` をローカル保存（`draftId` 参照 or 本文内包）で登録。  
2. 起動時スキャン＋`setInterval` で期限到来投稿を順次実行。  
3. 投稿処理は `CCPostEditor` の既存ロジックを抽出して再利用。  
4. DoD: 期限到達後に自動投稿され、失敗時の再試行 or 通知が確認できる。  

## フェーズ10: ホーム/Watch 表現の整合 + 最終統合

1. 既存 `ListPage` を「ホーム（Watch 一覧）」として文言・導線を合わせる。  
2. Timeline 側を Watch トグル標準化し Keep/Bookmark 文脈を揃える。  
3. `pinned` を全画面（User/Community/Message/Draft）で共通扱いにし `Library` と同期。  
4. DoD: 主要画面で Keep/Ping/Watch の体験差を縮め、重要機能退行なし。  

## フェーズ11: 品質固めと運用移行

1. `managed` 付き項目向け移行スクリプト（既存 Keep データの初期値処理）を実装。  
2. 誤解除事故防止のため KV 書き込みは `flush`/デバウンス。  
3. 最低限受け入れテストを手順化し、シナリオ実施。  
4. DoD: 片方向依存や誤解除事故が再現しない状態でリリース可。  
