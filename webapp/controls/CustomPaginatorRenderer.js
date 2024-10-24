sap.ui.define([], function () {
	"use strict";

	var CustomPaginatorRenderer = {};

	CustomPaginatorRenderer.render = function(oRm, oControl) {
		// if (oControl.getNubmerOfPages() !== null && oControl.getNubmerOfPages() > 0) {
		oRm.write("<ul");
		oRm.writeControlData(oControl);
		oRm.addClass("pagination");
		oRm.writeClasses();
		
		oRm.writeStyles();
		oRm.write(">");
		
		oRm.write("</ul>");
		// }
	};

	return CustomPaginatorRenderer;
}, /* bExport= */ true);
