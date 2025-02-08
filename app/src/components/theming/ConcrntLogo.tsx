import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

const spin = keyframes`
  from {
    transform: rotate(0deg)
  }

  to {
    transform: rotate(360deg)
  }
`

const Ring = styled.path`
    transform-origin: center;
    animation: ${spin} 1s ease infinite;
`

export interface ConcrntLogoProps {
    size: string
    color: string
    spinning?: boolean
}

export function ConcrntLogo(props: ConcrntLogoProps): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={{ width: props.size, height: props.size }}>
            <polygon
                style={{ fill: props.color }}
                points="236.14 276.1 280 407.71 367.74 144.5 104.53 232.24 236.14 276.1"
            />
            <Ring
                style={{ fill: props.color, animationPlayState: props.spinning ? 'running' : 'paused' }}
                d="M422.58,256.38c0,91.95-74.8,166.75-166.75,166.75s-166.75-74.8-166.75-166.75S163.89,89.63,255.83,89.63V19.63c-63.24,0-122.69,24.63-167.41,69.34S19.09,193.14,19.09,256.38s24.63,122.69,69.34,167.41,104.17,69.34,167.41,69.34,122.69-24.63,167.41-69.34,69.34-104.17,69.34-167.41h-70Z"
            />
        </svg>
    )
}
