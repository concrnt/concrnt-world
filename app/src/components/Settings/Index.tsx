import { Typography, Box, Button, Paper, Alert, AlertTitle } from '@mui/material'
import { useClient } from '../../context/ClientContext'
import SettingsIcon from '@mui/icons-material/Settings'
import PaletteIcon from '@mui/icons-material/Palette'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions'
import PhotoIcon from '@mui/icons-material/Photo'
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet'
import BadgeIcon from '@mui/icons-material/Badge'
import QrCodeIcon from '@mui/icons-material/QrCode'
import { useSnackbar } from 'notistack'
import { LogoutButton } from './LogoutButton'
import { IconButtonWithLabel } from '../ui/IconButtonWithLabel'
import { useTranslation } from 'react-i18next'
import ImportExportIcon from '@mui/icons-material/ImportExport'
import EventNoteIcon from '@mui/icons-material/EventNote'
import { useMemo } from 'react'

// @ts-expect-error vite dynamic import
import buildTime from '~build/time'
// @ts-expect-error vite dynamic import
import { branch, sha } from '~build/git'
import { useGlobalState } from '../../context/GlobalState'
import { type Identity } from '@concrnt/client'

const branchName = branch || window.location.host.split('.')[0]

export function SettingsIndex(): JSX.Element {
    const { client } = useClient()
    const { enqueueSnackbar } = useSnackbar()
    const { setSwitchToSub } = useGlobalState()
    const identity: Identity = JSON.parse(localStorage.getItem('Identity') || 'null')

    const { t } = useTranslation('', { keyPrefix: '' })

    const deleteAllCache = (): void => {
        if (window.caches) {
            caches.keys().then((names) => {
                // Delete all the cache files
                names.forEach((name) => {
                    caches.delete(name)
                })
            })
            if (window.indexedDB) {
                const req = window.indexedDB.deleteDatabase('concrnt-client')
                console.log(req)
                req.onsuccess = () => {
                    // reload
                    console.log('deleted')
                    window.location.reload()
                }
                req.onerror = () => {
                    console.log('failed to delete')
                }
            }

            enqueueSnackbar('Cache deleted', { variant: 'success' })
        } else {
            enqueueSnackbar('No cache to delete', { variant: 'info' })
        }
    }

    const isDomainApAvailable = useMemo(() => {
        return 'activitypub' in client.domainServices || 'world.concrnt.ap-bridge' in client.domainServices
    }, [client.domainServices])

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1
            }}
        >
            {identity && (
                <Alert
                    severity="info"
                    action={
                        <Button
                            variant="text"
                            color="inherit"
                            size="small"
                            onClick={() => {
                                setSwitchToSub(true)
                            }}
                        >
                            {t('settings.privileged.action')}
                        </Button>
                    }
                >
                    <AlertTitle>{t('settings.privileged.title')}</AlertTitle>
                    {t('settings.privileged.desc')}
                </Alert>
            )}

            <Paper /* menu */
                variant="outlined"
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: 1,
                    padding: 1
                }}
            >
                <IconButtonWithLabel
                    link
                    icon={SettingsIcon}
                    label={t('settings.general.title')}
                    to="/settings/general"
                />
                <IconButtonWithLabel
                    link
                    icon={AccountCircleIcon}
                    label={t('settings.profile.title')}
                    to="/settings/profile"
                />
                <IconButtonWithLabel
                    link
                    icon={BadgeIcon}
                    label={t('settings.identity.title')}
                    to="/settings/identity"
                />
                <IconButtonWithLabel link icon={PaletteIcon} label={t('settings.theme.title')} to="/settings/theme" />
                <IconButtonWithLabel link icon={VolumeUpIcon} label={t('settings.sound.title')} to="/settings/sound" />
                <IconButtonWithLabel
                    link
                    icon={EmojiEmotionsIcon}
                    label={t('settings.emoji.title')}
                    to="/settings/emoji"
                />
                <IconButtonWithLabel link icon={PhotoIcon} label={t('settings.media.title')} to="/settings/storage" />
                <IconButtonWithLabel
                    link
                    disabled={!isDomainApAvailable}
                    disableMessage={t('settings.ap.notAvailable', { host: client.host })}
                    icon={SettingsEthernetIcon}
                    label={t('settings.ap.title')}
                    to="/settings/activitypub"
                />
                <IconButtonWithLabel link icon={QrCodeIcon} label={t('settings.qr.title')} to="/settings/loginqr" />
                {/*
                <IconButtonWithLabel
                    link
                    icon={HailIcon}
                    label={t('settings.transit.title')}
                    to="/settings/transit"
                />
                */}
                <IconButtonWithLabel
                    link
                    icon={ImportExportIcon}
                    label={t('settings.importexport.title')}
                    to="/settings/importexport/manage"
                />
                <IconButtonWithLabel link icon={EventNoteIcon} label={t('settings.jobs.title')} to="/settings/jobs" />
            </Paper>
            <Paper
                variant="outlined"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    padding: 1
                }}
            >
                <Typography variant="h2" gutterBottom>
                    {t('pages.settings.actions.title')}
                </Typography>

                <Button
                    onClick={(_) => {
                        deleteAllCache()
                    }}
                >
                    {t('pages.settings.actions.clearCache')}
                </Button>
                <Button
                    onClick={(_) => {
                        window.location.reload()
                    }}
                >
                    {t('pages.settings.actions.forceReload')}
                </Button>
                <LogoutButton />
            </Paper>
            <Paper
                variant="outlined"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    padding: 1
                }}
            >
                <Typography variant="h2" gutterBottom>
                    Concrnt-World
                </Typography>
                buildTime: {buildTime.toLocaleString()}
                <br />
                branch: {branchName}
                <br />
                sha: {sha}
            </Paper>
        </Box>
    )
}
