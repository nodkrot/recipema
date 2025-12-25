![logo](./logo.png)

Family recipes hub.

## Setup

Create `.env.local` and/or `.env.production` with the following variables (this project uses Firebase):

```
FB_API_KEY=
FB_AUTH_DOMAIN=
FB_DATABASE_URL=
FB_PROJECT_ID=
FB_STORAGE_BUCKET=
FB_MESSAGEING_SENDER_ID=
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

## Bugs

- Deployment sporadically does not pick up prod env variables
