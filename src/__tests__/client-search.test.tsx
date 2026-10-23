// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientSearchDialog } from '@/components/client-search'
import { SessionProvider } from '@/state/session'
import { StoreProvider } from '@/state/store'

// cmdk measures and scrolls its list; jsdom has neither.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  Element.prototype.scrollIntoView ??= () => {}
})

describe('client search (F2 / Ctrl+K)', () => {
  it('opens without crashing, filters, and picks a client', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <StoreProvider>
        <SessionProvider userId="msantos">
          <ClientSearchDialog open onOpenChange={() => {}} onSelect={onSelect} />
        </SessionProvider>
      </StoreProvider>,
    )
    await user.type(screen.getByPlaceholderText('Name, client ID or loan no.'), 'castillo')
    await user.click(await screen.findByText('Castillo, Nora'))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'CL-00418' }))
  })
})
