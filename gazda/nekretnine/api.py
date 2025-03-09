import frappe
from datetime import datetime, timedelta
from calendar import monthrange
from dateutil.relativedelta import relativedelta
    
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
                        doc.dinarska_protivrednost = izracunaj_protivrednost(doc.valuta, doc.vrednost)
                        doc.preostalo = doc.dinarska_protivrednost   
                        doc.naziv = f"{doc.tip_transakcije} za {mesec} {godina} - {doc.uplatilac.split(' ')[0].upper()} ({nekretnina.skracenica})"
                        doc.insert()
                    
@frappe.whitelist()
def update_all_abbreviations():
    nekretnine = frappe.get_all('Nekretnina', fields=['name', 'naziv_nekretnine'])
    for n in nekretnine:
        doc = frappe.get_doc('Nekretnina', n.name)
        if doc.naziv_nekretnine:
            # Replace non-alphanumeric chars with space
            cleaned_name = ''.join(char if char.isalnum() else ' ' for char in doc.naziv_nekretnine)
            abbr = ''
            words = cleaned_name.split()
            for word in words:
                if len(word) < 5 and word.isupper():
                    abbr += word
                else:
                    for char in word:
                        if char.isdigit():  # Keep all numbers
                            abbr += word
                            break
                        elif char.isalpha():
                            abbr += char.upper()
                            break
            doc.skracenica = abbr
            doc.save()
                    
@frappe.whitelist()
def create_abbr(naziv_nekretnine):
    # Replace non-alphanumeric chars with space
    cleaned_name = ''.join(char if char.isalnum() else ' ' for char in naziv_nekretnine)
    abbr = ''
    words = cleaned_name.split()
    for word in words:
        if len(word) < 5 and word.isupper():
            abbr += word
        else:
            for char in word:
                if char.isdigit():  # Keep all numbers
                    abbr += word
                    break
                elif char.isalpha():
                    abbr += char.upper()
                    break
    frappe.db.set_value('Nekretnina', {'naziv_nekretnine': naziv_nekretnine}, 'skracenica', abbr)
    return True

@frappe.whitelist()
def izracunaj_protivrednost(valuta, vrednost):
    system_currency = frappe.get_cached_value('System Settings', 'System Settings', 'currency')
    if not vrednost:
            return 0
    vrednost = float(vrednost)
    if valuta == system_currency:
            return vrednost
            
    try:
            exchange_doc = frappe.get_last_doc('Currency Exchange', 
                    filters={
                            "from_currency": valuta, 
                            "to_currency": system_currency, 
                            "for_selling": 1
                    }
            )
            return exchange_doc.exchange_rate * vrednost
    except Exception as e:
            frappe.msgprint(f"Error getting exchange rate: {str(e)}")
            return 0
                    
@frappe.whitelist()
def delete_racun(names):
    try:
        # Convert string to list if needed
        if isinstance(names, str):
            import json
            try:
                names = json.loads(names)
            except:
                names = [names]  # If it's a single name as string
        
        # Ensure names is a list
        if not isinstance(names, list):
            names = [names]
            
        deleted_count = 0
        for name in names:
            if frappe.db.exists("Racun", name):
                frappe.delete_doc('Racun', name, force=1)
                deleted_count += 1
                
        return {
            "success": True,
            "message": f"Successfully deleted {deleted_count} records",
            "count": deleted_count
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in delete_racun")
        frappe.throw(f"Error deleting records: {str(e)}")
                    