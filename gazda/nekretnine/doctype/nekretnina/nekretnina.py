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
		
		
		# Podaci koji se vuku iz katastra
		if self.katastarska_strana_url and (self.get_doc_before_save() == None or self.katastarska_strana_url != self.get_doc_before_save().katastarska_strana_url):
			nekretnina = make_request(self.katastarska_strana_url)
			
			# funkcija za skrejpovanje jednog polja nekretnine
			# uzima selektor kao parametar
			def scrape(selector):
				res = nekretnina.css_first(selector)
				if res != None:
					return cyrillic_to_latin(res.text())
				else:
					return ""

			def scrape_vlasnike(field, selector):
				res = nekretnina.css(selector)
				if  res != None:
					for r in res:
						osoba = cyrillic_to_latin(r.text()).title().replace('"', '').strip()
						if frappe.db.exists("Osoba", osoba):
							if "Vlasnici" not in osoba:
								self.append(field, {
									'vlasnik': osoba
								})
						else:
							if "Vlasnici" not in osoba:
								new_osoba = frappe.new_doc('Osoba')
								new_osoba.ime = osoba
								new_osoba.insert()
								self.append(field, {
									'vlasnik': osoba
								})


			# podaci o parceli
			self.db_set('opština', scrape('#propNepokretnost_ucLabelPermitionOpstinaNaziv_lblText'))
			self.db_set('potes_ili_ulica', scrape("#propParcela_ucLabelPermitionUlica_lblText"))
			self.db_set('broj_parcele_kat', scrape("#propParcela_ucLabelPermitionBrParc_lblText"))
			self.db_set('katastarska_opština', scrape("#propNepokretnost_ucLabelPermitionSluzba_lblText"))
			self.db_set('mesto', scrape("#propNepokretnost_ucLabelPermitionOpstinaNaziv_lblText"))
			self.db_set('površina', scrape("#propParcela_ucLabelPermitionPovrsina_lblText"))
			self.db_set('broj_lista_nepokretnosti', scrape("#propParcela_ucLabelPermitionBrojLN_lblText"))			
			self.db_set('broj_parcele', scrape("#propParcela_ucLabelPermitionBrParc_lblText"))
			self.db_set('površina_m2', float(scrape("#propParcela_ucLabelPermitionPovrsina_lblText")))
			scrape_vlasnike('imaoci_prava_na_parcelu', 'table:has(#getNosiociPravaNaParceli_lblCaption) + table #ImaocPrava + td')
			# pretvori u jutro i hektar
			self.db_set('površina_jutro',self.površina_m2 / 5754,64)
			self.db_set('površina_hektar',self.površina_m2 / 10000)
			# podaci o celokupnom objektu
			self.db_set('broj_objekta_zgr', scrape("#propObjekat_ucLabelPermitionBrDelaParc_lblText"))
			self.db_set('površina_objekta_zgr', scrape("#propObjekat_ucLabelPermitionPovrsina_lblText"))
			self.db_set('korisna_površina_objekta_zgr', scrape("#propObjekat_ucLabelPermitionPovrsinaKorisna_lblText"))
			self.db_set('pravni_status_objekta_zgr', scrape("#propObjekat_ucLabelPermitionObjekatStatus_lblText"))
			self.db_set('broj_etaža_pod_zemljom_zgr', scrape("#propObjekat_ucLabelPermitionBrPodzemnihEtaza_lblText"))
			self.db_set('broj_etaža_prizemlje_zgr', scrape("#propObjekat_ucLabelPermitionBrPrizemnihEtaza_lblText"))
			self.db_set('ulica_i_broj_kat_zgr', scrape("#propObjekat_ucLabelPermitionUlicaPotes_lblText") + " " + scrape("#propObjekat_ucLabelPermitionKcBroj_lblText") + " " + scrape("#propObjekat_ucLabelPermitionKcPodBr_lblText"))
			self.db_set('ulica_i_broj', scrape("#propObjekat_ucLabelPermitionUlicaPotes_lblText") + " " + scrape("#propObjekat_ucLabelPermitionKcBroj_lblText") + " " + scrape("#propObjekat_ucLabelPermitionKcPodBr_lblText"))
			self.db_set('građevinska_površina_m2_zgr', scrape("#propObjekat_ucLabelPermitionPovrsinaGradjevinska_lblText"))
			self.db_set('način_korištenja_i_naziv_objekta_zgr', scrape("#propObjekat_ucLabelPermitionObjekatKoriscenje_lblText"))
			self.db_set('broj_etaža_nad_zemljom_zgr', scrape("#propObjekat_ucLabelPermitionBrNadzemnihEtaza_lblText"))
			self.db_set('broj_etaža_potkrovlje_zgr', scrape("#propObjekat_ucLabelPermitionBrPotkrovnihEtaza_lblText"))
			scrape_vlasnike('imaoci_prava_na_ceo_objekat', 'table:has(#getNosiociPravaNaObjektu_lblCaption) + table #ImaocPrava + td')
			# podaci o posebnom delu objekta, stanu i tako to
			self.db_set('broj_objekta_stan', scrape("#propObjekatDeo_ucLabelPermitionBrDelaParc_lblText"))
			self.db_set('naziv_ulice_stan', scrape("#propObjekatDeo_ucLabelPermitionUlicaPotes_lblText"))
			self.db_set('broj_ulaza_stan', scrape("#propObjekatDeo_ucLabelPermitionBrUlaza_lblText"))
			self.db_set('ev_broj_stan', scrape("#propObjekatDeo_ucLabelPermitionEvidBroj_lblText"))
			self.db_set('način_korištenja', scrape("#propObjekatDeo_ucLabelPermitionObjekatDeoKoriscenje_lblText"))
			self.db_set('broj_stana_objekta_stan', scrape("#propObjekatDeo_ucLabelPermitionBrojStana_lblText"))
			self.db_set('podbroj_stana_objekta_stan', scrape("#propObjekatDeo_ucLabelPermitionPbrStana_lblText") + " " + scrape("#propObjekat_ucLabelPermitionKcBroj_lblText") + " " + scrape("#propObjekat_ucLabelPermitionKcPodBr_lblText"))
			self.db_set('građevinska_površina_stan', scrape("#propObjekatDeo_ucLabelPermitionObjekatDeoPovrsinaGradjevinska_lblText") + " " + scrape("#propObjekat_ucLabelPermitionKcBroj_lblText") + " " + scrape("#propObjekat_ucLabelPermitionKcPodBr_lblText"))
			self.db_set('korisna_površina_stan', scrape("#propObjekatDeo_ucLabelPermitionObjekatDeoPovrsinaKorisna_lblText"))
			self.db_set('način_utvrđivanja_korisne_površine_stan', scrape("#propObjekatDeo_ucLabelPermitionPovrsinaNacUtv_lblText"))
			scrape_vlasnike('imaoci_prava_na_posebni_deo_objekta', 'table:has(#getNosiociPravaNaPosebnomDelu_lblCaption) + table #ImaocPrava + td')

			# odredi odgovornog vlasnika i suvlasnike pomocu tipa nekretnine
			if self.tip_nekretnine == 'Njiva':
				self.db_set('vlasnik', self.imaoci_prava_na_parcelu[0].vlasnik)
				scrape_vlasnike('suvlasnici', 'table:has(#getNosiociPravaNaParceli_lblCaption) + table #ImaocPrava + td')
			elif self.tip_nekretnine == 'Zgrada':
				self.db_set('vlasnik', self.imaoci_prava_na_ceo_objekat[0].vlasnik)
				scrape_vlasnike('suvlasnici', 'table:has(#getNosiociPravaNaParceli_lblCaption) + table #ImaocPrava + td')
			else:
				self.db_set('vlasnik', self.imaoci_prava_na_posebni_deo_objekta[0].vlasnik)
				scrape_vlasnike('suvlasnici', 'table:has(#getNosiociPravaNaPosebnomDelu_lblCaption) + table #ImaocPrava + td')
			


			