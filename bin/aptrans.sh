#!/bin/bash

cp /opt/centar/frappe/apps/gazda/bin/trans13/sr.csv /opt/centar/frappe/apps/erpnext/erpnext/translations/sr.csv
cp /opt/centar/frappe/apps/gazda/bin/trans13/sr.csv  /opt/centar/frappe/apps/frappe/frappe/translations/sr.csv
cp /opt/centar/frappe/apps/gazda/bin/trans13/sr.csv  /opt/centar/frappe/apps/gazda/gazda/translations/sr.csv
bench --site stan.filipilic.com clear-cache

