import { render, screen } from '@testing-library/react'
import App from '@/App'

describe('App', () => {
  it('opens on the warband list with a prompt to import rules on first run', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Warbands' })).toBeInTheDocument()
    expect(screen.getByText('No rules loaded yet.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Import rules' })).toHaveAttribute('href', '#/rules')
  })

  it('shows a readable error for a damaged share link', async () => {
    window.location.hash = '#/s/not-a-real-payload'
    render(<App />)
    expect(await screen.findByText('This share link cannot be opened')).toBeInTheDocument()
    window.location.hash = ''
  })
})
