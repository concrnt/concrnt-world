import { useCallback, useEffect, useState } from 'react'
import { type Emoji, type EmojiLite } from '../../model'
import { Box, Collapse, List, ListItemButton, ListItemIcon, ListItemText, Paper, Popper } from '@mui/material'
import caretPosition from 'textarea-caret'
import { useEmojiPicker } from '../../context/EmojiPickerContext'
import { useGlobalState } from '../../context/GlobalState'

export interface EmojiSuggestionProps {
    textInputRef: HTMLInputElement
    text: string
    setText: (text: string) => void
    updateEmojiDict: (update: (prev: Record<string, EmojiLite>) => Record<string, EmojiLite>) => void
    mobile?: boolean
}

export const EmojiSuggestion = (props: EmojiSuggestionProps): JSX.Element => {
    const emojiPicker = useEmojiPicker()
    const { getImageURL } = useGlobalState()

    const ref = props.textInputRef
    const text = props.text
    const cursorPos = ref.selectionEnd ?? 0

    const caretPos = caretPosition(ref, cursorPos)
    const caretPosOffsetted = {
        top: caretPos.top - 50,
        left: caretPos.left + 10
    }

    const before = text.slice(0, cursorPos ?? 0) ?? ''
    const query = /:(\w+)$/.exec(before)?.[1]

    const [emojiSuggestions, setEmojiSuggestions] = useState<Emoji[]>([])
    const [selectedSuggestions, setSelectedSuggestions] = useState<number>(0)

    const [forceOff, setForceOff] = useState<boolean>(false)
    const enableSuggestions = query !== undefined && !forceOff

    const onEmojiSuggestConfirm = (index: number): void => {
        const colonPos = before.lastIndexOf(':')
        if (colonPos === -1) return
        const after = text.slice(cursorPos) ?? ''
        const selected = emojiSuggestions[index]

        props.setText(before.slice(0, colonPos) + `:${selected.shortcode}: ` + after)
        setSelectedSuggestions(0)

        props.updateEmojiDict((prev) => ({
            ...prev,
            [selected.shortcode]: { imageURL: selected.imageURL }
        }))

        setForceOff(true)
    }

    useEffect(() => {
        if (!query) return
        setEmojiSuggestions(emojiPicker.search(query, 16))
    }, [query])

    const onKeyDown = useCallback(
        (e: KeyboardEvent) => {
            setForceOff(false)
            if (!enableSuggestions) return
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedSuggestions((selectedSuggestions - 1 + emojiSuggestions.length) % emojiSuggestions.length)
                return
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedSuggestions((selectedSuggestions + 1) % emojiSuggestions.length)
                return
            }
            if (e.key === 'Enter') {
                e.preventDefault()
                onEmojiSuggestConfirm(selectedSuggestions)
            }
        },
        [selectedSuggestions, emojiSuggestions, enableSuggestions]
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
                    justifyContent: 'flex-start',
                    gap: 0.5
                }}
            >
                {emojiSuggestions.map((emoji, index) => (
                    <ListItemButton
                        key={emoji.imageURL}
                        selected={index === selectedSuggestions}
                        onClick={() => {
                            onEmojiSuggestConfirm(index)
                        }}
                        sx={{
                            p: 0,
                            width: '2em',
                            height: '2em',
                            maxWidth: '2em',
                            maxHeight: '2em',
                            flexShrink: 0
                        }}
                    >
                        <Box
                            component="img"
                            src={getImageURL(emoji.imageURL, { maxHeight: 128 })}
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
                    {emojiSuggestions.map((emoji, index) => (
                        <ListItemButton
                            dense
                            key={emoji.imageURL}
                            selected={index === selectedSuggestions}
                            onClick={() => {
                                onEmojiSuggestConfirm(index)
                                ref.focus()
                            }}
                        >
                            <ListItemIcon>
                                <Box
                                    component="img"
                                    src={getImageURL(emoji.imageURL, { maxHeight: 128 })}
                                    sx={{ width: '1em', height: '1em' }}
                                />
                            </ListItemIcon>
                            <ListItemText>{emoji.shortcode}</ListItemText>
                        </ListItemButton>
                    ))}
                </List>
            </Paper>
        </Popper>
    )
}
