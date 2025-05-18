import { useEffect, useState } from 'react'
import { useAutoSummary } from '../../context/AutoSummaryContext'
import { Box, Divider, Tooltip, Typography } from '@mui/material'
import { EmojiLite } from '../../model'
import * as mfm from 'mfm-js'

import { keyframes } from '@emotion/react'
import { useGlobalState } from '../../context/GlobalState'
import { CCLink } from './CCLink'

const mfmSpinX = keyframes`
	0% { transform: perspective(128px) rotateX(0deg); }
	100% { transform: perspective(128px) rotateX(360deg); }
`

const mfmSpinY = keyframes`
	0% { transform: perspective(128px) rotateY(0deg); }
	100% { transform: perspective(128px) rotateY(360deg); }
`

const mfmSpin = keyframes`
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
`

const mfmRubberBand = keyframes`
	from { transform: scale3d(1, 1, 1); }
	30% { transform: scale3d(1.25, 0.75, 1); }
	40% { transform: scale3d(0.75, 1.25, 1); }
	50% { transform: scale3d(1.15, 0.85, 1); }
	65% { transform: scale3d(0.95, 1.05, 1); }
	75% { transform: scale3d(1.05, 0.95, 1); }
	to { transform: scale3d(1, 1, 1); }
`

const mfmGlobalTada = keyframes`
	from {
		transform: scale3d(1, 1, 1);
	}

	10%,
	20% {
		transform: scale3d(0.91, 0.91, 0.91) rotate3d(0, 0, 1, -2deg);
	}

	30%,
	70% {
		transform: scale3d(1.09, 1.09, 1.09) rotate3d(0, 0, 1, 2deg);
	}

	50%,
	90% {
		transform: scale3d(1.09, 1.09, 1.09) rotate3d(0, 0, 1, -2deg);
	}

	to {
		transform: scale3d(1, 1, 1);
	}
`

const mfmTwitch = keyframes`
	0% { transform: translate(7px, -2px) }
	5% { transform: translate(-3px, 1px) }
	10% { transform: translate(-7px, -1px) }
	15% { transform: translate(0px, -1px) }
	20% { transform: translate(-8px, 6px) }
	25% { transform: translate(-4px, -3px) }
	30% { transform: translate(-4px, -6px) }
	35% { transform: translate(-8px, -8px) }
	40% { transform: translate(4px, 6px) }
	45% { transform: translate(-3px, 1px) }
	50% { transform: translate(2px, -10px) }
	55% { transform: translate(-7px, 0px) }
	60% { transform: translate(-2px, 4px) }
	65% { transform: translate(3px, -8px) }
	70% { transform: translate(6px, 7px) }
	75% { transform: translate(-7px, -2px) }
	80% { transform: translate(-7px, -8px) }
	85% { transform: translate(9px, 3px) }
	90% { transform: translate(-3px, -2px) }
	95% { transform: translate(-10px, 2px) }
	100% { transform: translate(-2px, -6px) }
`

const mfmShake = keyframes`
	0% { transform: translate(-3px, -1px) rotate(-8deg) }
	5% { transform: translate(0px, -1px) rotate(-10deg) }
	10% { transform: translate(1px, -3px) rotate(0deg) }
	15% { transform: translate(1px, 1px) rotate(11deg) }
	20% { transform: translate(-2px, 1px) rotate(1deg) }
	25% { transform: translate(-1px, -2px) rotate(-2deg) }
	30% { transform: translate(-1px, 2px) rotate(-3deg) }
	35% { transform: translate(2px, 1px) rotate(6deg) }
	40% { transform: translate(-2px, -3px) rotate(-9deg) }
	45% { transform: translate(0px, -1px) rotate(-12deg) }
	50% { transform: translate(1px, 2px) rotate(10deg) }
	55% { transform: translate(0px, -3px) rotate(8deg) }
	60% { transform: translate(1px, -1px) rotate(8deg) }
	65% { transform: translate(0px, -1px) rotate(-7deg) }
	70% { transform: translate(-1px, -3px) rotate(6deg) }
	75% { transform: translate(0px, -2px) rotate(4deg) }
	80% { transform: translate(-2px, -1px) rotate(3deg) }
	85% { transform: translate(1px, -3px) rotate(-10deg) }
	90% { transform: translate(1px, 0px) rotate(3deg) }
	95% { transform: translate(-2px, 0px) rotate(-3deg) }
	100% { transform: translate(2px, 1px) rotate(2deg) }
`

