import { Box } from '@mui/material'
import ExifReader from 'exifreader'
import { Fragment, useEffect, useState } from 'react'

interface ExifInfoProps {
    src: string
    keys: string[]
}

export default function ExifInfo(props: ExifInfoProps): JSX.Element {
    const [infos, setInfos] = useState<Record<string, string>>({})

    useEffect(() => {
        setInfos({})

        fetch(props.src)
            .then((response) => response.blob())
            .then(async (blob) => {
                try {
                    const exifData = ExifReader.load(await blob.arrayBuffer())
                    const newInfos: Record<string, string> = {}
                    for (const key of props.keys) {
                        if (exifData[key]) {
                            newInfos[key] = exifData[key].description
                        }
                    }
                    setInfos(newInfos)
                } catch (error) {
                    console.error("Error parsing EXIF data:", error)
                }
            })
            .catch((error) => {
                console.error("Error fetching image:", error)
            })
    }, [props.src, props.keys])

    if (Object.keys(infos).length === 0) return <></>

    return (
        <Box
            sx={{
                backgroundColor: 'black',
                color: 'white',
                fontSize: '0.5rem',
                display: 'grid',
                gridTemplateColumns: 'auto auto',
                padding: 0.5
            }}
        >
            {Object.keys(infos).map((key) => {
                return (
                    <Fragment key={key}>
                        <Box>{key}: </Box>
                        <Box>{infos[key]}</Box>
                    </Fragment>
                )
            })}
        </Box>
    )
}
