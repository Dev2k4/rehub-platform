# ReHub Frontend Architecture

## Cấu trúc thư mục

```
src/
├── api/                    # API hooks (TanStack Query)
│   ├── index.ts
│   ├── use-auth.ts         # Authentication hooks
│   ├── use-categories.ts   # Categories hooks
│   ├── use-listings.ts     # Listings hooks
│   └── use-user.ts         # User hooks
│
├── client/                 # Auto-generated OpenAPI client
│   ├── core/
│   ├── sdk.gen.ts
│   ├── types.gen.ts
│   └── index.ts
│
├── components/             # React Components
│   ├── ui/                 # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── common/             # Reusable atomic components
│   │   ├── avatar.tsx
│   │   ├── condition-badge.tsx
│   │   ├── empty-state.tsx
│   │   ├── loading-spinner.tsx
│   │   ├── price.tsx
│   │   ├── rating.tsx
│   │   ├── status-badge.tsx
│   │   └── trust-score.tsx
│   │
│   ├── composite/          # Complex composed components
│   │   ├── category-card.tsx
│   │   ├── listing-card.tsx
│   │   ├── stats-card.tsx
│   │   └── user-card.tsx
│   │
│   ├── layout/             # Layout components
│   │   ├── container.tsx
│   │   ├── footer.tsx
│   │   ├── main-nav.tsx
│   │   ├── mobile-nav.tsx
│   │   └── search-bar.tsx
│   │
│   └── index.ts            # Main export
│
├── hooks/                  # Custom React hooks
│   ├── index.ts
│   ├── use-copy-to-clipboard.ts
│   ├── use-debounce.ts
│   ├── use-is-mobile.ts
│   ├── use-local-storage.ts
│   ├── use-media-query.ts
│   └── use-on-click-outside.ts
│
├── lib/                    # Utilities & constants
│   ├── index.ts
│   ├── constants.ts        # App constants, routes, config
│   ├── format.ts           # Formatting utilities
│   └── utils.ts            # General utilities
│
├── routes/                 # TanStack Router pages
│   ├── _layout/            # Layout routes
│   ├── _layout.tsx
│   ├── __root.tsx
│   ├── login.tsx
│   ├── signup.tsx
│   └── ...
│
├── types/                  # TypeScript types
│   └── index.ts
│
├── index.css               # Tailwind + Design System
├── main.tsx                # App entry point
└── routeTree.gen.ts        # Auto-generated routes
```

## Design System

### Colors

```css
/* Primary - Royal Blue */
--primary: oklch(0.55 0.22 264);

/* Success - Emerald */
--success: oklch(0.70 0.17 162);

/* Warning - Amber */
--warning: oklch(0.80 0.16 75);

/* Destructive - Red */
--destructive: oklch(0.58 0.22 25);

/* Info - Sky Blue */
--info: oklch(0.68 0.16 230);

/* Price - Orange/Red */
--price: oklch(0.60 0.20 30);
```

### Typography

- Font: Inter
- Headings: Bold/Semibold
- Body: Regular 16px

### Spacing

Sử dụng Tailwind spacing scale: `4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px`

## Component Guidelines

### 1. Atomic Components (`components/common/`)

Small, reusable components with single responsibility:

```tsx
import { Price } from "@/components/common"

<Price amount={1500000} size="lg" />
<Rating value={4.5} count={23} />
<StatusBadge type="listing" status="active" />
```

### 2. Composite Components (`components/composite/`)

Larger components composed from atomic components:

```tsx
import { ListingCard, UserCard } from "@/components/composite"

<ListingCard listing={listing} onFavorite={handleFavorite} />
<UserCard user={user} showStats />
```

### 3. Layout Components (`components/layout/`)

Page structure components:

```tsx
import { MainNav, Footer, Container } from "@/components/layout"

<MainNav user={user} notificationCount={3} onLogout={logout} />
<Container size="lg">
  {children}
</Container>
<Footer />
```

## API Hooks Usage

### Authentication

```tsx
import { useAuth } from "@/api"

function LoginPage() {
  const { login, isLoading, loginMutation } = useAuth()

  const handleSubmit = async (data) => {
    try {
      await login(data)
      // Redirect on success
    } catch (error) {
      // Handle error
    }
  }
}
```

### Listings

```tsx
import { useListings, useListing, useCreateListing } from "@/api"

// List with filters
const { data, isLoading } = useListings({
  category_id: "123",
  price_max: 5000000,
})

// Single listing
const { data: listing } = useListing(id)

// Create new
const createMutation = useCreateListing()
```

### Categories

```tsx
import { useCategories, useFlatCategories } from "@/api"

// Tree structure (for navigation)
const { data: categories } = useCategories(true)

// Flat list (for dropdowns)
const { data: flatCategories } = useFlatCategories()
```

## Performance Optimization

### 1. React.memo

Tất cả components đều được wrap với `memo()`:

```tsx
export const Price = memo(function Price(props) {
  // ...
})
```

### 2. Code Splitting

TanStack Router tự động code-split theo routes với `autoCodeSplitting: true`.

### 3. Lazy Loading

- Images: `loading="lazy"` attribute
- Components: Dynamic imports khi cần

### 4. Query Caching

React Query tự động cache data:

```tsx
// Categories cache 10 minutes
staleTime: 1000 * 60 * 10
```

## Best Practices

1. **Import từ index files**:
   ```tsx
   import { Button, Card, ListingCard } from "@/components"
   import { formatPrice, ROUTES } from "@/lib"
   import { useListings, useAuth } from "@/api"
   ```

2. **Sử dụng TypeScript types**:
   ```tsx
   import type { Listing, User } from "@/types"
   ```

3. **Consistent naming**:
   - Components: PascalCase
   - Hooks: use + PascalCase
   - Files: kebab-case

4. **Component props**:
   - Sử dụng destructuring
   - Default values khi cần
   - Optional chaining
