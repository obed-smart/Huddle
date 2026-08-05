#!/bin/sh
# Strips the diagnostic layer completely. Nothing else depends on it.
#
#   rm boot.js            — the error banner + CSP listener
#   remove the guarded __reportMissing lines from every page script
#   remove the <script src="/js/boot.js"> tags from the views

cd "$(dirname "$0")"
rm -f public/js/boot.js
sed -i "/__reportMissing/d" public/js/*.js
sed -i "/Optional dependency check/,+2d" public/js/*.js
sed -i "/js\/boot\.js/d" views/*.ejs
echo "Diagnostics removed."
