// Copyright (c) 2025, Filip Ilic and contributors
// For license information, please see license.txt

frappe.query_reports["Zarada po mesecu"] = {
	"filters": [],
	"formatter": function(value, row, column, data, default_formatter) {
		if (column.fieldname == "ukupno") {
			value = format_currency(value, "RSD");
			return `<div style="text-align: left">${value}</div>`;
		}
		if (column.fieldname == "u_eurima") {
			value = format_currency(value, "EUR");
			return `<div style="text-align: left">${value}</div>`;
		}
		if (column.fieldname == "u_dinarima") {
			value = format_currency(value, "RSD");
			return `<div style="text-align: left">${value}</div>`;
		}
		if (column.fieldname == "na_vreme" || column.fieldname == "kasnili") {
			return `<div style="text-align: left">${value}</div>`;
		}
		return default_formatter(value, row, column, data);
	}
};
