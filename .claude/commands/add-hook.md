# Add Custom Hook

Create a new React hook following project conventions.

## Instructions

Create a new hook in `next/src/hooks/` with the following patterns:

1. **File naming**: Use `use-` prefix with kebab-case (e.g., `use-local-storage.ts`, `use-debounce.ts`)

2. **Hook structure**:
```typescript
import { useState, useEffect, useCallback } from "react"

type UseHookNameOptions = {
  initialValue?: string
  delay?: number
}

type UseHookNameReturn = {
  value: string
  setValue: (value: string) => void
  reset: () => void
}

export const useHookName = (options: UseHookNameOptions = {}): UseHookNameReturn => {
  const { initialValue = "", delay = 300 } = options

  const [value, setValue] = useState(initialValue)

  const reset = useCallback(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    // Side effects here
    return () => {
      // Cleanup
    }
  }, [value, delay])

  return { value, setValue, reset }
}
```

3. **Common hook patterns**:

**State hook**:
```typescript
export const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue)
  const toggle = useCallback(() => setValue(v => !v), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])
  return { value, toggle, setTrue, setFalse }
}
```

**Data fetching hook** (with SWR-like pattern):
```typescript
export const useData = <T>(key: string, fetcher: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetcher()
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [key])

  return { data, error, isLoading }
}
```

4. **Best practices**:
   - Return objects for multiple values (easier to extend)
   - Use `useCallback` for returned functions
   - Handle cleanup in `useEffect` return
   - Provide sensible defaults
   - Type everything explicitly

Ask for the hook name and purpose before creating.
