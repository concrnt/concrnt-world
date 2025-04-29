import { CSSProperties, useEffect, useState } from 'react'

interface ModelViewerProps {
    src: string
    style: CSSProperties
}

export const ModelViewer = (props: ModelViewerProps): JSX.Element => {
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        import('@google/model-viewer').then((_module) => {
            setLoaded(true)
        })
    }, [])

    if (loaded) {
        return <model-viewer src={props.src} autoplay camera-controls style={props.style} />
    } else {
        return <div style={{ ...props.style }}>Loading...</div>
    }
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                src: string
                alt?: string
                'camera-controls'?: boolean
                'auto-rotate'?: boolean
                ar?: boolean
                autoplay?: boolean
            }
        }
    }
}
