import { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import cfm from '@concrnt/cfm'

import type { EmojiLite } from '../../model'
import { CCUserChip } from './CCUserChip'
import { TimelineChip } from './TimelineChip'
import { useGlobalState } from '../../context/GlobalState'
import { CCLink } from './CCLink'
import { WellKnownLink } from '../WellKnownLink'
import { CCImage } from './CCImage'

export interface CfmRendererLiteProps {
    messagebody: string
    emojiDict: Record<string, EmojiLite>
    forceOneline?: boolean
    limit?: number
}

export interface RenderAstProps {
    ast: any
    props: CfmRendererLiteProps
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

const RenderAst = ({ ast, props }: RenderAstProps): JSX.Element => {
    if (Array.isArray(ast)) {
        return (
            <>
                {ast.map((node: any, i: number) => (
                    <RenderAst key={i} ast={node} props={props} />
                ))}
            </>
        )
    }

    const { getImageURL } = useGlobalState()

    if (!ast) return <></>
    switch (ast.type) {
        case 'newline':
            return props.forceOneline ? <></> : <br />
        case 'Line':
            return (
                <>
                    <RenderAst ast={ast.body} props={props} />
                    {!props.forceOneline && <br />}
                </>
            )
        case 'Marquee':
            return <RenderAst ast={ast.body} props={props} />
        case 'Text':
            return ast.body
        case 'Italic':
            return (
                <i>
                    <RenderAst ast={ast.body} props={props} />
                </i>
            )
        case 'Bold':
            return (
                <b>
                    <RenderAst ast={ast.body} props={props} />
                </b>
            )
        case 'Strike':
            return (
                <s>
                    <RenderAst ast={ast.body} props={props} />
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
                    <RenderAst ast={ast.body} props={props} />
                </Spoiler>
            )
        case 'Quote':
            if (props.forceOneline) {
                return (
                    <>
                        "<RenderAst ast={ast.body} props={props} />"
                    </>
                )
            }
            return (
                <blockquote style={{ margin: 0, paddingLeft: '1rem', borderLeft: '4px solid #ccc' }}>
                    <RenderAst ast={ast.body} props={props} />
                </blockquote>
            )
        case 'Tag':
            return <span>#{ast.body}</span>
        case 'Mention': {
            if (ast.body.startsWith('con1') && ast.body.length === 42) {
                return <CCUserChip ccid={ast.body} />
            } else {
                return <span>@{ast.body}</span>
            }
        }
        case 'Emoji': {
            const emoji = props.emojiDict[ast.body]
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
                <span>:{ast.body}:</span>
            )
        }
        case 'Details':
            return <span>[Details]</span>
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
            if (props.forceOneline) {
                return <span>[Image: {ast.alt}]</span>
            } else {
                return (
                    <CCImage
                        src={ast.url}
                        sx={{
                            width: '75px',
                            height: '75px'
                        }}
                    />
                )
            }
        case 'CodeBlock':
            return <span>[Codeblock]</span>
        case 'EmojiPack':
            return <span>[EmojiPack]</span>
        case 'Heading':
            return <RenderAst ast={ast.body} props={props} />
        default:
            return <>unknown ast type: {ast.type}</>
    }
}

export const CfmRendererLite = (props: CfmRendererLiteProps): JSX.Element => {
    const [ast, setAst] = useState<any>(null)

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

    return (
        <Box
            sx={{
                whiteSpace: props.forceOneline ? 'inherit' : 'pre-wrap'
            }}
        >
            <RenderAst ast={ast} props={props} />
        </Box>
    )
}
