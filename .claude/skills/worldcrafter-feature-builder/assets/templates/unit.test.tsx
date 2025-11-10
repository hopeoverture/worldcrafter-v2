import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/utils/render'
import FeatureComponent from '../FeatureComponent'

describe('FeatureComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<FeatureComponent />)

    expect(screen.getByRole('heading', { name: /feature/i })).toBeInTheDocument()
  })

  it('handles form submission successfully', async () => {
    const user = userEvent.setup()
    const mockSubmit = vi.fn().mockResolvedValue({ success: true })

    renderWithProviders(<FeatureComponent onSubmit={mockSubmit} />)

    // Fill form
    await user.type(screen.getByLabelText(/title/i), 'Test Title')
    await user.type(screen.getByLabelText(/description/i), 'Test Description')

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        title: 'Test Title',
        description: 'Test Description',
      })
    })
  })

  it('displays validation errors', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FeatureComponent />)

    // Submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })
  })

  it('handles submission errors', async () => {
    const user = userEvent.setup()
    const mockSubmit = vi.fn().mockResolvedValue({
      success: false,
      error: 'Operation failed',
    })

    renderWithProviders(<FeatureComponent onSubmit={mockSubmit} />)

    await user.type(screen.getByLabelText(/title/i), 'Test Title')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/operation failed/i)).toBeInTheDocument()
    })
  })

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup()
    const mockSubmit = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    )

    renderWithProviders(<FeatureComponent onSubmit={mockSubmit} />)

    await user.type(screen.getByLabelText(/title/i), 'Test Title')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    // Button should be disabled while submitting
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('resets form after successful submission', async () => {
    const user = userEvent.setup()
    const mockSubmit = vi.fn().mockResolvedValue({ success: true })

    renderWithProviders(<FeatureComponent onSubmit={mockSubmit} />)

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement

    await user.type(titleInput, 'Test Title')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(titleInput.value).toBe('')
    })
  })
})
