import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Client } from '@concurrent-world/client'
import { usePersistent } from '../hooks/usePersistent'

// @ts-expect-error vite dynamic import
import { branch, sha } from '~build/info'
import { FullScreenLoading } from '../components/ui/FullScreenLoading'

const branchName = branch || window.location.host.split('.')[0]
const versionString = `${location.hostname}-${branchName as string}-${sha.slice(0, 7) as string}`

export interface ClientContextState {
    client: Client
    forceUpdate: () => void
}

export interface ClientProviderProps {
    children: JSX.Element
    client?: Client
}

const ClientContext = createContext<ClientContextState>({
    client: undefined as unknown as Client,
    forceUpdate: () => {}
})

export const ClientProvider = (props: ClientProviderProps): JSX.Element => {
    const [domain] = usePersistent<string>('Domain', '')
    const [prvkey] = usePersistent<string>('PrivateKey', '')
    const [subkey] = usePersistent<string>('SubKey', '')

    const [client, setClient] = useState<Client | undefined>(props.client)
    const [updatecount, updater] = useState(0)

    const [progress, setProgress] = useState<string>('Downloading client...')

    useEffect(() => {
        if (props.client) return

        const loader = async (): Promise<void> => {
            const { Client } = await import('@concurrent-world/client')

            if (prvkey !== '') {
                Client.create(prvkey, domain, {
                    appName: versionString,
                    progressCallback: (msg) => {
                        setProgress(msg)
                    }
                })
                    .then((client) => {
                        setClient(client)
                    })
                    .catch((e) => {
                        console.error(e)
                    })
            } else if (subkey !== '') {
                Client.createFromSubkey(subkey, {
                    appName: versionString,
                    progressCallback: (msg) => {
                        setProgress(msg)
                    }
                })
                    .then((client) => {
                        setClient(client)
                    })
                    .catch((e) => {
                        console.error(e)
                    })
            }
        }

        loader()
    }, [domain, prvkey])

    const forceUpdate = useCallback(() => {
        updater((prev) => prev + 1)
    }, [updatecount])

    const value = useMemo(() => {
        return {
            client,
            forceUpdate
        }
    }, [client, forceUpdate])

    if (!client) {
        return <FullScreenLoading message={progress} />
    }

    return <ClientContext.Provider value={value as ClientContextState}>{props.children}</ClientContext.Provider>
}

export function useClient(): ClientContextState {
    return useContext(ClientContext)
}
