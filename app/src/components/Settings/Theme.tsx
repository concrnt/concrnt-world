import {
    Box,
    Divider,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Typography,
    useTheme
} from '@mui/material'
import { ThemeCreator } from '../ThemeCreator'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type User } from '@concrnt/worldlib'
import { useClient } from '../../context/ClientContext'
import { usePreference } from '../../context/PreferenceContext'
import { type ConcurrentTheme } from '../../model'
import { Themes, loadConcurrentTheme } from '../../themes'
import { DummyMessageView } from '../Message/DummyMessageView'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { ThemeCard } from '../ThemeCard'
import DataObjectIcon from '@mui/icons-material/DataObject'
import SendIcon from '@mui/icons-material/Send'
import { useEditorModal } from '../EditorModal'

export const ThemeSettings = (): JSX.Element => {
    const { client } = useClient()
    const [themeName, setThemeName] = usePreference('themeName')
    const [customThemes, setCustomTheme] = usePreference('customThemes')
    const theme = useTheme<ConcurrentTheme>()
    const { t } = useTranslation('', { keyPrefix: 'ui' })
    const editorModal = useEditorModal()

    const previewTheme: Record<string, ConcurrentTheme> = useMemo(
        () => Object.fromEntries(Object.keys(Themes).map((e) => [e, loadConcurrentTheme(e)])),
        []
    )

    const renderedCustomThemes = useMemo(
        () => Object.fromEntries(Object.keys(customThemes).map((e) => [e, loadConcurrentTheme(e, customThemes)])),
        [customThemes]
    )

    const [themeAuthor, setThemeAuthor] = useState<User | undefined>(undefined)

    const [menuElem, setMenuElem] = useState<[string, null | HTMLElement]>(['', null])

    useEffect(() => {
        if (theme.meta?.author) {
            client
                .getUser(theme.meta.author)
                .then((e) => {
                    setThemeAuthor(e ?? undefined)
                })
                .catch((_) => {
                    setThemeAuthor(undefined)
                })
        } else {
            setThemeAuthor(undefined)
        }
    }, [theme])

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box py={1}>
                <Typography variant="h3">Current Theme: {themeName}</Typography>
                <Typography variant="h5">Theme Createor:</Typography>
                <Paper
                    sx={{
                        p: 1
                    }}
                    variant="outlined"
                >
                    <DummyMessageView
                        message={{
                            body: theme.meta?.comment ?? 'I made this theme!'
                        }}
                        user={themeAuthor?.profile}
                        timestamp={
                            <Typography
                                sx={{
                                    backgroundColor: 'divider',
                                    color: 'primary.contrastText',
                                    px: 1,
                                    fontSize: '0.75rem'
                                }}
                            >
                                {t('draft.preview')}
                            </Typography>
                        }
                    />
                </Paper>
            </Box>
            <Box display="flex" flexDirection="column" gap={1}>
                <Typography variant="h3">Select Theme:</Typography>
                <Box
                    sx={{
                        display: { xs: 'flex', md: 'grid' },
                        flexFlow: 'column',
                        gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
                        gridAutoRows: '1fr',
                        gap: 1
                    }}
                >
                    {Object.keys(previewTheme).map((e) => (
                        <ThemeCard
                            key={e}
                            theme={previewTheme[e]}
                            onClick={() => {
                                setThemeName(e)
                            }}
                        />
                    ))}
                </Box>
                <Divider />
                <Box
                    sx={{
                        display: { xs: 'flex', md: 'grid' },
                        flexFlow: 'column',
                        gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
                        gridAutoRows: '1fr',
                        gap: 1
                    }}
                >
                    {Object.keys(renderedCustomThemes).map((e) => (
                        <ThemeCard
                            key={e}
                            theme={renderedCustomThemes[e]}
                            onClick={() => {
                                setThemeName(e)
                            }}
                            additionalButton={
                                <IconButton
                                    onClick={(event) => {
                                        setMenuElem([e, event.currentTarget])
                                        event.stopPropagation()
                                    }}
                                    onMouseDown={(event) => {
                                        event.stopPropagation()
                                    }}
                                >
                                    <MoreHorizIcon />
                                </IconButton>
                            }
                        />
                    ))}
                </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
            <ThemeCreator />
            <Menu
                open={Boolean(menuElem[1])}
                onClose={() => {
                    setMenuElem(['', null])
                }}
                anchorEl={menuElem[1]}
            >
                <MenuItem
                    onClick={() => {
                        editorModal.open({
                            draft: `
\`\`\`theme
${JSON.stringify(customThemes[menuElem[0]])}
\`\`\``
                        })
                    }}
                >
                    <ListItemIcon>
                        <SendIcon />
                    </ListItemIcon>
                    <ListItemText>Share</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        window.navigator.clipboard.writeText(JSON.stringify(customThemes[menuElem[0]]))
                    }}
                >
                    <ListItemIcon>
                        <DataObjectIcon />
                    </ListItemIcon>
                    <ListItemText>CopyJson</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        delete customThemes[menuElem[0]]
                        setCustomTheme({ ...customThemes })
                        setMenuElem(['', null])
                    }}
                >
                    <ListItemIcon>
                        <DeleteForeverIcon />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    )
}
