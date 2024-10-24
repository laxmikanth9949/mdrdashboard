sap.ui.define([
	"corp/sap/mdrdashboards/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController,JSONModel) {
	"use strict";

	return BaseController.extend("corp.sap.mdrdashboards.controller.MDRList", {
		onInit: function () {
			this.oRouter = this.getRouter();
			// this.oRouter.attachRouteMatched(this.onRouteMatched, this);
			this.oRouter.navTo("");
		}
	});
});