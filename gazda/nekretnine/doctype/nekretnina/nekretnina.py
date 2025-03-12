import re
import frappe
import requests
import random
import string
from selectolax.parser import HTMLParser
from srtools import cyrillic_to_latin
from frappe import _

from frappe.model.document import Document

class Nekretnina(Document):
    def calculate_povrsina(self):
        if self.površina_m2:
            self.db_set('površina_jutro', self.površina_m2 / 5754.64)  # Fixed decimal point
            self.db_set('površina_hektar', self.površina_m2 / 10000)
    def before_save(self):
        self.calculate_povrsina()

    @frappe.whitelist()
    def fetch_cadastral_data(self):
        """Fetch cadastral data for the property"""
        if self.katastarska_strana_url:
            try:
                html = self.make_request(self.katastarska_strana_url)
                
                def parse_decimal(value):
                    if not value:
                        return 0
                    cleaned = ''.join(c for c in value if c.isdigit() or c == '.')
                    try:
                        return float(cleaned) if cleaned else 0
                    except ValueError:
                        return 0

                def scrape(selector):
                    try:
                        res = html.css_first(selector)
                        if res != None:
                            return cyrillic_to_latin(res.text())
                        else:
                            return ""
                    except Exception as e:
                        frappe.log_error(f"Error scraping selector {selector}: {str(e)}")
                        return ""
                def scrape_vlasnike(field, selector):
                    res = html.css(selector)
                    if res != None:
                        # Clear existing entries for this field
                        self.set(field, [])
                        
                        for r in res:
                            osoba_raw = cyrillic_to_latin(r.text()).title().replace('"', '').strip()
                            osoba = re.sub(r'[(@*&?].*[)@*&?]', '', osoba_raw)
                            
                            if "Vlasnici" not in osoba:
                                # Create Osoba if doesn't exist
                                if not frappe.db.exists("Osoba", osoba):
                                    new_osoba = frappe.new_doc('Osoba')
                                    new_osoba.ime = osoba
                                    new_osoba.insert()
                                
                                # Add to child table
                                self.append(field, {
                                    "suvlasnik": osoba
                                })
                        
                        # Save the parent document
                        self.save()

                # Update all the fields
                self.db_set('opština', scrape('#propNepokretnost_ucLabelPermitionOpstinaNaziv_lblText'))
                self.db_set('potes_ili_ulica', scrape("#propParcela_ucLabelPermitionUlica_lblText"))
                self.db_set('broj_parcele_kat', scrape("#propParcela_ucLabelPermitionBrParc_lblText"))
                self.db_set('katastarska_opština', scrape("#propNepokretnost_ucLabelPermitionSluzba_lblText"))
                self.db_set('mesto', scrape("#propNepokretnost_ucLabelPermitionOpstinaNaziv_lblText"))
                self.db_set('površina', parse_decimal(scrape("#propParcelaDeo_ucLabelPermitionPovrsina_lblText")))
                self.db_set('broj_lista_nepokretnosti', scrape("#propParcela_ucLabelPermitionBrojLN_lblText"))
                self.db_set('broj_parcele', scrape("#propParcela_ucLabelPermitionBrParc_lblText"))
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

                # Scrape owners
                scrape_vlasnike('imaoci_prava_na_parcelu', 'table:has(#getNosiociPravaNaParceli_lblCaption) + table #ImaocPrava + td')
                scrape_vlasnike('imaoci_prava_na_ceo_objekat', 'table:has(#getNosiociPravaNaObjektu_lblCaption) + table #ImaocPrava + td')
                scrape_vlasnike('imaoci_prava_na_posebni_deo_objekta', 'table:has(#getNosiociPravaNaPosebnomDelu_lblCaption) + table #ImaocPrava + td')
                
                if self.površina_m2 == 0:
                    if self.tip_nekretnine == 'NJIVA':
                        self.db_set('površina_m2', parse_decimal(scrape("#propParcelaDeo_ucLabelPermitionPovrsina_lblText")))
                        self.calculate_povrsina()
                    elif self.tip_nekretnine in ['ZGRADA', 'KUĆA']:
                        self.db_set('površina_m2', parse_decimal(scrape("#propObjekat_ucLabelPermitionPovrsina_lblText")))
                        self.calculate_povrsina()
                    else:
                        self.db_set('površina_m2', parse_decimal(scrape("#propObjekatDeo_ucLabelPermitionObjekatDeoPovrsina_lblText")))
                        self.calculate_povrsina()
                # Set suvlasnici based on property type if it's empty
                if len(self.get('suvlasnici', [])) == 0:
                    if self.tip_nekretnine == 'NJIVA':
                        scrape_vlasnike('suvlasnici', 'table:has(#getNosiociPravaNaParceli_lblCaption) + table #ImaocPrava + td')
                    elif self.tip_nekretnine in ['ZGRADA', 'KUĆA']:
                        scrape_vlasnike('suvlasnici', 'table:has(#getNosiociPravaNaObjektu_lblCaption) + table #ImaocPrava + td')
                    else:
                        scrape_vlasnike('suvlasnici', 'table:has(#getNosiociPravaNaPosebnomDelu_lblCaption) + table #ImaocPrava + td')

                return True

            except Exception as e:
                frappe.log_error(f"Error fetching cadastral data: {str(e)}")
                frappe.throw(_("Greška pri preuzimanju podataka iz katastra"))
                
        return False

    def make_request(self, url):
        """Make a request to the cadastral website"""
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://katastar.rgz.gov.rs',
            'Referer': 'https://katastar.rgz.gov.rs/eKatastarPublic/FindParcelaResult.aspx',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
        }
        proxies = {'http': '10.181.126.198:3131'}
        resp = requests.get(url, headers=headers, proxies=proxies)
        html = HTMLParser(resp.text)
        return html
            
@frappe.whitelist()
def fetch_cadastral_data(docname):
    try:
        doc = frappe.get_doc("Nekretnina", docname)
        result = doc.fetch_cadastral_data()
        
        if result:
            frappe.db.commit()
            return True
            
        return False
        
    except Exception as e:
        frappe.log_error(f"Error fetching cadastral data: {str(e)}")
        frappe.throw(_("Greška pri preuzimanju podataka iz katastra"))
        return False
            