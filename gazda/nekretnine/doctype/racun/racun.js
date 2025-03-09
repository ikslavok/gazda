// Copyright (c) 2025, Filip Ilic and contributors
// For license information, please see license.txt

frappe.ui.form.on("Racun", {
	before_save(frm) {
		if (frm.doc.name.includes('new-')) {
			calculate_protivrednost(frm);
		}
	},
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
			if (frm.doc.state != 1) {
				$('.actions-btn-group').hide();
			}
			if (frm.doc.preostalo <= 0){
				$('.grid-add-row').hide();
			}
			$('.actions-btn-group-label').hide();
		}, 10);

		const observer = new MutationObserver((mutations) => {
				attachButtonHandlers(frm);
		});
		const grid = $('[data-fieldname="uplate"]')[0];
		if (grid) {
				observer.observe(grid, { 
						childList: true, 
						subtree: true 
				});
		}
		attachButtonHandlers(frm);
	},  
	vrednost: function(frm) {
		calculate_protivrednost(frm);
	},
	
	valuta: function(frm) {
		calculate_protivrednost(frm);
	},

});
function calculate_protivrednost(frm) {
	if (frm.doc.vrednost && frm.doc.valuta) {
		frappe.call({
			method: 'gazda.nekretnine.api.izracunaj_protivrednost',
			args: {
				valuta: frm.doc.valuta,
				vrednost: frm.doc.vrednost
			},
			callback: function(r) {
				if (!r.exc) {
					frm.doc.dinarska_protivrednost = r.message;
					frm.refresh_fields(['dinarska_protivrednost', 'preostalo', 'status']);
				}
			}
		});
	}
}

frappe.ui.form.on("Racun Uplaceno", {
	uplate_add: function(frm, cdt, cdn) {
		frappe.call({
			method: 'gazda.nekretnine.doctype.racun.racun.set_missing_values_in_uplate',
			args: {
				doc: frm.doc.name,
				row: locals[cdt][cdn]
			},
			callback: function(r) {
				if (r.message) {
					frappe.model.set_value(cdt, cdn, 'uplaceno', r.message.uplaceno);
					frappe.model.set_value(cdt, cdn, 'valuta', r.message.valuta);
					frappe.model.set_value(cdt, cdn, 'dinarska_protivrednost', r.message.dinarska_protivrednost);
					frappe.model.set_value(cdt, cdn, 'primio', r.message.primio);
				}
			}
		});
	},
});


function attachButtonHandlers(frm) {
	function update_protivrednost_on(field) {
		$('[data-fieldname="uplate"] .rows [data-fieldname="'+field+'"] .field-area').each(function() {
		$(this).find('input')
		.on('change', function() {
			let row = $(this).closest('.grid-row').data('doc');
			frappe.call({
				method: 'gazda.nekretnine.api.izracunaj_protivrednost',
				args: {
					valuta: row.valuta,
					vrednost: row.uplaceno
				},
				callback: function(r) {
					if (!r.exc) {
						row.dinarska_protivrednost = r.message;
					}
				}
			});
		})
	});
	}
	update_protivrednost_on('valuta');
	update_protivrednost_on('uplaceno');
	$('[data-fieldname="uplate"] .rows [data-fieldname="potvrdi"] .field-area').each(function() {
		$(this).find('button')
			.addClass('btn-primary')
			.removeClass('btn-default')
			.off('click')
			.on('click', function() {
				frm.save().then(() => {
					let row = $(this).closest('.grid-row').data('doc');
					frappe.call({
						method: 'gazda.nekretnine.api.izracunaj_protivrednost',
						args: {
							valuta: row.valuta,
							vrednost: row.uplaceno
						},
						callback: function(r) {
							if (!r.exc) {
								row.dinarska_protivrednost = r.message;
								frappe.call({
									method: 'gazda.nekretnine.doctype.racun.racun.potvrdi_uplatu',
									args: {
										racun: frm.doc.name
									},
									callback: function(r) {
										if (r.message) {
											cur_frm.reload_doc();
										}
									}
								});
							}
						}
					});
				});
			});
	});
}



