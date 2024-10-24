sap.ui.define([
	"corp/sap/mdrdashboards/controller/DA_BaseController", "sap/m/MessageToast"
], function (DA_BaseController, MessageToast) {
	"use strict";
	
	return DA_BaseController.extend("corp/sap/mdrdashboards.controller.DA_Overview", {
		
		onPress: function (evt) {
			var oTile = evt.getSource(),
				sTileName = oTile.getTooltip(),
				i18nModel = this.getView().getModel("i18n").getResourceBundle();
			switch (sTileName) {
			case "Analyze Guide":
				if (!this.guideAnalysis) {
					this.guideAnalysis = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_GuideAnalysis", this);
					this.getView().addDependent(this.guideAnalysis);
					this.guideAnalysis.open();
				}
				// MessageToast.show("Not available yet.");
				// window.open(i18nModel.getText("something").toString().trim()); // carousel guide here
				break;
			case "Build Guide":
				if (!this.guideBuild) {
					this.guideBuild = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_GuideBuild", this);
					this.getView().addDependent(this.guideBuild);
					this.guideBuild.open();
				}
				break;
			case "MCC Tools Page":
				window.open(i18nModel.getText("mccToolsPage").toString().trim());
				break;
			case "News and Updates":
				if (!this.guideBuild) {
					this.guideBuild = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_TechnicalDocumentation", this);
					this.getView().addDependent(this.guideBuild);
					this.guideBuild.open();
				}
				break;
			case "Best Practices":
				if (!this.guideURL) {
					this.guideURL = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_GuideURL", this);
					this.getView().addDependent(this.guideURL);
					this.guideURL.open();
				}
				break;
			default:
				break;
			}
		},
		
		closeGuideAnalysis: function () {
			// When closed, the dialog gets destroyed
			if (this.guideAnalysis) {
				this.guideAnalysis.destroy(true);
				delete this.guideAnalysis;
			}
		},
		
		closeGuideBuild: function () {
			// When closed, the dialog gets destroyed
			if (this.guideBuild) {
				this.guideBuild.destroy(true);
				delete this.guideBuild;
			}
		},
		
		closeGuideURL: function () {
			// When closed, the dialog gets destroyed
			if (this.guideURL) {
				this.guideURL.destroy(true);
				delete this.guideURL;
			}
		}
	});
});