sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"sap/ui/model/odata/v2/ODataModel"
], function(Controller, History, UIComponent, ODataModel) {
	"use strict";

	return Controller.extend("corp.sap.mdrdashboards.controller.BaseController", {

		getRouter : function () {
			return UIComponent.getRouterFor(this);
		},

		onNavBack: function () {
			var oHistory, sPreviousHash;

			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("RouteMDRList", {}, true /*no history*/);
			}
		},

		getSourceICAddr: function () {
			var host = window.location.host;
			var sourceIC = "icp";
			if ((host.search("dev-mallard") !== -1) || (host.search("mccdashboardrepository-dev") !== -1) || (host.search("port5000") !== -1)) {
				sourceIC = "icd";
			} else if ((host.search("test-kinkajou") !== -1) || (host.search("sapit-home-test-004") !== -1) || (host.search("mccdashboardrepository-test") !== -1)) {
				sourceIC = "ict";
			} else if ((host.search("prod-kestrel") !== -1) || (host.search("sapit-home-prod-004") !== -1) || (host.search("mccdashboardrepository.cfapps") !== -1)){
				sourceIC = "icp";
			}
			this.source_IC = sourceIC;
			return sourceIC;
		},

		/**
		 * Convenience method for getting the component model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getComponentModel: function (sName) {
			return this.getOwnerComponent().getModel(sName);
		},
		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},
		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		/**
		 * Show busy dialog on page
		 * @public
		 */
		showBusyDialog: function(){
			this.getOwnerComponent().oBusyDialog.open();
		},
		/**
		 * Hide busy dialog on page
		 * @public
		 */
		hideBusyDialog: function(){
			this.getOwnerComponent().oBusyDialog.close();
		},

		getServiceName: function(modelName) {
			var source = this.getSourceICAddr();
			var serviceSuffix = "Service";
			if (modelName === "complaintModel") {
				source = source.replace("i", "b");
				serviceSuffix = "Service13";
			}
			return source + serviceSuffix;
		},

		loadModel: function(modelName) {
			var oDataSources = this.getOwnerComponent().getMetadata().getManifestEntry("sap.app")["dataSources"];
			var serviceName = this.getServiceName(modelName);
			var oModel = new ODataModel({serviceUrl: oDataSources[serviceName].uri});
			this.setModel(oModel, modelName);
		},
		
		checkDashboardType: function() {
			if(jQuery.sap.getUriParameters().get("type") !== null) {
				return jQuery.sap.getUriParameters().get("type");
			}
			return "MCC";
		},
		
		getRootPath: function() {
			var sRootPath = jQuery.sap.getModulePath("corp.sap.mdrdashboards");
			console.log("sRootPath=====", sRootPath);
			return sRootPath;
		}

	});

});