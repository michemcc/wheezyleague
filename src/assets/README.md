# assets/

Static assets used throughout the app.

## Structure

```
assets/
├── images/     — Logos, hero images, OG images
│                 (e.g. logo.png, og-image.jpg)
└── icons/      — Custom SVG icons not covered by emoji
                  (e.g. lung-icon.svg, pace-icon.svg)
```

## Notes
- Prefer SVG for icons (scalable, small, styleable)
- Optimise images with squoosh.app or imageoptim before committing
- Reference in components via: `import logo from '../assets/images/logo.png'`
