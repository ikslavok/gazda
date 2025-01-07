# Copyright (c) 2023, Filip Ilic and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class Transakcija(Document):
	def before_submit(self):
		# self.db_set('state','PLAĆENO')
		self.naziv = f"{self.uplatilac} - {self.tip_transakcije} ({self.nekretnina})"
		self.save()