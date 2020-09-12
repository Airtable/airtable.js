#!/usr/bin/env sh

npm run prepare
git diff --exit-code ./build

if [ $? -eq 0 ]
then
  echo "Build dir is up to date"
else
  echo "Build dir is out of date. Run 'npm run prepare' and commit changes to update it."
  exit 1
fi