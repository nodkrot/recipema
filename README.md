# RecipeMa

Family recipes hub.

## Setup

Create `.env.local` and/or `.env.production` with the following variables:

```
FB_API_KEY=
FB_AUTH_DOMAIN=
FB_DATABASE_URL=
FB_PROJECT_ID=
FB_STORAGE_BUCKET=
FB_MESSAGEING_SENDER_ID=
```

Setup AWS credentials on your machine first, then run the following commands:

```
npm run setup -- example.com    # This will create website S3 bucket in AWS
npm install                     # This will install npm dependencies
npm start                       # This will start the app on port 1234

npm run build                   # This will build production bundle
npm run deploy                  # This will build and deploy the app to S3 bucket
npm run analyze                 # This will generate bundle size report
```
