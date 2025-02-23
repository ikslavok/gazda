# Copyright (c) 2025, Filip Ilic and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Racun(Document):
	def before_delete(self):
		if self.uplata:
			import frappe
			frappe.delete_doc('Transakcija', self.uplata)
