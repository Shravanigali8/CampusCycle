# CSS Not Loading - Troubleshooting Steps

If you're only seeing HTML without CSS styling, follow these steps:

## 1. Stop the Dev Server
Press `Ctrl+C` in the terminal where `npm run dev` is running

## 2. Clear Next.js Cache
```bash
rm -rf .next
```

## 3. Restart the Dev Server
```bash
npm run dev
```

## 4. Verify CSS is Imported
Check that `app/layout.tsx` has this import:
```typescript
import './globals.css'
```

## 5. Check Browser Console
Open browser DevTools (F12) and check:
- Console for any CSS errors
- Network tab to see if CSS files are loading
- Elements tab to see if Tailwind classes are applied

## 6. Force Hard Refresh
- Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- Safari: `Cmd+Option+R`

## 7. Verify Tailwind Config
The config file should be `tailwind.config.ts` (not `.cjs`)

## 8. Check PostCSS Config
Should have `postcss.config.js` with tailwindcss and autoprefixer

If issues persist, check the terminal output when starting the dev server for any errors.

