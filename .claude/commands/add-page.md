# Add Page

Create a new Next.js App Router page following project conventions.

## Instructions

Create a new page in `next/src/app/` with the following patterns:

1. **File structure**:
   - `page.tsx` - Server component (default)
   - `page.client.tsx` - Client component (if needed for interactivity)
   - `layout.tsx` - Layout wrapper (if page needs specific layout)
   - `loading.tsx` - Loading state

2. **Server Component pattern** (preferred):
```typescript
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Title | Claude Sessions Explorer",
  description: "Page description",
}

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ query?: string }>
}

export default async function PageName({ params, searchParams }: PageProps) {
  const { id } = await params
  const { query } = await searchParams

  // Fetch data here (server-side)
  const data = await fetchData(id)

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Page content */}
    </main>
  )
}
```

3. **Client Component pattern** (when needed):
```typescript
"use client"

import { useState, useEffect } from "react"

export default function PageNameClient() {
  const [data, setData] = useState(null)

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Interactive content */}
    </main>
  )
}
```

4. **Route conventions**:
   - `/app/page.tsx` → `/`
   - `/app/about/page.tsx` → `/about`
   - `/app/sessions/[id]/page.tsx` → `/sessions/:id`
   - `/app/(group)/page.tsx` → Route groups (no URL segment)

5. **Layout conventions**:
   - Layouts persist across child routes
   - Keep non-interactive wrappers in server components
   - Use `<Suspense>` for streaming

Ask for the route path and purpose before creating.
