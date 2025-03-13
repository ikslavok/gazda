#!/bin/bash

cp ./locale/frappe/sr.csv ./frappe/frappe/locale/sr.csv
bench build && bench clear-cache

