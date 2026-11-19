# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## AdSense production setup

- `.env.production` enables the shared AdSense script for production builds. The host safeguard only allows `fresh-teacher.github.io`; localhost, Lovable previews, and other domains never request ads. Explicitly approved additional domains must be added to `shouldLoadAdsense` and its tests before deployment there.
- Document pages have separate responsive units below the download actions and below the document information. Archive pages insert a responsive unit after every eight visible documents when more follow; archives currently paginate at twelve documents, so each full page has one unit. Ads remain clearly separated from download controls.
- The existing publisher ID, manual slot IDs, and `public/ads.txt` are preserved. Google's approval, fill rate, and revenue are not guaranteed by loading the script.
- In **Google AdSense → Ads → By site → fresh-teacher.github.io → Edit**, enable **Auto ads**, **Anchor ads**, and **Vignette ads**, then apply the settings to the site. These account settings cannot be switched on by this repository. The shared publisher script already supports Auto ads; no additional script or custom sticky overlay is needed.
- Confirm the site is approved in AdSense and configure Google's certified consent message for visitors in regions where it is required before serving personalized ads.
