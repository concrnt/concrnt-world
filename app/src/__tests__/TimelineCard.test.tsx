import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock WatchButton so we can detect whether it's rendered without pulling in its deps
vi.mock('../components/WatchButton', () => ({
    WatchButton: () => <div data-testid="watch-button">WatchButton</div>
}))

// Mock CCWallpaper (renders an img internally)
vi.mock('../components/ui/CCWallpaper', () => ({
    CCWallpaper: () => <div data-testid="wallpaper" />
}))

import { TimelineCard } from '../components/TimelineCard'

const defaultProps = {
    timelineFQID: 'test-timeline@example.com',
    name: 'Test Timeline',
    description: 'A test timeline',
    banner: '',
    domain: 'example.com'
}

describe('TimelineCard', () => {
    it('renders without crash when LibraryProvider is absent', () => {
        // TimelineCard uses useOptionalLibrary which returns null outside the provider.
        // It must NOT throw "useLibrary must be used within LibraryProvider".
        expect(() =>
            render(
                <MemoryRouter>
                    <TimelineCard {...defaultProps} />
                </MemoryRouter>
            )
        ).not.toThrow()
    })

    it('does not render WatchButton when LibraryProvider is absent', () => {
        render(
            <MemoryRouter>
                <TimelineCard {...defaultProps} />
            </MemoryRouter>
        )
        expect(screen.queryByTestId('watch-button')).not.toBeInTheDocument()
    })

    it('does not render WatchButton when showWatchButton={false}', () => {
        render(
            <MemoryRouter>
                <TimelineCard {...defaultProps} showWatchButton={false} />
            </MemoryRouter>
        )
        expect(screen.queryByTestId('watch-button')).not.toBeInTheDocument()
    })

    it('renders timeline name and description', () => {
        render(
            <MemoryRouter>
                <TimelineCard {...defaultProps} />
            </MemoryRouter>
        )
        expect(screen.getByText('Test Timeline')).toBeInTheDocument()
        expect(screen.getByText('A test timeline')).toBeInTheDocument()
    })
})
