![logo](./logo.png)

Family recipes hub.

## Setup

Create `.env` with the following variables (this project uses Firebase):

```
VITE_FB_API_KEY=
VITE_FB_AUTH_DOMAIN=
VITE_FB_DATABASE_URL=
VITE_FB_PROJECT_ID=
VITE_FB_STORAGE_BUCKET=
VITE_FB_MESSAGEING_SENDER_ID=
```

## Development

Use these commands for development:

```
npm install                     # This will install npm dependencies
npm start                       # This will start the app on port 1234
npm run format                  # This will format code with prettier
npm run deploy                  # This will build and deploy the app
npm run analyze                 # This will generate bundle size report
```

## Deployment

Note: For production deployments create `.env.production`

Use these commands for deployment:

```
npm run deploy                  # This will build and deploy the app
```
