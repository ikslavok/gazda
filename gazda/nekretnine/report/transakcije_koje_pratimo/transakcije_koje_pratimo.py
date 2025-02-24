# Copyright (c) 2025, Filip Ilic and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns = [
		{
			"fieldname": "nekretnina",
			"label": "Nekretnina",
			"fieldtype": "Link",
			"options": "Nekretnina",
			"width": 300
		},
		{
			"fieldname": "zakupac",
			"label": "Zakupac",
			"fieldtype": "Link",
			"options": "Osoba",
			"width": 200
		},
		{
			"fieldname": "transakcije",
			"label": "Transakcije",
			"fieldtype": "HTML",
			"width": 400
		}
	]
	
	data = []
	nekretnine = frappe.get_all(
		'Nekretnina',
		fields=['name', 'zakupac'],
		filters={'status': 'Zauzeto'}
	)
	
	for n in nekretnine:
		doc = frappe.get_doc('Nekretnina', n.name)
		transakcije = [t.transakcije for t in doc.pratimo_transakcije]
		pills = ' '.join([f'<span class="pill">{t}</span>' for t in transakcije]) if transakcije else ''
		data.append({
			'nekretnina': n.name,
			'zakupac': n.zakupac,
			'transakcije': f'<div class="pills-container">{pills}</div>'
		})
	
	return columns, data
