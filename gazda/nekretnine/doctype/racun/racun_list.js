frappe.listview_settings["Racun"] = {
    refresh: function(listview) {
        listview.page.add_inner_button('Azuriraj račune', function() {
            frappe.call({
                method: 'gazda.nekretnine.api.create_racun',
                callback: function(response) {
                    if (response.message) {
                        listview.refresh();
                    }
                }
            });
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

