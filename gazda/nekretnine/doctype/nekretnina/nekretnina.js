// Copyright (c) 2023, Filip Ilic and contributors
// For license information, please see license.txt

frappe.ui.form.on('Nekretnina', {
	// refresh: function(frm) {

	// }
	
	"embed_parcele": function(frm) {
		frm.set_value("lokacija_parcele","<iframe name='embedMap' title='Adaptive EmbedMap' scrolling='no' frameborder='0' width='400px' height='400px' src='https://a3.geosrbija.rs/embedded/14ddaf8a-3b34-4a06-90a0-f775350c59cb' ></iframe>")
	}
});
