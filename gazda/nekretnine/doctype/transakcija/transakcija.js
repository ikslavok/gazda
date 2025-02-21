// Copyright (c) 2023, Filip Ilic and contributors
// For license information, please see license.txt

frappe.ui.form.on('Transakcija', {
	onload(frm) {
        setTimeout(() => {
                $('.col-lg-2.layout-side-section').css('display', 'none');
        }, 10);
        },
	refresh(frm) {
		if (frm.doc.docstatus === 0) {
			frm.page.set_primary_action(__('ARHIVIRAJ'), function() {
				frm.save('Submit')
			});
		}
        setTimeout(() => {
                $('.form-assignments').hide();
                $('.form-attachments').hide();
                $('.form-tags').hide();
                $('.form-shared').hide();
                $('.followed-by-section').hide();
                $('.form-sidebar-stats').hide();
                
        }, 10);
	},
	nekretnina: function(frm) {
			frm.save();
	},
	rok_za_plaćanje: function(frm) {
			frm.save();
	},
	datum_plaćanja: function(frm) {
			if (!frm.is_new()) {
				frm.save();
			}
	},
	tip_transakcije: function(frm) {
			if (!frm.is_new()) {
				frm.save();
			}
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