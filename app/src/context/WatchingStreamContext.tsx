import { createContext, useContext } from 'react'

const WatchingStreamContext = createContext<string[]>([])

export interface WatchingStreamContextProviderProps {
    children: JSX.Element
    watchingStreams: string[]
}

export default function WatchingStreamContextProvider(props: WatchingStreamContextProviderProps): JSX.Element {
    return (
        <WatchingStreamContext.Provider value={props.watchingStreams}>{props.children}</WatchingStreamContext.Provider>
    )
}

export function useWatchingStream(): string[] {
    return useContext(WatchingStreamContext)
}
