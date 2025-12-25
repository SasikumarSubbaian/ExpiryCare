# How to Add ExpiryCare Logo

## Step-by-Step Instructions

### Method 1: Using File Explorer (Easiest)

1. **Locate your logo image file** on your computer
   - Supported formats: `.png`, `.jpg`, `.jpeg`, `.svg` (PNG recommended)
   - Make sure the logo is clear and has good quality

2. **Navigate to the public folder:**
   ```
   C:\Users\Sasikumar S\NeverMiss - Life Admin for Indians\public
   ```

3. **Copy your logo file** into this `public` folder

4. **Rename it to `logo.png`** (or keep the extension if it's already PNG)
   - Right-click the file → Rename
   - Change name to: `logo.png`

### Method 2: Using VS Code/Cursor

1. **Open your project** in VS Code/Cursor

2. **In the file explorer sidebar**, find the `public` folder

3. **Right-click on `public` folder** → Select "New File" or "Paste" (if you copied the image)

4. **Name the file:** `logo.png`

5. **If you have the image in clipboard:**
   - Copy your logo image
   - Right-click in `public` folder → Paste
   - Rename to `logo.png`

### Method 3: Using Command Line (PowerShell)

1. **Open PowerShell** in your project directory

2. **Copy your logo to the public folder:**
   ```powershell
   # If your logo is on Desktop, for example:
   Copy-Item "C:\Users\Sasikumar S\Desktop\your-logo.png" -Destination ".\public\logo.png"
   
   # Or if it's in Downloads:
   Copy-Item "C:\Users\Sasikumar S\Downloads\your-logo.png" -Destination ".\public\logo.png"
   ```

3. **Verify the file exists:**
   ```powershell
   ls public\logo.png
   ```

## File Requirements

- **File name:** `logo.png` (exactly this name)
- **Location:** `public/logo.png` (in the `public` folder at project root)
- **Recommended format:** PNG with transparent background
- **Recommended size:** 200x200px to 400x400px (will be scaled to 40px height)
- **File size:** Keep under 500KB for fast loading

## Verify Logo is Added

After adding the logo, you can verify it's in the right place:

1. **Check the file exists:**
   - Navigate to: `public/logo.png`
   - File should be visible in the `public` folder

2. **Test in browser:**
   - Start your dev server: `npm run dev`
   - Visit: `http://localhost:3000/logo.png`
   - You should see your logo image

3. **Check on pages:**
   - Visit home page: `http://localhost:3000`
   - Visit dashboard: `http://localhost:3000/dashboard`
   - Logo should appear in the header

## Troubleshooting

### Logo not showing?

1. **Check file name:** Must be exactly `logo.png` (case-sensitive)
2. **Check file location:** Must be in `public/logo.png` (not `public/images/logo.png`)
3. **Restart dev server:** After adding the file, restart with `npm run dev`
4. **Clear browser cache:** Hard refresh with `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
5. **Check file format:** Ensure it's a valid image file (PNG, JPG, etc.)

### Logo appears broken/not loading?

1. **Check file size:** Very large files may take time to load
2. **Check file format:** PNG is recommended, but JPG also works
3. **Check browser console:** Open DevTools (F12) → Console tab for errors
4. **Verify path:** The code references `/logo.png` which maps to `public/logo.png`

## Alternative: Use SVG Logo

If you have an SVG logo, you can also use it:

1. **Save as:** `public/logo.svg`
2. **Update code:** Change `/logo.png` to `/logo.svg` in:
   - `app/page.tsx`
   - `components/DashboardHeader.tsx`

## Current Code References

The logo is referenced in these files:
- `app/page.tsx` - Home page header
- `components/DashboardHeader.tsx` - Dashboard header

Both use: `<Image src="/logo.png" ... />`

---

**Quick Checklist:**
- [ ] Logo file copied to `public` folder
- [ ] File renamed to `logo.png`
- [ ] Dev server restarted
- [ ] Logo visible on home page
- [ ] Logo visible on dashboard page

