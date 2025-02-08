import { Card, CardActionArea, CardActions, CardContent, type SxProps, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

import { CCWallpaper } from '../ui/CCWallpaper'
import { WatchButton } from '../WatchButton'

interface StreamCardProps {
    timelineFQID: string
    name: string
    description: string
    banner: string
    domain: string
    isOwner?: boolean
    sx?: SxProps
    onClick?: () => void
}

export function StreamCard(props: StreamCardProps): JSX.Element {
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
                        <WatchButton minimal timelineFQID={props.timelineFQID} />
                    </CardActions>
                </>
            )}
        </Card>
    )
}
