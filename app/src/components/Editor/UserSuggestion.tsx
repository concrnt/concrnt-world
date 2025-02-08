import { useCallback, useEffect, useState } from 'react'
import { Box, Collapse, List, ListItemButton, ListItemIcon, ListItemText, Paper, Popper } from '@mui/material'
import caretPosition from 'textarea-caret'
import { type User } from '@concrnt/worldlib'
import { useClient } from '../../context/ClientContext'

export interface UserSuggestionProps {
    textInputRef: HTMLInputElement
    text: string
    setText: (text: string) => void
    mobile?: boolean
}

export const UserSuggestion = (props: UserSuggestionProps): JSX.Element => {
    const { client } = useClient()

    const ref = props.textInputRef
    const text = props.text
    const cursorPos = ref.selectionEnd ?? 0

    const caretPos = caretPosition(ref, cursorPos)
    const caretPosOffsetted = {
        top: caretPos.top - 50,
        left: caretPos.left + 10
    }

    const before = text.slice(0, cursorPos ?? 0) ?? ''
    const query = /(^|\s+)@([^\s]+)$/.exec(before)?.[2]

    const [forceOff, setForceOff] = useState<boolean>(false)
    const enableSuggestions = query !== undefined && !forceOff

    const [selectedSuggestions, setSelectedSuggestions] = useState<number>(0)
    const [userSuggestions, setUserSuggestions] = useState<User[]>([])

    useEffect(() => {
        if (!query) return
        setUserSuggestions(client.ackings?.filter((q) => q.profile?.username?.toLowerCase()?.includes(query)) ?? [])
    }, [query])

    const onUserSuggestConfirm = (index: number): void => {
        const before = text.slice(0, cursorPos) ?? ''
        const colonPos = before.lastIndexOf('@')
        if (colonPos === -1) return
        const after = text.slice(cursorPos) ?? ''

        const selected = userSuggestions[index]
        props.setText(before.slice(0, colonPos) + `@${selected.ccid} ` + after)

        setForceOff(true)
    }

    const onKeyDown = useCallback(
        (e: KeyboardEvent) => {
            setForceOff(false)
            if (!enableSuggestions) return
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedSuggestions((selectedSuggestions - 1 + userSuggestions.length) % userSuggestions.length)
                return
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedSuggestions((selectedSuggestions + 1) % userSuggestions.length)
                return
            }
            if (e.key === 'Enter') {
                if (userSuggestions.length === 0) return
                e.preventDefault()
                onUserSuggestConfirm(selectedSuggestions)
            }
        },
        [selectedSuggestions, userSuggestions, enableSuggestions]
    )

    const onBlur = useCallback(() => {
        setTimeout(() => {
            setForceOff(true)
        }, 100)
    }, [])

    useEffect(() => {
        props.textInputRef.addEventListener('keydown', onKeyDown)
        props.textInputRef.addEventListener('blur', onBlur)

        return () => {
            props.textInputRef.removeEventListener('keydown', onKeyDown)
            props.textInputRef.removeEventListener('blur', onBlur)
        }
    }, [props.textInputRef, onKeyDown])

    return props.mobile ? (
        <Collapse in={enableSuggestions}>
            <List
                dense
                sx={{
                    display: 'flex',
                    overflowX: 'auto',
                    alignItems: 'center',
                    justifyContent: 'flex-start'
                }}
            >
                {userSuggestions.map((user, index) => (
                    <ListItemButton
                        key={user.profile?.avatar}
                        selected={index === selectedSuggestions}
                        onClick={() => {
                            onUserSuggestConfirm(index)
                        }}
                        sx={{
                            p: 0,
                            width: '2em',
                            height: '2em',
                            maxWidth: '2em',
                            maxHeight: '2em'
                        }}
                    >
                        <Box
                            component="img"
                            src={user.profile?.avatar}
                            sx={{
                                width: '100%',
                                height: '100%'
                            }}
                        />
                    </ListItemButton>
                ))}
            </List>
        </Collapse>
    ) : (
        <Popper
            open={enableSuggestions}
            anchorEl={props.textInputRef}
            placement="bottom-start"
            modifiers={[
                {
                    name: 'offset',
                    options: {
                        offset: [caretPosOffsetted.left, caretPosOffsetted.top]
                    }
                }
            ]}
            sx={{
                zIndex: (theme) => theme.zIndex.tooltip + 1
            }}
        >
            <Paper>
                <List dense>
                    {userSuggestions.map((user, index) => (
                        <ListItemButton
                            dense
                            key={user.profile?.avatar}
                            selected={index === selectedSuggestions}
                            onClick={() => {
                                onUserSuggestConfirm(index)
                                ref.focus()
                            }}
                        >
                            <ListItemIcon>
                                <Box component="img" src={user.profile?.avatar} sx={{ width: '1em', height: '1em' }} />
                            </ListItemIcon>
                            <ListItemText>{user.profile?.username}</ListItemText>
                        </ListItemButton>
                    ))}
                </List>
            </Paper>
        </Popper>
    )
}
