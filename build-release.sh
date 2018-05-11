#!/bin/bash
HASH=`git rev-parse --short=16  HEAD`
echo "Version ${HASH}"

rm -rf ./release
mkdir ./release

docker build -t "ercdex/mm-api:$HASH" ./api
docker push "ercdex/mm-api:$HASH"
docker build -t "ercdex/mm-aqueduct-remote:$HASH" ./aqueduct-remote
docker push "ercdex/mm-aqueduct-remote:$HASH"
docker build -t "ercdex/mm-web:$HASH" ./web
docker push "ercdex/mm-web:$HASH"
docker build -t "ercdex/mm-parity:$HASH" ./parity
docker push "ercdex/mm-parity:$HASH"

cp docker-compose.release.yml ./release
mv ./release/docker-compose.release.yml ./release/docker-compose.yml
sed -i '' "s/\$HASH/$HASH/g" release/docker-compose.yml

cp README.MD ./release
cp run-kovan.sh ./release
cp run-mainnet.sh ./release
cp check-path.sh ./release
zip -r "release-$HASH.zip" ./release
