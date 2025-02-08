import {
    AppBar,
    Box,
    Button,
    Divider,
    IconButton,
    InputAdornment,
    Paper,
    Popover,
    TextField,
    ThemeProvider,
    ToggleButton,
    ToggleButtonGroup,
    Toolbar,
    Typography,
    useTheme
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { type ConcurrentTheme } from '../model'
import { Themes, createConcurrentThemeFromObject } from '../themes'
import { usePreference } from '../context/PreferenceContext'
import { useClient } from '../context/ClientContext'
import { HexColorPicker } from 'react-colorful'
import ColorizeIcon from '@mui/icons-material/Colorize'
import { ConcrntLogoSplitted } from './theming/ConcrntLogo_Splitted'
import { useEditorModal } from './EditorModal'

export interface ColorPickerProps {
    label: string
    value: string
    onChange: (value: string) => void
    color: string
}

export const ColorPicker = (props: ColorPickerProps): JSX.Element => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

    return (
        <Box>
            <TextField
                label={props.label}
                value={props.value}
                onChange={(e) => {
                    props.onChange(e.target.value)
                }}
                sx={{
                    '& .MuiInputBase-root': {
                        color: props.color
                    },
                    '& label': {
                        color: props.color
                    },
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            color: props.color
                        },
                        '&:hover fieldset': {
                            color: props.color
                        },
                        '&.Mui-focused fieldset': {
                            color: props.color
                        }
                    }
                }}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle color picker"
                                onClick={(e) => {
                                    setAnchorEl(e.currentTarget)
                                }}
                            >
                                <ColorizeIcon sx={{ color: props.color }} />
                            </IconButton>
                        </InputAdornment>
                    )
                }}
            />
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => {
                    setAnchorEl(null)
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                }}
                sx={{
                    '& .MuiPaper-root': {
                        bgcolor: 'transparent',
                        overflow: 'hidden'
                    }
                }}
            >
                <HexColorPicker
                    color={props.value}
                    onChange={(color) => {
                        props.onChange(color)
                    }}
                />
            </Popover>
        </Box>
    )
}

