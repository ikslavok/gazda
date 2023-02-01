#!/bin/bash

cp /opt/centar/frappe/apps/bth/bin/trans13/sr.csv /opt/centar/frappe/apps/erpnext/erpnext/translations/sr.csv
cp /opt/centar/frappe/apps/bth/bin/trans13/sr.csv  /opt/centar/frappe/apps/frappe/frappe/translations/sr.csv
cp /opt/centar/frappe/apps/bth/bin/trans13/sr.csv  /opt/centar/frappe/apps/bth/bth/translations/sr.csv
bench --site centar.belotehna.rs clear-cache

