import { BrowserQRCodeReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { useEffect, useRef } from 'react'

export default function QRCodeReader(props: { onRead: (result: string) => void }): JSX.Element {
    useEffect(() => {
        const hints = new Map()
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE])
        hints.set(DecodeHintType.TRY_HARDER, true)
        const codeReader = new BrowserQRCodeReader(hints)

        codeReader.decodeFromVideoDevice(undefined, videoRef.current!, function (result, _errors, _controls) {
            if (typeof result !== 'undefined') {
                props.onRead(result.getText())
            }
        })
    }, [])

    const videoRef = useRef<HTMLVideoElement | null>(null)

    return <video style={{ width: '100%', borderRadius: '10px' }} ref={videoRef} />
}
