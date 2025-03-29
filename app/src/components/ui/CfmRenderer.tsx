import { useEffect, useState } from 'react'
import { Box, Button, Divider, IconButton, Tooltip, Typography } from '@mui/material'
import { Codeblock } from './Codeblock'
import cfm from '@concrnt/cfm'
import { keyframes } from '@emotion/react'

import type { EmojiLite } from '../../model'
import { CCUserChip } from './CCUserChip'
import { ThemeCard } from '../ThemeCard'
import { closeSnackbar, useSnackbar } from 'notistack'
import { usePreference } from '../../context/PreferenceContext'
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline'
import { EmojipackCard } from '../EmojipackCard'
import ManageSearchIcon from '@mui/icons-material/ManageSearch'
import { useGlobalActions } from '../../context/GlobalActions'
import { TimelineChip } from './TimelineChip'
import { useMediaViewer } from '../../context/MediaViewer'
import { useGlobalState } from '../../context/GlobalState'
import { useAutoSummary } from '../../context/AutoSummaryContext'
import { CCLink } from './CCLink'
import { WellKnownLink } from '../WellKnownLink'

const marquee = keyframes`
    0% {
        transform: translateX(0);
    }
    50% {
        transform: translateX(100%);
    }
    100% {
        transform: translateX(0);
    }
`

const flipMarquee = keyframes`
    0% {
        transform: translateX(0);
    }
    50% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(0);
    }
`

export interface CfmRendererProps {
    messagebody: string
    emojiDict: Record<string, EmojiLite>
}

export interface RenderAstProps {
    ast: any
    emojis: Record<string, EmojiLite>
}

const Spoiler = ({ children }: { children: JSX.Element }) => {
    const [open, setOpen] = useState(false)

    return (
        <Box
            component="span"
            sx={{
                cursor: 'pointer',
                color: open ? 'text.disabled' : 'transparent',
                backgroundColor: open ? 'transparent' : 'text.primary'
            }}
            onClick={(e) => {
                setOpen(!open)
                e.stopPropagation()
            }}
        >
            {children}
        </Box>
    )
}

