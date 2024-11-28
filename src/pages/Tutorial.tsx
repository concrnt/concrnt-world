import { Alert, Box, Button, Divider, Tab, Tabs, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useClient } from '../context/ClientContext'
import { usePreference } from '../context/PreferenceContext'
import { Suspense, lazy, useState } from 'react'
import { MarkdownRenderer } from '../components/ui/MarkdownRenderer'
import { type Identity } from '@concurrent-world/client'
import { useEditorModal } from '../components/EditorModal'
import { StreamCard } from '../components/Stream/Card'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import figurePost from '../resources/tutorial-post-to-communities.png'
import figureListSettings from '../resources/tutorial-list-settings.png'
import TuneIcon from '@mui/icons-material/Tune'
import { Helmet } from 'react-helmet-async'

const SwitchMasterToSub = lazy(() => import('../components/SwitchMasterToSub'))

const tabs = ['パスワードとログイン', '投稿', 'フォローとウォッチ', 'コミュニティ', 'リスト', 'カスタマイズ', '完了！']

export function Tutorial(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'pages.tutorial' })
    const { client } = useClient()

    const [progress, setProgress] = usePreference('tutorialProgress')
    const [tutorialCompleted, setTutorialCompleted] = usePreference('tutorialCompleted')
    const [page, setPage] = useState(progress)

    const identity: Identity | null = JSON.parse(localStorage.getItem('Identity') || 'null')

    const editorModal = useEditorModal()

    const goNext = (): void => {
        setPage(page + 1)
        if (page + 1 > progress) setProgress(page + 1)
    }

    return (
        <>
            <Helmet>
                <title>{t('title')} - Concrnt</title>
                <meta name="description" content={t('description')} />
            </Helmet>
            <Box
                sx={{
                    width: '100%',
                    minHeight: '100%',
                    backgroundColor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto'
                }}
            >
                <Box
                    sx={{
                        paddingX: 1,
                        paddingTop: 1
                    }}
                >
                    <Typography variant="h2">
                        {t('title')} {`(${progress + 1}/${tabs.length})`}
                    </Typography>
                    <Divider />
                    <Tabs
                        value={page}
                        onChange={(_, value) => {
                            setPage(value)
                        }}
                        variant="scrollable"
                    >
                        {tabs.map((label, index) => (
                            <Tab key={index} label={label + (progress > index ? '✅' : '')} />
                        ))}
                    </Tabs>
                    <Divider />
                    <Box
                        sx={{
                            padding: { xs: 2, sm: 4, md: 4 },
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                        }}
                    >
                        {page === 0 && (
                            <>
                                {!identity && (
                                    <>
                                        <Alert
                                            severity="success"
                                            action={
                                                <Button
                                                    variant="text"
                                                    color="inherit"
                                                    size="small"
                                                    disabled={progress !== 0}
                                                    onClick={() => {
                                                        goNext()
                                                    }}
                                                >
                                                    次へ
                                                </Button>
                                            }
                                        >
                                            無事に特権モードから通常モードに切り替えることができました！すばらしい！
                                        </Alert>
                                    </>
                                )}

                                <Typography variant="h1">パスワードとログイン</Typography>
                                <Typography>
                                    コンカレントでは、ログインするときに自分で決めるパスワードではなく、決まったパスワードを使います。このパスワードは非常に重要な為、「マスターキー」と呼ばれています。マスターキーは、他人に知られてしまうと取り返しがつかないことになるので、絶対に他人に教えないでください。
                                </Typography>
                                <Typography>
                                    また、マスターキーを無くしてしまった場合、復旧することは決してできず、アカウントを新しく作り直す必要があります。そのため、マスターキーは印刷したりメモしたりして、貴重品として大切に保管してください。
                                </Typography>

                                {identity && (
                                    <>
                                        <Typography variant="h2">マスターキーを保存しよう</Typography>
                                        下のボタンから、自分の好きな方法でマスターキーを安全な場所に保存してください。
                                        <Suspense fallback={<>loading...</>}>
                                            <SwitchMasterToSub identity={identity} mode="memo" />
                                        </Suspense>
                                    </>
                                )}

                                <Typography variant="h2">ログイン方法</Typography>

                                <Typography>
                                    ログインは、トップページのログイン画面からマスターキーを入力して行います。
                                    他にも、QRコードを使ったログイン方法もあります。
                                </Typography>
                                <Typography>
                                    すでにログイン済みの端末の設定&gt;ログインQRからQRコードを表示させ、新しい端末でQRコードを読み取ります。
                                </Typography>

                                <Typography variant="h2">特権モード</Typography>
                                <Typography>
                                    コンカレントでは、マスターキーを入力してログインするとき、特権モードでログインすることができます。
                                    特権モードでは、アカウントの引っ越しや削除など、重要な操作が行えるモードです。
                                </Typography>

                                <Typography>
                                    特権モードである必要がない場合は、画面上部の「特権モード」をクリックすることで端末から秘密情報を忘れさせて、通常モードに切り替えることができます。
                                </Typography>

                                <Typography>
                                    通常モードから特権モードに切り替えるには、一度ログアウトして再度マスターキーを入力してログインする必要があります。
                                </Typography>

                                {identity && (
                                    <>
                                        <Typography variant="h2">特権モードから抜けてみよう</Typography>
                                        登録直後はまだ特権モードになっています。特権モードから通常モードに切り替えてみましょう。
                                        <Suspense fallback={<>loading...</>}>
                                            <SwitchMasterToSub identity={identity} mode="test" />
                                        </Suspense>
                                    </>
                                )}

                                <details>
                                    <summary>より詳しく知りたい人へ</summary>

                                    <Typography>
                                        コンカレントには二種類のパスワードがあります。一つは「マスターキー」、もう一つは「サブキー」です。
                                    </Typography>

                                    <Typography>これは、いわゆる実印とシャチハタのような関係です。</Typography>

                                    <Typography>
                                        コンカレントでは、自分の投稿にデジタルな印鑑を押して、自分の投稿であることを証明しています。
                                    </Typography>

                                    <Typography>
                                        一方で、実印は契約したり銀行からお金を引き下ろしたりなど、非常に強い権限を持っています。これを荷物の受け取りには使いませんよね。
                                    </Typography>

                                    <Typography>
                                        これと同じように、コンカレントでも引っ越しやアカウントの削除などを行う場合はマスターキー、投稿やフォローなどの日常的な操作にはサブキーを使う仕組みになっています。
                                    </Typography>

                                    <Typography>
                                        マスターキーは一度他人に知られてしまえば一巻の終わりですが、サブキーはいつでもその効力を取り消すことができます。
                                    </Typography>
                                </details>

                                {client.api.ckid ? (
                                    <Button
                                        disabled={progress !== 0}
                                        onClick={() => {
                                            goNext()
                                        }}
                                    >
                                        次へ
                                    </Button>
                                ) : (
                                    <Button disabled>
                                        次へ進む前に、特権モードから通常モードへ切り替えてみましょう。
                                    </Button>
                                )}
                            </>
                        )}

                        {page === 1 && (
                            <>
                                <Typography variant="h1">投稿</Typography>

                                <Typography>
                                    デスクトップではデフォルトで画面上部に投稿UIがあります。スマートフォンでは右下のボタンを押すことで投稿画面を表示することができます。
                                    まずは試しに1つ投稿してみましょう。
                                </Typography>

                                <Button
                                    onClick={() => {
                                        editorModal.open({ draft: 'ハロー！コンカレント！' })
                                    }}
                                >
                                    ハロー！コンカレント！ する
                                </Button>

                                <MarkdownRenderer
                                    messagebody={`
## 装飾とプレビュー

コンカレントでは、投稿に記号を使うことで装飾を行うことができます。

例えば、\`**太字**\`と書くことで**太字**にすることができます。

実際に記法がどのように表示されるかは、投稿画面の下部のプレビューでリアルタイムに確認することができます。

## 記法の一覧

- \`# 見出し\`: 見出し (#の数で大きさが変わります)
- \`**太字**\`: **太字**
- \`*斜体*\`: *斜体*
- \`~~取り消し線~~\`: ~~取り消し線~~

`}
                                    emojiDict={{}}
                                />
                                <Button
                                    disabled={progress !== 1}
                                    onClick={() => {
                                        goNext()
                                    }}
                                >
                                    次へ
                                </Button>
                            </>
                        )}

                        {page === 2 && (
                            <>
                                <MarkdownRenderer
                                    messagebody={`
# フォローとウォッチ

コンカレントではいわゆる「フォロー」が、一般的なSNSとは異なる仕組みになっています。
コンカレントでの「フォロー」は、いわゆる「連絡先に追加」のようなものです。知ってる人・興味のある人は積極的にフォローしてみましょう。

一方、「ウォッチ」は、その人を特定のリストに追加し、その人の投稿すべてを見るためのものです。

コンカレントはコミュニティベースなSNSでもあるので、いろんな人を直接ウォッチしてしまうと、タイムラインが雑多に埋まってしまいがちです。
ウォッチは本当に興味のある人だけにするのがおすすめです。

`}
                                    emojiDict={{}}
                                />
                                <Button
                                    disabled={progress !== 2}
                                    onClick={() => {
                                        goNext()
                                    }}
                                >
                                    次へ
                                </Button>
                            </>
                        )}

                        {page === 3 && (
                            <>
                                <Typography variant="h1">コミュニティ</Typography>
                                <Typography>
                                    コンカレントにはコミュニティタイムラインがあります。
                                    コミュニティタイムラインは「探索」タブから探すことができます。1つみつけてみましょう。無ければ、新しく自分で作ってみるのもいいですね。
                                </Typography>

                                <StreamCard
                                    sx={{ minWidth: '300px' }}
                                    streamID="tar69vv26r5s4wk0r067v20bvyw@ariake.concrnt.net"
                                    name="Arrival Lounge"
                                    description="コンカレントへようこそ！ここは主にビギナーの方が自分のコミュニティを見つける入口のタイムラインです。困ったら、まずはこのタイムラインをリストに追加してみるのがおススメです。"
                                    banner="https://worldfile.cc/CC2d97694D850Df2089F48E639B4795dD95D2DCE2E/f696009d-f1f0-44f8-83fe-6387946f1b86"
                                    domain="ariake.concrnt.net"
                                />

                                <Typography>
                                    みつけたら、
                                    {
                                        <PlaylistAddIcon
                                            sx={{
                                                color: 'text.primary',
                                                verticalAlign: 'middle'
                                            }}
                                        />
                                    }
                                    ボタンを押すことでそのコミュニティをリストに追加する(ウォッチする)ことができます。
                                </Typography>

                                <Typography variant="h2">コミュニティへの投稿</Typography>
                                <Typography>
                                    コミュニティをリストに追加していると、普段の投稿UIの投稿先一覧にその候補が追加されます。投稿先はいくつも選ぶことができます。
                                </Typography>

                                <Box
                                    component="img"
                                    src={figurePost}
                                    sx={{
                                        maxWidth: '80%',
                                        margin: 'auto'
                                    }}
                                />

                                <Typography variant="h2">デフォルト投稿先の設定</Typography>

                                <Typography>
                                    自分の腰を据えるコミュニティがあれば、そのコミュニティをデフォルト投稿先に設定しておくと便利でしょう。
                                    リストを表示した状態で、右上の
                                    {
                                        <TuneIcon
                                            sx={{
                                                color: 'text.primary',
                                                verticalAlign: 'middle'
                                            }}
                                        />
                                    }
                                    を押すことで、デフォルト投稿先の設定を行うことができます。
                                </Typography>

                                <Box
                                    component="img"
                                    src={figureListSettings}
                                    sx={{
                                        maxWidth: '80%',
                                        margin: 'auto'
                                    }}
                                />

                                <Button
                                    disabled={progress !== 3}
                                    onClick={() => {
                                        goNext()
                                    }}
                                >
                                    次へ
                                </Button>
                            </>
                        )}

                        {page === 4 && (
                            <>
                                <MarkdownRenderer
                                    messagebody={`
# リスト

複数コミュニティをウォッチしていると、タイムラインが雑多になりすぎてしまうことがあります。
そういう時は、リストを増やして整理しましょう。 メニューの「リスト」からリストの管理画面を開くことができます。

## リストのピン止め

リスト設定から特定のリストをピン止めすることができます。ピン止めをすると、画面上部のタブからいつでもそのリストにアクセスすることができます。

## プリセットとしてのリスト

コンカレントのリストはただまとめるだけではなく、プリセットとして強力に機能します。
たとえば、複数のリストにそれぞれ別のデフォルト投稿先を設定しておくことで、素早く投稿先を切り替えることができます。


`}
                                    emojiDict={{}}
                                />
                                <Button
                                    disabled={progress !== 4}
                                    onClick={() => {
                                        goNext()
                                    }}
                                >
                                    次へ
                                </Button>
                            </>
                        )}

                        {page === 5 && (
                            <>
                                <MarkdownRenderer
                                    messagebody={`
# カスタマイズ

コンカレントでは、様々なカスタマイズ機能があります。

## カラーテーマ
コンカレントのカラーテーマは、設定画面のテーマから変更することができます。また、自分で新しいテーマを作成することも、そしてそのテーマを共有することもできます。
共有されたテーマはタイムライン上でこのように表示されます。
\`\`\`theme
{"meta":{"name":"おりーぶ","author":"con1t0tey8uxhkqkd4wcp4hd4jedt7f0vfhk29xdd2"},"palette":{"primary":{"main":"#292e24","contrastText":"#ffffff"},"secondary":{"main":"#265E2C"},"background":{"default":"#12a129","paper":"#fffcfa","contrastText":"#292e24"},"text":{"primary":"#292e24","secondary":"#265E2C","hint":"rgba(41, 46, 36, 0.5)","disabled":"rgba(41, 46, 36, 0.5)"},"divider":"rgba(41, 46, 36, 0.12)"},"components":{"MuiButton":{"defaultProps":{"variant":"contained","disableElevation":false}},"MuiPaper":{"defaultProps":{"variant":"elevation"}},"MuiAppBar":{"defaultProps":{"color":"primary"}}}}
\`\`\`

テーマのインストールボタンを押すことで、すぐにそのテーマを適用することができます。

## 絵文字パック

コンカレントでは投稿の本文やリアクションとして絵文字を使うことができますが、この絵文字は絵文字パックをインストールすることで追加することができます。

共有された絵文字パックはタイムライン上でこのように表示されます。実際にクリックして、絵文字パックをインストールしてみましょう。

<emojipack src="https://emojis.worldfile.cc/worldpack/emojis.json"></emojipack>

また、少し手間が必要ですが、自分で絵文字パックを作成することもできます。詳細は[こちら](https://square.concrnt.net/general/world/emojipack/)を参照してください。


`}
                                    emojiDict={{}}
                                />
                                <Button
                                    disabled={progress !== 5}
                                    onClick={() => {
                                        goNext()
                                    }}
                                >
                                    次へ
                                </Button>
                            </>
                        )}

                        {page === 6 && (
                            <>
                                <MarkdownRenderer
                                    emojiDict={{}}
                                    messagebody={`
# 完了！

これで、コンカレントの基本的な使い方をマスターしました！

これからは、自分の好きなようにコンカレントを使ってみてください。
`}
                                />

                                <Button
                                    disabled={progress !== 6}
                                    onClick={() => {
                                        editorModal.open({ draft: 'コンカレントの使い方をマスターした！' })
                                    }}
                                >
                                    マスターした！ する
                                </Button>

                                <Button
                                    disabled={progress !== 6}
                                    onClick={() => {
                                        setTutorialCompleted(!tutorialCompleted)
                                    }}
                                >
                                    {tutorialCompleted
                                        ? 'メニューにチュートリアルを表示する'
                                        : 'メニューからチュートリアルを非表示にする'}
                                </Button>

                                <MarkdownRenderer
                                    emojiDict={{}}
                                    messagebody={`

## その他Tips

### パスワードマネージャをお使いの方・頻繁にログインする方へ

パスワードマネージャーを使ってコンカレントにログインする場合は、マスターキーではなくサブキーを使う方がオススメです。
これは、パスワードマネージャーが日本語をパスワードとして取り扱う際に難があることがある為・マスターキーによるログインは新しいセッションを作成してしまう為です。

サブキーは、通常モードログイン時に、設定/ID管理からコピーして控えることができます。ログインは、マスターキーによるログインと同じ画面にサブキー向けの入力欄あがるので、そこからログイン可能です。


## その他の機能

### サブプロフィール
コンカレントでは、自分のプロフィールを複数作ることができます。投稿する際に、どのプロフィールで投稿するか選ぶことができます。

### Activitypubとの連携
コンカレントでは、Activitypub連携を有効化することで、ほかのActivitypubに対応したSNS(Mastodon, Misskey, Pleromaなど)と連携することができます。

### データ管理と引っ越し
コンカレントは分散型SNSです。自分のデータを自分で管理することができます。
サーバーがいつ消滅してもいいように、定期的に「設定>データ管理」からデータをエクスポートして、自分の手元に保存しておくと安心です。
また、自分がいるサーバーがサービス終了するときは、ほかのサーバーに引っ越すことができます。

`}
                                />
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </>
    )
}
