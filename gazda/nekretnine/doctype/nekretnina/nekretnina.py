import frappe
import requests
from selectolax.parser import HTMLParser
from srtools import cyrillic_to_latin

from frappe.model.document import Document

class Nekretnina(Document):
	def validate(self):
		def make_request(url):
			resp = requests.get(url)
			html = HTMLParser(resp.text)
			return html
		if self.katastarska_strana_url != self.get_doc_before_save().katastarska_strana_url:
			nekretnina = make_request(self.katastarska_strana_url)
			
			self.db_set('opština', cyrillic_to_latin(nekretnina.css_first("#propNepokretnost_ucLabelPermitionOpstinaNaziv_lblText").text()))
			self.db_set('potes_ili_ulica', cyrillic_to_latin(nekretnina.css_first("#propParcela_ucLabelPermitionUlica_lblText").text()))
			self.db_set('broj_parcele_kat', nekretnina.css_first("#propParcela_ucLabelPermitionBrParc_lblText").text())
			self.db_set('katastarska_opština', cyrillic_to_latin(nekretnina.css_first("#propNepokretnost_ucLabelPermitionSluzba_lblText").text()))
			self.db_set('površina', float(nekretnina.css_first("#propParcela_ucLabelPermitionPovrsina_lblText").text()))
			self.db_set('broj_lista_nepokretnosti', nekretnina.css_first("#propParcela_ucLabelPermitionBrojLN_lblText").text())
			
			self.db_set('broj_parcele', nekretnina.css_first("#propParcela_ucLabelPermitionBrParc_lblText").text())
			self.db_set('površina_m2', float(nekretnina.css_first("#propParcela_ucLabelPermitionPovrsina_lblText").text()))
			self.db_set('površina_jutro',self.površina_m2 / 5754,64)
			self.db_set('površina_hektar',self.površina_m2 / 10000)

			self.db_set('broj_objekta', nekretnina.css_first("#propObjekat_ucLabelPermitionBrDelaParc_lblText").text())
			self.db_set('površina_objekta', nekretnina.css_first("#propObjekat_ucLabelPermitionPovrsina_lblText").text())
			self.db_set('korisna_površina_objekta', nekretnina.css_first("#propObjekat_ucLabelPermitionPovrsinaKorisna_lblText").text())
			self.db_set('pravni_status_objekta', cyrillic_to_latin(nekretnina.css_first("#propObjekat_ucLabelPermitionObjekatStatus_lblText").text()))
			self.db_set('broj_etaža_pod_zemljom', nekretnina.css_first("#propObjekat_ucLabelPermitionBrPodzemnihEtaza_lblText").text())
			self.db_set('broj_etaža_prizemlje', nekretnina.css_first("#propObjekat_ucLabelPermitionBrPrizemnihEtaza_lblText").text())
			self.db_set('ulica_i_broj_kat', cyrillic_to_latin(nekretnina.css_first("#propObjekat_ucLabelPermitionUlicaPotes_lblText").text() + " " + nekretnina.css_first("#propObjekat_ucLabelPermitionKcBroj_lblText").text() + " " + nekretnina.css_first("#propObjekat_ucLabelPermitionKcPodBr_lblText").text()))
			self.db_set('građevinska_površina_m2', nekretnina.css_first("#propObjekat_ucLabelPermitionPovrsinaGradjevinska_lblText").text())
			self.db_set('način_korištenja_i_naziv_objekta', cyrillic_to_latin(nekretnina.css_first("#propObjekat_ucLabelPermitionObjekatKoriscenje_lblText").text()))
			self.db_set('broj_etaža_nad_zemljom', nekretnina.css_first("#propObjekat_ucLabelPermitionBrNadzemnihEtaza_lblText").text())
			self.db_set('broj_etaža_potkrovlje', nekretnina.css_first("#propObjekat_ucLabelPermitionBrPotkrovnihEtaza_lblText").text())

			