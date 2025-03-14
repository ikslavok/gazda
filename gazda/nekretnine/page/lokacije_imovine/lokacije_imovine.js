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
			<div class="page-content-wrapper">
			<div id="map" style="height: 400px; width: 100%;"></div>
				<div class="datatable-outer-container" style="height: 400px; overflow: hidden;">
					<div class="datatable-container"></div>
				</div>
			</div>
		`;

		// First render the HTML content
		$(frappe.render(htmlContent, this)).appendTo(this.page.main);

		// Initialize the datatable and map
		this.initializeDataTable();
		this.initializeMap();

		// Load initial styles
		let headContent = `
			<style id="lokacije-imovine-styles">
				.page-content-wrapper {
					display: flex;
					flex-direction: column;
					height: calc(100vh - 400px);
				}
				.datatable-outer-container {
					height: 400px !important;
					overflow: hidden;
				}
				.datatable-container {
					height: 100%;
					overflow: auto;
					margin-left: 50px;
				}
				.custom-div-icon svg {
					display: block;
					width: 100%;
					height: 100%;
				}
				.dt-scrollable {
					height: 400px !important;
					max-height: 400px !important;
				}
				.datatable .dt-row.selected {
					background-color: #f0f8ff;
				}
				.dt-instance-1 {
					margin: 0 !important;
					margin-left: 0 !important;
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
				/* No coordinates icon */
				.no-coordinates-icon {
					display: flex;
					align-items: center;
					justify-content: center;
					height: 24px;
					color: #aaa;
					font-size: 16px;
				}
				/* Edit button styles */
				.btn-edit-location {
					padding: 4px 8px;
					background-color: #f8f9fa;
					border: 1px solid #dee2e6;
					border-radius: 3px;
					color: #495057;
					cursor: pointer;
					display: inline-flex;
					align-items: center;
					justify-content: center;
				}
				.btn-edit-location:hover {
					background-color: #e9ecef;
				}
				.btn-edit-location svg {
					margin-right: 0;
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
				.property-filters.mb-3 {
					margin-bottom: 0;
				}
				#map {
					flex-shrink: 0;
					margin-bottom: 0;
				}
				/* Edit location mode styles */
				.edit-location-mode {
					cursor: crosshair !important;
				}
				.location-edit-tooltip {
					background-color: rgba(0, 0, 0, 0.7);
					border: none;
					color: white;
					padding: 5px 10px;
					border-radius: 3px;
					font-weight: bold;
				}
				.location-edit-tooltip:before {
					border-top-color: rgba(0, 0, 0, 0.7);
				}
				.edit-location-cancel {
					margin-bottom: 10px;
				}
				.edit-location-cancel button {
					padding: 4px 10px;
					font-size: 12px;
				}
				.dt-cell__content--col-0 {
					padding: 0 !important;
				}
				.dt-cell__content--col-3, .dt-cell__content--col-4 {
					padding: 0 !important;
				}
			</style>
		`;

		$(frappe.render(headContent, this)).appendTo(this.page.head);
		
		// Add final styles with a delay to ensure they're loaded last and can't be overwritten
		setTimeout(() => {
			// Remove existing styles if they exist
			$('#lokacije-imovine-final-styles').remove();
			
			// Create a new style element with !important flags for critical styles
			const finalStyles = document.createElement('style');
			finalStyles.id = 'lokacije-imovine-final-styles';
			finalStyles.innerHTML = `
				.datatable-container {
					height: 100% !important;
					overflow: auto !important;
					margin-left: 0 !important;
				}
				.dt-scrollable {
					height: 400px !important;
					max-height: 400px !important;
					overflow-y: auto !important;
				}
				.dt-instance-1 {
					margin: 0 !important;
					margin-left: 0 !important;
				}
				.dt-cell--0 {
					width: 40px !important;
					min-width: 40px !important;
					max-width: 40px !important;
				}
				.dt-cell--3, .dt-cell--4 {
					width: 40px !important;
					min-width: 40px !important;
					max-width: 40px !important;
					text-align: center !important;
				}
				.dt-cell__content--col-0 {
					padding: 0 !important;
				}
				.dt-cell__content--col-3, .dt-cell__content--col-4 {
					padding: 0 !important;
				}
				#map {
					flex-shrink: 0 !important;
					margin-bottom: 0 !important;
					height: 400px !important;
					width: 100% !important;
				}
				.datatable-outer-container {
					height: 400px !important;
					overflow: hidden !important;
				}
				/* Property link styles */
				.property-link {
					color: #2c80ff !important;
					text-decoration: none !important;
					font-weight: 500 !important;
				}
				.property-link:hover {
					text-decoration: underline !important;
				}
				/* Marker cluster styles */
				.custom-cluster-icon {
					background: none;
				}
				.cluster-icon {
					width: 40px !important;
					height: 40px !important;
					background-color: rgba(49, 52, 75, 0.8) !important;
					color: white !important;
					border-radius: 50% !important;
					display: flex !important;
					align-items: center !important;
					justify-content: center !important;
					font-weight: bold !important;
					font-size: 14px !important;
					box-shadow: 0 0 0 4px rgba(49, 52, 75, 0.3) !important;
					transition: all 0.2s ease-in-out !important;
				}
				.cluster-icon:hover {
					transform: scale(1.1) !important;
					background-color: rgba(49, 52, 75, 0.9) !important;
				}
				/* Cluster polygon styles */
				.cluster-polygon {
					transition: all 0.3s ease-in-out !important;
					animation: pulse 2s infinite !important;
				}
				@keyframes pulse {
					0% {
						opacity: 0.2;
					}
					50% {
						opacity: 0.5;
					}
					100% {
						opacity: 0.2;
					}
				}
				/* Draw polygon mode styles */
				.draw-polygon-mode {
					cursor: crosshair !important;
				}
				.draw-polygon-tooltip {
					background-color: rgba(0, 0, 0, 0.7) !important;
					border: none !important;
					color: white !important;
					padding: 5px 10px !important;
					border-radius: 3px !important;
					font-weight: bold !important;
					max-width: 300px !important;
					text-align: center !important;
				}
				.draw-polygon-tooltip:before {
					border-top-color: rgba(0, 0, 0, 0.7) !important;
				}
				.draw-polygon-cancel {
					margin-bottom: 10px !important;
				}
				.draw-polygon-cancel button {
					padding: 4px 10px !important;
					font-size: 12px !important;
				}
				.polygon-marker-icon {
					background: none !important;
				}
				.polygon-point-marker {
					width: 20px !important;
					height: 20px !important;
					background-color: #3388ff !important;
					color: white !important;
					border-radius: 50% !important;
					display: flex !important;
					align-items: center !important;
					justify-content: center !important;
					font-weight: bold !important;
					font-size: 12px !important;
					box-shadow: 0 0 0 2px white !important;
				}
				/* Button styles */
				.btn-draw-polygon {
					padding: 4px 8px !important;
					background-color: #f8f9fa !important;
					border: 1px solid #dee2e6 !important;
					border-radius: 3px !important;
					color: #495057 !important;
					cursor: pointer !important;
					display: inline-flex !important;
					align-items: center !important;
					justify-content: center !important;
				}
				.btn-draw-polygon:hover {
					background-color: #e9ecef !important;
				}
				.btn-draw-polygon svg {
					margin-right: 0 !important;
				}
				/* Area label styles */
				.area-label-container {
					background: none !important;
				}
				.area-label {
					background-color: rgba(0, 0, 0, 0.7) !important;
					color: white !important;
					padding: 5px 10px !important;
					border-radius: 3px !important;
					font-weight: bold !important;
					text-align: center !important;
					white-space: nowrap !important;
				}
			`;
			
			// Append the style element to the document head
			document.head.appendChild(finalStyles);
		}, 1000); // Delay of 1 second to ensure it's loaded after other styles
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
		
		// Build filters object
		let filters = {};
		if (typeFilter?.length > 1) filters.tip_nekretnine = typeFilter;
		if (statusFilter?.length > 1) filters.status = statusFilter;
		
		frappe.call({
			method: "frappe.client.get_list",
			args: {
				doctype: "Nekretnina",
				fields: ["name", "naziv_nekretnine", "tip_nekretnine", "status", 
				         "adresa", "mesto", "zakupac", "zakupnina", "odrzava", "slika_prilaza_nekretnini", "location"],
				filters: filters,
				limit_page_length: 1000,
				order_by: "modified desc"
			},
			callback: (r) => {
				if (r.message) {
					// Store all properties
					this.allProperties = r.message;
					
					// Filter properties for map display (only those with location)
					this.properties = r.message.filter(p => p.location && this.hasValidCoordinates(p.location));

					if (this.properties.length === 0) {
						frappe.show_alert({
							message: __('Nema nekretnina sa definisanim koordinatama za prikaz na mapi'),
							indicator: 'orange'
						});
						
						// Clear the map
						this.refreshMap([]);
					} else {
						// Refresh the map with properties that have coordinates
						this.refreshMap(this.properties);
					}
					
					// Always render the datatable with all properties
					this.renderDataTable(this.allProperties);
				}
			}
		});
	},
	
	// Helper method to check if location has valid coordinates
	hasValidCoordinates: function(location) {
		try {
			const geoJson = JSON.parse(location);
			const pointFeature = geoJson.features.find(f => f.geometry && f.geometry.type === "Point");
			if (pointFeature && pointFeature.geometry.coordinates) {
				const [lng, lat] = pointFeature.geometry.coordinates;
				return !isNaN(lng) && !isNaN(lat);
			}
			return false;
		} catch (e) {
			return false;
		}
	},

	// Helper method to get coordinates from location
	getCoordinatesFromLocation: function(location) {
		try {
			const geoJson = JSON.parse(location);
			const pointFeature = geoJson.features.find(f => f.geometry && f.geometry.type === "Point");
			if (pointFeature && pointFeature.geometry.coordinates) {
				const [lng, lat] = pointFeature.geometry.coordinates;
				return { lat, lng };
			}
			return null;
		} catch (e) {
			return null;
		}
	},
	
	renderDataTable: function(properties) {
		// Format the data for the datatable
		const data = properties.map(p => {
			// Check if property has coordinates
			const hasCoordinates = p.location && this.hasValidCoordinates(p.location);
			
			// Get property details for the icon
			const status = p.status || 'N/A';
			const propertyType = p.tip_nekretnine || 'DEFAULT';
			
			return [
				// Create a button with the SVG inside - only if coordinates exist
				hasCoordinates ? 
					`<button class="btn btn-icon property-icon" data-property="${p.name}">${this.getPropertyIcon(propertyType, status)}</button>` : 
					'<div class="no-coordinates-icon">—</div>',
				// Make the property name a link to the property page
				`<a href="/app/nekretnina/${p.name}" class="property-link">${p.naziv_nekretnine || p.name}</a>`,
				p.zakupac || '',
				// Add edit button as a new column
				`<button class="btn btn-sm btn-edit-location" data-property="${p.name}" ${!hasCoordinates ? 'data-new-location="true"' : ''}>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M480-80Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q27 0 53.5 4.5T585-863l-65 66q-10-2-19.5-2.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186q122-112 181-203.5T720-552q0-12-1-24t-3-23l66-66q9 26 13.5 54t4.5 59q0 100-79.5 217.5T480-80m254-726-46-46-248 248v84h84l248-248zm66 10 28-28q11-11 11-28t-11-28l-28-28q-11-11-28-11t-28 11l-28 28q-11 11-11 28t11 28l28 28q11 11 28 11t28-11l28-28z"/></svg>
				</button>`,
				// Add draw polygon button as a new column
				`<button class="btn btn-sm btn-draw-polygon" data-property="${p.name}">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
					</svg>
				</button>`
			];
		});
		
		// If datatable already exists, refresh it
		if (this.datatable) {
			this.datatable.refresh(data);
			
			// Re-attach click handlers after refresh
			setTimeout(() => {
				this.attachButtonClickHandlers();
				this.attachEditButtonHandlers();
				this.attachDrawPolygonHandlers();
			}, 500);
			return;
		}
		
		// Initialize the datatable
		this.datatable = new DataTable('.datatable-container', {
			columns: [
				{ 
					name: '', 
					width: 40,
					resizable: false,
					format: (value) => value, // This will render the button with SVG directly
					editable: false,
					sortable: false,
				},
				{ 
					name: 'Naziv', 
					width: 400,
					format: (value) => value, // This will render the link directly
				},
				{ name: 'Zakupac', width: 200 },
				{ 
					name: '', 
					width: 45,
					format: (value) => value, // This will render the edit button
					editable: false,
					sortable: false,
				},
				{ 
					name: '', 
					width: 40,
					format: (value) => value, // This will render the draw polygon button
					editable: false,
					sortable: false,
				}
			],
			data: data,
			layout: 'fixed',
			serialNoColumn: false,
			checkboxColumn: false,
			inlineFilters: true,
			cellHeight: 35,
			dynamicRowHeight: false,
		});
		
		// Force column widths and attach button handlers
		setTimeout(() => {
			$('.dt-cell--0').css('width', '40px');
			$('.dt-cell--0').css('min-width', '40px');
			$('.dt-cell--0').css('max-width', '40px');
			
			$('.dt-cell--3').css('width', '40px');
			$('.dt-cell--3').css('min-width', '40px');
			$('.dt-cell--3').css('max-width', '40px');
			
			$('.dt-cell--4').css('width', '40px');
			$('.dt-cell--4').css('min-width', '40px');
			$('.dt-cell--4').css('max-width', '40px');
			
			this.attachButtonClickHandlers();
			this.attachEditButtonHandlers();
			this.attachDrawPolygonHandlers();
		}, 500);
	},
	
	// Method to attach click handlers to the edit buttons in the datatable
	attachEditButtonHandlers: function() {
		// Remove any existing handlers to prevent duplicates
		$(document).off('click', '.btn-edit-location');
		
		// Add click handler to all edit location buttons
		$(document).on('click', '.btn-edit-location', (e) => {
			e.preventDefault();
			e.stopPropagation();
			
			// Get the property ID from the data attribute
			const propertyId = $(e.currentTarget).data('property');
			const isNewLocation = $(e.currentTarget).data('new-location');
			
			if (propertyId) {
				// Find the property in all properties
				const property = this.allProperties.find(p => p.name === propertyId);
				
				if (property) {
					if (isNewLocation) {
						// Show a message for properties without coordinates
						frappe.show_alert({
							message: __('Postavljanje nove lokacije za nekretninu bez koordinata'),
							indicator: 'blue'
						});
					}
					this.enableLocationEditMode(propertyId);
				}
			}
		});
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
				
				if (property) {
					const coords = this.getCoordinatesFromLocation(property.location);
					if (coords) {
						// Invalidate the map size to ensure it's rendered correctly
						this.map.invalidateSize();
						
						// Center map on this property
						this.map.setView([coords.lat, coords.lng], 16);
						
						// Find the marker for this property
						const marker = this.markersList.find(marker => marker.propertyId === propertyId);
						if (marker) {
							// Create a small delay to ensure the map has centered first
							setTimeout(() => {
								marker.openPopup();
							}, 100);
						}
					}
				}
			}
		});
	},
	
	// Method to attach click handlers to the draw polygon buttons
	attachDrawPolygonHandlers: function() {
		// Remove any existing handlers to prevent duplicates
		$(document).off('click', '.btn-draw-polygon');
		
		// Add click handler to all draw polygon buttons
		$(document).on('click', '.btn-draw-polygon', (e) => {
			e.preventDefault();
			e.stopPropagation();
			
			// Get the property ID from the data attribute
			const propertyId = $(e.currentTarget).data('property');
			
			if (propertyId) {
				// Find the property in all properties
				const property = this.allProperties.find(p => p.name === propertyId);
				
				if (property) {
					this.enablePolygonDrawMode(propertyId);
				}
			}
		});
	},
	
	// Method to enable polygon drawing mode
	enablePolygonDrawMode: function(propertyId) {
		// Find the property in all properties
		const property = this.allProperties.find(p => p.name === propertyId);
		if (!property) return;
		
		// Close any open popups
		this.map.closePopup();
		
		// If property has coordinates, center the map on it
		if (property.latitude && property.longitude) {
			this.map.setView([property.latitude, property.longitude], 16);
		}
		
		// Check if property already has a polygon
		const hasExistingShape = property.location && 
			property.location.includes('"type":"Polygon"');
		
		if (hasExistingShape) {
			frappe.confirm(
				__('Ova nekretnina već ima definisan oblik. Da li želite da ga zamenite novim?'),
				() => {
					// User confirmed, proceed with drawing
					this.startPolygonDrawing(property);
				},
				() => {
					// User cancelled, do nothing
				}
			);
		} else {
			// No existing shape, proceed with drawing
			this.startPolygonDrawing(property);
		}
	},
	
	// Method to start the polygon drawing process
	startPolygonDrawing: function(property) {
		// Change cursor to crosshair
		$('#map').addClass('draw-polygon-mode');
		
		// Create a tooltip but don't add it to the map yet
		const tooltip = L.tooltip({
			permanent: true,
			direction: 'top',
			className: 'draw-polygon-tooltip'
		}).setContent('Klikom na prvu tačku završite crtanje.');
		
		let tooltipAdded = false;
		
		// Update tooltip position on mousemove
		const updateTooltip = (e) => {
			if (!e.latlng) return;
			
			// Add tooltip to map on first valid mousemove if not already added
			if (!tooltipAdded) {
				tooltip.setLatLng(e.latlng).addTo(this.map);
				tooltipAdded = true;
			} else {
				tooltip.setLatLng(e.latlng);
			}
		};
		
		this.map.on('mousemove', updateTooltip);
		
		// Initialize polygon points array and markers array
		this.polygonPoints = [];
		this.polygonMarkers = [];
		
		// Create a layer for the polygon
		this.drawingPolygon = L.layerGroup().addTo(this.map);
		
		// Create a layer for the polygon markers
		this.drawingMarkers = L.layerGroup().addTo(this.map);
		
		// Create a layer for the polygon lines
		this.drawingLines = L.layerGroup().addTo(this.map);
		
		// Create a layer for the area label
		this.areaLabel = L.layerGroup().addTo(this.map);
		
		// Function to update area label visibility based on zoom
		const updateAreaLabel = () => {
			if (this.polygonPoints.length >= 3) {
				// Clear existing polygon and area label
				this.drawingPolygon.clearLayers();
				
				// Create a new polygon
				const polygon = L.polygon(this.polygonPoints, {
					color: '#3388ff',
					weight: 2,
					opacity: 0.5,
					fillColor: '#3388ff',
					fillOpacity: 0.2
				}).addTo(this.drawingPolygon);
				
				// Only show area label if zoom level is 14 or higher
				if (this.map.getZoom() >= 14) {
					
					// Add area label at the center of the polygon
					const center = polygon.getBounds().getCenter();
				}
			}
		};


		// Handle click to add a point
		const handleMapClick = (e) => {
			if (!e.latlng) return;
			
			const clickedLat = e.latlng.lat;
			const clickedLng = e.latlng.lng;
			
			// Check if this is a click on the first point to complete the polygon
			if (this.polygonPoints.length > 2) {
				const firstPoint = this.polygonPoints[0];
				const distance = this.map.distance(
					[clickedLat, clickedLng],
					[firstPoint.lat, firstPoint.lng]
				);
				
				// If clicked close to the first point, complete the polygon
				if (distance < 20) { // 20 meters threshold
					// Remove the tooltip before completing the polygon
					if (tooltip && tooltip._map) {
						this.map.removeLayer(tooltip);
					}
					this.completePolygon(property);
					return;
				}
			}
			
			// Add the point to the array
			this.polygonPoints.push({
				lat: clickedLat,
				lng: clickedLng
			});
			
			// Add a marker for this point
			const marker = L.marker([clickedLat, clickedLng], {
				icon: L.divIcon({
					html: `<div class="polygon-point-marker">${this.polygonPoints.length}</div>`,
					className: 'polygon-marker-icon',
					iconSize: [20, 20],
					iconAnchor: [10, 10]
				})
			}).addTo(this.drawingMarkers);
			
			this.polygonMarkers.push(marker);
			
			// If we have at least 2 points, draw a line between the last two points
			if (this.polygonPoints.length > 1) {
				const lastPoint = this.polygonPoints[this.polygonPoints.length - 2];
				const line = L.polyline([
					[lastPoint.lat, lastPoint.lng],
					[clickedLat, clickedLng]
				], {
					color: '#3388ff',
					weight: 3,
					opacity: 0.7
				}).addTo(this.drawingLines);
			}
		};
		
		this.map.on('click', handleMapClick);
		
		// Add escape key handler to cancel draw mode
		const escKeyHandler = (e) => {
			if (e.key === 'Escape') {
				this.disablePolygonDrawMode(tooltip);
				document.removeEventListener('keydown', escKeyHandler);
			}
		};
		
		document.addEventListener('keydown', escKeyHandler);
		
		// Add a cancel button to the map
		const cancelButton = L.control({position: 'topright'});
		cancelButton.onAdd = (map) => {
			const div = L.DomUtil.create('div', 'draw-polygon-cancel');
			div.innerHTML = '<button class="btn btn-sm btn-danger">Otkaži</button>';
			div.onclick = () => {
				this.disablePolygonDrawMode(tooltip);
				map.removeControl(cancelButton);
			};
			return div;
		};
		cancelButton.addTo(this.map);
		
		// Store the cancel button reference for removal later
		this.cancelDrawButton = cancelButton;
		
		// Store the event handlers for removal later
		this.polygonDrawHandlers = {
			mousemove: updateTooltip,
			click: handleMapClick,
			escKey: escKeyHandler
		};
	},
	
	// Method to complete the polygon drawing
	completePolygon: function(property) {
		// Get the center point of the polygon for the property location
		const bounds = L.latLngBounds(this.polygonPoints);
		const center = bounds.getCenter();
		
		// Format the GeoJSON data without area
		const geoJsonData = {
			"type": "FeatureCollection",
			"features": [
				{
					"type": "Feature",
					"properties": {},
					"geometry": {
						"type": "Point",
						"coordinates": [center.lng, center.lat]
					}
				},
				{
					"type": "Feature",
					"properties": {},  // Removed area property
					"geometry": {
						"type": "Polygon",
						"coordinates": [
							[...this.polygonPoints.map(point => [point.lng, point.lat]),
							 [this.polygonPoints[0].lng, this.polygonPoints[0].lat]]
						]
					}
				}
			]
		};
		
	// Update the property in the database
	frappe.call({
		method: "frappe.client.set_value",
		args: {
			doctype: "Nekretnina",
			name: property.name,
			fieldname: {
				location: JSON.stringify(geoJsonData),
				latitude: center.lat,
				longitude: center.lng
			}
		},
		callback: (r) => {
			if (r.message) {
				frappe.show_alert({
					message: __('Lokacija i oblik nekretnine uspešno ažurirani'),
					indicator: 'green'
				});
				
				// Update the property in our local data
				property.location = JSON.stringify(geoJsonData);
				property.latitude = center.lat;
				property.longitude = center.lng;
				
				// Add to properties with coordinates if it wasn't there before
				if (!this.properties.some(p => p.name === property.name)) {
					this.properties.push(property);
				}
				
				// Refresh the map and datatable
				this.refreshMap(this.properties);
				this.renderDataTable(this.allProperties);
			}
		}
	});
	
	// Disable the polygon draw mode
	this.disablePolygonDrawMode();
},
	
	// Method to calculate the area of a polygon in square meters
	calculatePolygonArea: function(points) {
		if (points.length < 3) return 0;
		
		// Create a Leaflet polygon to use its getLatLngs method
		const polygon = L.polygon(points);
		
		// Use Leaflet's built-in geodesic area calculation
		return L.GeometryUtil.geodesicArea(polygon.getLatLngs()[0]);
	},
	
	// Method to disable polygon draw mode
	disablePolygonDrawMode: function(tooltip) {
		// Remove the tooltip if it exists and has been added to the map
		if (tooltip && tooltip._map) {
			this.map.removeLayer(tooltip);
		}
		
		// Remove the event handlers
		if (this.polygonDrawHandlers) {
			this.map.off('mousemove', this.polygonDrawHandlers.mousemove);
			this.map.off('click', this.polygonDrawHandlers.click);
			document.removeEventListener('keydown', this.polygonDrawHandlers.escKey);
			this.polygonDrawHandlers = null;
		}
		
		// Remove the cancel button if it exists
		if (this.cancelDrawButton) {
			this.map.removeControl(this.cancelDrawButton);
			this.cancelDrawButton = null;
		}
		
		// Remove the drawing layers
		if (this.drawingPolygon) {
			this.map.removeLayer(this.drawingPolygon);
			this.drawingPolygon = null;
		}
		
		if (this.drawingMarkers) {
			this.map.removeLayer(this.drawingMarkers);
			this.drawingMarkers = null;
		}
		
		if (this.drawingLines) {
			this.map.removeLayer(this.drawingLines);
			this.drawingLines = null;
		}
		
		// Reset cursor
		$('#map').removeClass('draw-polygon-mode');
		
		// Clear the polygon points and markers
		this.polygonPoints = [];
		this.polygonMarkers = [];

		// Remove the zoom event handler
		if (this.zoomHandler) {
			this.map.off('zoomend', this.zoomHandler);
			this.zoomHandler = null;
		}
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
			"Satellite": L.tileLayer(esri_url, {
				maxZoom: 20, 
				tileSize: 512, 
				zoomOffset: -1, 
				attribution: esri_attribution
			})
		};

		// Add layer control to map
		L.control.layers(baseMaps).addTo(this.map);
		
		// Initialize markers list array
		this.markersList = [];
		
		// Create a layer for the cluster polygon
		this.clusterPolygon = L.layerGroup().addTo(this.map);
		
		// Check if marker cluster plugin is available
		this.useMarkerCluster = typeof L.markerClusterGroup === 'function';
		
		if (this.useMarkerCluster) {
			// Initialize marker cluster group
			this.markers = L.markerClusterGroup({
				showCoverageOnHover: false,
				maxClusterRadius: 50,
				iconCreateFunction: function(cluster) {
					const count = cluster.getChildCount();
					return L.divIcon({
						html: `<div class="cluster-icon">${count}</div>`,
						className: 'custom-cluster-icon',
						iconSize: L.point(40, 40)
					});
				}
			});
			
			// Add event listeners for cluster hover
			this.markers.on('clustermouseover', (e) => {
				this.showClusterPolygon(e.layer);
			});
			
			this.markers.on('clustermouseout', () => {
				this.hideClusterPolygon();
			});
			
			this.map.addLayer(this.markers);
		} else {
			// If marker cluster is not available, create a layer group for markers
			this.markers = L.layerGroup().addTo(this.map);
			console.warn('Leaflet.markercluster plugin is not loaded. Using regular markers instead.');
			
			// Try to load the marker cluster plugin dynamically
			this.loadMarkerClusterPlugin();
		}
		
		// Load Leaflet.GeometryUtil if not already loaded
		if (!L.GeometryUtil) {
			this.loadGeometryUtilPlugin();
		}
		
		// Invalidate size after initialization to ensure proper rendering
		setTimeout(() => {
			this.map.invalidateSize();
		}, 100);
	},
	
	// Method to show the polygon shape of a cluster
	showClusterPolygon: function(cluster) {
		// Clear any existing polygon
		this.hideClusterPolygon();
		
		// Get all markers in this cluster
		const markers = cluster.getAllChildMarkers();
		if (markers.length < 3) return; // Need at least 3 points for a polygon
		
		// Extract latlngs from markers
		const points = markers.map(marker => marker.getLatLng());
		
		// Create a convex hull polygon
		const hull = this.getConvexHull(points);
		
		if (hull.length >= 3) {
			// Create a polygon with the hull points
			this.currentClusterPolygon = L.polygon(hull, {
				color: '#3388ff',
				weight: 2,
				opacity: 0.5,
				fillColor: '#3388ff',
				fillOpacity: 0.2,
				className: 'cluster-polygon'
			}).addTo(this.clusterPolygon);
		}
	},
	
	// Method to hide the cluster polygon
	hideClusterPolygon: function() {
		this.clusterPolygon.clearLayers();
		this.currentClusterPolygon = null;
	},
	
	// Method to calculate convex hull (Graham scan algorithm)
	getConvexHull: function(points) {
		// Function to calculate the cross product of three points
		function cross(o, a, b) {
			return (a.lat - o.lat) * (b.lng - o.lng) - (a.lng - o.lng) * (b.lat - o.lat);
		}
		
		// Sort points by latitude (and longitude for ties)
		points.sort((a, b) => {
			return a.lat !== b.lat ? a.lat - b.lat : a.lng - b.lng;
		});
		
		const lower = [];
		const upper = [];
		
		// Build lower hull
		for (let i = 0; i < points.length; i++) {
			while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
				lower.pop();
			}
			lower.push(points[i]);
		}
		
		// Build upper hull
		for (let i = points.length - 1; i >= 0; i--) {
			while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
				upper.pop();
			}
			upper.push(points[i]);
		}
		
		// Remove the last point of each hull (it's the same as the first point of the other hull)
		upper.pop();
		lower.pop();
		
		// Concatenate the lower and upper hulls to form the convex hull
		return lower.concat(upper);
	},
	
	// Method to dynamically load the marker cluster plugin
	loadMarkerClusterPlugin: function() {
		// Check if already loaded or loading
		if (document.querySelector('script[src*="leaflet.markercluster"]')) return;
		
		// Try to load the CSS
		const cssLink = document.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.href = 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css';
		document.head.appendChild(cssLink);
		
		const cssDefaultLink = document.createElement('link');
		cssDefaultLink.rel = 'stylesheet';
		cssDefaultLink.href = 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css';
		document.head.appendChild(cssDefaultLink);
		
		// Load the JS
		const script = document.createElement('script');
		script.src = 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js';
		script.onload = () => {
			console.log('Leaflet.markercluster plugin loaded successfully.');
			// Refresh the map to use the newly loaded plugin
			this.useMarkerCluster = typeof L.markerClusterGroup === 'function';
			if (this.useMarkerCluster) {
				// Initialize marker cluster group
				this.markers = L.markerClusterGroup({
					showCoverageOnHover: false,
					maxClusterRadius: 50,
					iconCreateFunction: function(cluster) {
						const count = cluster.getChildCount();
						return L.divIcon({
							html: `<div class="cluster-icon">${count}</div>`,
							className: 'custom-cluster-icon',
							iconSize: L.point(40, 40)
						});
					}
				});
				
				// Add event listeners for cluster hover
				this.markers.on('clustermouseover', (e) => {
					this.showClusterPolygon(e.layer);
				});
				
				this.markers.on('clustermouseout', () => {
					this.hideClusterPolygon();
				});
				
				this.map.addLayer(this.markers);
				
				// Remove markers from the regular layer group and add them to the cluster
				if (this.markers && this.markersList.length > 0) {
					this.markers.clearLayers();
					this.markersList.forEach(marker => this.markers.addLayer(marker));
				}
			}
		};
		script.onerror = () => {
			console.error('Failed to load Leaflet.markercluster plugin.');
		};
		document.head.appendChild(script);
	},

	// Method to load the Leaflet.GeometryUtil plugin
	loadGeometryUtilPlugin: function() {
		// Check if already loaded or loading
		if (document.querySelector('script[src*="leaflet.geometryutil"]')) return;
		
		// Load the JS
		const script = document.createElement('script');
		script.src = 'https://unpkg.com/leaflet-geometryutil@0.9.3/src/leaflet.geometryutil.js';
		script.onload = () => {
			console.log('Leaflet.GeometryUtil plugin loaded successfully.');
		};
		script.onerror = () => {
			console.error('Failed to load Leaflet.GeometryUtil plugin.');
			// Fallback implementation for polygon area calculation
			if (!L.GeometryUtil) {
				L.GeometryUtil = {
					geodesicArea: function(latLngs) {
						let area = 0;
						const d2r = Math.PI / 180;
						let p1, p2;
						
						for (let i = 0; i < latLngs.length - 1; i++) {
							p1 = latLngs[i];
							p2 = latLngs[i + 1];
							area += ((p2.lng - p1.lng) * d2r) * 
								(2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
						}
						
						// Add the last segment connecting the last point to the first
						p1 = latLngs[latLngs.length - 1];
						p2 = latLngs[0];
						area += ((p2.lng - p1.lng) * d2r) * 
							(2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
						
						area = area * 6378137.0 * 6378137.0 / 2.0;
						return Math.abs(area);
					}
				};
			}
		};
		document.head.appendChild(script);
	},

	loadPropertyLocations: function(properties) {
		// Clear existing markers
		if (this.markers) {
			this.markers.clearLayers();
		}
		
		// Clear marker list
		this.markersList = [];
		
		// Clear any existing polygons
		if (this.propertyPolygons) {
			this.map.removeLayer(this.propertyPolygons);
		}
		
		// Create a new layer group for property polygons
		this.propertyPolygons = L.layerGroup().addTo(this.map);
		
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

		// Add markers and polygons for each property
		properties.forEach(doc => {
			if (doc.location) {
				try {
					const coords = this.getCoordinatesFromLocation(doc.location);
					if (coords) {
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
						
						let marker = L.marker([coords.lat, coords.lng], { icon: icon })
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
						
						// Add marker to the list
						this.markersList.push(marker);
						
						// Add marker to the appropriate layer
						if (this.useMarkerCluster) {
							this.markers.addLayer(marker);
						} else {
							this.markers.addLayer(marker);
						}
						
						// Check if property has GeoJSON data with a polygon
						if (doc.location && doc.location.includes('"type":"Polygon"')) {
							try {
								const geoJson = JSON.parse(doc.location);
								
								// Find the polygon feature
								const polygonFeature = geoJson.features.find(f => 
									f.geometry && f.geometry.type === "Polygon");
								
								if (polygonFeature && polygonFeature.geometry.coordinates) {
									// Extract coordinates and convert from [lng, lat] to [lat, lng]
									const coords = polygonFeature.geometry.coordinates[0].map(
										coord => [coord[1], coord[0]]
									);
									
									// Get the color based on status
									const polygonColor = getStatusColor(status);
									
									// Create the polygon
									const polygon = L.polygon(coords, {
										color: polygonColor,
										weight: 2,
										opacity: 0.5,
										fillColor: polygonColor,
										fillOpacity: 0.2
									}).addTo(this.propertyPolygons);
								
									// Associate the polygon with the property
									polygon.propertyId = doc.name;
									
									// Make the polygon clickable to show property info
									polygon.on('click', () => {
										this.map.setView([coords.lat, coords.lng], 16);
										setTimeout(() => {
											marker.openPopup();
										}, 50);
									});
								}
							} catch (e) {
								console.error("Error parsing GeoJSON for property", doc.name, e);
							}
						}
					}
				} catch (e) {
					console.error("Error processing property", doc.name, e);
				}
			}
		});
	},
	
	// New method to enable location edit mode
	enableLocationEditMode: function(propertyId) {
		// Find the property in all properties
		const property = this.allProperties.find(p => p.name === propertyId);
		if (!property) return;
		
		// Close any open popups
		this.map.closePopup();
		
		// If property has coordinates, center the map on it
		if (property.location) {
			const coords = this.getCoordinatesFromLocation(property.location);
			if (coords) {
				this.map.setView([coords.lat, coords.lng], 16);
			}
		}
		
		// Change cursor to crosshair
		$('#map').addClass('edit-location-mode');
		
		// Create a tooltip but don't add it to the map yet
		const tooltip = L.tooltip({
			permanent: true,
			direction: 'top',
			className: 'location-edit-tooltip'
		}).setContent('Postavi novu lokaciju');
		
		let tooltipAdded = false;
		
		// Update tooltip position on mousemove
		const updateTooltip = (e) => {
			if (!e.latlng) return;
			
			// Add tooltip to map on first valid mousemove if not already added
			if (!tooltipAdded) {
				tooltip.setLatLng(e.latlng).addTo(this.map);
				tooltipAdded = true;
			} else {
				tooltip.setLatLng(e.latlng);
			}
		};
		
		this.map.on('mousemove', updateTooltip);
		
		// Handle click to set new location
		const handleMapClick = (e) => {
			if (!e.latlng) return;
			
			const newLat = e.latlng.lat;
			const newLng = e.latlng.lng;
			
			// Create new GeoJSON data
			const newGeoJson = {
				"type": "FeatureCollection",
				"features": [
					{
						"type": "Feature",
						"properties": {},
						"geometry": {
							"type": "Point",
							"coordinates": [newLng, newLat]
						}
					}
				]
			};
			
			// Ask for confirmation
			frappe.confirm(
				`Da li želite da postavite ${property.location ? 'novu' : 'prvu'} lokaciju za "${property.naziv_nekretnine || property.name}"?<br>
				${property.location ? 'Nove' : 'Nove'} koordinate: ${newLat.toFixed(6)}, ${newLng.toFixed(6)}`,
				() => {
					// User confirmed, update the property location
					frappe.call({
						method: "frappe.client.set_value",
						args: {
							doctype: "Nekretnina",
							name: propertyId,
							fieldname: {
								location: JSON.stringify(newGeoJson)
							}
						},
						callback: (r) => {
							if (r.message) {
								frappe.show_alert({
										message: __('Lokacija uspešno ažurirana'),
										indicator: 'green'
									});
								
								// Update the property in our local data
								property.location = JSON.stringify(newGeoJson);
								
								// Add to properties with coordinates if it wasn't there before
								if (!this.properties.some(p => p.name === property.name)) {
									this.properties.push(property);
								}
								
								// Refresh the map and datatable
								this.refreshMap(this.properties);
								this.renderDataTable(this.allProperties);
							}
						}
					});
					
					// Clean up
					this.disableLocationEditMode(tooltip);
				},
				() => {
					// User cancelled
					this.disableLocationEditMode(tooltip);
				},
				'Potvrdi'
			);
		};
		
		this.map.once('click', handleMapClick);
		
		// Add escape key handler to cancel edit mode
		const escKeyHandler = (e) => {
			if (e.key === 'Escape') {
				this.disableLocationEditMode(tooltip);
				document.removeEventListener('keydown', escKeyHandler);
			}
		};
		
		document.addEventListener('keydown', escKeyHandler);
		
		// Add a cancel button to the map
		const cancelButton = L.control({position: 'topright'});
		cancelButton.onAdd = (map) => {
			const div = L.DomUtil.create('div', 'edit-location-cancel');
			div.innerHTML = '<button class="btn btn-sm btn-danger">Otkaži</button>';
			div.onclick = () => {
				this.disableLocationEditMode(tooltip);
				map.removeControl(cancelButton);
			};
			return div;
		};
		cancelButton.addTo(this.map);
		
		// Store the cancel button reference for removal later
		this.cancelEditButton = cancelButton;
	},
	
	// Method to disable location edit mode
	disableLocationEditMode: function(tooltip) {
		// Remove the tooltip if it exists and has been added to the map
		if (tooltip && tooltip._map) {
			this.map.removeLayer(tooltip);
		}
		
		// Remove the mousemove event
		this.map.off('mousemove');
		
		// Remove the cancel button if it exists
		if (this.cancelEditButton) {
			this.map.removeControl(this.cancelEditButton);
			this.cancelEditButton = null;
		}
		
		// Reset cursor
		$('#map').removeClass('edit-location-mode');
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
		if (this.markersList.length > 0) {
			// Invalidate size before fitting bounds
			this.map.invalidateSize();
			
			// Create a bounds object
			const bounds = L.latLngBounds(this.markersList.map(marker => marker.getLatLng()));
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
