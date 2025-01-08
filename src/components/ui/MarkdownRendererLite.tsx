import { type ImgHTMLAttributes, type DetailedHTMLProps } from 'react'
import { Box, Link, Typography } from '@mui/material'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import { type ReactMarkdownProps } from 'react-markdown/lib/ast-to-react'
import breaks from 'remark-breaks'

import type { EmojiLite } from '../../model'
import {
    userMentionRemarkPlugin,
    emojiRemarkPlugin,
    streamLinkRemarkPlugin,
    literalLinkRemarkPlugin,
    strikeThroughRemarkPlugin
} from '../../util'
import { CCUserChip } from './CCUserChip'
import { LinkChip } from './LinkChip'
import { TimelineChip } from './TimelineChip'
import { useGlobalState } from '../../context/GlobalState'
import { CCLink } from './CCLink'

export interface MarkdownRendererProps {
    messagebody: string
    emojiDict: Record<string, EmojiLite>
    forceOneline?: boolean
    limit?: number
}

export function MarkdownRendererLite(props: MarkdownRendererProps): JSX.Element {
    const { getImageURL } = useGlobalState()

    return (
        <Box
            sx={{
                width: '100%',
                '& pre': {
                    margin: 0
                },
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
                }
            }}
        >
            <ReactMarkdown
                remarkPlugins={[
                    breaks,
                    literalLinkRemarkPlugin,
                    strikeThroughRemarkPlugin,
                    userMentionRemarkPlugin,
                    streamLinkRemarkPlugin,
                    emojiRemarkPlugin
                ]}
                remarkRehypeOptions={{
                    handlers: {
                        userlink: (h, node) => {
                            return h(node, 'userlink', { ccid: node.ccid })
                        },
                        streamlink: (h, node) => {
                            return h(node, 'streamlink', { streamId: node.streamId })
                        },
                        emoji: (h, node) => {
                            return h(node, 'emoji', { shortcode: node.shortcode })
                        }
                    }
                }}
                components={{
                    userlink: ({ ccid }) => {
                        return <CCUserChip ccid={ccid} />
                    },
                    streamlink: ({ streamId }) => {
                        return <TimelineChip timelineID={streamId} />
                    },
                    social: ({ href, icon, service, children }) => {
                        return (
                            <LinkChip href={href} icon={icon} service={service}>
                                {children}
                            </LinkChip>
                        )
                    },
                    p: ({ children }) => {
                        if (props.forceOneline) return <span>{children}</span>
                        return (
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
                                paragraph
                            >
                                {children}
                            </Typography>
                        )
                    },
                    h1: ({ children }) => {
                        if (props.forceOneline) return <b>{children}</b>
                        return (
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
                        )
                    },
                    h2: ({ children }) => {
                        if (props.forceOneline) return <b>{children}</b>
                        return (
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
                        )
                    },
                    h3: ({ children }) => {
                        if (props.forceOneline) return <b>{children}</b>
                        return (
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
                        )
                    },
                    h4: ({ children }) =>
                        props.forceOneline ? <b>{children}</b> : <Typography variant="h4">{children}</Typography>,
                    h5: ({ children }) =>
                        props.forceOneline ? <b>{children}</b> : <Typography variant="h5">{children}</Typography>,
                    h6: ({ children }) =>
                        props.forceOneline ? <b>{children}</b> : <Typography variant="h6">{children}</Typography>,
                    ul: ({ children }) => (props.forceOneline ? <>{children}</> : <ul style={{}}>{children}</ul>),
                    ol: ({ children }) => (props.forceOneline ? <>{children}</> : <ol style={{}}>{children}</ol>),
                    li: ({ children }) => {
                        if (props.forceOneline) {
                            return <span>- {children} </span>
                        } else {
                            return <li style={{ marginLeft: 0 }}>{children}</li>
                        }
                    },
                    blockquote: ({ children }) => (
                        <blockquote style={{ margin: 0, paddingLeft: '1rem', borderLeft: '4px solid #ccc' }}>
                            {children}
                        </blockquote>
                    ),
                    a: ({ children, href }) => {
                        if (!href) return <></>
                        return (
                            <CCLink to={href} target="_blank" color="secondary" underline="hover">
                                {children}
                            </CCLink>
                        )
                    },
                    code: ({ node, children, inline }) => {
                        const language = node.position
                            ? props.messagebody
                                  .slice(node.position.start.offset, node.position.end.offset)
                                  .split('\n')[0]
                                  .slice(3)
                            : ''

                        if (language === 'theme') {
                            try {
                                const theme = JSON.parse(String(children))
                                return <span>[Theme: {theme.meta?.name ?? 'no title'}]</span>
                            } catch (e) {
                                console.error(e)
                            }
                        }

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
                            <span>[Codeblock]</span>
                        )
                    },
                    img: (
                        props: Pick<
                            DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>,
                            'key' | keyof ImgHTMLAttributes<HTMLImageElement>
                        > &
                            ReactMarkdownProps
                    ) => {
                        return <span>[Image: {props.alt}]</span>
                    },
                    emoji: ({ shortcode }) => {
                        const emoji = props.emojiDict[shortcode]
                        return emoji ? (
                            <img
                                src={getImageURL(emoji?.animURL ?? emoji?.imageURL, { maxHeight: 128 })}
                                style={{
                                    height: '1.25em',
                                    verticalAlign: '-0.45em',
                                    marginBottom: '4px'
                                }}
                            />
                        ) : (
                            <span>:{shortcode}:</span>
                        )
                    },
                    video: (_props) => {
                        return <span>[Video]</span>
                    },
                    br: () => <></>
                }}
            >
                {props.limit
                    ? props.messagebody.slice(0, props.limit) + (props.messagebody.length > props.limit ? '...' : '')
                    : props.messagebody}
            </ReactMarkdown>
        </Box>
    )
}
