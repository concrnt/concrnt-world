# concurrent-arakoshi-world 実験改変 要件（最新版）

## 1) 目的

`concrnt-world` をフォークし、実験的な追加・変更を実装する。
ホーム刷新、ブックマーク、情報フロー、下書き・予約投稿などを含む。

## 2) ガードレール（必須）

- キー名前空間分離
  - KV: `world.concurrent.arakoshi.*`
  - localStorage / IndexedDB: `concurrent-arakoshi-*` 系で分離
  - 本家側 (`world.concurrent.*`) と同居しても衝突しないようにする
- 本家からのインポート機能は用意する
- 逆方向（実験側 → 本家）への接触・書き戻しは保留（実験的追加として接触しない）
- 設定は保存前提で扱う

## 3) 情報フロー

### 3.1 共有原則

- Keep/Bookmark は一本化して管理
- Unkeep（Keep解除）時は「Keep起因の Watch/Ack のみ」を除去する
- `managed` に起源を持たせる

### 3.2 Community

- Keep時の既定候補:
  - Watch ON
  - 表示制御（blur/omit）の設定
  - Mark

### 3.3 User

- Keep時の既定候補:
  - Home timeline の Watch ON
  - Ack ON
  - 表示制御（blur/omit）
  - Mark

### 3.4 Message

- Keep時の既定候補:
  - 投稿者 home timeline の Watch ON
  - 投稿先コミュニティの Watch ON
  - Mark

### 3.5 運用ルール

- Keep + Watch された後に重要性が上がった対象は Mark を付与
- Mark 対象は後続でまとめて Folder / Tag 化しやすい共通ルールで扱う

## 4) 画面・機能要件

### 4.1 Keep 画面

- `/library` で表示
- ユーザー / コミュニティ / メッセージをタブ分け

### 4.2 ホーム

- Home は Watch 対象を表示

### 4.3 コミュニティ画面

- Watch ボタンで Watch のオンオフを切替可能

### 4.4 Pin

- あらゆる画面で Pin が存在すること

### 4.5 Draft

- Community と同等に一覧表示
- 編集・削除
- 予約投稿へセット
- 投稿欄へコピー
- 作成日時順・更新日時順ソート
- 常時上位に固定される Pin

### 4.6 予約投稿

- 予定時刻を過ぎた投稿を自動投稿
- クライアント稼働時は即時実行
- 非稼働時分は次回起動時に追い投稿

### 4.7 Bookmark

- 対象: User / Community / Message を Bookmark
- User 専用:
  - Ack ON/OFF
  - Watch ON/OFF
- 共通:
  - タグ付与
  - フォルダ付与
  - メモ
  - 未分類は `folderId === null` として扱う
- 一括操作:
  - タグ/フォルダ単位で Watch subscribe/unsubscribe
    - User: `user.homeTimeline`
    - Community: `timeline.fqid`
  - User のみ Ack 一括
- タグルール:
  - 画面表示ルールへ反映（blur/omit/hide）

### 4.8 メッセージ表示

- 一行省略表示（OneLine 形式）を追加
- タップで展開して通常表示へ戻す

## 5) 受け入れ基準（抜粋）

- 分離されたキー名で本家データと衝突しない
- Keep/Unkeep が managed 前提で安全に動作する
- Keep 画面、ホーム、Community、Message、Draft の主要導線が動作する
- 予約投稿が次回起動時追従を満たす
- Bookmark のタグ/フォルダ/メモが機能する
