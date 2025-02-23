frappe.listview_settings["Racun"] = {
    refresh: function(listview) {
        listview.page.add_inner_button('Kreiraj račune', function() {
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
    },
    hide_name_column: true,
    button: {
      show: function(doc) {
        return doc.reference_name;
      },
      get_description: function() {
        return __("Uplati", null, "Access");
      },
      action: function(doc) {
        // frappe.set_route("Form", "Transakcija", doc.uplata);
      },
    }
  };

