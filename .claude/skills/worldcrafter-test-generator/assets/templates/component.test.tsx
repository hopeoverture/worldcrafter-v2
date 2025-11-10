import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/utils/render'
import ComponentName from '../ComponentName'

describe('ComponentName', () => {
  describe('rendering', () => {
    it('renders correctly', () => {
      renderWithProviders(<ComponentName />)

      expect(screen.getByRole('heading')).toBeInTheDocument()
    })

    it('renders with props', () => {
      renderWithProviders(<ComponentName title="Test Title" />)

      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })

    it('renders loading state', () => {
      renderWithProviders(<ComponentName isLoading={true} />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/loading/i)).toBeVisible()
    })

    it('renders error state', () => {
      renderWithProviders(<ComponentName error="Something went wrong" />)

      expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i)
    })
  })

  describe('user interactions', () => {
    it('handles button click', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()

      renderWithProviders(<ComponentName onClick={handleClick} />)

      await user.click(screen.getByRole('button'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('handles form submission', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn()

      renderWithProviders(<ComponentName onSubmit={handleSubmit} />)

      await user.type(screen.getByLabelText(/input/i), 'Test input')
      await user.click(screen.getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          input: 'Test input'
        })
      })
    })

    it('validates input', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ComponentName />)

      await user.click(screen.getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument()
      })
    })
  })

  describe('state management', () => {
    it('updates state on interaction', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ComponentName />)

      const button = screen.getByRole('button', { name: /increment/i })
      expect(screen.getByText(/count: 0/i)).toBeInTheDocument()

      await user.click(button)
      expect(screen.getByText(/count: 1/i)).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles empty data', () => {
      renderWithProviders(<ComponentName data={[]} />)

      expect(screen.getByText(/no data/i)).toBeInTheDocument()
    })

    it('handles null props', () => {
      renderWithProviders(<ComponentName data={null} />)

      expect(screen.getByText(/no data/i)).toBeInTheDocument()
    })
  })
})
