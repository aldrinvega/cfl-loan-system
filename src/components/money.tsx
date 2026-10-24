import { formatAmount, type Centavos } from '@/lib/money'
import { cn } from '@/lib/utils'

const PESO_TEXT = /^([−-]?)(₱?)([\d,]+)\.(\d{2})$/

/**
 * A peso amount with the centavos set small and raised, the way the Mercury references show money.
 * `signed` adds a "+" to positive amounts; `positive` sets money coming in in green.
 */
export function Money({
  value,
  peso = true,
  signed = false,
  positive = false,
  className,
}: {
  value: Centavos
  peso?: boolean
  signed?: boolean
  positive?: boolean
  className?: string
}) {
  const sign = value < 0 ? '−' : signed && value > 0 ? '+' : ''
  const [whole, cents] = formatAmount(Math.abs(value)).split('.')
  return (
    <span className={cn('money', positive && value > 0 && 'text-positive', className)}>
      {sign}
      {peso && '₱'}
      {whole}
      <span className="cents">.{cents}</span>
    </span>
  )
}

/** Same look for an amount that is already formatted ("₱1,100.00", "−₱50.00", "1,100.00"). */
export function MoneyText({ text, className }: { text: string; className?: string }) {
  const m = PESO_TEXT.exec(text)
  if (!m) return <span className={className}>{text}</span>
  const [, sign, peso, whole, cents] = m
  return (
    <span className={cn('money', className)}>
      {sign}
      {peso}
      {whole}
      <span className="cents">.{cents}</span>
    </span>
  )
}

/** Renders strings that look like amounts as money, anything else as given. */
export function maybeMoney(value: React.ReactNode, className?: string) {
  return typeof value === 'string' && PESO_TEXT.test(value) ? <MoneyText text={value} className={className} /> : value
}
