// Copyright (c) 2025, Filip Ilic and contributors
// For license information, please see license.txt

frappe.query_reports["Transakcije koje pratimo"] = {
	"filters": [
		{
			"fieldname": "nekretnina",
			"label": __("Nekretnina"),
			"fieldtype": "Link",
			"options": "Nekretnina",
			"width": "300px"
		},
		{
			"fieldname": "zakupac",
			"label": __("Zakupac"),
			"fieldtype": "Link",
			"options": "Osoba",
			"width": "200px"
		},
		{
			"fieldname": "transakcije",
			"label": __("Pratimo ove transakcije"),
			"fieldtype": "Data",
			"width": "350px"
		}
	],
	onload: function(report) {
		// Add CSS for pills
		$('head').append(`
			<style>
				.pills-container {
					display: flex;
					flex-wrap: wrap;
					gap: 5px;
				}
				.pill {
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
