import { Box, Divider, InputAdornment, InputBase, List, ListItemButton, Modal, Paper, Typography } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'

import SearchIcon from '@mui/icons-material/Search'
import { Timeline, User } from '../pages/ExplorerPlus'
import { CCAvatar } from '../components/ui/CCAvatar'
import { ListItemTimeline } from '../components/ui/ListItemTimeline'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

interface CommandPaletteProps {
    children: JSX.Element
}

const EXPLORER_HOST = 'https://explorer.concrnt.world'

export const CommandPaletteProvider = (props: CommandPaletteProps): JSX.Element => {
    const [query, setQuery] = useState<string>('')

    const [timelines, setTimelines] = useState<Timeline[] | undefined>(undefined)
    const [users, setUsers] = useState<User[] | undefined>(undefined)

    const [selectedIndex, setSelectedIndex] = useState<number>(0)

    const textInputRef = useRef<HTMLInputElement>(null)

    const [open, setOpen] = useState<boolean>(false)
    const navigate = useNavigate()

    const reset = () => {
        setOpen(false)
        setQuery('')
        setTimelines(undefined)
        setUsers(undefined)
        setSelectedIndex(0)
    }

    useEffect(() => {
        if (!query) {
            setTimelines(undefined)
            setUsers(undefined)
            setSelectedIndex(0)
            return
        }
        let unmounted = false

        const fetcher = setTimeout(() => {
            if (unmounted) return

            fetch(EXPLORER_HOST + '/timeline?limit=20&q=' + query).then(async (result) => {
                if (unmounted) return
                setTimelines(await result.json())
            })

            fetch(EXPLORER_HOST + '/user?limit=20&q=' + query).then(async (result) => {
                if (unmounted) return
                setUsers(await result.json())
            })
        }, 200)

        return () => {
            unmounted = true
            clearTimeout(fetcher)
        }
    }, [query])

    const onKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const timelineLength = timelines?.length ?? 0
            const userLength = users?.length ?? 0
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex((selectedIndex - 1 + timelineLength + userLength) % (timelineLength + userLength))
                return
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex((selectedIndex + 1) % (timelineLength + userLength))
                return
            }
            if (e.key === 'Enter') {
                if (selectedIndex < timelineLength) {
                    const timeline = timelines![selectedIndex]
                    navigate(`/timeline/${timeline.id}`)
                    reset()
                } else {
                    const user = users![selectedIndex - timelineLength]
                    navigate(`/${user.author}`)
                    reset()
                }
                e.preventDefault()
            }
        },
        [timelines, users, selectedIndex]
    )

    const onBlur = useCallback(() => {
        setTimeout(() => {
            reset()
        }, 100)
    }, [])

    useEffect(() => {
        textInputRef.current?.addEventListener('keydown', onKeyDown)
        textInputRef.current?.addEventListener('blur', onBlur)

        return () => {
            textInputRef.current?.removeEventListener('keydown', onKeyDown)
            textInputRef.current?.removeEventListener('blur', onBlur)
        }
    }, [textInputRef, onKeyDown])

    useEffect(() => {
        // press ctrl + k to open the command palette
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault()
                setOpen(true)
            }
        })
    }, [])

    return (
        <>
            <Modal open={open} onClose={reset}>
                <Paper
                    sx={{
                        position: 'absolute',
                        top: '20%',
                        left: '50%',
                        transform: 'translate(-50%, 0%)',
                        width: '80vw',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        maxHeight: '50vh'
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            padding: '10px'
                        }}
                    >
                        <InputBase
                            inputRef={textInputRef}
                            fullWidth
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search..."
                            startAdornment={
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            }
                        />
                    </Box>

                    {((timelines && timelines.length > 0) || (users && users.length > 0)) && (
                        <Divider sx={{ mt: 0, mx: 1, mb: 1 }} />
                    )}

                    <Box
                        sx={{
                            width: '100%',
                            display: 'flex',
                            height: '100%',
                            overflowY: 'auto',
                            flexDirection: 'column'
                        }}
                    >
                        {timelines && timelines.length > 0 && (
                            <List
                                disablePadding
                                subheader="Timelines"
                                sx={{
                                    px: 2
                                }}
                            >
                                {timelines.map((timeline, i) => (
                                    <ListItemTimeline
                                        selected={selectedIndex === i}
                                        key={timeline.id}
                                        timelineID={timeline.id}
                                        onClick={reset}
                                    />
                                ))}
                            </List>
                        )}
                        {timelines && timelines.length > 0 && users && users.length > 0 && <Divider sx={{ m: 1 }} />}
                        {users && users.length > 0 && (
                            <List
                                disablePadding
                                subheader="Users"
                                sx={{
                                    px: 2,
                                    mb: 2
                                }}
                            >
                                {users.map((user, i) => (
                                    <ListItemButton
                                        selected={selectedIndex === i + (timelines ? timelines.length : 0)}
                                        dense
                                        key={user.author}
                                        sx={{
                                            gap: 1
                                        }}
                                        component={RouterLink}
                                        to={`/${user.author}`}
                                        onClick={reset}
                                    >
                                        <CCAvatar
                                            sx={{
                                                width: 20,
                                                height: 20
                                            }}
                                            identiconSource={user.author}
                                            avatarURL={user._parsedDocument.body.avatar}
                                        />
                                        {user._parsedDocument.body.username}
                                    </ListItemButton>
                                ))}
                            </List>
                        )}
                        {query != '' && timelines && timelines.length === 0 && users && users.length === 0 && (
                            <Box px={2}>
                                <Typography>No results matched your search</Typography>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Modal>
            {props.children}
        </>
    )
}
