import { type Key } from '@concrnt/client'
import { alpha, useTheme, IconButton } from '@mui/material'
import { type ConcurrentTheme } from '../../model'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'

export interface KeyCardProps {
    item: Key
    selected?: boolean
    onMenuClick?: (event: React.MouseEvent<HTMLButtonElement>, key: Key) => void
    subText?: string
}

export const KeyCard = (props: KeyCardProps): JSX.Element => {
    const valid = !props.item.revokeDocument
    const theme = useTheme<ConcurrentTheme>()

    const mainColor = valid ? theme.palette.primary.main : theme.palette.text.disabled

    const bodyStyle = {
        fill: props.selected ? theme.palette.background.paper : alpha(mainColor, 0.8),
        stroke: mainColor,
        strokeWidth: '5px'
    }

    const headerStyle = {
        fill: theme.palette.background.paper,
        stroke: mainColor,
        strokeWidth: '5px'
    }

    const decorationStyle = {
        fill: props.selected ? mainColor : theme.palette.background.paper
    }

    const lineStyle = {
        stroke: mainColor,
        strokeWidth: '8px'
    }

    const bodyText = {
        fontFamily: 'Source Code Pro, monospace',
        fontWeight: 900,
        fill: props.selected ? mainColor : theme.palette.primary.contrastText,
        fontSize: '35px'
    }

    const subText = {
        fontFamily: 'Source Code Pro, monospace',
        fontWeight: 500,
        fill: props.selected ? mainColor : theme.palette.primary.contrastText,
        fontSize: '15px'
    }

    const kindText = {
        fontFamily: 'Source Code Pro, monospace',
        fontWeight: 500,
        fill: props.selected ? mainColor : theme.palette.primary.contrastText,
        fontSize: '18px'
    }

    const headerText = {
        fontFamily: 'Source Code Pro, monospace',
        fontWeight: 900,
        fill: theme.palette.text.primary,
        fontSize: '22px'
    }

    return (
        <div
            style={{
                marginTop: '15px',
                position: 'relative',
                userSelect: 'none'
            }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 415 115.03">
                <path
                    style={bodyStyle}
                    d="M42.5,102.53l106.44-.21c2.13,0,4.17.84,5.67,2.34l5.54,5.53c1.5,1.5,3.54,2.34,5.66,2.34h113.28c2.17,0,4.26-.88,5.77-2.45l5.26-5.45c1.52-1.57,3.61-2.46,5.79-2.45l108.53.33c4.44.01,8.05-3.59,8.05-8.03V10.56c0-4.43-3.59-8.03-8.03-8.03h-118.65c-2.12,0-4.16.84-5.66,2.35l-5.31,5.31c-1.5,1.5-3.54,2.35-5.66,2.35h-93.36c-2.12,0-4.16-.84-5.66-2.35l-5.31-5.31c-1.5-1.5-3.54-2.35-5.66-2.35H42.5"
                />
                <path
                    style={headerStyle}
                    d="M42.5,2.53l-31.97-.03c-4.44,0-8.04,3.61-8.03,8.05l.23,83.97c.01,4.43,3.61,8.02,8.04,8.01h31.73"
                />
                <circle style={decorationStyle} cx="52.5" cy="12.53" r="4" />
                <circle style={decorationStyle} cx="52.5" cy="92.53" r="4" />
                <circle style={decorationStyle} cx="402.5" cy="12.53" r="4" />
                <circle style={decorationStyle} cx="402.5" cy="92.53" r="4" />
                <line style={lineStyle} x1="42.5" y1="2.53" x2="42.5" y2="102.53" />
                <text style={headerText} textAnchor="middle" transform="translate(29 53) rotate(-90)">
                    <tspan x="0" y="0">
                        {props.item.parent.substring(4, 10)}
                    </tspan>
                </text>
                <text style={kindText} transform="translate(67 38)">
                    <tspan x="0" y="0">
                        {props.item.id.substring(0, 4)}
                    </tspan>
                </text>
                <text
                    style={bodyText}
                    textAnchor="middle"
                    transform={props.onMenuClick ? 'translate(205 65)' : 'translate(225 65)'}
                >
                    <tspan x="0" y="0">
                        {props.onMenuClick
                            ? props.item.id.substring(4, 10) + '…' + props.item.id.substring(36, 42)
                            : props.item.id.substring(4, 11) + '…' + props.item.id.substring(35, 42)}
                    </tspan>
                </text>
                <text style={subText} textAnchor="end" transform="translate(390 95)">
                    <tspan x="0" y="0">
                        {props.subText}
                    </tspan>
                </text>
                <text style={subText} textAnchor="middle" transform="translate(223 108)">
                    <tspan x="0" y="0">
                        {valid ? ' Key Valid' : 'Key Revoked'}
                    </tspan>
                </text>
            </svg>
            {props.onMenuClick && (
                <div
                    style={{
                        position: 'absolute',
                        top: '45%',
                        right: '0%',
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <IconButton
                        disabled={!valid}
                        sx={{
                            width: '30px',
                            height: '30px',
                            backgroundColor: alpha(theme.palette.background.paper, 0.5),
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.background.paper, 0.8)
                            }
                        }}
                        onClick={(event) => {
                            event.stopPropagation()
                            props.onMenuClick?.(event, props.item)
                        }}
                    >
                        <MoreHorizIcon />
                    </IconButton>
                </div>
            )}
        </div>
    )
}
