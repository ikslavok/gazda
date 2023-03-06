#!/bin/bash

cp /workspace/development/gazda/apps/gazda/bin/trans13/sr.csv  /workspace/development/gazda/apps/frappe/frappe/translations/sr.csv
#cp /workspace/development/gazda/apps/gazda/bin/trans13/sr.csv /workspace/development/gazda/apps/gazda/gazda/translations/sr.csv
bench build
bench migrate
bench clear-cache


git add .
git commit  -m "Dodat prevod: `date`"
git push
