import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export type DayPeriod = 'morning' | 'afternoon' | 'evening'

export function dayPeriod(date: Date): DayPeriod {
  const hour = date.getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315]
const ray = (i: number) => ({ '--i': i }) as CSSProperties

/**
 * The greeting's sun or moon. It plays once when it appears (the sun rises over the horizon in the
 * morning, its rays open in the afternoon, the moon turns in with two stars at night) and then
 * stays still, so it never competes with the figures below it.
 */
export function TimeOfDayIcon({ period, className }: { period: DayPeriod; className?: string }) {
  return (
    <svg
      key={period}
      viewBox="0 0 32 32"
      aria-hidden
      className={cn('tod size-8 flex-none overflow-visible', className)}
      fill="none"
      strokeLinecap="round"
    >
      {period === 'morning' && (
        <>
          <defs>
            <clipPath id="tod-horizon">
              <rect x="-4" y="-4" width="40" height="27" />
            </clipPath>
          </defs>
          <g clipPath="url(#tod-horizon)">
            <g className="tod-rise">
              <circle cx="16" cy="22" r="7" className="fill-(--sun)" />
              {[-60, -30, 0, 30, 60].map((deg, i) => (
                <line
                  key={deg}
                  x1="16"
                  y1="10.5"
                  x2="16"
                  y2="7.5"
                  strokeWidth="2"
                  className="tod-ray stroke-(--sun)"
                  style={ray(i)}
                  transform={`rotate(${deg} 16 22)`}
                />
              ))}
            </g>
          </g>
          <line x1="5" y1="23" x2="27" y2="23" strokeWidth="1.75" className="stroke-(--horizon)" />
        </>
      )}

      {period === 'afternoon' && (
        <>
          <circle cx="16" cy="16" r="6" className="tod-core fill-(--sun)" />
          {RAYS.map((deg, i) => (
            <line
              key={deg}
              x1="16"
              y1="5"
              x2="16"
              y2="2.5"
              strokeWidth="2"
              className="tod-ray stroke-(--sun)"
              style={ray(i)}
              transform={`rotate(${deg} 16 16)`}
            />
          ))}
        </>
      )}

      {period === 'evening' && (
        <>
          <defs>
            <mask id="tod-crescent">
              <rect width="32" height="32" fill="white" />
              <circle cx="20.5" cy="11.5" r="8" fill="black" />
            </mask>
          </defs>
          <circle cx="15" cy="17" r="9" mask="url(#tod-crescent)" className="tod-moon fill-(--moon)" />
          <circle cx="24" cy="7" r="1.3" className="tod-star fill-(--moon)" style={ray(0)} />
          <circle cx="28" cy="12.5" r="0.9" className="tod-star fill-(--moon)" style={ray(1)} />
        </>
      )}
    </svg>
  )
}
