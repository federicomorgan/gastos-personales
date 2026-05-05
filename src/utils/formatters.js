export const fmtMoney = (n) => {
  const num = Math.round(Number(n) || 0)
  return '$ ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export const fmtMoneyCompact = (n) => {
  const num = Math.abs(Math.round(Number(n) || 0))
  if (num >= 1000000) return '$ ' + (Math.round(Number(n) / 100000) / 10).toString().replace('.', ',') + 'M'
  if (num >= 1000) return '$ ' + Math.round(Number(n) / 1000) + 'k'
  return '$ ' + Math.round(Number(n))
}