export const ThemeCreator = (): JSX.Element => {
    const { client } = useClient()
    const editorModal = useEditorModal()
    const theme = useTheme<ConcurrentTheme>()
    const [currentTheme, setCurrentTheme] = usePreference('themeName')
    const [customThemes, setCustomThemes] = usePreference('customThemes')

    const [title, setTitle] = useState(currentTheme ?? 'My Theme')
    const modifyDisabled = title in Themes
    const themeExists = customThemes[title] !== undefined

    const [contentBackground, setContentBackground] = useState(theme.palette.background.paper)
    const [contentText, setContentText] = useState(theme.palette.text.primary)
    const [contentLink, setContentLink] = useState(theme.palette.text.secondary)

    const [uiBackground, setUiBackground] = useState(theme.palette.primary.main)
    const [uiText, setUiText] = useState(theme.palette.primary.contrastText)

    const [underlayBackground, setUnderlayBackground] = useState(theme.palette.background.default)
    const [underlayText, setUnderlayText] = useState(theme.palette.background.contrastText)

    const [_comment, setComment] = useState<string>(theme.meta?.comment ?? '')

    const [newThemeBase, setNewThemeBase] = useState<any>(theme)

    const [buttonVariant, setButtonVariant] = useState<'contained' | 'outlined' | 'text'>('contained')
    const [paperVariant, setPaperVariant] = useState<'elevation' | 'outlined'>('elevation')
    const [appBarVariant, setAppBarVariant] = useState<'primary' | 'transparent'>('primary')

    const comment = _comment.trim().length > 0 ? _comment : undefined

    useEffect(() => {
        setTitle(currentTheme)
    }, [currentTheme])

    const newTheme = useMemo(() => {
        return createConcurrentThemeFromObject(newThemeBase)
    }, [newThemeBase])

    useEffect(() => {
        setContentBackground(theme.palette.background.paper)
        setContentText(theme.palette.text.primary)
        setContentLink(theme.palette.text.secondary)
        setUiBackground(theme.palette.primary.main)
        setUiText(theme.palette.primary.contrastText)
        setUnderlayBackground(theme.palette.background.default)
        setUnderlayText(theme.palette.background.contrastText)
        setComment(theme.meta?.comment ?? '')
        setButtonVariant(theme.components?.MuiButton?.defaultProps?.variant ?? 'contained')
        setPaperVariant(theme.components?.MuiPaper?.defaultProps?.variant ?? 'elevation')
        setAppBarVariant(theme.components?.MuiAppBar?.defaultProps?.color === 'transparent' ? 'transparent' : 'primary')
    }, [theme])

    const validateColor = (color: string): boolean => {
        // The following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color().
        const regex = /(#[a-zA-Z0-9]{3,6}|(rgb|rgba|hsl|hsla|color)\((\s*\d+(\.\d+)?,?){3,4}\))/i
        return regex.test(color)
    }
    useEffect(() => {
        setNewThemeBase({
            meta: {
                name: title,
                author: client.user?.ccid,
                comment
            },
            palette: {
                primary: {
                    main: validateColor(uiBackground) ? uiBackground : newThemeBase?.palette.primary.main,
                    contrastText: validateColor(uiText) ? uiText : newThemeBase?.palette.primary.contrastText
                },
                secondary: {
                    main: validateColor(contentLink) ? contentLink : newThemeBase?.palette.secondary.main
                },
                background: {
                    default: validateColor(underlayBackground)
                        ? underlayBackground
                        : newThemeBase?.palette.background.default,
                    paper: validateColor(contentBackground)
                        ? contentBackground
                        : newThemeBase?.palette.background.paper,
                    contrastText: validateColor(underlayText)
                        ? underlayText
                        : newThemeBase?.palette.background.contrastText
                },
                text: {
                    primary: validateColor(contentText) ? contentText : newThemeBase?.palette.text.primary,
                    secondary: validateColor(contentLink) ? contentLink : newThemeBase?.palette.text.secondary
                }
            },
            components: {
                MuiButton: {
                    defaultProps: {
                        variant: buttonVariant,
                        disableElevation: paperVariant === 'outlined'
                    }
                },
                MuiPaper: {
                    defaultProps: {
                        variant: paperVariant
                    }
                },
                MuiAppBar: {
                    defaultProps: {
                        color: appBarVariant
                    }
                }
            }
        })
    }, [
        contentBackground,
        contentLink,
        contentText,
        uiBackground,
        uiText,
        underlayBackground,
        underlayText,
        comment,
        buttonVariant,
        paperVariant,
        appBarVariant
    ])

    const serialized = useMemo(() => {
        return JSON.stringify(newThemeBase)
    }, [newThemeBase])

    const color =
        newTheme.components?.MuiAppBar?.defaultProps?.color === 'transparent'
            ? newTheme.palette.primary.main
            : newTheme.palette.primary.contrastText

    return (
        <ThemeProvider theme={newTheme}>
            <Box display="flex" flexDirection="column" gap={1}>
                <Paper
                    variant="outlined"
                    sx={{
                        width: '100%',
                        overflow: 'hidden'
                    }}
                >
                    <AppBar
                        elevation={0}
                        position="relative"
                        sx={{
                            borderLeft: 'none',
                            borderTop: 'none',
                            borderRight: 'none'
                        }}
                    >
                        <Toolbar
                            variant="dense"
                            sx={{
                                color
                            }}
                        >
                            <b>Theme Creator</b>
                        </Toolbar>
                    </AppBar>
                    <Box p={2} display="flex" alignItems="center" gap={2}>
                        <Box
                            sx={{
                                display: 'flex',
                                borderRadius: '100px',
                                background: newTheme.palette.primary.contrastText
                            }}
                        >
                            <ConcrntLogoSplitted
                                size="50px"
                                upperColor={newTheme.palette.primary.main}
                                lowerColor={newTheme.palette.background.default}
                                frameColor={newTheme.palette.background.default}
                            />
                        </Box>
                        <TextField
                            fullWidth
                            value={title}
                            label="Title"
                            onChange={(e) => {
                                setTitle(e.target.value)
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: 'text.disabled'
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'text.primary'
                                    }
                                }
                            }}
                        />
                        <Button
                            sx={{
                                height: '50px'
                            }}
                            onClick={() => {
                                if (themeExists) {
                                    setCustomThemes({
                                        ...customThemes,
                                        [title]: newThemeBase
                                    })
                                } else {
                                    setCustomThemes({
                                        ...customThemes,
                                        [title]: newThemeBase
                                    })
                                }
                                setCurrentTheme(title)
                            }}
                            disabled={modifyDisabled}
                        >
                            {themeExists ? 'Modify' : 'Create'}
                        </Button>
                    </Box>
                    <Divider />
                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'column', md: 'row' }}>
                        <Box
                            sx={{
                                bgcolor: 'background.paper',
                                flexGrow: 1,
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                            }}
                        >
                            <Box height={70}>
                                <Typography color={'text.primary'} variant="h1">
                                    Content
                                </Typography>
                                <Typography color={'text.secondary'} variant="h2">
                                    Link
                                </Typography>
                            </Box>
                            <Divider />

                            <ColorPicker
                                label="Text"
                                value={contentText}
                                onChange={setContentText}
                                color={'text.primary'}
                            />

                            <ColorPicker
                                label="Link"
                                value={contentLink}
                                onChange={setContentLink}
                                color={'text.primary'}
                            />

                            <ColorPicker
                                label="Background"
                                value={contentBackground}
                                onChange={setContentBackground}
                                color={'text.primary'}
                            />
                        </Box>
                        <Box
                            sx={{
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                flexGrow: 1,
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                            }}
                        >
                            <Box height={70}>
                                <Typography color={'primary.contrastText'} variant="h1">
                                    UI
                                </Typography>
                            </Box>
                            <Divider />

                            <ColorPicker
                                label="Text"
                                value={uiText}
                                onChange={setUiText}
                                color={'primary.contrastText'}
                            />

                            <ColorPicker
                                label="Background"
                                value={uiBackground}
                                onChange={setUiBackground}
                                color={'primary.contrastText'}
                            />
                        </Box>
                        <Box
                            sx={{
                                bgcolor: 'background.default',
                                flexGrow: 1,
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                            }}
                        >
                            <Box height={70}>
                                <Typography color={'background.contrastText'} variant="h1">
                                    Underlay
                                </Typography>
                            </Box>
                            <Divider />

                            <ColorPicker
                                label="Text"
                                value={underlayText}
                                onChange={setUnderlayText}
                                color={'background.contrastText'}
                            />

                            <ColorPicker
                                label="Background"
                                value={underlayBackground}
                                onChange={setUnderlayBackground}
                                color={'background.contrastText'}
                            />
                        </Box>
                    </Box>
                    <Divider />
                    <Box p={2} gap={1} display="flex" flexDirection="column">
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}
                            gap={1}
                            flexDirection={{ xs: 'column', sm: 'column', md: 'row' }}
                            alignItems={{ xs: 'flex-start', sm: 'flex-start', md: 'center' }}
                        >
                            <Typography variant="h3">Button Style</Typography>
                            <ToggleButtonGroup
                                value={buttonVariant}
                                exclusive
                                onChange={(_, value) => {
                                    if (value === null) return
                                    setButtonVariant(value)
                                }}
                            >
                                <ToggleButton value="contained">
                                    <Typography>contained</Typography>
                                </ToggleButton>
                                <ToggleButton value="outlined">
                                    <Typography>outlined</Typography>
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}
                            gap={1}
                            flexDirection={{ xs: 'column', sm: 'column', md: 'row' }}
                            alignItems={{ xs: 'flex-start', sm: 'flex-start', md: 'center' }}
                        >
                            <Typography variant="h3">Paper Style</Typography>
                            <ToggleButtonGroup
                                value={paperVariant}
                                exclusive
                                onChange={(_, value) => {
                                    if (value === null) return
                                    setPaperVariant(value)
                                }}
                            >
                                <ToggleButton value="elevation">
                                    <Typography>elevation</Typography>
                                </ToggleButton>
                                <ToggleButton value="outlined">
                                    <Typography>outlined</Typography>
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}
                            gap={1}
                            flexDirection={{ xs: 'column', sm: 'column', md: 'row' }}
                            alignItems={{ xs: 'flex-start', sm: 'flex-start', md: 'center' }}
                        >
                            <Typography variant="h3">AppBar Style</Typography>
                            <ToggleButtonGroup
                                value={appBarVariant}
                                exclusive
                                onChange={(_, value) => {
                                    if (value === null) return
                                    setAppBarVariant(value)
                                }}
                            >
                                <ToggleButton value="primary">
                                    <Typography>default</Typography>
                                </ToggleButton>
                                <ToggleButton value="transparent">
                                    <Typography>transparent</Typography>
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Box>
                    <Divider />
                    <Box p={2}>
                        <Box display="flex" gap={1}>
                            <TextField
                                label="Comment"
                                fullWidth
                                multiline
                                value={_comment}
                                onChange={(e) => {
                                    setComment(e.target.value)
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: 'text.disabled'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'text.primary'
                                        }
                                    }
                                }}
                            />
                            <Button
                                onClick={() => {
                                    editorModal.open({
                                        draft: `
\`\`\`theme
${serialized}
\`\`\``
                                    })
                                }}
                            >
                                Share
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </ThemeProvider>
    )
}
