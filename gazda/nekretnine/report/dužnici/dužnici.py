# Copyright (c) 2025, Filip Ilic and contributors
# For license information, please see license.txt

import frappe
from frappe import _

def execute(filters=None):
	columns = get_columns()
	data = get_data(filters)
	return columns, data

def get_columns():
	return [
		{
			"fieldname": "uplatilac",
			"label": _("Uplatilac"),
			"fieldtype": "Link",
			"options": "Osoba",
			"width": 200
		},
		{
			"fieldname": "ukupno_preostalo",
			"label": _("Ukupno preostalo (RSD)"),
			"fieldtype": "Currency",
			"width": 150
		},
		{
			"fieldname": "broj_racuna",
			"label": _("Broj računa"),
			"fieldtype": "Int",
			"width": 100
		},
		{
			"fieldname": "racuni",
			"label": _("Računi"),
			"fieldtype": "HTML",
			"width": 400
		}
	]

def get_data(filters):
	# Build filter conditions
	conditions = {"status": ["!=", "Plaćeno"]}
	
	# If include_partial is not checked, exclude partially paid bills
	if filters and not filters.get("include_partial"):
		conditions["status"] = "Neplaćeno"
	
	# Get all unpaid bills
	racuni = frappe.get_all(
		"Racun",
		filters=conditions,
		fields=["name", "uplatilac", "naziv", "preostalo", "status"]
	)
	
	# Group by uplatilac
	grouped_data = {}
	for racun in racuni:
		uplatilac = racun.uplatilac
		if uplatilac not in grouped_data:
			grouped_data[uplatilac] = {
				"uplatilac": uplatilac,
				"ukupno_preostalo": 0,
				"broj_racuna": 0,
				"racuni_list": []
			}
		
		grouped_data[uplatilac]["ukupno_preostalo"] += float(racun.preostalo or 0)
		grouped_data[uplatilac]["broj_racuna"] += 1
		# Store both name and title for each bill
		grouped_data[uplatilac]["racuni_list"].append({
			"name": racun.name,
			"naziv": racun.naziv,
			"status": racun.status
		})
	
	# Format the data for the report
	result = []
	min_amount = filters.get("min_amount", 0) if filters else 0
	
	for uplatilac, data in grouped_data.items():
		# Skip if below minimum amount
		if data["ukupno_preostalo"] < min_amount:
			continue
			
		# Create HTML with orange pills for each bill
		html_pills = ""
		for racun in data["racuni_list"]:
			# Use different background colors based on status
			bg_color = "#FF9800" if racun["status"] == "Delimično plaćeno" else "#F44336"  # Orange for partial, Red for unpaid
			text_color = "#FFF3E0"  # Light orange/amber text
			
			html_pills += f'<a href="/app/racun/{racun["name"]}" style="display:inline-block; margin:2px; padding:3px 8px; background-color:{bg_color}; color:{text_color}; border-radius:12px; font-size:11px; text-decoration:none;">{racun["naziv"]}</a> '
		
		data["racuni"] = html_pills
		# Remove the list as it's not needed in the final output
		del data["racuni_list"]
		result.append(data)
	
	# Sort by ukupno_preostalo in descending order
	result.sort(key=lambda x: x["ukupno_preostalo"], reverse=True)
	
	return result
