# Skill: Modern React Expo & Apple-Style Architecture
- **Tech Stack**: React Native, Expo Router, TypeScript, Tailwind/NativeWind or StyleSheet system.
- **SOLID Principles**: 
  - *Single Responsibility*: Separate hooks (data/state) from UI components. No fat components.
  - *Open/Closed*: Use composition and children props rather than massive config switches.
  - *Dependency Inversion*: Services and hardware integrations (Location, Bluetooth/Watch, Notifications) must be injected via custom hooks, never hardcoded inside views.
- **Apple UI/UX Design System**:
  - Typography: SF Pro scaling hierarchy, generous whitespace, high contrast.
  - Colors: Dynamic system backgrounds, deep blacks, subtle separators, vibrant accent cards.
  - Motion: Fluid, spring-based micro-interactions (using Reanimated).
