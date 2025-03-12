import { Divider, Box } from '@mui/material'
import { Route, Routes } from 'react-router-dom'
import { SettingsIndex } from '../components/Settings/Index'
import { GeneralSettings } from '../components/Settings/General'
import { ProfileSettings } from '../components/Settings/Profile'
import { ThemeSettings } from '../components/Settings/Theme'
import { SoundSettings } from '../components/Settings/Sound'
import { EmojiSettings } from '../components/Settings/Emoji'
import { MediaSettings } from '../components/Settings/Media'
import { LoginQR } from '../components/Settings/LoginQR'
import { APSettings } from '../components/Settings/APSettings'
import { IdentitySettings } from '../components/Settings/Identity'
import { BreadcrumbList } from '../components/ui/BreadcrumbList'
import { ImportExport } from '../components/Settings/ImportExport'
import { Jobs } from '../components/Settings/Jobs'
import { Helmet } from 'react-helmet-async'

const pathTitles: Record<string, string> = {
    '/settings': 'settings.title',
    '/settings/general': 'settings.general.title',
    '/settings/profile': 'settings.profile.title',
    '/settings/identity': 'settings.identity.title',
    '/settings/theme': 'settings.theme.title',
    '/settings/sound': 'settings.sound.title',
    '/settings/emoji': 'settings.emoji.title',
    '/settings/storage': 'settings.media.title',
    '/settings/activitypub': 'settings.ap.title',
    '/settings/loginqr': 'settings.qr.title',
    '/settings/importexport': 'settings.importexport.title',
    '/settings/jobs': 'settings.jobs.title'
}

export function Settings(): JSX.Element {
    return (
        <>
            <Helmet>
                <title>Settings - Concrnt</title>
                <meta name="description" content="Settings" />
            </Helmet>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    p: 1,
                    backgroundColor: 'background.paper',
                    minHeight: '100%',
                    overflowX: 'hidden',
                    overflowY: 'scroll'
                }}
            >
                <BreadcrumbList pathTitles={pathTitles} />
                <Divider sx={{ marginBottom: 1 }} />
                <Routes>
                    <Route path="/" element={<SettingsIndex />} />
                    <Route path="/general" element={<GeneralSettings />} />
                    <Route path="/profile" element={<ProfileSettings />} />
                    <Route path="/identity" element={<IdentitySettings />} />
                    <Route path="/theme" element={<ThemeSettings />} />
                    <Route path="/sound" element={<SoundSettings />} />
                    <Route path="/emoji" element={<EmojiSettings />} />
                    <Route path="/storage" element={<MediaSettings />} />
                    <Route path="/activitypub" element={<APSettings />} />
                    <Route path="/loginqr" element={<LoginQR />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/importexport/:tab" element={<ImportExport />} />
                </Routes>
            </Box>
        </>
    )
}
