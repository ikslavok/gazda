// For license information, please see license.txt

frappe.ui.form.on('Nekretnina', {
	refresh: function(frm) {
		// Invalidate map size after the form is rendered
		if (frm.fields_dict.location.map) {
			setTimeout(() => {
				frm.fields_dict.location.map.invalidateSize();

				// Get the map instance
				const map = frm.fields_dict.location.map;

				// Remove unwanted controls
				document.querySelectorAll('.leaflet-draw, .leaflet-control-zoom, .leaflet-control-locate').forEach(el => {
					el.remove();
				});

				// Override the click handler for the map
				map.off('click');
				map.on('click', function(e) {
					// Clear existing features
					frm.fields_dict.location.map_features.clearLayers();

					// Create new marker at clicked location
					const marker = L.marker(e.latlng);
					frm.fields_dict.location.map_features.addLayer(marker);

					// Update the location field value with GeoJSON
					const geoJson = {
						type: "FeatureCollection",
						features: [{
							type: "Feature",
							properties: {},
							geometry: {
								type: "Point",
								coordinates: [e.latlng.lng, e.latlng.lat]
							}
						}]
					};

					// Update the form field
					frm.set_value('location', JSON.stringify(geoJson));
					frm.set_value('latitude', e.latlng.lat);
					frm.set_value('longitude', e.latlng.lng);
				});
			}, 1000);
		}
	},

	onload: function(frm) {
		// Set default map settings
		const map_settings = frappe.provide("frappe.utils.map_defaults");
		
		// If we have coordinates stored, use them as default center
		if (frm.doc.latitude && frm.doc.longitude) {
			map_settings.center = [
				parseFloat(frm.doc.latitude),
				parseFloat(frm.doc.longitude)
			];
			map_settings.zoom = 16; // Closer zoom for specific location
		} else {
			// Default center for Serbia if no coordinates are set
			map_settings.center = [44.0165, 21.0059];
			map_settings.zoom = 7;
		}
	},

	površina_m2: function(frm) {
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
	naziv_nekretnine: function(frm) {
		if (frm.doc.naziv_nekretnine) {
			frappe.call({
				method: 'gazda.nekretnine.api.create_abbr',
				args: {
					'naziv_nekretnine': frm.doc.naziv_nekretnine
				},
				callback: function(response) {
					if (response.message) {
						frm.reload_doc();
					}
				}
			});
		}
	},
	povuci_iz_katastra: function(frm) {
		frm.save().then(() => {
			if (frm.doc.katastarska_strana_url) {
				frappe.call({
					method: 'gazda.nekretnine.doctype.nekretnina.nekretnina.fetch_cadastral_data',
					args: {
						'docname': frm.doc.name
					},
					freeze: true,
					freeze_message: __('Preuzimanje podataka iz katastra...'),
					callback: function(r) {
						if (r.message) {
							frm.reload_doc();
							frappe.show_alert({
								message: __('Podaci uspešno preuzeti'),
								indicator: 'green'
							});
						}
					}
				});
			} else {
				frappe.throw(__('Molimo unesite katastarsku stranu (URL)'));
			}
		});
	}
});
// Copyright (c) 2023, Filip Ilic and contributors
