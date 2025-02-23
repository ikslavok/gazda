import frappe
from datetime import datetime, timedelta
from calendar import monthrange
from dateutil.relativedelta import relativedelta

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
            doc.vrednost = float(vrednost)
        if valuta:
            doc.valuta = valuta
        doc.racun = name
        if dinarska_protivrednost:
            doc.dinarska_protivrednost = float(dinarska_protivrednost)
        else:
            doc.dinarska_protivrednost = float(vrednost) * 117 if valuta == 'EUR' else float(vrednost)
        doc.save()
        frappe.set_value('Racun', name, 'uplata', doc.name)
        
        return doc.name
    
@frappe.whitelist()
def create_racun(**kwargs):
    from_date = kwargs.get('from_date')
    
    def get_dates_list(from_date):
        dates = []
        start_date = datetime.strptime(from_date, '%Y-%m-%d')
        while start_date <= datetime.now():
            dates.append(start_date.strftime('%Y-%m-%d'))
            start_date += relativedelta(months=1)
        return dates
        
        
    def get_period_string(tip_transakcije, date):
        if tip_transakcije not in ['ARENDA', 'KIRIJA']:
            date = datetime.strptime(date, '%Y-%m-%d')
            date = date.replace(day=15)  
            last_month = date - timedelta(days=30)  
            first_day = 1
            _, last_day = monthrange(last_month.year, last_month.month)
            return f"{first_day}-{last_day}.{last_month.month}.{last_month.year}"
        else:
            date = datetime.strptime(date, '%Y-%m-%d')
            first_day = 1
            _, last_day = monthrange(date.year, date.month)
            return f"{first_day}-{last_day}.{date.month}.{date.year}"
        
    
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
            for date in get_dates_list(from_date):
                period = get_period_string(trans.transakcije, date)
                if period:
                    period_end = period.split('-')[-1]
                    date_sr_format = "%d.%m.%Y"
                    date_obj = datetime.strptime(period_end, date_sr_format)
                    if trans.transakcije in ['ARENDA', 'KIRIJA']:
                        first_day_of_month = date_obj.replace(day=1)
                        rok_object = first_day_of_month + timedelta(days=20)
                    else:
                        rok_object = date_obj + timedelta(days=19)
                    rok = rok_object.strftime('%Y-%m-%d')
                    
                    sr_months = {
                        1: 'januar', 2: 'februar', 3: 'mart', 4: 'april', 
                        5: 'maj', 6: 'jun', 7: 'jul', 8: 'avgust',
                        9: 'septembar', 10: 'oktobar', 11: 'novembar', 12: 'decembar'
                    }
                    mesec = sr_months[date_obj.month]
                    godina = date_obj.year
                    
                    trans_check = frappe.get_list(
                        'Racun',
                        filters= {
                            'tip_transakcije': trans.transakcije,
                            'nekretnina': nekretnina.name,
                            'uplatilac': nekretnina.zakupac,
                            'period': period
                        },
                        fields=['name']
                    )
                    if not trans_check:
                        valuta_check = 'EUR' if trans.transakcije in ['KIRIJA', 'ARENDA'] else 'RSD'
                        vrednost_check = nekretnina.zakupnina if trans.transakcije in ['KIRIJA', 'ARENDA'] else 0
                        kretanje_novca = frappe.get_value('Tip Transakcije', trans.transakcije, 'kretanje_novca')
                        
                        doc = frappe.new_doc('Racun')
                        doc.nekretnina = nekretnina.name
                        doc.uplatilac = nekretnina.zakupac
                        doc.tip_transakcije = trans.transakcije
                        doc.period = period
                        doc.rok_placanja = rok 
                        doc.vrednost = vrednost_check
                        doc.valuta = valuta_check
                        doc.kretanje_novca = kretanje_novca
                        doc.naziv = f"{doc.tip_transakcije} za {mesec} {godina} - {doc.uplatilac.split(' ')[0].upper()} ({nekretnina.skracenica})"
                        doc.insert()
                    
@frappe.whitelist()
def update_all_abbreviations():
    nekretnine = frappe.get_all('Nekretnina', fields=['name'])
    for n in nekretnine:
        doc = frappe.get_doc('Nekretnina', n.name)
        doc.create_abbr()
        doc.save()
                    