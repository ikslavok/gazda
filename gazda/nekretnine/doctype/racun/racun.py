# Copyright (c) 2025, Filip Ilic and contributors
# For license information, please see license.txt

import frappe
from datetime import datetime
from frappe.model.document import Document


class Racun(Document):
	def before_save(self):
    
		if self.period:
			datum = datetime.strptime(self.period.split('-')[-1], '%d.%m.%Y')
			mesec = datum.strftime('%B')
			sr_months = {
				'January': 'JANUAR', 'February': 'FEBRUAR', 'March': 'MART', 'April': 'APRIL',
				'May': 'MAJ', 'June': 'JUN', 'July': 'JUL', 'August': 'AVGUST', 
				'September': 'SEPTEMBAR', 'October': 'OKTOBAR', 'November': 'NOVEMBAR', 'December': 'DECEMBAR'
			}
			mesec = sr_months[mesec]
			godina = datum.strftime('%Y')
			datum_t = f"za {mesec} {godina}"
		else:
			datum_t = ""
		self.naziv = f"{self.tip_transakcije} {datum_t} - {self.uplatilac.split(' ')[0].upper()} ({frappe.get_value('Nekretnina', self.nekretnina, 'skracenica')})"
