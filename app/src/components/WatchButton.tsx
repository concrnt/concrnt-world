import { Box, Button, ButtonGroup, Checkbox, IconButton, Menu, MenuItem, Tooltip, useTheme } from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useClient } from '../context/ClientContext'

import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import { useGlobalState } from '../context/GlobalState'
import { type Timeline } from '@concrnt/worldlib'

export interface WatchButtonProps {
    timelineFQID: string
    minimal?: boolean
    small?: boolean
}

export const WatchButton = (props: WatchButtonProps): JSX.Element => {
    const theme = useTheme()
    const { client } = useClient()
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

    const [isHovered, setIsHovered] = useState(false)
    const { allKnownTimelines, listedSubscriptions, reloadList } = useGlobalState()

    const { t } = useTranslation('', { keyPrefix: 'common' })

    const [timeline, setTimeline] = useState<null | Timeline<any>>(null)

    useEffect(() => {
        client?.getTimeline<any>(props.timelineFQID).then((timeline) => {
            setTimeline(timeline)
        })
    }, [props.timelineFQID])

    const watching = allKnownTimelines.find((e) => e.fqid === timeline?.fqid) !== undefined

    return (
        <Box>
            {props.minimal ? (
                <Tooltip title={t('addToList')} placement="top" arrow>
                    <IconButton
                        sx={{ flexGrow: 0 }}
                        size={props.small ? 'small' : 'medium'}
                        onClick={(e) => {
                            setMenuAnchor(e.currentTarget)
                        }}
                    >
                        <PlaylistAddIcon
                            sx={{
                                color: 'text.primary'
                            }}
                        />
                    </IconButton>
                </Tooltip>
            ) : (
                <ButtonGroup color="primary" variant="contained">
                    <Button
                        onClick={(e) => {
                            if (watching) {
                                setMenuAnchor(e.currentTarget)
                            } else {
                                client.api
                                    .subscribe(props.timelineFQID, Object.keys(listedSubscriptions)[0])
                                    .then((subscription) => {
                                        reloadList()
                                    })
                            }
                        }}
                        onMouseEnter={() => {
                            setIsHovered(true)
                        }}
                        onMouseLeave={() => {
                            setIsHovered(false)
                        }}
                    >
                        {watching ? (isHovered ? t('unwatch') : t('watching')) : t('watch')}
                    </Button>
                    <Button
                        size="small"
                        onClick={(e) => {
                            setMenuAnchor(e.currentTarget)
                        }}
                        sx={{
                            padding: 0
                        }}
                    >
                        <ArrowDropDownIcon />
                    </Button>
                </ButtonGroup>
            )}

            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => {
                    setMenuAnchor(null)
                }}
                sx={{
                    zIndex: theme.zIndex.tooltip + 1
                }}
            >
                {Object.keys(listedSubscriptions).map((key) => (
                    <MenuItem key={key} onClick={() => {}}>
                        {listedSubscriptions[key].parsedDoc.body.name}
                        <Checkbox
                            checked={
                                listedSubscriptions[key].items.find((e) => e.id === props.timelineFQID) !== undefined
                            }
                            onChange={(check) => {
                                if (check.target.checked) {
                                    client.api.subscribe(props.timelineFQID, key).then((_) => {
                                        reloadList()
                                    })
                                } else {
                                    client.api.unsubscribe(props.timelineFQID, key).then((_) => {
                                        reloadList()
                                    })
                                }
                            }}
                        />
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    )
}
