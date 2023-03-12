// Copyright (c) 2023, Filip Ilic and contributors
// For license information, please see license.txt

frappe.ui.form.on('Nekretnina', {
	// refresh: function(frm) {

	// }
	"površina_m2": function(frm) {
		frm.set_value('površina_jutro',frm.doc.površina_m2 / 5754.64);
		frm.set_value('površina_hektar',frm.doc.površina_m2 / 10000);
	}
	// "onload_post_render": function(frm) {
	// 	const preview = document.querySelector('.html-preview');
	// 	const editor = document.querySelector('.ace-editor-target');
	// 	preview.style.display= 'contents';
	// 	editor.style.display= 'none';
	// }
});
