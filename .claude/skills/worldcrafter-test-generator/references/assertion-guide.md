# Assertion Guide for WorldCrafter Tests

Common assertions and testing utilities for Vitest, React Testing Library, and Playwright.

## Vitest Assertions

### Basic Assertions

```typescript
// Equality
expect(value).toBe(expected)           // Strict equality (===)
expect(value).toEqual(expected)        // Deep equality
expect(value).not.toBe(unexpected)

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeDefined()

// Numbers
expect(number).toBeGreaterThan(5)
expect(number).toBeGreaterThanOrEqual(5)
expect(number).toBeLessThan(10)
expect(number).toBeLessThanOrEqual(10)
expect(number).toBeCloseTo(0.3, 1)     // Floating point

// Strings
expect(string).toMatch(/pattern/)
expect(string).toContain('substring')
expect(string).toHaveLength(10)

// Arrays
expect(array).toContain(item)
expect(array).toHaveLength(3)
expect(array).toEqual(expect.arrayContaining([1, 2]))

// Objects
expect(object).toHaveProperty('key')
expect(object).toHaveProperty('key', value)
expect(object).toMatchObject({ key: 'value' })
expect(object).toStrictEqual({ exact: 'match' })

// Exceptions
expect(() => fn()).toThrow()
expect(() => fn()).toThrow('error message')
expect(() => fn()).toThrow(Error)

// Promises
await expect(promise).resolves.toBe(value)
await expect(promise).rejects.toThrow()
```

### Advanced Matchers

```typescript
// Partial matching
expect(object).toEqual(
  expect.objectContaining({
    key: 'value',
    nested: expect.objectContaining({
      prop: 'value'
    })
  })
)

// Array containing
expect(array).toEqual(
  expect.arrayContaining(['item1', 'item2'])
)

// Any type
expect(value).toEqual(expect.any(String))
expect(value).toEqual(expect.any(Number))
expect(value).toEqual(expect.any(Object))

// String matching
expect(value).toEqual(expect.stringContaining('substring'))
expect(value).toEqual(expect.stringMatching(/pattern/))

// Asymmetric matchers
expect({
  id: expect.any(String),
  name: 'John',
  age: expect.any(Number),
  createdAt: expect.any(Date)
}).toEqual(result)
```

### Mock Function Assertions

```typescript
// Called
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledTimes(2)
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
expect(mockFn).toHaveBeenLastCalledWith('arg')
expect(mockFn).toHaveBeenNthCalledWith(1, 'first call')

// Return values
expect(mockFn).toHaveReturned()
expect(mockFn).toHaveReturnedTimes(2)
expect(mockFn).toHaveReturnedWith('value')
expect(mockFn).toHaveLastReturnedWith('value')

// Not called
expect(mockFn).not.toHaveBeenCalled()
```

## React Testing Library Assertions

### DOM Queries

```typescript
import { screen } from '@testing-library/react'

// Query by role (preferred)
screen.getByRole('button', { name: /submit/i })
screen.getByRole('heading', { level: 1 })
screen.getByRole('textbox', { name: /email/i })

// Query by label
screen.getByLabelText(/email/i)
screen.getByLabelText('Email Address')

// Query by text
screen.getByText(/hello world/i)
screen.getByText((content, element) => content.startsWith('Hello'))

// Query by test ID
screen.getByTestId('custom-element')

// Query variants
screen.getByRole(...)      // Throws if not found
screen.queryByRole(...)    // Returns null if not found
screen.findByRole(...)     // Async, waits for element

// Multiple elements
screen.getAllByRole('listitem')
screen.queryAllByRole('listitem')
screen.findAllByRole('listitem')
```

### Presence Assertions

```typescript
import { expect } from 'vitest'

// In document
expect(element).toBeInTheDocument()
expect(element).not.toBeInTheDocument()

// Visible
expect(element).toBeVisible()
expect(element).not.toBeVisible()

// Empty
expect(element).toBeEmptyDOMElement()

// Contains element
expect(container).toContainElement(child)
expect(container).toContainHTML('<span>text</span>')
```

### Attribute Assertions

```typescript
// Attributes
expect(element).toHaveAttribute('type', 'text')
expect(element).toHaveAttribute('disabled')
expect(element).not.toHaveAttribute('disabled')

// Class
expect(element).toHaveClass('btn')
expect(element).toHaveClass('btn', 'btn-primary')

// Style
expect(element).toHaveStyle({ display: 'none' })
expect(element).toHaveStyle(`
  color: red;
  background: blue;
