frappe.pages['lokacije-imovine'].on_page_load = function(wrapper) {
	new PageContent(wrapper).make();
}

PageContent = Class.extend({
	init: function(wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: 'Lokacije imovine',
			single_column: true
		});
		
		// Add buttons to the page
		this.page.add_inner_button(__('Osveži podatke'), () => this.refreshData());
		this.page.add_inner_button(__('Prikaži sve na mapi'), () => this.showAllOnMap());
	},

	make: function() {
		let htmlContent = `
			<div class="property-filters mb-3">
				<div class="row">
					<div class="col-md-3">
						<div class="form-group">
							<label>Tip nekretnine</label>
							<select class="form-control" id="property-type-filter">
								<option value="">Svi tipovi</option>
							</select>
						</div>
					</div>
					<div class="col-md-3">
						<div class="form-group">
							<label>Status</label>
							<select class="form-control" id="property-status-filter">
								<option value="">Svi statusi</option>
								<option value="Slobodno">Slobodno</option>
								<option value="Zauzeto">Zauzeto</option>
							</select>
						</div>
					</div>
				</div>
			</div>
			<div class="datatable-container"></div>
			<div id="map" style="height: 400px; width: 100%;"></div>
		`;

		let headContent = `
			<style>
				.datatable-container {
					max-height: 300px;
					overflow: auto;
					border: 1px solid #F3F3F3;
				}
				.custom-div-icon svg {
					display: block;
					width: 100%;
					height: 100%;
				}
				.dt-scrollable {
					max-height: 300px;
				}
				.datatable .dt-row.selected {
					background-color: #f0f8ff;
				}
				.dt-instance-1 {
					margin: 0 !important;
				}
				/* Force first column width */
				.dt-cell--0 {
					width: 40px !important;
					min-width: 40px !important;
					max-width: 40px !important;
				}
				/* Style for the property icon button */
				.btn-icon {
					padding: 0;
					background: none;
					border: none;
					width: 24px;
					height: 24px;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
				}
				.btn-icon:hover {
					background-color: rgba(0,0,0,0.05);
					border-radius: 50%;
				}
				.btn-icon svg {
					width: 20px;
					height: 20px;
				}
				/* Popup styles */
				.property-popup {
					min-width: 200px;
				}
				.property-popup h4 {
					margin-top: 0;
					margin-bottom: 8px;
					font-weight: bold;
				}
				.popup-image-container {
					margin-bottom: 8px;
					text-align: center;
				}
				.popup-image-container img {
					max-width: 100%;
					height: auto;
					border-radius: 4px;
				}
				.popup-info {
					font-size: 12px;
					line-height: 1.4;
				}
				.popup-info a {
					display: block;
					margin-top: 8px;
					font-weight: bold;
				}
			</style>
		`;

		$(frappe.render(headContent, this)).appendTo(this.page.head);
		$(frappe.render(htmlContent, this)).appendTo(this.page.main);

		// Initialize the datatable and map
		this.initializeDataTable();
		this.initializeMap();
	},
	
	initializeDataTable: function() {
		// First, get the property types for the filter
		frappe.call({
			method: "frappe.client.get_list",
			args: {
				doctype: "Tip Nekretnine",
				fields: ["name"]
			},
			callback: (r) => {
				if (r.message) {
					let typeSelect = $('#property-type-filter');
					r.message.forEach(type => {
						typeSelect.append(`<option value="${type.name}">${type.name}</option>`);
					});
					
					// Add event listeners to filters
					$('#property-type-filter, #property-status-filter').on('change', () => {
						this.refreshData();
					});
				}
			}
		});
		
		// Now fetch the properties data
		this.fetchPropertiesData();
	},
	
	fetchPropertiesData: function() {
		// Get filter values
		const typeFilter = $('#property-type-filter').val();
		const statusFilter = $('#property-status-filter').val();
		const onlyWithCoordinates = true; // Only show properties with coordinates
		
		// Build filters object
		let filters = {};
		if (typeFilter) filters.tip_nekretnine = typeFilter;
		if (statusFilter) filters.status = statusFilter;
		
		frappe.call({
			method: "frappe.client.get_list",
			args: {
				doctype: "Nekretnina",
				fields: ["name", "naziv_nekretnine", "tip_nekretnine", "status", "latitude", "longitude", 
				         "adresa", "mesto", "zakupac", "zakupnina", "odrzava", "slika_prilaza_nekretnini"],
				filters: filters
			},
			callback: (r) => {
				if (r.message) {
					// Filter properties to only include those with coordinates
					this.properties = r.message.filter(p => p.latitude && p.longitude);
					
					if (this.properties.length === 0) {
						frappe.show_alert({
							message: __('Nema nekretnina sa definisanim koordinatama'),
							indicator: 'orange'
						});
						
						// Clear the datatable and map
						if (this.datatable) {
							this.datatable.refresh([]);
						}
						this.refreshMap([]);
					} else {
						this.renderDataTable(this.properties);
						this.refreshMap(this.properties);
					}
				}
			}
		});
	},
	
	renderDataTable: function(properties) {
		// Format the data for the datatable
		const data = properties.map(p => [
			// Create a button with the SVG inside
			`<button class="btn btn-icon property-icon" data-property="${p.name}">${this.getPropertyIcon(p.tip_nekretnine, p.status)}</button>`,
			p.naziv_nekretnine || p.name,
			p.zakupac || '',
		]);
		
		// If datatable already exists, refresh it
		if (this.datatable) {
			this.datatable.refresh(data);
			
			// Re-attach click handlers after refresh
			setTimeout(() => this.attachButtonClickHandlers(), 500);
			return;
		}
		
		// Initialize the datatable
		this.datatable = new DataTable('.datatable-container', {
			columns: [
				{ 
					name: '', 
					width: 40,
					format: (value) => value, // This will render the button with SVG directly
					editable: false,
					sortable: false,
				},
				{ name: 'Naziv', width: 250 },
				{ name: 'Zakupac', width: 250 },
			],
			data: data,
			layout: 'fluid',
			serialNoColumn: false,
			checkboxColumn: false,
			inlineFilters: true,
			cellHeight: 35,
			dynamicRowHeight: false,
		});
		
		// Force the first column width to exactly 40px with CSS and attach button handlers
		setTimeout(() => {
			$('.dt-cell--0').css('width', '40px');
			$('.dt-cell--0').css('min-width', '40px');
			$('.dt-cell--0').css('max-width', '40px');
			
			this.attachButtonClickHandlers();
		}, 500);
	},
	
	// Method to attach click handlers to the buttons
	attachButtonClickHandlers: function() {
		// Remove any existing handlers to prevent duplicates
		$(document).off('click', '.property-icon');
		
		// Add click handler to all property icon buttons
		$(document).on('click', '.property-icon', (e) => {
			e.preventDefault();
			e.stopPropagation();
			
			// Get the property ID from the data attribute
			const propertyId = $(e.currentTarget).data('property');
			
			if (propertyId) {
				// Find the property in our data
				const property = this.properties.find(p => p.name === propertyId);
				
				if (property && property.latitude && property.longitude) {
					// Invalidate the map size to ensure it's rendered correctly
					this.map.invalidateSize();
					
					// Center map on this property
					this.map.setView([property.latitude, property.longitude], 16);
					
					// Find and open the marker popup
					this.markers.forEach(marker => {
						if (marker.propertyId === propertyId) {
							marker.openPopup();
						}
					});
				}
			}
		});
	},
	
	// Update the getPropertyIcon method to return just the SVG content
	getPropertyIcon: function(propertyType, status) {
		// Define SVG content for different property types
		const svgContent = {
			NJIVA: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M160-600q-17 0-28.5-11.5T120-640t11.5-28.5T160-680h120q33 0 56.5 23.5T360-600zm80 360q50 0 85-35t35-85-35-85-85-35-85 35-35 85 35 85 85 35m540 0q25 0 42.5-17.5T840-300t-17.5-42.5T780-360t-42.5 17.5T720-300t17.5 42.5T780-240m-540-60q-25 0-42.5-17.5T180-360t17.5-42.5T240-420t42.5 17.5T300-360t-17.5 42.5T240-300m560-139q26 5 43 13.5t37 27.5v-242q0-33-23.5-56.5T800-720H548l-42-44 56-56-28-28-142 142 30 28 56-56 42 42v92q0 33-23.5 56.5T440-520h-81q23 17 37 35t28 45h16q66 0 113-47t47-113v-40h200zM641-320q6-27 14.5-43.5T682-400H436q4 23 4 40t-4 40zm139 160q-58 0-99-41t-41-99 41-99 99-41 99 41 41 99-41 99-99 41m-540 0q-83 0-141.5-58.5T40-360t58.5-141.5T240-560t141.5 58.5T440-360t-58.5 141.5T240-160m393-360"/></svg>',
			STAN: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16"><path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022M6 8.694 1 10.36V15h5zM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309l-7 3.5z"/><path d="M2 11h1v1H2zm2 0h1v1H4zm-2 2h1v1H2zm2 0h1v1H4zm4-4h1v1H8zm2 0h1v1h-1zm-2 2h1v1H8zm2 0h1v1h-1zm2-2h1v1h-1zm0 2h1v1h-1zM8 7h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zM8 5h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zm0-2h1v1h-1z"/></svg>',
			KUĆA: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M200-160v-366L88-440l-48-64 440-336 160 122v-82h120v174l160 122-48 64-112-86v366H520v-240h-80v240zm80-80h80v-240h240v240h80v-347L480-739 280-587zm120-319h160q0-32-24-52.5T480-632t-56 20.5-24 52.5m-40 319v-240h240v240-240H360z"/></svg>',
			LOKAL: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M280-80q-33 0-56.5-23.5T200-160t23.5-56.5T280-240t56.5 23.5T360-160t-23.5 56.5T280-80m400 0q-33 0-56.5-23.5T600-160t23.5-56.5T680-240t56.5 23.5T760-160t-23.5 56.5T680-80M246-720l96 200h280l110-200zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H40v-80h130zm134 280h280z"/></svg>'
		};
		
		// Helper function to get color based on status
		function getStatusColor(status) {
			return status === "Zauzeto" ? "#FF4136" : // Red
				   status === "Slobodno" ? "#2ECC40" : // Green
				   "#0074D9"; // Blue (default)
		}
		
		const color = getStatusColor(status);
		let svg = svgContent[propertyType] || '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';
		
		// Replace fill color or add it if not present
		if (svg.includes('fill="')) {
			svg = svg.replace(/fill="[^"]*"/g, `fill="${color}"`);
		} else {
			svg = svg.replace('<svg', `<svg fill="${color}"`);
		}
		
		return svg;
	},
	
	initializeMap: function() {
		// Define tile URLs and attributions first
		var esri_url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
		var esri_attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
		
		var mapbox_url = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
		var mapbox_attribution = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

		// Define layers before using them
		var lyr_satellite = L.tileLayer(esri_url, {
			maxZoom: 20, 
			tileSize: 512, 
			zoomOffset: -1, 
			attribution: esri_attribution
		});
		
		var lyr_streets = L.tileLayer(mapbox_url, {
			id: 'mapbox/streets-v11', 
			maxZoom: 28, 
			tileSize: 512, 
			zoomOffset: -1, 
			attribution: mapbox_attribution
		});
		
		var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		});

		// Now initialize the map with the defined layers
		this.map = L.map('map', {
			center: [45.24751882829121, 19.387521743774418], // Updated coordinates
			zoom: 13,
			layers: [osm] // Start with OSM as default
		});

		// Define base maps for layer control
		var baseMaps = {
			"OpenStreetMap": osm,
			"Satellite": lyr_satellite,
			"Streets": lyr_streets
		};

		// Add layer control to map
		L.control.layers(baseMaps).addTo(this.map);
		
		// Initialize markers array
		this.markers = [];
		
		// Invalidate size after initialization to ensure proper rendering
		setTimeout(() => {
			this.map.invalidateSize();
		}, 100);
	},

	loadPropertyLocations: function(properties) {
		// Clear existing markers
		this.markers.forEach(marker => this.map.removeLayer(marker));
		this.markers = [];
		
		// Helper function to get color based on status
		function getStatusColor(status) {
			return status === "Zauzeto" ? "#FF4136" : // Red
				   status === "Slobodno" ? "#2ECC40" : // Green
				   "#0074D9"; // Blue (default)
		}
		
		// Function to create SVG icon with proper color
		function createSvgIcon(svgContent, status, type) {
			const color = getStatusColor(status);
			let html = svgContent.replace(/fill="[^"]*"/, `fill="${color}"`);
			
			// If there's no fill attribute, add it
			if (!html.includes('fill="')) {
				html = html.replace('<svg', `<svg fill="${color}"`);
			}
			
			return L.divIcon({
				html: html,
				className: `custom-div-icon ${type.toLowerCase()}`,
				iconSize: [30, 30],
				iconAnchor: [15, 15]
			});
		}

		// Define SVG content for different property types
		const svgContent = {
			NJIVA: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M160-600q-17 0-28.5-11.5T120-640t11.5-28.5T160-680h120q33 0 56.5 23.5T360-600zm80 360q50 0 85-35t35-85-35-85-85-35-85 35-35 85 35 85 85 35m540 0q25 0 42.5-17.5T840-300t-17.5-42.5T780-360t-42.5 17.5T720-300t17.5 42.5T780-240m-540-60q-25 0-42.5-17.5T180-360t17.5-42.5T240-420t42.5 17.5T300-360t-17.5 42.5T240-300m560-139q26 5 43 13.5t37 27.5v-242q0-33-23.5-56.5T800-720H548l-42-44 56-56-28-28-142 142 30 28 56-56 42 42v92q0 33-23.5 56.5T440-520h-81q23 17 37 35t28 45h16q66 0 113-47t47-113v-40h200zM641-320q6-27 14.5-43.5T682-400H436q4 23 4 40t-4 40zm139 160q-58 0-99-41t-41-99 41-99 99-41 99 41 41 99-41 99-99 41m-540 0q-83 0-141.5-58.5T40-360t58.5-141.5T240-560t141.5 58.5T440-360t-58.5 141.5T240-160m393-360"/></svg>',
			STAN: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16"><path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022M6 8.694 1 10.36V15h5zM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309l-7 3.5z"/><path d="M2 11h1v1H2zm2 0h1v1H4zm-2 2h1v1H2zm2 0h1v1H4zm4-4h1v1H8zm2 0h1v1h-1zm-2 2h1v1H8zm2 0h1v1h-1zm2-2h1v1h-1zm0 2h1v1h-1zM8 7h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zM8 5h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zm0-2h1v1h-1z"/></svg>',
			KUĆA: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M200-160v-366L88-440l-48-64 440-336 160 122v-82h120v174l160 122-48 64-112-86v366H520v-240h-80v240zm80-80h80v-240h240v240h80v-347L480-739 280-587zm120-319h160q0-32-24-52.5T480-632t-56 20.5-24 52.5m-40 319v-240h240v240-240H360z"/></svg>',
			LOKAL: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M280-80q-33 0-56.5-23.5T200-160t23.5-56.5T280-240t56.5 23.5T360-160t-23.5 56.5T280-80m400 0q-33 0-56.5-23.5T600-160t23.5-56.5T680-240t56.5 23.5T760-160t-23.5 56.5T680-80M246-720l96 200h280l110-200zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H40v-80h130zm134 280h280z"/></svg>'
		};

		// Add markers for each property
		properties.forEach(doc => {
			if (doc.latitude && doc.longitude) {
				try {
					const lat = parseFloat(doc.latitude);
					const lng = parseFloat(doc.longitude);
					
					if (!isNaN(lat) && !isNaN(lng)) {
						const status = doc.status || 'N/A';
						const propertyType = doc.tip_nekretnine || 'DEFAULT';
						
						// Get the appropriate icon
						let icon;
						if (svgContent[propertyType]) {
							icon = createSvgIcon(svgContent[propertyType], status, propertyType);
						} else {
							// Default marker for other property types
							icon = L.divIcon({
								html: `<div style="background-color: ${getStatusColor(status)}; width: 100%; height: 100%; border-radius: 50%;"></div>`,
								className: "custom-div-icon",
								iconSize: [20, 20],
								iconAnchor: [10, 10]
							});
						}
						
						// Create image HTML if image exists
						const imageHtml = doc.slika_prilaza_nekretnini ? 
							`<div class="popup-image-container">
								<img src="${doc.slika_prilaza_nekretnini}" alt="Slika prilaza" width="80">
							</div>` : '';
						
						// Create additional info HTML
						const zakupacInfo = doc.zakupac ? `<strong>Zakupac:</strong> ${doc.zakupac}<br>` : '';
						const zakupninaInfo = doc.zakupnina ? `<strong>Zakupnina:</strong> ${doc.zakupnina}<br>` : '';
						const odrzavaInfo = doc.odrzava ? `<strong>Održava:</strong> ${doc.odrzava}<br>` : '';
						
						let marker = L.marker([lat, lng], { icon: icon })
							.addTo(this.map)
							.bindPopup(`
								<div class="property-popup">
									<h4>${doc.naziv_nekretnine || doc.name}</h4>
									${imageHtml}
									<div class="popup-info">
										<strong>Tip:</strong> ${propertyType}<br>
										<strong>Status:</strong> ${status}<br>
										${zakupacInfo}
										${zakupninaInfo}
										${odrzavaInfo}
										<a href="/app/nekretnina/${doc.name}">Prikaži detalje</a>
									</div>
								</div>
							`);
						
						// Store property ID in marker for reference
						marker.propertyId = doc.name;
						this.markers.push(marker);
					}
				} catch (e) {
					console.error("Error parsing coordinates for property", doc.name, e);
				}
			}
		});
	},
	
	refreshData: function() {
		this.fetchPropertiesData();
	},
	
	refreshMap: function(properties) {
		this.loadPropertyLocations(properties);
		
		// Invalidate size after refreshing the map
		this.map.invalidateSize();
	},
	
	showAllOnMap: function() {
		if (this.markers.length > 0) {
			// Invalidate size before fitting bounds
			this.map.invalidateSize();
			
			// Create a bounds object
			const bounds = L.latLngBounds(this.markers.map(marker => marker.getLatLng()));
			// Fit the map to these bounds
			this.map.fitBounds(bounds, { padding: [50, 50] });
		} else {
			frappe.show_alert({
				message: __('Nema nekretnina sa definisanim koordinatama'),
				indicator: 'red'
			});
		}
	}
});
