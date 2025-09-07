import { type Profile } from '@concrnt/client'
import { useEffect, useState } from 'react'
import { useClient } from '../../context/ClientContext'
import { Avatar, type SxProps, Tooltip, Skeleton } from '@mui/material'
import BoringAvatar from 'boring-avatars'
import { useMediaViewer } from '../../context/MediaViewer'

export interface SubprofileBadgeProps {
    characterID: string
    authorCCID: string
    onClick?: (characterID: string) => void
    sx?: SxProps
    enablePreview?: boolean
    circle?: boolean
}

export function SubprofileBadge(props: SubprofileBadgeProps): JSX.Element {
    const { client } = useClient()
    const mediaViewer = useMediaViewer()
    const [character, setProfile] = useState<Profile<any> | null>(null)

    useEffect(() => {
        client.api.getProfile(props.characterID, props.authorCCID).then((character) => {
            setProfile(character ?? null)
        })
    }, [props.characterID])

    if (!character) return <Skeleton variant="rectangular" width={40} height={40} />

    return (
        <Tooltip arrow title={character?.parsedDoc.body.username} placement="top">
            <Avatar
                alt={character?.parsedDoc.body.username}
                src={character?.parsedDoc.body.avatar}
                sx={{
                    ...props.sx,
                    borderRadius: props.circle ? undefined : 1
                }}
                onClick={() => {
                    if (props.enablePreview) {
                        mediaViewer.openSingle(character?.parsedDoc.body.avatar)
                    } else {
                        props.onClick?.(props.characterID)
                    }
                }}
                variant={props.circle ? 'circular' : 'square'}
            >
                <BoringAvatar
                    square={!props.circle}
                    name={character?.parsedDoc.body.username}
                    variant="beam"
                    size={1000}
                />
            </Avatar>
        </Tooltip>
    )
}
