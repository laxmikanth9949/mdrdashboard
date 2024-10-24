sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";
	return Controller.extend("corp.sap.mdrdashboards.controller.DA_BaseController", {
		getRouter: function() {
			return sap.ui.core.UIComponent.getRouterFor(this);
		}
	});
});