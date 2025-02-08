export interface ConcrntLogoSplittedProps {
    size: string
    upperColor: string
    lowerColor: string
    frameColor: string
}

export function ConcrntLogoSplitted(props: ConcrntLogoSplittedProps): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={{ width: props.size, height: props.size }}>
            <path
                d="M422.58,256.38c0,91.95-74.8,166.75-166.75,166.75s-166.75-74.8-166.75-166.75S163.89,89.63,255.83,89.63V19.63c-63.24,0-122.69,24.63-167.41,69.34S19.09,193.14,19.09,256.38s24.63,122.69,69.34,167.41,104.17,69.34,167.41,69.34,122.69-24.63,167.41-69.34,69.34-104.17,69.34-167.41h-70Z"
                style={{ fill: props.frameColor }}
            />
            <polygon
                points="367.75 144.49 218.44 226.55 236.14 276.1 280.01 407.71 367.75 144.49"
                style={{ fill: props.lowerColor }}
            />
            <polygon
                points="104.53 232.23 236.14 276.1 367.75 144.49 104.53 232.23"
                style={{ fill: props.upperColor }}
            />
        </svg>
    )
}
