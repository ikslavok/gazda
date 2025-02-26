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

	def on_trash(self):
		if self.uplata:
			trans_doc = frappe.get_doc('Transakcija', self.uplata)
			if trans_doc.docstatus == 1:  # If submitted
				trans_doc.cancel()
			trans_doc.delete()
	
	def on_cancel(self):
		if self.uplata:
			trans_doc = frappe.get_doc('Transakcija', self.uplata)
			self.db_set('uplata', None)
			if trans_doc.docstatus == 1:  
				frappe.has_permission('Transakcija', 'cancel', throw=True)
				trans_doc.flags.ignore_permissions = True
				if self.period:
					trans_doc.period = self.period + " - PONISTENO"
				trans_doc.cancel()
