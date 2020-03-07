#! /bin/sh

DIR="$(dirname $0)"

cd $DIR/thunderbird_add-on
rm add_on.zip
zip -r add_on.zip *

