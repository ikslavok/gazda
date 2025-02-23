frappe.listview_settings["Nekretnina"] = {
    refresh: function(listview) {
        listview.page.add_inner_button('Ažuriraj skraćenice', function() {
            frappe.confirm(
                'Da li želite da ažurirate skraćenice za sve nekretnine?',
                function() {
                    frappe.call({
                        method: 'gazda.nekretnine.api.update_all_abbreviations',
                        callback: function(response) {
                            frappe.msgprint('Skraćenice su ažurirane');
                            listview.refresh();
                        }
                    });
                }
            );
        });
    }
}; 