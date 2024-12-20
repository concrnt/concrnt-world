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

export function Tutorial(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'tutorial' })
    const { client } = useClient()

    const tabs = [
        t('tabs.login'),
        t('tabs.post'),
        t('tabs.follow&watch'),
        t('tabs.community'),
        t('tabs.list'),
        t('tabs.customize'),
        t('tabs.done')
    ]

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
                                                    {t('common.next')}
                                                </Button>
                                            }
                                        >
                                            {t('login.congrat')}
                                        </Alert>
                                    </>
                                )}

                                <Typography variant="h1">{t('login.password&login.title')}</Typography>
                                <Typography>{t('login.password&login.desc1')}</Typography>
                                <Typography>{t('login.password&login.desc2')}</Typography>

                                {identity && (
                                    <>
                                        <Typography variant="h2">{t('login.password&login.handsonTitle')}</Typography>
                                        {t('login.password&login.handsonDesc')}
                                        <Suspense fallback={<>loading...</>}>
                                            <SwitchMasterToSub identity={identity} mode="memo" />
                                        </Suspense>
                                    </>
                                )}

                                <Typography variant="h2">{t('login.howtologin.title')}</Typography>

                                <Typography>{t('login.howtologin.desc1')}</Typography>
                                <Typography>{t('login.howtologin.desc2')}</Typography>

                                <Typography variant="h2">{t('login.privmode.title')}</Typography>
                                <Typography>{t('login.privmode.desc1')}</Typography>
                                <Typography>{t('login.privmode.desc2')}</Typography>
                                <Typography>{t('login.privmode.desc3')}</Typography>
                                {identity && (
                                    <>
                                        <Typography variant="h2">{t('login.privmode.handsonTitle')}</Typography>
                                        {t('login.privmode.handsonDesc')}
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
                                        {t('common.next')}
                                    </Button>
                                ) : (
                                    <Button disabled>{t('login.block')}</Button>
                                )}
                            </>
                        )}

                        {page === 1 && (
                            <>
                                <Typography variant="h1">{t('post.title')}</Typography>
                                <Typography>{t('post.desc')}</Typography>

                                <Button
                                    onClick={() => {
                                        editorModal.open({ draft: t('post.handsonContent') })
                                    }}
                                >
                                    {t('post.handsonButton')}
                                </Button>

                                <MarkdownRenderer messagebody={t('post.syntax')} emojiDict={{}} />
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
                                <MarkdownRenderer messagebody={t('follow&watch.desc')} emojiDict={{}} />
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
                                <Typography variant="h1">{t('community.title')}</Typography>
                                <Typography>{t('community.desc1')}</Typography>

                                <StreamCard
                                    sx={{ minWidth: '300px' }}
                                    streamID="tar69vv26r5s4wk0r067v20bvyw@ariake.concrnt.net"
                                    name="Arrival Lounge"
                                    description="コンカレントへようこそ！ここは主にビギナーの方が自分のコミュニティを見つける入口のタイムラインです。困ったら、まずはこのタイムラインをリストに追加してみるのがおススメです。"
                                    banner="https://worldfile.cc/CC2d97694D850Df2089F48E639B4795dD95D2DCE2E/f696009d-f1f0-44f8-83fe-6387946f1b86"
                                    domain="ariake.concrnt.net"
                                />

                                <Typography>
                                    {t('community.desc2before')}
                                    {
                                        <PlaylistAddIcon
                                            sx={{
                                                color: 'text.primary',
                                                verticalAlign: 'middle'
                                            }}
                                        />
                                    }
                                    {t('community.desc2after')}
                                </Typography>

                                <Typography variant="h2">{t('community.postToCommunity.title')}</Typography>
                                <Typography>{t('community.postToCommunity.desc')}</Typography>

                                <Box
                                    component="img"
                                    src={figurePost}
                                    sx={{
                                        maxWidth: '80%',
                                        margin: 'auto'
                                    }}
                                />

                                <Typography variant="h2">{t('community.changeDefault.title')}</Typography>

                                <Typography>
                                    {t('community.changeDefault.descbefore')}
                                    {
                                        <TuneIcon
                                            sx={{
                                                color: 'text.primary',
                                                verticalAlign: 'middle'
                                            }}
                                        />
                                    }
                                    {t('community.changeDefault.descafter')}
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
                                <MarkdownRenderer messagebody={t('list.desc')} emojiDict={{}} />
                                <Button
                                    disabled={progress !== 4}
                                    onClick={() => {
                                        goNext()
                                    }}
                                >
                                    {t('common.next')}
                                </Button>
                            </>
                        )}

                        {page === 5 && (
                            <>
                                <MarkdownRenderer messagebody={t('customize.desc')} emojiDict={{}} />
                                <Button
                                    disabled={progress !== 5}
                                    onClick={() => {
                                        goNext()
                                    }}
                                >
                                    {t('common.next')}
                                </Button>
                            </>
                        )}

                        {page === 6 && (
                            <>
                                <MarkdownRenderer emojiDict={{}} messagebody={t('done.desc')} />

                                <Button
                                    disabled={progress !== 6}
                                    onClick={() => {
                                        editorModal.open({ draft: t('done.handsonContent') })
                                    }}
                                >
                                    {t('done.handsonButton')}
                                </Button>

                                <Button
                                    disabled={progress !== 6}
                                    onClick={() => {
                                        setTutorialCompleted(!tutorialCompleted)
                                    }}
                                >
                                    {tutorialCompleted ? t('done.showTutorial') : t('done.hideTutorial')}
                                </Button>

                                <MarkdownRenderer emojiDict={{}} messagebody={t('done.otherTips')} />
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </>
    )
}
