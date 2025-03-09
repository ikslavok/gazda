frappe.listview_settings["Racun"] = {
    refresh: function(listview) {
        listview.page.add_menu_item('Kreiraj račune', function() {
            frappe.prompt([
                {
                    label: 'Od datuma',
                    fieldname: 'from_date',
                    fieldtype: 'Date',
                    default: frappe.datetime.get_today(),
                    reqd: 1
                }
            ], function(values) {
                frappe.call({
                    method: 'gazda.nekretnine.api.create_racun',
                    args: {
                        'from_date': values.from_date
                    },
                    callback: function(response) {
                        if (response.message) {
                            listview.refresh();
                        }
                    }
                });
            }, 'Od kojeg datuma do danas, da kreiram račune?', 'Kreiraj račune');
        });
        listview.page.add_action_item('Obriši izabrano', function() {
            let names=[];
            $.each(listview.get_checked_items(), function(key, value) {
                names.push(value.name);
            });
            if (names.length === 0) {
                frappe.throw(__("No rows selected."));
            }
            frappe.confirm(
                'Stvarno hoćeš da obrišeš ' + names.length + ' računa?',
                function() {
                    frappe.call({
                        method: 'gazda.nekretnine.api.delete_racun',
                        args: {
                            'names': names,
                        },
                        callback: function(r) {
                            listview.refresh();
                            frappe.show_alert({
                                message: __('Obrisano ' + names.length + ' računa'),
                                indicator: 'green'
                            });
                        }
                    });
                }
            );
            
        });
    }
  };

