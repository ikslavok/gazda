// Copyright (c) 2023, Filip Ilic and contributors
// For license information, please see license.txt

frappe.ui.form.on('Nekretnina', {
	// refresh: function(frm) {

	// }
	"površina_m2": function(frm) {
		frm.set_value('površina_jutro',frm.doc.površina_m2 / 5754.64);
		frm.set_value('površina_hektar',frm.doc.površina_m2 / 10000);
	},
	zakupac: function(frm) {
		if (frm.doc.zakupac) {
			frm.set_value('status', 'Zauzeto');
		} else {
			frm.set_value('status', 'Slobodno');
		}
	},

	
});
