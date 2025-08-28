# Kedah Logo Setup Instructions

## 🖼️ Adding the Kedah State Government Logo

### Step 1: Place the Logo File
1. Copy your `kedah-logo-png.png` file to the `public/` directory
2. Make sure the file is named exactly `kedah-logo-png.png`

### Step 2: File Location
```
project/
├── public/
│   └── kedah-logo-png.png  ← Place your logo here
├── src/
│   └── components/
│       └── Layout/
│           └── Header.tsx  ← Logo is used here
└── ...
```

### Step 3: Logo Specifications
- **Format**: PNG (recommended) or JPG
- **Size**: Recommended 200x200 pixels or larger
- **Background**: Transparent or white background works best
- **Aspect Ratio**: Square or close to square for best display

### Step 4: Current Implementation
The logo is displayed in the header next to "Program Management System" with:
- **Size**: 48x48 pixels (w-12 h-12)
- **Object Fit**: `object-contain` to maintain aspect ratio
- **Fallback**: If the logo fails to load, it falls back to the Wikipedia Kedah coat of arms

### Step 5: Testing
1. Start your development server: `npm run dev`
2. Login to the system
3. Check the header - you should see your Kedah logo next to the title
4. If the logo doesn't appear, check the browser console for errors

### Step 6: Customization (Optional)
If you want to adjust the logo size or styling, edit `src/components/Layout/Header.tsx`:

```tsx
<img 
  src="/kedah-logo-png.png" 
  alt="Kedah State Government Logo" 
  className="w-12 h-12 object-contain"  // Adjust size here
  onError={(e) => {
    // Fallback image
    e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Coat_of_arms_of_Kedah.svg/200px-Coat_of_arms_of_Kedah.svg.png";
  }}
/>
```

### Troubleshooting
- **Logo not showing**: Check if the file is in the correct location (`public/kedah-logo-png.png`)
- **Wrong size**: Adjust the `w-12 h-12` classes in the Header component
- **Fallback showing**: The fallback image will show if your logo fails to load

### Current Header Layout
```
[Kedah Logo] Program Management System
            Kedah State Government
```

The logo appears on the left side of the header, next to the system title and subtitle. 