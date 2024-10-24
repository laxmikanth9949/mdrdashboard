sap.ui.define([
	"sap/ui/core/UIComponent",
	"corp/sap/mdrdashboards/model/models",
	"corp/sap/mdrdashboards/cFLPAdapter"
], function (UIComponent, models, cFLPAdapter) {
	"use strict";

	return UIComponent.extend("corp.sap.mdrdashboards.Component", {

		metadata: {
			manifest: "json"
		},

		getSystemType: function () {
			var host = window.location.host;
			var pos = host.search("br339jmc4c");
			if (pos !== -1)
				return "d";
			pos = host.search("sapitcloudt");
			if (pos !== -1)
				return "t";
			pos = host.search("sapitcloud");
			if (pos !== -1)
				return "p";
			return "p";
		},

		init: function () {
			cFLPAdapter.init(); 
			sap.ui.Device.system.phone = false;
			sap.ui.Device.system.tablet = false;
			var oManifestUi5 = this.getMetadata().getManifestEntry("sap.ui5");
			// To be done: Source = "icx" or "bcx" ?
			var source = "ic" + this.getSystemType();
			var url = window.location.href;
			var mdr = url.split("#");
			oManifestUi5.models[""].settings.dataSource = source + "Service";
			// Define model for favorite customers
			var oFavoriteModel = new sap.ui.model.json.JSONModel({
				tiles: [],
				laodingFavorites: true
			});
			this.setModel(oFavoriteModel, 'favoriteModel');
			// Call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			// Enable routing
			this.getRouter().initialize();
			// Set the device model
			this.setModel(models.createDeviceModel(), "device");

			// MDR Version
			this.setModel(new sap.ui.model.json.JSONModel({version: this.getMetadata().getVersion()}), "MDRVersion");
			// Busy dialog
			this.oBusyDialog = new sap.m.BusyDialog({
				showCancelButton: false
			}).addStyleClass("busy_indicator");
			// Module Path
			var sRootPath = jQuery.sap.getModulePath("corp.sap.mdrdashboards");
			this.setModel(new sap.ui.model.json.JSONModel({rootPath: sRootPath}), "base");
			// Mobile Usage Reporting
			// Version V3
			sap.git = sap.git || {};
			sap.git.usage = sap.git.usage || {};
			sap.git.usage.Reporting = {
				_lp: null,
				_load: function (a) {
					this._lp = this._lp || sap.ui.getCore().loadLibrary("sap.git.usage", {
						url: "https://trackingshallwe.hana.ondemand.com/web-client/v3",
						async: !0
					}), this._lp.then(function () {
						a(sap.git.usage.MobileUsageReporting);
					}, this._loadFailed);
				},
				_loadFailed: function (a) {
					jQuery.sap.log.warning("[sap.git.usage.MobileUsageReporting]", "Loading failed: " + a)
				},
				setup: function (a) {
					this._load(function (b) {
						b.setup(a)
					})
				},
				addEvent: function (a, b) {
					this._load(function (c) {
						c.addEvent(a, b)
					})
				},
				setUser: function (a, b) {
					this._load(function (c) {
						c.setUser(a, b)
					})
				}
			};
			sap.git.usage.Reporting.setup(this);
		}
	});
});