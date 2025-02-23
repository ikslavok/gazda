import frappe
from datetime import datetime, timedelta
from calendar import monthrange

@frappe.whitelist()
def otvori_transakciju(**kwargs):
    tip_transakcije = kwargs.get('tip_transakcije')
    nekretnina = kwargs.get('nekretnina')
    uplatilac = kwargs.get('uplatilac')
    period = kwargs.get('period')
    name = kwargs.get('name')
    vrednost = kwargs.get('vrednost')
    valuta = kwargs.get('valuta')
    dinarska_protivrednost = kwargs.get('dinarska_protivrednost')
    naziv = kwargs.get('naziv')
    proveri_transakciju = frappe.get_all(
        'Transakcija',
        filters={
            'tip_transakcije': tip_transakcije,
            'nekretnina': nekretnina,
            'uplatilac': uplatilac,
            'period': period
        },
        limit=1
    )
    
    if proveri_transakciju:
        frappe.set_value('Racun', name, 'uplata', proveri_transakciju[0].name)
        frappe.set_value('Transakcija', proveri_transakciju[0].name, 'racun', name)
        return proveri_transakciju[0].name
    else:
        doc = frappe.new_doc('Transakcija')
        doc.tip_transakcije = tip_transakcije
        doc.kretanje_novca = frappe.get_value('Tip Transakcije', tip_transakcije, 'kretanje_novca')
        doc.nekretnina = nekretnina
        doc.uplatilac = uplatilac
        doc.period = period
        doc.naziv = naziv
        if vrednost:
            doc.vrednost = vrednost
        if valuta:
            doc.valuta = valuta
        doc.racun = name
        if dinarska_protivrednost:
            doc.dinarska_protivrednost = dinarska_protivrednost
        else:
            doc.dinarska_protivrednost = vrednost * 117 if valuta == 'EUR' else vrednost
        doc.save()
        frappe.set_value('Racun', name, 'uplata', doc.name)
        
        return doc.name
    
@frappe.whitelist()
def create_racun():
    def get_period_string(tip_transakcije, datum):
        # default današnji mesec, ako se pokreće sa dugmetom može se izabrati od kog datuma do danas proveriti da li postoje računi
        # ako se radi o bilo čemu drugom osim renovacija i arende period za plaćanje je 20 dana. Posle toga treba dz ide obaveštenje
        today = datetime.now()
        first_day = 1
        _, last_day = monthrange(today.year, today.month)
        return f"{first_day}-{last_day}.{today.month}.{today.year}"
    period = get_period_string()
    
    period_end = period.split('-')[-1]
    date_sr_format = "%d.%m.%Y"
    date_obj = datetime.strptime(period_end, date_sr_format)
    rok_object = date_obj + timedelta(days=30)
    rok = rok_object.strftime('%Y-%m-%d')
    
    sr_months = {
        1: 'januar', 2: 'februar', 3: 'mart', 4: 'april',
        5: 'maj', 6: 'jun', 7: 'jul', 8: 'avgust',
        9: 'septembar', 10: 'oktobar', 11: 'novembar', 12: 'decembar'
    }
    mesec = sr_months[date_obj.month]
    
    def create_document(nekretnina, uplatilac, transakcija, skracenica, kretanje_novca='zapis', vrednost=0, valuta='RSD'):
        doc = frappe.new_doc('Racun')
        doc.nekretnina = nekretnina
        doc.uplatilac = uplatilac
        doc.tip_transakcije = transakcija
        doc.period = period
        doc.rok_placanja = rok 
        doc.vrednost = vrednost
        doc.valuta = valuta
        doc.kretanje_novca = kretanje_novca
        doc.naziv = f"{doc.tip_transakcije} za {mesec} - {doc.uplatilac.split(' ')[0].upper()} ({skracenica})"
        doc.insert()
    
    zauzete_nekretnine_lista = frappe.get_list(
        'Nekretnina',
        filters= {
            'tip_nekretnine': ['in', ['KUĆA', 'STAN']],
            'status': 'Zauzeto'
        },
        fields=['name']
    )
    
    for nekretnina_dict in zauzete_nekretnine_lista:
        nekretnina = frappe.get_doc('Nekretnina', nekretnina_dict.name)
        for trans in nekretnina.pratimo_transakcije:
            trans_test = frappe.get_list(
                'Racun',
                filters= {
                    'tip_transakcije': trans.transakcije,
                    'nekretnina': nekretnina.name,
                    'uplatilac': nekretnina.zakupac,
                    'period': period
                },
                fields=['name']
            )
            if not trans_test:
                valuta_check = 'EUR' if trans.transakcije in ['KIRIJA', 'ARENDA'] else 'RSD'
                vrednost_check = nekretnina.zakupnina if trans.transakcije in ['KIRIJA', 'ARENDA'] else 0
                kretanje_novca = frappe.get_value('Tip Transakcije', trans.transakcije, 'kretanje_novca')
                create_document(
                    nekretnina=nekretnina.name,
                    uplatilac=nekretnina.zakupac,
                    transakcija=trans.transakcije,
                    kretanje_novca=kretanje_novca,
                    vrednost=vrednost_check, 
                    valuta=valuta_check,
                    skracenica=nekretnina.skracenica
                )
