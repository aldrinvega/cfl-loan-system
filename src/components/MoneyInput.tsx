import { useLayoutEffect, useRef, useState, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { formatAmount, formatPeso, parseAmount, type Centavos } from '@/lib/money'

type Props = Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
  value: Centavos | null
  onValueChange: (value: Centavos | null) => void
}

/**
 * Peso amount field. Shows "₱1,100.00" at rest and a plain number while typing,
 * so the cashier never has to type the peso sign or commas.
 */
export function MoneyInput({ value, onValueChange, onFocus, onBlur, ...props }: Props) {
  const [draft, setDraft] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectAfterFocus = useRef(false)
  const shown = draft ?? (value === null ? '' : formatPeso(value))

  // Select the plain number as soon as it replaces the formatted one, before any key is typed,
  // so the next keystroke overwrites it.
  useLayoutEffect(() => {
    if (selectAfterFocus.current) {
      selectAfterFocus.current = false
      inputRef.current?.select()
    }
  }, [draft])

  return (
    <Input
      {...props}
      ref={inputRef}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={shown}
      onFocus={(e) => {
        selectAfterFocus.current = true
        setDraft(value === null ? '' : formatAmount(value).replace(/,/g, ''))
        onFocus?.(e)
      }}
      onChange={(e) => {
        setDraft(e.target.value)
        onValueChange(parseAmount(e.target.value))
      }}
      onBlur={(e) => {
        setDraft(null)
        onBlur?.(e)
      }}
    />
  )
}
