# Copyright (c) 2023, Filip Ilic and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class Transakcija(Document):
	def before_submit(self):
		# self.db_set('state','PLAĆENO')
		naziv_racuna = frappe.get_value('Racun', self.racun, 'naziv')
		self.naziv = naziv_racuna if naziv_racuna else f"{self.tip_transakcije} za {self.period} - {self.uplatilac.split(' ')[0].upper()} ({self.nekretnina.skracenica})"
		
	def on_submit(self):
		if self.racun:
			racun_doc = frappe.get_doc("Racun", self.racun)
			if racun_doc.docstatus == 0:  
				racun_doc.submit()
  