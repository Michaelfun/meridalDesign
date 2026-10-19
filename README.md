# Meridian Studio website

React 18, Vite, Tailwind v4, Framer Motion, react-three-fiber, React Router, Lenis.

    npm install
    npm run dev      # develop
    npm run build    # production build in dist/

## Content (CMS)
All copy and projects live in `content/` (`site.json` and `projects/*.json`) and are edited at `/admin` with Decap CMS.
1. Set `repo` in `public/admin/config.yml`. For local editing run `npx decap-server` next to `npm run dev`.
2. GitHub backend needs an OAuth app. On Netlify, switch the backend to `git-gateway` and enable Identity.
3. Each save commits to Git and triggers a redeploy.
Project pages are generated from `content/projects` at `/projects/<slug>`.

## Analytics
Copy `.env.example` to `.env`. `VITE_PLAUSIBLE_DOMAIN` enables cookieless analytics with no banner. `VITE_GA_ID` enables Google Analytics after the visitor accepts a cookie banner. Events: `project_view`, `contact_submit`. Nothing loads in dev.

## 3D scene
`src/Scene.jsx`: `KEYS` is the camera path, `WALLS` the layout, `SHADOW` the shadow map size.

## Hosting
`public/_redirects` (Netlify) and `vercel.json` route all paths to the app so `/projects/...` works on refresh.

## SEO
`npm run build` also runs `scripts/postbuild.mjs`: it writes `sitemap.xml`, `robots.txt` and a static `dist/projects/<slug>/index.html` for every project, each with its own title, description, canonical URL, social preview image and structured data. Set `VITE_SITE_URL` in `.env` first. Page content itself still renders in the browser.

## The house model
`src/Scene.jsx` builds a 3-bedroom, 2-toilet house procedurally from the supplied plan (10.4 m x 11.6 m, flat roof, columned entrance, drawing room, dining, kitchen, staircase). Edit `WALLS` (walls with window/door openings), `ITEMS` (furniture), `ROOMS` (plan labels) and `KEYS` (camera path). Trees, palms, lawn and sky are in the environment components at the bottom of the file.

## Camera tour
`src/tour.js` holds the camera track (`KEYS`), the on-screen captions (`STOPS`) and the tour length (`TOUR_VH`). `src/house.js` holds the walls, furniture, staircase and roof opening as plain data. After changing either, run `npm run check:tour`: it reports any point where the camera would pass through a wall, furniture or the ceiling, and any stretch where a wall fills the view.

## After the tour
Once the walk-through ends, the camera rises off the roof terrace and circles the finished house in slow motion (see `ORBIT_FROM` and the orbit block in `Rig`, `src/Scene.jsx`). Every section after the tour is transparent so the house stays visible; the copy sits on frosted panels. The 3D scene uses locally generated textures and reflections, so it needs no extra downloads.

## Brand and logo
The company name lives in one place: `brand` in `content/site.json` (also editable in the CMS under Site settings). The header and footer logo (`src/components/Logo.jsx`) reads it. Outlined SVG files for print, social and the favicon are in `public/` (`logo.svg`, `logo-light.svg`, `logo-mark.svg`, `favicon.svg`); if you rename the company, the wordmark in those files needs regenerating, but the mark itself stays.

## Environment
`src/vegetation.jsx` generates the tropical planting (areca and coconut-style palms, canopy trees, banana plants, flowering shrubs, grass) with instancing and a light breeze. Positions are listed in `build()`. The sun, clouds and sky gradient are in `src/Scene.jsx` (`SUN_VIS`, `SKY`, `Clouds`).

## Mobile
`src/quality.js` detects phones and small tablets. On those the 3D scene drops shadows, renders at a lower pixel ratio, uses fewer lights, clouds, leaves and grass blades, and re-frames the camera for tall screens.
