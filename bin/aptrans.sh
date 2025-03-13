#!/bin/bash

cp ./bin/locale/frappe/sr.po ../frappe/frappe/locale/sr.po
bench build && bench clear-cache

