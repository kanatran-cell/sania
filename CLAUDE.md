# SanIA - Mobile App Development Guidelines

## Role

Expert mobile app developer specializing in modern, responsive, and accessible applications.
Every decision prioritizes: **User Experience > Performance > Accessibility > Maintainability**.

## Tech Stack

- **Framework**: React Native with Expo (SDK latest stable)
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation v6+
- **State Management**: Zustand for global state, React Query for server state
- **Styling**: NativeWind (TailwindCSS for React Native)
- **Backend/BaaS**: Supabase (auth, database, storage, realtime)
- **Testing**: Jest + React Native Testing Library
- **CI/CD**: EAS Build + EAS Submit

## Project Structure

```
src/
  app/              # Screens and navigation (file-based routing with Expo Router)
  components/
    ui/             # Reusable UI primitives (Button, Input, Card, Modal...)
    features/       # Feature-specific components
  hooks/            # Custom hooks
  services/         # API calls, external integrations
  stores/           # Zustand stores
  utils/            # Pure utility functions
  constants/        # Theme, colors, sizes, config
  types/            # Shared TypeScript types and interfaces
  assets/           # Images, fonts, animations
```

## Code Conventions

### General

- All files in TypeScript (`.ts` / `.tsx`), never `.js`
- Functional components only, no class components
- Named exports preferred over default exports
- One component per file, filename matches component name in PascalCase
- Hooks start with `use` prefix
- Constants in UPPER_SNAKE_CASE
- Interfaces prefixed with `I` only when needed for disambiguation

### Components

```tsx
// Pattern: keep components small, focused, and typed
interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export function ActionButton({ title, onPress, disabled = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text>{title}</Text>
    </Pressable>
  );
}
```

### State Management

- Local state (`useState`) for UI-only state
- Zustand for shared app state (auth, preferences, cart)
- React Query (`useQuery` / `useMutation`) for all server data
- Never duplicate server state in global store

### API Layer

- All API calls live in `src/services/`
- Use React Query hooks wrapping service functions
- Handle loading, error, and empty states in every screen
- Retry logic via React Query defaults, not manual implementation

## UX Principles

1. **Feedback inmediato**: Every user action must produce visible feedback (haptics, animations, loading states)
2. **Offline-first mindset**: Cache aggressively, show stale data with refresh option
3. **Skeleton screens** over spinners wherever possible
4. **Pull-to-refresh** on all list screens
5. **Optimistic updates** for actions that rarely fail (likes, toggles)
6. **Error boundaries** at screen level with retry action
7. **Bottom navigation** for primary actions (thumb-zone friendly)
8. **Consistent spacing** using 4px grid system (4, 8, 12, 16, 24, 32, 48)
9. **Max touch target**: minimum 44x44 pts
10. **Smooth transitions**: use `react-native-reanimated` for 60fps animations

## Performance Rules

- Use `FlatList` or `FlashList` for lists, never `ScrollView` with `.map()`
- Memoize expensive components with `React.memo` only when profiling shows need
- Images: use `expo-image` with caching, serve WebP, specify dimensions
- Avoid inline styles in render — use StyleSheet or NativeWind classes
- Lazy load screens with `React.lazy` + Suspense
- Minimize re-renders: split context, use selectors in Zustand
- Bundle size: audit with `npx expo-doctor`, remove unused dependencies
- Animations on UI thread via `useAnimatedStyle` (Reanimated)

## Accessibility (a11y)

- Every interactive element needs `accessibilityRole` and `accessibilityLabel`
- Images need `accessibilityLabel` descriptions
- Form fields need `accessibilityHint` for context
- Support Dynamic Type / font scaling (never hardcode font sizes without scaling)
- Color contrast ratio minimum 4.5:1 (AA standard)
- Test with screen reader (VoiceOver / TalkBack)
- Support reduced motion preference: `useReducedMotion()` from Reanimated
- Focus order must follow visual reading order

## Theming & Design Tokens

```ts
// src/constants/theme.ts
export const COLORS = {
  primary: '#6366F1',
  secondary: '#EC4899',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#64748B',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
} as const;

export const SPACING = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const FONT_SIZE = {
  xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32,
} as const;

export const RADIUS = {
  sm: 4, md: 8, lg: 12, xl: 16, full: 9999,
} as const;
```

- Dark mode support required from day one via `useColorScheme()`
- All colors from theme tokens, never hardcoded in components

## Error Handling

- Global error boundary at app root with crash reporting
- Per-screen error boundaries with contextual retry
- Network errors: toast notification + retry button
- Form validation: inline errors below fields, shown on blur
- Never show raw error messages to users — always human-readable

## Security

- Store sensitive data with `expo-secure-store`, never AsyncStorage
- API keys in environment variables via `expo-constants`
- Validate all user input client-side AND server-side
- Use Supabase RLS (Row Level Security) on every table
- Pin SSL certificates for production builds
- No sensitive data in logs or crash reports

## Testing Strategy

- **Unit tests**: utils, hooks, store logic
- **Component tests**: UI components with RNTL
- **Integration tests**: screen flows with mocked services
- **Coverage target**: 70% minimum on business logic
- Test accessibility: verify `accessibilityRole` and labels

## Git & Workflow

- Branch naming: `feat/`, `fix/`, `refactor/`, `chore/`
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)
- PR size: max ~300 lines changed, split if larger
- Run lint + type-check + tests before every commit

## Commands

```bash
npx expo start           # Dev server
npx expo start --clear   # Dev server with cache clear
npx jest                 # Run tests
npx jest --watch         # Tests in watch mode
npx tsc --noEmit         # Type check
npx expo-doctor          # Health check
eas build --platform all # Production build
```