const mfmJump = keyframes`
	0% { transform: translateY(0); }
	25% { transform: translateY(-16px); }
	50% { transform: translateY(0); }
	75% { transform: translateY(-8px); }
	100% { transform: translateY(0); }
`

const mfmBounce = keyframes`
	0% { transform: translateY(0) scale(1, 1); }
	25% { transform: translateY(-16px) scale(1, 1); }
	50% { transform: translateY(0) scale(1, 1); }
	75% { transform: translateY(0) scale(1.5, 0.75); }
	100% { transform: translateY(0) scale(1, 1); }
`

const mfmRainbow = keyframes`
	0% { filter: hue-rotate(0deg) contrast(150%) saturate(150%); }
	100% { filter: hue-rotate(360deg) contrast(150%) saturate(150%); }
`

export interface RenderAstProps {
    ast: any
    emojis: Record<string, EmojiLite>
}

export interface MfmRendererProps {
    messagebody: string
    emojiDict: Record<string, EmojiLite>
}

const RenderAst = ({ ast, emojis }: RenderAstProps): JSX.Element => {
    const { getImageURL } = useGlobalState()

    if (Array.isArray(ast)) {
        return (
            <>
                {ast.map((node: any, i: number) => (
                    <RenderAst key={i} ast={node} emojis={emojis} />
                ))}
            </>
        )
    }

    if (!ast) {
        return <>null</>
    }

    switch (ast.type) {
        case 'text': {
            return <span>{ast.props.text}</span>
        }
        case 'bold': {
            return (
                <b>
                    <RenderAst ast={ast.children} emojis={emojis} />
                </b>
            )
        }
        case 'strike': {
            return (
                <s>
                    <RenderAst ast={ast.children} emojis={emojis} />
                </s>
            )
        }
        case 'italic': {
            return (
                <i>
                    <RenderAst ast={ast.children} emojis={emojis} />
                </i>
            )
        }
        case 'fn': {
            switch (ast.props.name) {
                case 'tada': {
                    const speed = ast.props.args.speed ?? '1s'
                    const delay = ast.props.args.delay ?? '0s'
                    return (
                        <Box
                            sx={{
                                display: 'inline-block',
                                animation: `${mfmGlobalTada} ${speed} linear infinite both`,
                                animationDelay: delay
                            }}
                        >
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </Box>
                    )
                }
                case 'jelly': {
                    const speed = ast.props.args.speed ?? '1s'
                    const delay = ast.props.args.delay ?? '0s'
                    return (
                        <Box
                            sx={{
                                display: 'inline-block',
                                animation: `${mfmRubberBand} ${speed} linear infinite both`,
                                animationDelay: delay
                            }}
                        >
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </Box>
                    )
                }
                case 'twitch': {
                    const speed = ast.props.args.speed ?? '1s'
                    const delay = ast.props.args.delay ?? '0s'
                    return (
                        <Box
                            sx={{
                                display: 'inline-block',
                                animation: `${mfmTwitch} ${speed} linear infinite both`,
                                animationDelay: delay
                            }}
                        >
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </Box>
                    )
                }
                case 'shake': {
                    const speed = ast.props.args.speed ?? '1s'
                    const delay = ast.props.args.delay ?? '0s'
                    return (
                        <Box
                            sx={{
                                display: 'inline-block',
                                animation: `${mfmShake} ${speed} ease infinite`,
                                animationDelay: delay
                            }}
                        >
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </Box>
                    )
                }
                case 'spin': {
                    const direction = ast.props.args.left
                        ? 'reverse'
                        : ast.props.args.alternate
                          ? 'alternate'
                          : 'normal'
                    const speed = ast.props.args.speed ?? '1.5s'
                    const delay = ast.props.args.delay ?? '0s'
                    const anime = ast.props.args.x ? mfmSpinX : ast.props.args.y ? mfmSpinY : mfmSpin
                    return (
                        <Box
                            sx={{
                                display: 'inline-block',
                                animation: `${anime} ${speed} linear infinite`,
                                animationDirection: direction,
                                animationDelay: delay
                            }}
                        >
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </Box>
                    )
                }
                case 'jump': {
                    const speed = ast.props.args.speed ?? '1s'
                    const delay = ast.props.args.delay ?? '0s'
                    return (
                        <Box
                            sx={{
                                display: 'inline-block',
                                animation: `${mfmJump} ${speed} linear infinite`,
                                animationDelay: delay
                            }}
                        >
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </Box>
                    )
                }
                case 'bounce': {
                    const speed = ast.props.args.speed ?? '1s'
                    const delay = ast.props.args.delay ?? '0s'
                    return (
                        <Box
                            sx={{
                                display: 'inline-block',
                                animation: `${mfmBounce} ${speed} linear infinite`,
                                animationDelay: delay
                            }}
                        >
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </Box>
                    )
                }
                case 'flip': {
                    const transform =
                        ast.props.args.h && ast.props.args.v
                            ? 'scale(-1, -1)'
                            : ast.props.args.v
                              ? 'scaleY(-1)'
                              : 'scaleX(-1)'
                    return (
                        <Box
                            sx={{
                                display: 'inline-block',
                                transform: transform
                            }}
                        >
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </Box>
                    )
                }
                case 'x2': {
                    return (
                        <span style={{ fontSize: '200%' }}>
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </span>
                    )
                }
                case 'x3': {
                    return (
                        <span style={{ fontSize: '400%' }}>
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </span>
                    )
                }
                case 'x4': {
                    return (
                        <span style={{ fontSize: '600%' }}>
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </span>
                    )
                }
                case 'font': {
                    const family = ast.props.args.serif
                        ? 'serif'
                        : ast.props.args.monospace
                          ? 'monospace'
                          : ast.props.args.cursive
                            ? 'cursive'
                            : ast.props.args.fantasy
                              ? 'fantasy'
                              : ast.props.args.emoji
                                ? 'emoji'
                                : ast.props.args.math
                                  ? 'math'
                                  : null
                    if (family) {
                        return (
                            <span
                                style={{
                                    fontFamily: family,
                                    display: 'inline-block'
                                }}
                            >
                                <RenderAst ast={ast.children} emojis={emojis} />
                            </span>
                        )
                    }
                    return (
                        <span
                            style={{
                                display: 'inline-block'
                            }}
                        >
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </span>
                    )
                }
                case 'blur': {
                    ;<Box
                        sx={{
                            display: 'inline-block',
                            filter: 'blur(6px)',
                            transition: 'filter 0.3s',
                            '&:hover': {
                                filter: 'blur(0px)'
                            }
                        }}
                    >
                        <RenderAst ast={ast.children} emojis={emojis} />
                    </Box>
                }
                case 'rainbow': {
                    const speed = ast.props.args.speed ?? '1s'
                    const delay = ast.props.args.delay ?? '0s'
                    return (
                        <Box
                            sx={{
                                display: 'inline-block',
                                animation: `${mfmRainbow} ${speed} linear infinite`,
                                animationDelay: delay
                            }}
                        >
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </Box>
                    )
                }
                case 'sparkle': {
                    return <RenderAst ast={ast.children} emojis={emojis} />
                }
                case 'rotate': {
                    const degrees = ast.props.args.deg ?? 90
                    return (
                        <span
                            style={{
                                display: 'inline-block',
                                transform: `rotate(${degrees}deg)`,
                                transformOrigin: 'center center'
                            }}
                        >
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </span>
                    )
                }
                case 'position': {
                    return (
                        <span
                            style={{
                                display: 'inline-block',
                                transform: `translateX(${ast.props.args.x ?? 0}em) translateY(${ast.props.args.y ?? 0}em)`
                            }}
                        >
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </span>
                    )
                }
                case 'scale': {
                    const x = Math.min(ast.props.args.x ?? 1, 5)
                    const y = Math.min(ast.props.args.y ?? 1, 5)
                    return (
                        <span style={{ display: 'inline-block', transform: `scale(${x}, ${y})` }}>
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </span>
                    )
                }
                case 'fg': {
                    let color = ast.props.args.color
                    color = color ?? 'f00'
                    return (
                        <span style={{ color: `#${color}` }}>
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </span>
                    )
                }
                case 'bg': {
                    let color = ast.props.args.color
                    color = color ?? 'f00'
                    return (
                        <span style={{ backgroundColor: `#${color}` }}>
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </span>
                    )
                }
                case 'border': {
                    let color = ast.props.args.color
                    color = color ?? 'f00'
                    const width = ast.props.args.width ?? 1
                    const radius = ast.props.args.radius ?? 0
                    return (
                        <Box
                            sx={{
                                border: `${width}px solid #${color}`,
                                borderRadius: `${radius}px`,
                                display: 'inline-block',
                                padding: '0.5em'
                            }}
                        >
                            <RenderAst ast={ast.children} emojis={emojis} />
                        </Box>
                    )
                }
            }
        }
        case 'small': {
            return (
                <span style={{ fontSize: '80%', opacity: 0.7 }}>
                    <RenderAst ast={ast.children} emojis={emojis} />
                </span>
            )
        }
        case 'center': {
            return (
                <Box
                    sx={{
                        textAlign: 'center'
                    }}
                >
                    <RenderAst ast={ast.children} emojis={emojis} />
                </Box>
            )
        }
        case 'url': {
            return (
                <CCLink to={ast.props.url} color="secondary" underline="hover">
                    {ast.props.url}
                </CCLink>
            )
        }
        case 'link': {
            return (
                <CCLink to={ast.props.url} color="secondary" underline="hover">
                    <RenderAst ast={ast.children} emojis={emojis} />
                </CCLink>
            )
        }
        case 'blockCode': {
        }
        case 'inlineCode': {
        }
        case 'quote': {
            return (
                <Box
                    sx={{
                        borderLeft: '4px solid #ccc',
                        paddingLeft: '1em',
                        marginBottom: '1em'
                    }}
                >
                    <RenderAst ast={ast.children} emojis={emojis} />
                </Box>
            )
        }
        case 'emojiCode': {
            const emoji = emojis[ast.props.name]
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
                                {ast.props.name}
                            </Typography>
                        </Box>
                    }
                >
                    <img
                        src={getImageURL(emoji?.animURL ?? emoji?.imageURL, { maxHeight: 128 })}
                        style={{
                            height: '2em',
                            verticalAlign: 'middle'
                        }}
                    />
                </Tooltip>
            ) : (
                <span>:{ast.props.name}:</span>
            )
        }
        case 'unicodeEmoji': {
            return <span>{ast.props.emoji}</span>
        }
        case 'search': {
            return <Box>{ast.props.text} 検索</Box>
        }
    }

    return <>unknown ast type: {ast.type}</>
}

export default function MfmRenderer(props: MfmRendererProps): JSX.Element {
    const [ast, setAst] = useState<any>(null)
    const summary = useAutoSummary()

    useEffect(() => {
        if (props.messagebody === '') {
            setAst([])
            return
        }
        try {
            setAst(mfm.parse(props.messagebody))
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
                whiteSpace: 'pre-wrap'
            }}
        >
            <RenderAst ast={ast} emojis={props.emojiDict} />
        </Box>
    )
}
