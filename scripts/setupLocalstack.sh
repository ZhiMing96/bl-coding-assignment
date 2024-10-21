#!/bin/bash

echo "**********************************************"
echo "Waiting for localstack startup.."

until curl -Is http://localstack:61160; do
  echo 'still waiting 1'
  sleep 5
done

echo 'setting up localstack  s3 now'
aws --endpoint-url http://localstack:61160 --region ap-southeast-1 s3api create-bucket --bucket local-post-images --acl public-read-write