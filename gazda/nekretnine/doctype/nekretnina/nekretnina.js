// Copyright (c) 2023, Filip Ilic and contributors
// For license information, please see license.txt

frappe.ui.form.on('Nekretnina', {
	// refresh: function(frm) {

	// }
	
	"površina_m2": function(frm) {
		frm.set_value('površina_jutro',frm.doc.površina_m2 / 5754,64);
		frm.set_value('površina_hektar',frm.doc.površina_m2 / 10000);
	},	
	"validate": function(frm) {
		frm.set_value("lokacija_parcele","<iframe name='embedMap' title='Adaptive EmbedMap' scrolling='no' frameborder='0' width='400px' height='400px' src='https://a3.geosrbija.rs/embedded/14ddaf8a-3b34-4a06-90a0-f775350c59cb' ></iframe>");
		
	}
	// "onload_post_render": function(frm) {
	// 	const preview = document.querySelector('.html-preview');
	// 	const editor = document.querySelector('.ace-editor-target');
	// 	preview.style.display= 'contents';
	// 	editor.style.display= 'none';
	// }
});
