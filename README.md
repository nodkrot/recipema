# RecipeMa

Quick app starter for static websites hosted in AWS S3

## Setup

Setup AWS credentials on your machine first, then run the following commands:

```
npm run setup -- example.com    # This will create S3 bucket in AWS
npm install                     # This will install npm dependencies

npm start                       # This will start app on port 1234
npm run deploy                  # This will deploy the app to S3 bucket
```

