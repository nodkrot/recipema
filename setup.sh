#!/bin/bash

if [ -z "$1" ]; then
  echo "Missing bucket name (i.e. example.com)"
  exit 0
fi

BUCKET_NAME=$1


aws s3api create-bucket --bucket $BUCKET_NAME --region us-east-1
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy \
'{
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
        }
    ]
}'
# `--error-document index.html` is not set to error.html because react-router handles error pages
aws s3 website s3://$BUCKET_NAME/ --index-document index.html --error-document index.html
sed -i '' 's/react-static/'$BUCKET_NAME'/g' package.json
