#!/bin/bash

cp ./bin/locale/frappe/sr.mo ../frappe/frappe/locale/sr.mo
bench build && bench clear-cache

