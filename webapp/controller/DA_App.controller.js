sap.ui.define([
	"corp/sap/mdrdashboards/controller/DA_BaseController",
	"sap/ui/model/json/JSONModel"
], function (DA_BaseController, JSONModel) {
	"use strict";
	var _aValidTabKeys = ["Home", "Analyze", "Build"];

	return DA_BaseController.extend("corp/sap/mdrdashboards.controller.DA_App", {
		
		onInit: function () {
			var oRouter = this.getRouter();
			this.getView().setModel(new JSONModel(), "view");
			this.changePageTitle();
			// Create correct path to images
			var oRootPath = jQuery.sap.getModulePath("corp.sap.mdrdashboards");
			var oImageModel = new sap.ui.model.json.JSONModel({
				path : oRootPath
			});
			this.getView().setModel(this.oUIModel, "UIModel");
			// Mobile Usage Reporting - Version Distribution
			// --> Counts Number of Devices
			try {
				var tracking = new GlobalITTracking("MDR Dashboards", "MDR Dashboard Builder & Analyzer - V1.4.0");
			} catch (e) {
				console.log("Error: " + e);
			}
			// Mobile Usage Reporting - Events
			// --> Counts Calls of the Application
			sap.git.usage.Reporting.addEvent(this.getOwnerComponent(), "MDR Dashboard Builder & Analyzer - V1.4.0");
			oRouter.getRoute("DA").attachMatched(this._onRouteMatched, this);
		},
		
		changePageTitle: function () { 
            	var newPageTitle = "Dashboard Builder & Analyzer"; 
            	document.title = newPageTitle; 
        	},
		
		_onRouteMatched: function (oEvent) {
			var oArgs, oView, oQuery;

			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();
			oQuery = typeof (oArgs["?query"]) === "undefined" ? "NO VALUE" : oArgs["?query"];

			if (oQuery.hasOwnProperty("analyze") === true) {
				oView.getModel("view").setProperty("/selectedTabKey", "Analyze");
				this.getRouter().getTargets().display("Analyze");

			} else if (oQuery && _aValidTabKeys.indexOf(oQuery.tab) > -1) {
				oView.getModel("view").setProperty("/selectedTabKey", oQuery.tab);

				// support lazy loading for the tabs
				if (oQuery.tab === "Analyze" || oQuery.tab === "Build" || oQuery.tab === "Home") {
					this.getRouter().getTargets().display(oQuery.tab);
				}
			} else {
				// the default query param should be visible at all time
				this.getRouter().navTo("App", {
					query: {
						tab: _aValidTabKeys[0]
					}
				}, true);
			}
		},
		
		onTabSelect: function (oEvent) {
			this.getRouter().navTo("App", {
				query: {
					tab: oEvent.getParameter("selectedKey")
				}
			}, true);
		},
		
		openInfoDialog: function () {
			if (!this.infoDialog) {
				this.infoDialog = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_InfoDialog", this);
				this.getView().addDependent(this.infoDialog);
				this.infoDialog.open();
			}
		},
		
		closeInfoDialog: function () {
			// When closed, the info dialog gets destroyed
			if (this.infoDialog) {
				this.infoDialog.destroy(true);
				delete this.infoDialog;
			}
		}
	});
});