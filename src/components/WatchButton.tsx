import { Box, Button, ButtonGroup, Checkbox, IconButton, Menu, MenuItem, Tooltip, useTheme } from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useClient } from '../context/ClientContext'

import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import { useGlobalState } from '../context/GlobalState'

export interface WatchButtonProps {
    timelineID: string
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

    const watching = allKnownTimelines.find((e) => (e.cacheKey ?? e.id) === props.timelineID) !== undefined

    return (
        <Box>
            {props.minimal ? (
                <Tooltip title="リストに追加" placement="top" arrow>
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
                                    .subscribe(props.timelineID, Object.keys(listedSubscriptions)[0])
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
                        {listedSubscriptions[key].document.body.name}
                        <Checkbox
                            checked={
                                listedSubscriptions[key].items.find((e) => e.id === props.timelineID) !== undefined
                            }
                            onChange={(check) => {
                                if (check.target.checked) {
                                    client.api.subscribe(props.timelineID, key).then((_) => {
                                        reloadList()
                                    })
                                } else {
                                    client.api.unsubscribe(props.timelineID, key).then((_) => {
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
