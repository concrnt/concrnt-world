import { useTheme } from '@mui/material'
import { type ConcurrentTheme } from '../../model'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useClient } from '../../context/ClientContext'
import BoringAvatar from 'boring-avatars'
import html2canvas from 'html2canvas'
import { type CCDocument } from '@concrnt/client'

export function Passport(): JSX.Element {
    const { client } = useClient()

    const affiliationDate = useMemo(() => {
        try {
            const document = client.user?.affiliationDocument
            if (!document) return null

            const doc: CCDocument.Affiliation = JSON.parse(document)
            return new Date(doc.signedAt)
        } catch (e) {
            console.error(e)
        }
    }, [client.user])

    return (
        <PassportRenderer
            ccid={client.ccid || ''}
            name={client?.user?.profile?.username || ''}
            avatar={client?.user?.profile?.avatar || ''}
            host={client.host || ''}
            cdate={affiliationDate?.toLocaleDateString() || 'N/A'}
            trust={100}
        />
    )
}

export interface PassportRendererProps {
    ccid: string
    name: string
    avatar: string
    host: string
    cdate: string
    trust: number
}

export function PassportRenderer(props: PassportRendererProps): JSX.Element {
    const theme = useTheme<ConcurrentTheme>()

    const line1 = 'P<' + props.ccid.toUpperCase()
    let line2 = props.host.toUpperCase().replace(/(\.|-)/g, '<') ?? 'UNKNOWN'
    line2 += '<'.repeat(40 - line2.length) + '0xFF'

    const style1 = {
        fontSize: '5px',
        fill: theme.palette.primary.contrastText,
        fontFamily: 'SourceCodeProRoman-Regular, Source Code Pro',
        fontVariationSettings: 'wght 400'
    }

    const style2 = {
        fontSize: '6px',
        fill: theme.palette.primary.contrastText,
        fontFamily: 'SourceCodeProRoman-Regular, Source Code Pro',
        fontVariationSettings: 'wght 400'
    }

    const style3 = {
        fontSize: '8px',
        fill: theme.palette.primary.contrastText,
        fontFamily: 'SourceCodeProRoman-Regular, Source Code Pro',
        fontVariationSettings: 'wght 600'
    }

    const maskId = useId()

    const avatarRef = useRef<HTMLDivElement>(null)
    const [identiconData, setIdenticonData] = useState<string>('')
    useEffect(() => {
        if (props.avatar) return
        html2canvas(avatarRef.current as HTMLElement).then((canvas) => {
            const url = canvas.toDataURL('image/png', 2.0)
            setIdenticonData(url)
        })
    }, [props.avatar])

    return (
        <>
            <div
                style={{
                    position: 'fixed',
                    width: '100px',
                    height: '100px',
                    overflow: 'hidden',
                    left: '50px',
                    top: '50px'
                }}
                ref={avatarRef}
            >
                <BoringAvatar square={true} name={props.ccid} variant="beam" size={100} />
            </div>
            <div
                style={{
                    filter: 'drop-shadow(1px 3px 5px rgba(0, 0, 0, 0.2))',
                    position: 'relative'
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 242.65 153" style={{ display: 'block' }}>
                    <path
                        fill={theme.palette.primary.main}
                        d="m233.21,0H9.44C4.23,0,0,4.23,0,9.44v134.14c0,5.21,4.23,9.44,9.44,9.44h223.77c5.21,0,9.44-4.23,9.44-9.44V9.44c0-5.21-4.23-9.44-9.44-9.44Zm-93.33,14.34h-37.1c-2.2,0-3.98-1.78-3.98-3.98s1.78-3.98,3.98-3.98h37.1c2.2,0,3.98,1.78,3.98,3.98s-1.78,3.98-3.98,3.98Z"
                    />

                    <text style={style3} transform="translate(12 14)">
                        <tspan x="0" y="0">
                            CONCRNT
                        </tspan>
                    </text>

                    <text style={style1} transform="translate(100 30)">
                        <tspan x="0" y="0">
                            current name
                        </tspan>
                    </text>
                    <text style={style3} transform="translate(100 40)">
                        <tspan x="0" y="0">
                            {props.name}
                        </tspan>
                    </text>

                    <text style={style1} transform="translate(100 60)">
                        <tspan x="0" y="0">
                            current address
                        </tspan>
                    </text>
                    <text style={style3} transform="translate(100 70)">
                        <tspan x="0" y="0">
                            {props.host}
                        </tspan>
                    </text>

                    <text style={style1} transform="translate(100 90)">
                        <tspan x="0" y="0">
                            registered
                        </tspan>
                    </text>
                    <text style={style3} transform="translate(100 100)">
                        <tspan x="0" y="0">
                            {props.cdate}
                        </tspan>
                    </text>

                    <text style={style3} transform="translate(200 100)">
                        <tspan x="0" y="0">
                            {props.trust}
                        </tspan>
                    </text>

                    <text style={style1} transform="translate(12 118)">
                        <tspan x="0" y="0">
                            You are permitted to travel to other servers
                        </tspan>
                        <tspan x="0" y="5">
                            under the trust held by {props.host}.
                        </tspan>
                    </text>

                    <text style={style3} transform="translate(12 135)">
                        <tspan x="0" y="0">
                            {line1}
                        </tspan>
                        <tspan x="0" y="10">
                            {line2}
                        </tspan>
                    </text>

                    <path
                        style={style2}
                        d="m53.14,100.35c-5.12,0-10.08-1-14.76-2.98-4.51-1.91-8.57-4.64-12.05-8.12s-6.21-7.53-8.12-12.05c-1.98-4.68-2.98-9.64-2.98-14.76s1-10.08,2.98-14.76c1.91-4.51,4.64-8.57,8.12-12.05s7.53-6.21,12.05-8.12c4.68-1.98,9.64-2.98,14.76-2.98v8.8c-16.05,0-29.1,13.06-29.1,29.1s13.06,29.1,29.1,29.1,29.1-13.06,29.1-29.1h8.8c0,5.12-1,10.08-2.98,14.76-1.91,4.51-4.64,8.57-8.12,12.05-3.48,3.48-7.53,6.21-12.05,8.12-4.68,1.98-9.64,2.98-14.76,2.98Z"
                    />

                    <mask id={maskId}>
                        <circle cx="53.14" cy="62.44" r="25" fill="white" />
                    </mask>
                    <image
                        mask={`url(#${maskId})`}
                        href={props.avatar || identiconData}
                        x="28.14"
                        y="37.44"
                        width="50"
                        height="50"
                        preserveAspectRatio="xMidYMid slice"
                    />
                </svg>
            </div>
        </>
    )
}
