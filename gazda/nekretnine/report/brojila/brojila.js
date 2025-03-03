// Copyright (c) 2025, Filip Ilic and contributors
// For license information, please see license.txt

frappe.query_reports["Brojila"] = {
	"filters": [],
	"formatter": function(value, row, column, data, default_formatter) {
		if (column.fieldname === "tip_brojila") {
			return `<div class="pill">${value}</div>`;
		}
		return default_formatter(value, row, column, data);
	},
	onload: function(report) {
		// Add CSS for pills
		$('head').append(`
			<style>
				.pill {
					display: inline-block;
					background-color: var(--orange-100);
					color: var(--orange-600);
					padding: 2px 8px;
					border-radius: 12px;
					font-size: 14px;
					white-space: nowrap;
				}
			</style>
		`);
	}
};
