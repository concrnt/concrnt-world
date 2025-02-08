export const CurrencyText = ({ value }: { value: number }): JSX.Element => {
    if (value < 1000) {
        return <>{`${value}uA`}</>
    } else if (value < 1000000) {
        return <>{`${value / 1000}mA`}</>
    } else {
        return <>{`${value / 1000000}A`}</>
    }
}
