# AGENT_BRIEF（最短実行版）

この文書は、担当エージェントへ渡す最短の運用要件です。

## 守ること（固定）

- `world.concurrent.arakoshi.*` namespaceのみを使用する  
- localStorage / IndexedDB のキーも `concurrent-arakoshi` 系で分離する  
- `upstream` への書き戻しは行わない（逆方向同期は保留）

## 各対象種別の既定動作

- User / Timeline / Message の Keep 時は、`Watch/Ack/Mark` を規定する  
- Unkeep で外すのは `managed` に起因した Watch/Ack のみとする

## 画面追加

- `/keep` を追加（User / Community / Message のタブ切替）  
- Message は「省略・展開」表示を必須とする

## 下書き・予約投稿

- 下書きは複数管理  
- Pin をサポート  
- 作成日・更新日ソート  
- 予約投稿は次回起動時再実行を行う

## エラーハンドリング

- Keep解除時の Watch/Ack 解除は部分失敗を許容  
- 失敗分は再試行可能な状態で残す
