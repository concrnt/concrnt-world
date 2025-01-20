![wordmark](https://github.com/totegamma/concurrent/assets/7270849/44864682-ca2d-427a-b1fb-552ca50bcfce)
### Concrnt: SNSのアカウントをあなたのインターネット人格として確立します。

Concurrent-worldは分散マイクロブログ基盤である[Concrnt](https://github.com/totegamma/concurrent)のwebクライアント実装の1つです。

現在は [concrnt.world](https://concrnt.world)で公開されています。

### 世界は一つ
Concrntを始めるのに、所属するコミュニティを選ぶ必要はありません。
アカウントを作成すれば、誰とでもつながることができ、好きな話題同士で集まったコミュニティタイムラインで交流できます。

### 環境は無数
発信する内容はどうしてもそのサーバーが設置してある国や、運用している団体により検閲・制限されてしまいます。
これ自体は仕方ないことですが、利用者としては自身が身を置く環境は選びたいものです。
Concrntは分散型なので、自身の発言を管理してくれる「ホスト」を自分で選ぶことができます。もちろん、ホストは自分で建てることもできますよ！

## Getting Started
### 前準備
nodeとpnpmがインストールされている必要があります。  

> [volta](https://volta.sh/) を使うことをお勧めします。
> ```shell
> # package.jsonで指定されているNode.jsをインストールする
> volta install node
> volta install pnpm
> ```

```
pnpm i
```

### devビルド
```
pnpm dev
```
### 本番ビルド
```
pnpm build
```

## Contributing
現在は絶賛開発中な為、PR前にissueの起票をお願いします。

大きいissueを除いて基本的にはissueとPRは1対1対応になるようにします。

issueはその仕様が妥当かどうかの議論に、はPRその実装が妥当かどうかの議論に使います。
