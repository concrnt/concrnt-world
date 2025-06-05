import { Alert, Box, Button, Divider, Tab, Tabs, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useClient } from '../context/ClientContext'
import { usePreference } from '../context/PreferenceContext'
import { Suspense, lazy, useState } from 'react'
import { type Identity } from '@concrnt/client'
import { useEditorModal } from '../components/EditorModal'
import { TimelineCard } from '../components/TimelineCard'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import figurePost from '../resources/tutorial-post-to-communities.png'
import figureListSettings from '../resources/tutorial-list-settings.png'
import TuneIcon from '@mui/icons-material/Tune'
import { Helmet } from 'react-helmet-async'
import { CfmRenderer } from '../components/ui/CfmRenderer'

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
                                    <summary>{t('details.moreInfo')}</summary>

                                    <Typography>{t('details.twoPasswords')}</Typography>
                                    <Typography>{t('details.sealAnalogy')}</Typography>
                                    <Typography>{t('details.digitalSeal')}</Typography>
                                    <Typography>{t('details.realSeal')}</Typography>
                                    <Typography>{t('details.masterSubUsage')}</Typography>
                                    <Typography>{t('details.masterKeyWarning')}</Typography>
                                </details>

                                {client.ckid ? (
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

                                <CfmRenderer messagebody={t('post.syntax')} emojiDict={{}} />
                                <Button
                                    disabled={progress !== 1}
                                    onClick={() => {
                                        goNext()
                                    }}
                                >
                                    {t('common.next')}
                                </Button>
                            </>
                        )}

                        {page === 2 && (
                            <>
                                <CfmRenderer messagebody={t('follow&watch.desc')} emojiDict={{}} />
                                <Button
                                    disabled={progress !== 2}
                                    onClick={() => {
                                        goNext()
                                    }}
                                >
                                    {t('common.next')}
                                </Button>
                            </>
                        )}

                        {page === 3 && (
                            <>
                                <Typography variant="h1">{t('community.title')}</Typography>
                                <Typography>{t('community.desc1')}</Typography>

                                <TimelineCard
                                    sx={{ minWidth: '300px' }}
                                    timelineFQID="tar69vv26r5s4wk0r067v20bvyw@ariake.concrnt.net"
                                    name="Arrival Lounge"
                                    description={t('community.timelineDescription')}
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
                                    {t('common.next')}
                                </Button>
                            </>
                        )}

                        {page === 4 && (
                            <>
                                <CfmRenderer messagebody={t('list.desc')} emojiDict={{}} />
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
                                <CfmRenderer messagebody={t('customize.desc')} emojiDict={{}} />
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
                                <CfmRenderer emojiDict={{}} messagebody={t('done.desc')} />

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

                                <CfmRenderer emojiDict={{}} messagebody={t('done.otherTips')} />
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </>
    )
}
