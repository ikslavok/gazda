# Copyright (c) 2023, Filip Ilic and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class Transakcija(Document):
	def before_save(self):
		naziv_racuna = frappe.get_value('Racun', self.racun, 'naziv')
		self.naziv = naziv_racuna if naziv_racuna else f"{self.tip_transakcije} za {self.period} - {self.uplatilac.split(' ')[0].upper()} ({self.nekretnina.skracenica})"
		
	def on_trash(self):
		if self.racun:
			racun_doc = frappe.get_doc('Racun', self.racun)
			if racun_doc.docstatus == 1:  # If submitted
				racun_doc.cancel()
			racun_doc.delete()

	def on_cancel(self):
		if self.racun:
			racun_doc = frappe.get_doc('Racun', self.racun)
			if racun_doc.docstatus == 1:  # If submitted
				frappe.has_permission('Racun', 'cancel', throw=True)
				racun_doc.flags.ignore_permissions = True
				racun_doc.cancel()
	def on_submit(self):
		if self.racun:
			racun_doc = frappe.get_doc("Racun", self.racun)
			if racun_doc.docstatus == 0:  
				racun_doc.submit()
  