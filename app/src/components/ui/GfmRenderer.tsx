import { useEffect } from 'react'
import { Box, Divider, Tooltip, Typography } from '@mui/material'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Codeblock } from './Codeblock'
import breaks from 'remark-breaks'

import type { EmojiLite } from '../../model'
import { emojiRemarkPlugin } from '../../util'
import { useMediaViewer } from '../../context/MediaViewer'
import { useGlobalState } from '../../context/GlobalState'
import { useAutoSummary } from '../../context/AutoSummaryContext'
import { CCLink } from './CCLink'

export interface GfmRendererProps {
    messagebody: string
    emojiDict: Record<string, EmojiLite>
}

export default function GfmRenderer(props: GfmRendererProps): JSX.Element {
    const { getImageURL } = useGlobalState()
    const mediaViewer = useMediaViewer()
    const summary = useAutoSummary()

    useEffect(() => {
        summary.update()
    }, [props.messagebody])

    return (
        <Box
            sx={{
                width: '100%',
                '& ul': {
                    marginTop: 1,
                    marginBottom: 1,
                    listStyle: 'none',
                    marginLeft: '0.8rem',
                    paddingLeft: 0,
                    fontSize: {
                        xs: '0.9rem',
                        sm: '1rem'
                    },
                    '&:firs-child': {
                        marginTop: 0
                    },
                    '&:last-child': {
                        marginBottom: 0
                    },
                    '& li': {
                        '&::before': {
                            content: '"•"',
                            display: 'inline-block',
                            width: '1em',
                            marginLeft: '-1em',
                            textAlign: 'center',
                            fontSize: {
                                xs: '0.7rem',
                                sm: '0.8rem'
                            },
                            lineHeight: {
                                xs: '0.9rem',
                                sm: '1rem'
                            }
                        }
                    }
                },
                '& ol': {
                    marginTop: 1,
                    marginBottom: 1,
                    marginLeft: {
                        xs: '1.3rem',
                        sm: '1.4rem'
                    },
                    paddingLeft: 0,
                    fontSize: {
                        xs: '0.9rem',
                        sm: '1rem'
                    },
                    '&:first-of-type': {
                        marginTop: 0
                    },
                    '&:last-child': {
                        marginBottom: 0
                    }
                },
                table: {
                    border: '1px #ccc solid',
                    borderCollapse: 'collapse'
                },
                tr: {
                    border: '1px #ccc solid'
                },
                th: {
                    border: '1px #ccc solid',
                    padding: '0.5rem'
                },
                td: {
                    border: '1px #ccc solid',
                    padding: '0.5rem'
                }
            }}
        >
            <Markdown
                remarkPlugins={[breaks, remarkGfm, emojiRemarkPlugin]}
                rehypePlugins={[rehypeRaw]}
                remarkRehypeOptions={{
                    handlers: {
                        emoji: (state, node) => {
                            return {
                                type: 'element',
                                tagName: 'emoji',
                                properties: {
                                    shortcode: node.shortcode
                                },
                                children: state.all(node)
                            }
                        }
                    }
                }}
                components={{
                    p: ({ children }) => (
                        <Typography
                            sx={{
                                fontSize: {
                                    xs: '0.9rem',
                                    sm: '1rem'
                                },
                                mt: 1,
                                mb: 1,
                                '&:first-of-type': {
                                    mt: 0
                                },
                                '&:last-child': {
                                    mb: 0
                                }
                            }}
                        >
                            {children}
                        </Typography>
                    ),
                    h1: ({ children }) => (
                        <Typography
                            sx={{
                                mt: 1.8,
                                mb: 1,
                                '&:first-of-type': {
                                    mt: 0
                                }
                            }}
                            variant="h1"
                        >
                            {children}
                        </Typography>
                    ),
                    h2: ({ children }) => (
                        <Typography
                            sx={{
                                mt: 1.5,
                                mb: 1,
                                '&:first-of-type': {
                                    mt: 0
                                },
                                '&:last-child': {
                                    mb: 0
                                }
                            }}
                            variant="h2"
                        >
                            {children}
                        </Typography>
                    ),
                    h3: ({ children }) => (
                        <Typography
                            sx={{
                                mt: 1,
                                mb: 1,
                                '&:first-of-type': {
                                    mt: 0
                                },
                                '&:last-child': {
                                    mb: 0
                                }
                            }}
                            variant="h3"
                        >
                            {children}
                        </Typography>
                    ),
                    h4: ({ children }) => <Typography variant="h4">{children}</Typography>,
                    h5: ({ children }) => <Typography variant="h5">{children}</Typography>,
                    h6: ({ children }) => <Typography variant="h6">{children}</Typography>,
                    ul: ({ children }) => <ul style={{}}>{children}</ul>,
                    ol: ({ children }) => <ol style={{}}>{children}</ol>,
                    li: ({ children }) => <li style={{ marginLeft: 0 }}>{children}</li>,
                    blockquote: ({ children }) => (
                        <blockquote style={{ margin: 0, paddingLeft: '1rem', borderLeft: '4px solid #ccc' }}>
                            {children}
                        </blockquote>
                    ),
                    hr: () => {
                        return (
                            <Divider
                                sx={{
                                    my: 1
                                }}
                            />
                        )
                    },
                    a: ({ children, href }) => {
                        if (!href) return <></>
                        let matchYoutubeVideo = href?.match(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/)
                        if (!matchYoutubeVideo) matchYoutubeVideo = href?.match(/https:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/)
                        if (matchYoutubeVideo) {
                            return (
                                <Box
                                    component="span"
                                    sx={{
                                        display: 'block',
                                        aspectRatio: '16 / 9',
                                        overflow: 'hidden',
                                        width: '100%',
                                        borderRadius: 1,
                                        maxWidth: '500px'
                                    }}
                                >
                                    <iframe
                                        allowFullScreen
                                        src={`https://www.youtube.com/embed/${matchYoutubeVideo[1]}`}
                                        title="YouTube video player"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            border: 'none'
                                        }}
                                    />
                                </Box>
                            )
                        }

                        return (
                            <CCLink to={href} color="secondary" underline="hover">
                                {children}
                            </CCLink>
                        )
                    },
                    code: ({ node, children }) => {
                        const language = node.position
                            ? props.messagebody
                                  .slice(node.position.start.offset, node.position.end.offset)
                                  .split('\n')[0]
                                  .slice(3)
                            : ''

                        const inline = !node.position || node.position.start.line === node.position.end.line
                        return inline ? (
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
                                {children}
                            </Box>
                        ) : (
                            <Codeblock language={language}>{String(children).replace(/\n$/, '')}</Codeblock>
                        )
                    },
                    img: (props) => {
                        return (
                            <Box
                                {...props}
                                src={getImageURL(props.src)}
                                component="img"
                                maxWidth="100%"
                                borderRadius={1}
                                sx={{
                                    maxHeight: '20vh'
                                }}
                                onClick={(e: Event) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    mediaViewer.openSingle(props.src)
                                }}
                            />
                        )
                    },
                    emoji: ({ shortcode }) => {
                        const emoji = props.emojiDict[shortcode]
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
                                            {shortcode}
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
                            <span>:{shortcode}:</span>
                        )
                    },
                    details: ({ children }) => {
                        return (
                            <details
                                onToggle={() => {
                                    summary.update()
                                }}
                                onClick={(e) => {
                                    e.stopPropagation()
                                }}
                            >
                                {children}
                            </details>
                        )
                    }
                }}
            >
                {props.messagebody}
            </Markdown>
        </Box>
    )
}
