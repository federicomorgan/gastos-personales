import useCountUp from '../hooks/useCountUp'
import { fmtMoney } from '../utils/formatters'

export default function AnimatedNumber({ value, duration = 1500 }) {
  const count = useCountUp(value, duration)
  return <>{fmtMoney(count)}</>
}