const RenderAst = ({ ast, emojis }: RenderAstProps): JSX.Element => {
    if (Array.isArray(ast)) {
        return (
            <>
                {ast.map((node: any, i: number) => (
                    <RenderAst key={i} ast={node} emojis={emojis} />
                ))}
            </>
        )
    }

    const actions = useGlobalActions()
    const { getImageURL } = useGlobalState()
    const { enqueueSnackbar } = useSnackbar()
    const mediaViewer = useMediaViewer()
    const summary = useAutoSummary()
    const [themeName, setThemeName] = usePreference('themeName')
    const [customThemes, setCustomThemes] = usePreference('customThemes')

    if (!ast) return <>null</>
    switch (ast.type) {
        case 'newline':
            return <br />
        case 'Line':
            return (
                <>
                    <RenderAst ast={ast.body} emojis={emojis} />
                    <br />
                </>
            )
        case 'Text':
            return ast.body
        case 'Marquee':
            return (
                <Box
                    sx={{
                        width: '100%',
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        sx={{
                            animation: `${marquee} 10s linear infinite`
                        }}
                    >
                        <Box
                            sx={{
                                animation: `${flipMarquee} 10s linear infinite`,
                                width: 'max-content'
                            }}
                        >
                            <RenderAst ast={ast.body} emojis={emojis} />
                        </Box>
                    </Box>
                </Box>
            )
        case 'Italic':
            return (
                <i>
                    <RenderAst ast={ast.body} emojis={emojis} />
                </i>
            )
        case 'Bold':
            return (
                <b>
                    <RenderAst ast={ast.body} emojis={emojis} />
                </b>
            )
        case 'Strike':
            return (
                <s>
                    <RenderAst ast={ast.body} emojis={emojis} />
                </s>
            )
        case 'URL':
            return (
                <WellKnownLink href={ast.body}>
                    <CCLink to={ast.body} color="secondary" underline="hover">
                        {ast.alt || ast.body}
                    </CCLink>
                </WellKnownLink>
            )
        case 'Timeline':
            return <TimelineChip timelineFQID={ast.body} />
        case 'Spoiler':
            return (
                <Spoiler>
                    <RenderAst ast={ast.body} emojis={emojis} />
                </Spoiler>
            )
        case 'Quote':
            return (
                <blockquote style={{ margin: 0, paddingLeft: '1rem', borderLeft: '4px solid #ccc' }}>
                    <RenderAst ast={ast.body} emojis={emojis} />
                </blockquote>
            )
        case 'Tag':
            if (ast.body.match(/[0-9a-fA-F]{6}$/)) {
                return (
                    <>
                        <span>{ast.body}</span>
                        <span
                            style={{
                                backgroundColor: '#' + ast.body,
                                width: '1em',
                                height: '1em',
                                display: 'inline-block',
                                marginLeft: '0.25em',
                                borderRadius: '0.2em',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                verticalAlign: '-0.1em',
                                cursor: 'pointer'
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(ast.body)
                                enqueueSnackbar(`Copied: ${ast.body}`, {
                                    autoHideDuration: 1500
                                })
                            }}
                        />
                    </>
                )
            }
            return <span>#{ast.body}</span>
        case 'Mention': {
            if (ast.body.startsWith('con1') && ast.body.length === 42) {
                return <CCUserChip ccid={ast.body} />
            } else {
                return <span>@{ast.body}</span>
            }
        }
        case 'Emoji': {
            const emoji = emojis[ast.body]
            return emoji ? (
                <Tooltip
                    arrow
                    placement="top"
                    title={
                        <Box display="flex" flexDirection="column" alignItems="center">
                            <img
                                src={getImageURL(emoji?.animURL ?? emoji?.imageURL, { maxHeight: 128 })}
                                style={{
                                    height: '5em'
                                }}
                            />
                            <Divider />
                            <Typography variant="caption" align="center">
                                {ast.body}
                            </Typography>
                        </Box>
                    }
                >
                    <img
                        src={getImageURL(emoji?.animURL ?? emoji?.imageURL, { maxHeight: 128 })}
                        style={{
                            height: '1.25em',
                            verticalAlign: '-0.45em',
                            marginBottom: '4px'
                        }}
                    />
                </Tooltip>
            ) : (
                <span>:{ast.body}:</span>
            )
        }
        case 'Details':
            return (
                <details
                    onClick={(e) => e.stopPropagation()}
                    onToggle={() => {
                        summary.update()
                    }}
                >
                    <summary>{ast.summary.body}</summary>
                    <RenderAst ast={ast.body} emojis={emojis} />
                </details>
            )
        case 'InlineCode':
            return (
                <Box
                    component="span"
                    sx={{
                        fontFamily: 'Source Code Pro, monospace',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: 1,
                        border: '0.5px solid #ddd',
                        padding: '0 0.5rem',
                        margin: '0 0.2rem'
                    }}
                >
                    {ast.body}
                </Box>
            )
        case 'Image':
            return (
                <Box
                    src={getImageURL(ast.url)}
                    alt={ast.alt}
                    component="img"
                    maxWidth="100%"
                    borderRadius={1}
                    sx={{
                        maxHeight: '20vh'
                    }}
                    onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        mediaViewer.openSingle(ast.url)
                    }}
                />
            )
        case 'CodeBlock':
            if (ast.lang === 'theme') {
                try {
                    const theme = JSON.parse(String(ast.body))
                    return (
                        <ThemeCard
                            theme={theme}
                            additionalButton={
                                <IconButton
                                    onClick={() => {
                                        if (!theme.meta?.name) return
                                        enqueueSnackbar(`Theme downloaded: ${theme.meta.name}`, {
                                            autoHideDuration: 15000,
                                            action: (key) => (
                                                <Button
                                                    onClick={() => {
                                                        setThemeName(themeName)
                                                        closeSnackbar(key)
                                                    }}
                                                >
                                                    Undo
                                                </Button>
                                            )
                                        })
                                        setThemeName(theme.meta.name)
                                        setCustomThemes({
                                            ...customThemes,
                                            [theme.meta.name]: theme
                                        })
                                    }}
                                    sx={{
                                        color: theme.palette.text.primary
                                    }}
                                >
                                    <DownloadForOfflineIcon />
                                </IconButton>
                            }
                        />
                    )
                } catch (e) {
                    console.error(e)
                }
            }
            return <Codeblock language={ast.lang}>{ast.body}</Codeblock>
        case 'EmojiPack':
            return <EmojipackCard src={ast.body} icon={<ManageSearchIcon />} onClick={actions.openEmojipack} />
        case 'Heading':
            return (
                <Typography variant={`h${ast.level}` as any}>
                    <RenderAst ast={ast.body} emojis={emojis} />
                </Typography>
            )
        default:
            return <>unknown ast type: {ast.type}</>
    }
}

export const CfmRenderer = (props: CfmRendererProps): JSX.Element => {
    const [ast, setAst] = useState<any>(null)
    const summary = useAutoSummary()

    useEffect(() => {
        if (props.messagebody === '') {
            setAst([])
            return
        }
        try {
            setAst(cfm.parse(props.messagebody))
        } catch (e) {
            console.error(e)
            setAst([
                {
                    type: 'Text',
                    body: props.messagebody
                },
                {
                    type: 'Text',
                    body: 'error: ' + JSON.stringify(e)
                }
            ])
        }
    }, [props.messagebody])

    useEffect(() => {
        summary.update()
    }, [ast])

    return (
        <Box
            sx={{
                whiteSpace: 'pre-wrap',
                fontSize: {
                    xs: '0.9rem',
                    sm: '1rem'
                }
            }}
        >
            <RenderAst ast={ast} emojis={props.emojiDict} />
        </Box>
    )
}
