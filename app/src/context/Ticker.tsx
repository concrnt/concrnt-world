import { createContext, useContext, useEffect, useState } from 'react'

const TickerContext = createContext<Date>(new Date())

export interface TickerProviderProps {
    children: JSX.Element
    interval?: number
}

export default function TickerProvider(props: TickerProviderProps): JSX.Element {
    const [clock, setClock] = useState<Date>(new Date())
    useEffect(() => {
        const timer = setInterval(() => {
            setClock(new Date())
        }, props.interval ?? 5000)
        return () => {
            clearInterval(timer)
        }
    }, [setClock])

    return <TickerContext.Provider value={clock}>{props.children}</TickerContext.Provider>
}

export function useTicker(): Date {
    return useContext(TickerContext)
}
