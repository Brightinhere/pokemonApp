import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { renderApp } from '../../test/renderApp'

const kantoRun = {
  squads: [{ id: 'k', name: 'Kanto run', members: [6, 10034, 94], updatedAt: 1 }],
  currentId: 'k',
}
const expected = `${window.location.origin}/squad?m=6,10034,94&n=Kanto+run`

describe('Copy share link', () => {
  test('copies the full link and confirms', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    renderApp('/squads/k', { squads: kantoRun })
    await user.click(await screen.findByRole('button', { name: 'Copy share link' }))
    expect(writeText).toHaveBeenCalledWith(expected)
    expect(await screen.findByRole('button', { name: 'Link copied' })).toBeInTheDocument()
    expect(screen.getByTestId('announcer')).toHaveTextContent('Link copied')
  })

  test('shows a selected field when the clipboard refuses', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
    renderApp('/squads/k', { squads: kantoRun })
    await user.click(await screen.findByRole('button', { name: 'Copy share link' }))
    const field = await screen.findByLabelText('Copy this link to share the squad')
    expect(field).toHaveValue(expected)
    expect((field as HTMLInputElement).selectionStart).toBe(0)
    expect((field as HTMLInputElement).selectionEnd).toBe(expected.length)
  })

  test('is not offered for an empty squad', async () => {
    renderApp('/squads/k', {
      squads: { ...kantoRun, squads: [{ ...kantoRun.squads[0]!, members: [] }] },
    })
    await screen.findByRole('heading', { level: 1, name: 'Kanto run' })
    expect(screen.queryByRole('button', { name: 'Copy share link' })).not.toBeInTheDocument()
  })
})
