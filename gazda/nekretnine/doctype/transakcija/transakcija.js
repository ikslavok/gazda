// Copyright (c) 2023, Filip Ilic and contributors
// For license information, please see license.txt

frappe.ui.form.on('Transakcija', {
	// refresh: function(frm) {

	// }
	"state": function(frm) {
			if (!frm.is_new()) {
				frm.save();
			}
	},
	"nekretnina": function(frm) {
			frm.save();
	},
	"rok_za_plaćanje": function(frm) {
			frm.save();
	},
	"datum_plaćanja": function(frm) {
			if (!frm.is_new()) {
				frm.save();
			}
	},
	"tip_transakcije": function(frm) {
			if (!frm.is_new()) {
				frm.save();
			}
	},
	"prihod": function(frm) {
			frm.save();
	},
	"rashod": function(frm) {
			frm.save();
	},
	"on_submit": function(frm) {
		frm.set_value("state","PLAĆENO");
	},
	"validate": function(frm) {
		frm.set_value('naziv',frm.doc.osoba + ' - ' + frm.doc.tip_transakcije + ' za ' + frm.doc.nekretnina);		
	}
});
