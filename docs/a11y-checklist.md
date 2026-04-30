# Accessibility Audit Checklist

Run this before every release. Use VoiceOver (iOS) and TalkBack (Android).

## Critical Flows to Test

### 1. Registration
- [ ] All TextInput fields announce their label
- [ ] Error messages are read aloud when validation fails
- [ ] "Zarejestruj się" button announces disabled state when form is incomplete
- [ ] Password toggle announces "show/hide password"

### 2. Onboarding
- [ ] Interest chips announce selected/unselected state
- [ ] Step progress ("3 z 7") is announced
- [ ] "Dalej" button is reachable via swipe navigation

### 3. Feed
- [ ] PostCard author name and time are read in sequence
- [ ] Reaction emojis announce their count ("❤️ 3")
- [ ] "Więcej opcji" menu announces available actions
- [ ] Image descriptions are read (accessibilityLabel on Image)

### 4. Chat
- [ ] Message bubbles read sender name + content + time
- [ ] Day separator labels ("Dzisiaj") are announced
- [ ] Send button announces disabled state when input is empty
- [ ] Keyboard does not obscure the input area

### 5. Events Map
- [ ] List/Map toggle announces selected state
- [ ] Event cards read title, date, location in sequence
- [ ] RSVP buttons ("Idę / Może / Nie idę") announce current state

## Automated Checks (run in CI with expo-doctor)

```bash
npx expo-doctor
```

Common issues it catches:
- Missing `accessibilityLabel` on Pressable
- `accessibilityRole` not set on interactive elements
- Images without `accessibilityLabel`

## WCAG AA Contrast Requirements

Minimum contrast ratios:
- Normal text (< 18pt): **4.5:1**
- Large text (≥ 18pt bold): **3:1**
- UI components (buttons, inputs): **3:1**

Theme colors to verify:
| Token | Hex | Background | Ratio |
|-------|-----|-----------|-------|
| textPrimary | #1A1612 | #F5F0E8 | verify |
| textSecondary | #5C4F44 | #F5F0E8 | verify |
| accent | #C4705A | #fff | verify |
| error | #D94F3D | #fff | verify |

Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to verify.

## Touch Target Sizes

All interactive elements must be ≥ 44×44 points.  
Use `hitSlop` for small visual elements:

```tsx
<Pressable
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  style={{ width: 24, height: 24 }}
/>
```

## Sign-off

Before submitting to the App Store, get explicit sign-off from:
- [ ] Tested on iPhone with VoiceOver on (latest iOS)
- [ ] Tested on Android with TalkBack on (Android 13+)
- [ ] All critical flows above pass without getting stuck
