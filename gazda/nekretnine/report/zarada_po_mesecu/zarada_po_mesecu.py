# Copyright (c) 2025, Filip Ilic and contributors
# For license information, please see license.txt

import frappe
from datetime import datetime


def execute(filters=None):
	columns = [
		{
			"fieldname": "period",
			"label": "Period",
			"fieldtype": "Data",
			"width": 150,
			"hidden": True
		},
		{
			"fieldname": "mesec_godina",
			"label": "Mesec",
			"fieldtype": "Data",
			"width": 200
		},
		{
			"fieldname": "u_eurima",
			"label": "U eurima (EUR)",
			"fieldtype": "Currency",
			"options": "EUR",
			"width": 150
		},
		{
			"fieldname": "u_dinarima",
			"label": "U dinarima (RSD)",
			"fieldtype": "Currency",
			"options": "RSD",
			"width": 150
		},
		{
			"fieldname": "ukupno",
			"label": "Ukupno (RSD)",
			"fieldtype": "Currency",
			"options": "RSD",
			"width": 200
		},
		{
			"fieldname": "na_vreme",
			"label": "Na vreme",
			"fieldtype": "Int",
			"width": 100
		},
		{
			"fieldname": "kasnili",
			"label": "Kasnili",
			"fieldtype": "Int",
			"width": 100
		},
		{
			"fieldname": "ocekivano_racuna",
			"label": "Očekivano računa",
			"fieldtype": "Int",
			"width": 150
		}
	]
	
	data = []
	sr_months = {
		1: 'JANUAR', 2: 'FEBRUAR', 3: 'MART', 4: 'APRIL',
		5: 'MAJ', 6: 'JUN', 7: 'JUL', 8: 'AVGUST',
		9: 'SEPTEMBAR', 10: 'OKTOBAR', 11: 'NOVEMBAR', 12: 'DECEMBAR'
	}
	
	# Get all income bills (both paid and unpaid)
	svi_racuni = frappe.get_all(
		'Racun',
		filters={
			'kretanje_novca': 'prihod'
		},
		fields=['period', 'status']
	)
	
	# Get paid bills for totals
	placeni_racuni = frappe.get_all(
		'Racun',
		filters={
			'status': 'Plaćeno',
			'kretanje_novca': 'prihod'
		},
		fields=['period', 'vrednost', 'valuta', 'dinarska_protivrednost', 'rok_placanja', 'uplata', 'name']
	)
	
	monthly_totals = {}
	expected_bills = {}
	
	from_date = None
	to_date = None
	if filters:
		if filters.get('from_date'):
			from_date = datetime.strptime(filters.get('from_date'), '%Y-%m-%d')
		if filters.get('to_date'):
			to_date = datetime.strptime(filters.get('to_date'), '%Y-%m-%d')
	
	# First count expected bills per period
	for racun in svi_racuni:
		if racun.period:
			try:
				period_end = racun.period.split('-')[-1].strip()
				date_obj = datetime.strptime(period_end, '%d.%m.%Y')
				
				# Skip if outside filter range
				if from_date and to_date:
					if date_obj.date() < from_date.date() or date_obj.date() > to_date.date():
						continue
				
				period_key = date_obj.strftime('%Y-%m')
				
				if period_key in expected_bills:
					expected_bills[period_key] += 1
				else:
					expected_bills[period_key] = 1
			except Exception:
				continue
	
	# Then process paid bills
	for racun in placeni_racuni:
		if racun.period:
			try:
				period_end = racun.period.split('-')[-1].strip()
				date_obj = datetime.strptime(period_end, '%d.%m.%Y')
				
				# Skip if outside filter range
				if from_date and to_date:
					if date_obj.date() < from_date.date() or date_obj.date() > to_date.date():
						continue
				
				period_key = date_obj.strftime('%Y-%m')
				
				# Calculate values based on currency
				vrednost = float(racun.vrednost) if racun.vrednost else 0
				vrednost_eur = vrednost if racun.valuta == 'EUR' else 0
				vrednost_rsd = vrednost if racun.valuta == 'RSD' else 0
				ukupno_rsd = float(racun.dinarska_protivrednost) if racun.dinarska_protivrednost else (vrednost * 117 if racun.valuta == 'EUR' else vrednost)
				
				# Get payment date from linked Transakcija
				datum_placanja = None
				if racun.uplata:
					transakcija = frappe.get_value('Transakcija', racun.uplata, 'datum_placanja')
					if transakcija:
						datum_placanja = datetime.strptime(str(transakcija), '%Y-%m-%d')
				
				# Check if payment was on time
				rok_placanja = datetime.strptime(str(racun.rok_placanja), '%Y-%m-%d') if racun.rok_placanja else None
				
				is_late = 0
				is_on_time = 0
				
				if datum_placanja and rok_placanja:
					if datum_placanja > rok_placanja:
						is_late = 1
					else:
						is_on_time = 1
				
				if period_key in monthly_totals:
					monthly_totals[period_key]['u_eurima'] += vrednost_eur
					monthly_totals[period_key]['u_dinarima'] += vrednost_rsd
					monthly_totals[period_key]['ukupno'] += ukupno_rsd
					monthly_totals[period_key]['na_vreme'] += is_on_time
					monthly_totals[period_key]['kasnili'] += is_late
				else:
					mesec_godina = f"{sr_months[date_obj.month]} {date_obj.year}"
					monthly_totals[period_key] = {
						'period': period_key,
						'mesec_godina': mesec_godina,
						'u_eurima': vrednost_eur,
						'u_dinarima': vrednost_rsd,
						'ukupno': ukupno_rsd,
						'na_vreme': is_on_time,
						'kasnili': is_late,
						'ocekivano_racuna': 0  # Will be filled from expected_bills
					}
			except Exception as e:
				frappe.msgprint(f"Error processing record: {str(e)}")
				continue
	
	# Add expected bills count to the totals
	for period_key in monthly_totals:
		monthly_totals[period_key]['ocekivano_racuna'] = expected_bills.get(period_key, 0)
	
	data = list(monthly_totals.values())
	data.sort(key=lambda x: x['period'], reverse=True)
	
	return columns, data
