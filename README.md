# Saumya Chaturvedi Portfolio Website

A cinematic, responsive personal portfolio built with `HTML`, `CSS`, and `vanilla JavaScript`.

This project was designed as a polished single-page portfolio with strong mobile support, smooth motion, interactive sections, and performance-minded visual effects. It can be used as inspiration for anyone building a modern developer portfolio without a framework.

## Live Demo

[View Portfolio](https://saumyachaturvedii.github.io/)

## Highlights

- Fully responsive layout for desktop, tablet, and mobile
- Smooth scroll-based reveals and section transitions
- Mobile-specific polish and navigation behavior
- Interactive project deck and creative showcase cards
- Floating navigation with active section tracking
- Reduced-motion and lower-power fallbacks for better usability
- Contact form integration using `FormSubmit`
- Static site structure with no build step required

## Tech Stack

- `HTML5`
- `CSS3`
- `Vanilla JavaScript`
- `Google Fonts`
- `Devicon` assets for tech icons
- `FormSubmit` for contact form handling

## Project Structure

```text
.
├── index.html
├── styles.css
├── responsive-fix.css
├── script.js
├── profile-optimized.webp
├── project1-new.jpg
├── project2-new.jpg
├── project3-new.jpg
└── Saumya_Chaturvedi_Resume.pdf
```

## What This Repo Can Help You Learn

- How to build a strong portfolio website without React, Next.js, or other frameworks
- How to separate base styling and device-specific overrides cleanly
- How to use `IntersectionObserver` for reveal animations
- How to create interactive UI sections with lightweight JavaScript
- How to improve mobile UX without breaking desktop behavior
- How to keep animation-heavy pages visually rich while staying performance-aware

## Running Locally

Because this is a static site, you can run it in any of these ways:

1. Open `index.html` directly in your browser.
2. Use VS Code Live Server.
3. Run a small local server:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Customization Guide

### Personal Information

Edit content in `index.html` to update:

- Name
- Hero text
- About section
- Skills
- Projects
- Creative section
- Contact details
- Social links

### Styling

Use these files depending on what you want to change:

- `styles.css` for base design, layout, and global styling
- `responsive-fix.css` for mobile, tablet, and device-specific polish
- `script.js` for animations, scroll logic, navigation behavior, and interactive effects

### Assets

Replace these files with your own if you fork the project:

- `profile-optimized.webp`
- `project1-new.jpg`
- `project2-new.jpg`
- `project3-new.jpg`
- `Saumya_Chaturvedi_Resume.pdf`

### Contact Form

The contact form uses `FormSubmit`.

If you want to use your own email, update the form `action` inside `index.html`.

## Deployment

This project is ready to deploy as a static website.

### GitHub Pages

1. Push the project to a GitHub repository.
2. Open `Settings` in the repository.
3. Go to `Pages`.
4. Set the source to your main branch and root folder.
5. Save and wait for GitHub Pages to publish the site.

If you use a different domain or repository URL, also update:

- `og:url` in `index.html`
- social preview metadata if needed

## Performance Notes

This project already includes a few optimization-focused choices:

- Preloaded hero image
- Lazy-loaded project and icon images where appropriate
- Motion fallbacks for users who prefer reduced animation
- Lower visual load on smaller or touch devices
- Static architecture with no framework bundle

## Browser Notes

The site is built to degrade gracefully across modern browsers. Advanced visual effects such as blur, glow, and motion are layered so the experience still remains usable if a browser does not fully support every effect.

## Credits

- [Google Fonts](https://fonts.google.com/)
- [Devicon](https://devicon.dev/)
- [FormSubmit](https://formsubmit.co/)

## If You Use This Repo

Feel free to use this project as inspiration for your own portfolio, learn from the structure, and adapt the interactions to fit your style.
