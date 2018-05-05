#!/bin/bash
HASH=`git rev-parse --short=16  HEAD`
echo "Version ${HASH}"

docker build -t "ercdex/mm-api:$HASH" ./api
docker push "ercdex/mm-api:$HASH"
docker build -t "ercdex/mm-aqueduct-remote:$HASH" ./aqueduct-remote
docker push "ercdex/mm-aqueduct-remote:$HASH"
docker build -t "ercdex/mm-web:$HASH" ./web
docker push "ercdex/mm-web:$HASH"
docker build -t "ercdex/mm-parity:$HASH" ./parity
docker push "ercdex/mm-parity:$HASH"

cp docker-compose.release.yml ./release
sed -i '' "s/\$HASH/$HASH/g" release/docker-compose.release.yml

cp README.MD ./release
cp .env-EXAMPLE ./release
cp run.sh ./release
zip -r "release-$HASH.zip" ./release
