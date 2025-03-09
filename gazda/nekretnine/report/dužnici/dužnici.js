// Copyright (c) 2025, Filip Ilic and contributors
// For license information, please see license.txt

frappe.query_reports["Dužnici"] = {
	"filters": [
		{
			"fieldname": "min_amount",
			"label": __("Minimalni iznos"),
			"fieldtype": "Currency",
			"default": 0
		},
		{
			"fieldname": "include_partial",
			"label": __("Uključi delimično plaćene"),
			"fieldtype": "Check",
			"default": 1
		}
	]
};