`)

// Value
expect(input).toHaveValue('text')
expect(select).toHaveValue('option1')
expect(checkbox).toBeChecked()
expect(checkbox).not.toBeChecked()

// Display value (what user sees)
expect(input).toHaveDisplayValue('Displayed Text')
```

### Form Assertions

```typescript
// Input value
expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com')

// Checkbox/Radio
expect(screen.getByRole('checkbox')).toBeChecked()
expect(screen.getByRole('radio')).not.toBeChecked()

// Select
expect(screen.getByRole('combobox')).toHaveValue('option1')

// Form validation
expect(screen.getByLabelText(/email/i)).toBeValid()
expect(screen.getByLabelText(/email/i)).toBeInvalid()
expect(screen.getByLabelText(/email/i)).toHaveErrorMessage('Invalid email')

// Required
expect(screen.getByLabelText(/email/i)).toBeRequired()

// Disabled
expect(screen.getByRole('button')).toBeDisabled()
expect(screen.getByRole('button')).toBeEnabled()
```

### Text Content Assertions

```typescript
// Text content
expect(element).toHaveTextContent('exact text')
expect(element).toHaveTextContent(/pattern/i)

// Accessibility
expect(element).toHaveAccessibleName('Button name')
expect(element).toHaveAccessibleDescription('Button description')

// Focus
expect(element).toHaveFocus()
```

## Async Assertions

### waitFor

```typescript
import { waitFor } from '@testing-library/react'

// Wait for assertion to pass
await waitFor(() => {
  expect(screen.getByText(/loaded/i)).toBeInTheDocument()
})

// Custom timeout
await waitFor(() => {
  expect(screen.getByText(/data/i)).toBeInTheDocument()
}, { timeout: 5000 })

// Custom interval
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled()
}, { interval: 100 })
```

### waitForElementToBeRemoved

```typescript
import { waitForElementToBeRemoved } from '@testing-library/react'

// Wait for element to disappear
await waitForElementToBeRemoved(() => screen.queryByText(/loading/i))
```

### findBy Queries (Built-in Waiting)

```typescript
// Automatically waits (default 1000ms)
const element = await screen.findByText(/async content/i)
expect(element).toBeInTheDocument()

// Custom timeout
const element = await screen.findByText(/slow content/i, {}, { timeout: 5000 })
```

## Playwright Assertions

### Element Assertions

```typescript
import { expect } from '@playwright/test'

// Visibility
await expect(page.locator('button')).toBeVisible()
await expect(page.locator('button')).toBeHidden()

// Enabled/Disabled
await expect(page.locator('button')).toBeEnabled()
await expect(page.locator('button')).toBeDisabled()

// Checked
await expect(page.locator('input[type="checkbox"]')).toBeChecked()
await expect(page.locator('input[type="checkbox"]')).not.toBeChecked()

// Focus
await expect(page.locator('input')).toBeFocused()

// Editable
await expect(page.locator('input')).toBeEditable()
```

### Text Content

```typescript
// Exact text
await expect(page.locator('h1')).toHaveText('Hello World')

// Pattern match
await expect(page.locator('h1')).toHaveText(/hello/i)

// Contains
await expect(page.locator('div')).toContainText('substring')

// Multiple elements
await expect(page.locator('li')).toHaveText(['Item 1', 'Item 2', 'Item 3'])
```

### Attributes

```typescript
// Has attribute
await expect(page.locator('button')).toHaveAttribute('type', 'submit')
await expect(page.locator('img')).toHaveAttribute('src', /logo\.png/)

// Class
await expect(page.locator('button')).toHaveClass('btn-primary')
await expect(page.locator('button')).toHaveClass(/btn-/)

// CSS
await expect(page.locator('div')).toHaveCSS('color', 'rgb(255, 0, 0)')

// Value
await expect(page.locator('input')).toHaveValue('text')
await expect(page.locator('input')).toHaveValue(/pattern/)
```

### Page Assertions

