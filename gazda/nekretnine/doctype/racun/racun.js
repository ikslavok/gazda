// Copyright (c) 2025, Filip Ilic and contributors
// For license information, please see license.txt

frappe.ui.form.on("Racun", {
        onload(frm) {
        setTimeout(() => {
                $('.col-lg-2.layout-side-section').css('display', 'none');
        }, 10);
        },
	refresh(frm) {
        setTimeout(() => {
                $('.form-assignments').hide();
                $('.form-attachments').hide();
                $('.form-tags').hide();
                $('.form-shared').hide();
                $('.followed-by-section').hide();
                $('.form-sidebar-stats').hide();
                

                
        }, 10);
        // Add click event handler for Transakcija elements
        $(document).on('click', '[data-doctype="Transakcija"]', function(e) {
            e.preventDefault();
            console.log('Clicked element:', $(this));
            console.log('Spans found:', $(this).find('span').length);
            console.log('Spans with "1":', $(this).find('span:contains("1")').length);
            // Check if the clicked element contains a span with content "1"
            if ($(this).find('span:containscrea("1")').length > 0) {
                frappe.set_route('Form', 'Transakcija', frm.doc.uplata);
                return false;
            }
        });
        
        frm.page.add_inner_button('TRANSAKCIJA', () => {
            frappe.call({
                method: 'gazda.nekretnine.api.otvori_transakciju',
                args: {
                    tip_transakcije: frm.doc.tip_transakcije,
                    nekretnina: frm.doc.nekretnina,
                    uplatilac: frm.doc.uplatilac,
                    period: frm.doc.period,
                    name: frm.doc.name,
                    vrednost: frm.doc.vrednost,
                    valuta: frm.doc.valuta,
                    dinarska_protivrednost: frm.doc.dinarska_protivrednost,
                    naziv: frm.doc.naziv
                },
                callback: (r) => {
                    if (r.message) {
                        // frappe.msgprint(r.message);
                        frappe.set_route('Form', 'Transakcija', r.message);
                    }
                }
            })
        })
	},
    
    vrednost: function(frm) {
        calculate_dinarska_protivrednost(frm);
    },
    
    valuta: function(frm) {
        calculate_dinarska_protivrednost(frm);
    }
});

function calculate_dinarska_protivrednost(frm) {
    if (!frm.doc.vrednost) {
        frm.set_value('dinarska_protivrednost', 0);
        return;
    }
    
    if (frm.doc.valuta === 'RSD') {
        frm.set_value('dinarska_protivrednost', frm.doc.vrednost);
    } else if (frm.doc.valuta === 'EUR') {
        frm.set_value('dinarska_protivrednost', frm.doc.vrednost * 117);
    }
}
