import { useState, useEffect } from 'react'

export default function useCountUp(target, duration = 1500) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) { setCount(0); return }
    const startTime = performance.now()
    let frame

    const update = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const sign = target < 0 ? -1 : 1
      setCount(Math.round(Math.abs(target) * eased) * sign)
      if (progress < 1) frame = requestAnimationFrame(update)
      else setCount(target)
    }

    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return count
}
