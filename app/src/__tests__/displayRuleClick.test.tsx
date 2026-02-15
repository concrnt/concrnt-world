/**
 * Tests for the blur/omit click-to-reveal event handling pattern
 * used in MessageContainer.tsx (lines 331-388 for omit, 507-536 for blur).
 *
 * These tests verify that:
 * 1. Clicking the reveal wrapper sets the override state to true
 * 2. Events do NOT bubble to a parent element (preventing navigation)
 *
 * We test the pattern in isolation because MessageContainer has many context
 * dependencies (Client, Library, Preference, GlobalState, i18n) that would
 * require extensive mocking for a unit test.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Box } from '@mui/material'

/**
 * Reproduces the exact event handling pattern from MessageContainer blur section.
 * See MessageContainer.tsx lines 507-536.
 */
function BlurRevealWrapper({ onParentClick }: { onParentClick: () => void }) {
    const [revealed, setRevealed] = useState(false)

    return (
        <div data-testid="parent-link" onClick={onParentClick}>
            {!revealed ? (
                <Box
                    data-testid="blur-wrapper"
                    sx={{
                        position: 'relative',
                        filter: 'blur(5px)',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                    onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setRevealed(true)
                    }}
                >
                    <span>blurred content</span>
                </Box>
            ) : (
                <span data-testid="revealed-content">revealed content</span>
            )}
        </div>
    )
}

/**
 * Reproduces the exact event handling pattern from MessageContainer omit section.
 * See MessageContainer.tsx lines 331-388.
 */
function OmitRevealWrapper({ onParentClick }: { onParentClick: () => void }) {
    const [revealed, setRevealed] = useState(false)

    return (
        <div data-testid="parent-link" onClick={onParentClick}>
            {!revealed ? (
                <Box
                    data-testid="omit-wrapper"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                    }}
                    onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setRevealed(true)
                    }}
                >
                    <span>omitted placeholder</span>
                    <span>表示する</span>
                </Box>
            ) : (
                <span data-testid="revealed-content">revealed content</span>
            )}
        </div>
    )
}

describe('displayRule blur click-to-reveal', () => {
    it('clicking blur wrapper reveals content', async () => {
        const parentClick = vi.fn()
        render(<BlurRevealWrapper onParentClick={parentClick} />)

        expect(screen.getByTestId('blur-wrapper')).toBeInTheDocument()

        await userEvent.click(screen.getByTestId('blur-wrapper'))

        expect(screen.getByTestId('revealed-content')).toBeInTheDocument()
        expect(screen.queryByTestId('blur-wrapper')).not.toBeInTheDocument()
    })

    it('click does NOT bubble to parent (no navigation)', async () => {
        const parentClick = vi.fn()
        render(<BlurRevealWrapper onParentClick={parentClick} />)

        await userEvent.click(screen.getByTestId('blur-wrapper'))

        expect(parentClick).not.toHaveBeenCalled()
    })
})

describe('displayRule omit click-to-reveal', () => {
    it('clicking omit wrapper reveals content', async () => {
        const parentClick = vi.fn()
        render(<OmitRevealWrapper onParentClick={parentClick} />)

        expect(screen.getByTestId('omit-wrapper')).toBeInTheDocument()

        await userEvent.click(screen.getByTestId('omit-wrapper'))

        expect(screen.getByTestId('revealed-content')).toBeInTheDocument()
        expect(screen.queryByTestId('omit-wrapper')).not.toBeInTheDocument()
    })

    it('click does NOT bubble to parent (no navigation)', async () => {
        const parentClick = vi.fn()
        render(<OmitRevealWrapper onParentClick={parentClick} />)

        await userEvent.click(screen.getByTestId('omit-wrapper'))

        expect(parentClick).not.toHaveBeenCalled()
    })
})
