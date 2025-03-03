# Copyright (c) 2025, Filip Ilic and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns = [
		{
			"fieldname": "naziv_nekretnine",
			"label": "Naziv nekretnine",
			"fieldtype": "Link",
			"options": "Nekretnina",
			"width": 350
		},
		{
			"fieldname": "zakupac",
			"label": "Zakupac",
			"fieldtype": "Link",
			"options": "Osoba",
			"width": 180
		},
		{
			"fieldname": "tip_brojila",
			"label": "Tip brojila",
			"fieldtype": "Link",
			"options": "Tip Transakcije",
			"width": 150
		},
		{
			"fieldname": "broj_brojila",
			"label": "Broj brojila",
			"fieldtype": "Data",
			"width": 350
		}
	]

	data = frappe.db.sql("""
		SELECT 
			n.name as naziv_nekretnine,
			n.zakupac,
			b.tip_brojila,
			b.broj_brojila
		FROM 
			`tabNekretnina` n
		LEFT JOIN 
			`tabNekretnina Brojila` b ON b.parent = n.name
		WHERE 
			b.tip_brojila IS NOT NULL
		ORDER BY 
			n.naziv_nekretnine, b.tip_brojila
	""", as_dict=1)

	return columns, data
