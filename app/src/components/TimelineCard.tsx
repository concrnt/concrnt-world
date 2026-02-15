import { Card, CardActionArea, CardActions, CardContent, type SxProps, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

import { CCWallpaper } from './ui/CCWallpaper'
import { WatchButton } from './WatchButton'
import { useOptionalLibrary } from '../context/LibraryContext'

interface TimelineCardProps {
    timelineFQID: string
    name: string
    description: string
    banner: string
    domain: string
    isOwner?: boolean
    showWatchButton?: boolean
    sx?: SxProps
    onClick?: () => void
}

export function TimelineCard(props: TimelineCardProps): JSX.Element {
    const hasLibraryProvider = useOptionalLibrary() !== null
    const showWatchButton = props.showWatchButton !== false && hasLibraryProvider

    return (
        <Card
            sx={{
                maxWidth: 345,
                ...props.sx
            }}
        >
            {props.onClick ? (
                <CardActionArea onClick={props.onClick}>
                    <CCWallpaper
                        sx={{
                            height: '140px'
                        }}
                        override={props.banner}
                    />
                    <CardContent>
                        <Typography gutterBottom variant="h5" component="div">
                            {props.name}
                            {props.isOwner ? ' (owner)' : ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {props.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {props.domain}
                        </Typography>
                    </CardContent>
                </CardActionArea>
            ) : (
                <>
                    <CardActionArea component={Link} to={'/timeline/' + props.timelineFQID}>
                        <CCWallpaper
                            sx={{
                                height: '140px'
                            }}
                            override={props.banner}
                        />
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                {props.name}
                                {props.isOwner ? ' (owner)' : ''}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {props.description}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {props.domain}
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                    <CardActions>
                        {showWatchButton ? <WatchButton minimal timelineFQID={props.timelineFQID} /> : null}
                    </CardActions>
                </>
            )}
        </Card>
    )
}
