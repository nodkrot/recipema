# RecipeMa

Family recipes hub.

## Setup

[Setup AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) on your machine first then run below command to create website S3 bucket in AWS:

```
npm run setup -- example.com
```

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

npm run deploy                  # This will build and deploy the app
npm run analyze                 # This will generate bundle size report
```