```typescript
// URL
await expect(page).toHaveURL('/dashboard')
await expect(page).toHaveURL(/\/posts\/\d+/)

// Title
await expect(page).toHaveTitle('My App')
await expect(page).toHaveTitle(/Dashboard/)

// Screenshot comparison
await expect(page).toHaveScreenshot('homepage.png')
```

### Count

```typescript
// Number of elements
await expect(page.locator('li')).toHaveCount(5)
await expect(page.locator('li')).toHaveCount(0) // None present
```

### Accessibility

```typescript
// Accessible name
await expect(page.locator('button')).toHaveAccessibleName('Submit Form')

// Accessible description
await expect(page.locator('button')).toHaveAccessibleDescription('Click to submit')

// Role
await expect(page.locator('[role="alert"]')).toBeVisible()
```

## Custom Matchers

### Create Custom Matcher

```typescript
import { expect } from 'vitest'

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
})

// Usage
expect(5).toBeWithinRange(1, 10)
```

## Snapshot Testing

```typescript
// Component snapshot
import { render } from '@testing-library/react'

it('matches snapshot', () => {
  const { container } = render(<MyComponent />)
  expect(container).toMatchSnapshot()
})

// Inline snapshot
expect(value).toMatchInlineSnapshot(`"expected value"`)

// Update snapshots: npm test -- -u
```

## Common Patterns

### Testing Error States

```typescript
it('displays error message', async () => {
  renderWithProviders(<Form />)

  await user.click(screen.getByRole('button', { name: /submit/i }))

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/error/i)
  })
})
```

### Testing Loading States

```typescript
it('shows loading indicator', () => {
  renderWithProviders(<Component isLoading={true} />)

  expect(screen.getByRole('status')).toBeInTheDocument()
  expect(screen.getByText(/loading/i)).toBeVisible()
})
```

### Testing Conditional Rendering

```typescript
it('shows content when loaded', () => {
  renderWithProviders(<Component isLoaded={true} data={mockData} />)

  expect(screen.getByText(mockData.title)).toBeInTheDocument()
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
})
```

### Testing Multiple Elements

```typescript
it('renders all items', () => {
  renderWithProviders(<List items={['A', 'B', 'C']} />)

  const items = screen.getAllByRole('listitem')

  expect(items).toHaveLength(3)
  expect(items[0]).toHaveTextContent('A')
  expect(items[1]).toHaveTextContent('B')
  expect(items[2]).toHaveTextContent('C')
})
```

### Testing Async Updates

```typescript
it('updates after async operation', async () => {
  renderWithProviders(<AsyncComponent />)

  await user.click(screen.getByRole('button', { name: /load/i }))

  // Wait for loading to finish
  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i))

  // Check for new content
  expect(screen.getByText(/loaded data/i)).toBeInTheDocument()
})
```

## Debugging Assertions

### Print DOM

```typescript
import { screen } from '@testing-library/react'

// Print current DOM
screen.debug()

// Print specific element
screen.debug(screen.getByRole('button'))

// Print with limit
screen.debug(undefined, 20000)
```

### Log Queries

```typescript
import { logRoles } from '@testing-library/react'

const { container } = render(<Component />)
logRoles(container)
```

### Check Available Queries

```typescript
// Shows what queries are available for element
screen.logTestingPlaygroundURL()
```

## Best Practices

1. **Prefer specific assertions**
   ```typescript
   // ❌ Less specific
   expect(element).toBeTruthy()

   // ✅ More specific
   expect(element).toBeInTheDocument()
   ```

2. **Use accessible queries**
   ```typescript
   // ❌ Less accessible
   screen.getByTestId('submit-button')

   // ✅ More accessible
   screen.getByRole('button', { name: /submit/i })
   ```

3. **Test user-visible behavior**
   ```typescript
   // ❌ Testing implementation
   expect(component.state.count).toBe(5)

   // ✅ Testing visible behavior
   expect(screen.getByText(/count: 5/i)).toBeInTheDocument()
   ```

4. **Wait for async changes**
   ```typescript
   // ❌ May fail if async
   expect(screen.getByText(/success/i)).toBeInTheDocument()

   // ✅ Waits for element
   await expect(screen.findByText(/success/i)).resolves.toBeInTheDocument()
   ```

5. **Use appropriate timeouts**
   ```typescript
   // For slow operations
   await waitFor(() => {
     expect(screen.getByText(/loaded/i)).toBeInTheDocument()
   }, { timeout: 5000 })
   ```
