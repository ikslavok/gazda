# Copyright (c) 2025, Filip Ilic and contributors
# For license information, please see license.txt

import frappe
from datetime import datetime
from frappe.model.document import Document

@frappe.whitelist()
def potvrdi_uplatu(racun):
	try:
		doc = frappe.get_doc('Racun', racun)
		doc.saberi_uplate()
		doc.izracunaj_preostalo()
		doc.status = "Plaćeno" if doc.preostalo <= 20 else "Delimično plaćeno" if doc.preostalo > 20 else "Neplaćeno"
		doc.save()
		if doc.status == "Plaćeno":
			doc.submit()
		return True
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), "Error in potvrdi_uplatu")
		frappe.throw(f"Error confirming payment: {str(e)}")
     
@frappe.whitelist()
def set_missing_values_in_uplate(doc, row):
	if isinstance(doc, str):
		doc = frappe.get_doc('Racun', doc)
	if isinstance(row, str):
		row = frappe.parse_json(row)
	try:
		odrzava = frappe.get_value('Nekretnina', doc.nekretnina, 'odrzava')
	except:
		odrzava = ""
	if doc.preostalo:
		if doc.valuta == "RSD":
			return {
				'uplaceno': doc.preostalo,
				'valuta': "RSD",
				'dinarska_protivrednost': doc.preostalo,
				'primio': odrzava
			}
		else:
			preostalo_u_valuti = doc.vrednost - float(doc.uplaceno or 0) / float(doc.dinarska_protivrednost or 1) * doc.vrednost
			return {
				'uplaceno': preostalo_u_valuti,
				'valuta': doc.valuta,
				'dinarska_protivrednost': doc.preostalo,
				'primio': odrzava
			}
	return None

class Racun(Document):
	@frappe.whitelist()
	def izracunaj_preostalo(self):
		self.preostalo = float(self.dinarska_protivrednost or 0) - float(self.uplaceno or 0)
      
	def before_save(self):
		self.saberi_uplate()
		self.izracunaj_preostalo()
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

		if self.uplatilac and self.nekretnina:
			skracenica = frappe.get_value('Nekretnina', self.nekretnina, 'skracenica')
			self.naziv = f"{self.tip_transakcije} {datum_t} - {self.uplatilac.split(' ')[0].upper()} ({skracenica})"
	def saberi_uplate(self):
		total_uplaceno = 0
		for uplata in self.uplate:
			if not uplata.potvrdjeno:
				uplata.dinarska_protivrednost = frappe.call('gazda.nekretnine.api.izracunaj_protivrednost', valuta=uplata.valuta, vrednost=uplata.uplaceno)
			if uplata.dinarska_protivrednost:
				total_uplaceno += float(uplata.dinarska_protivrednost or 0)
		self.uplaceno = total_uplaceno
	
