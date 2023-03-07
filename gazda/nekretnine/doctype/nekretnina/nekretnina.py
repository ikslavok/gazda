# Copyright (c) 2023, Filip Ilic and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document

class Nekretnina(Document):
	def validate(self):
		self.db_set('površina_jutro',self.površina_m2 / 5754,64)
		self.db_set('površina_hektar',self.površina_m2 / 10000)