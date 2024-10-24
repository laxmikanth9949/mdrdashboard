sap.ui.define([
	"corp/sap/mdrdashboards/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	'sap/m/MessageToast',
	'sap/ui/core/mvc/Controller',
	'sap/ui/core/Fragment',
	"sap/ui/model/Filter",
	'corp/sap/mdrdashboards/model/formatter'
], function (BaseController, JSONModel, MessageBox, MessageToast, Controller, Fragment, Filter, formatter) {
	"use strict";

	return BaseController.extend("corp/sap/mdrdashboards.controller.MDR10", {
		formatter: formatter,
		onInit: function () {
			// Create correct path to images
			var oRootPath = jQuery.sap.getModulePath("corp.sap.mdrdashboards");
			var oImageModel = new sap.ui.model.json.JSONModel({
				path : oRootPath
			});
			this.setModel(oImageModel, "imageModel");
			// Set the environment
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
			// Theme model
			var sTheme = "blue";
			this.oUIModel = new JSONModel({
				theme: sTheme,
				title: "",
				runTitle: false});
			this.getView().setModel(this.oUIModel, "UIModel");
			// Other models
			var oDataFigure = {
				text: "",
				title: "",
				id: "",
				nodes: new Array()
			};
			var oModel = new JSONModel(oDataFigure);
			this.getView().setModel(oModel, "TreeModel");
			var Tooltip = {
				"text": "",
				"title": "",
				"imageSrc": "",
				"status": "",
				"busy": true
			};
			var aModel = new JSONModel(Tooltip);
			this.getView().setModel(aModel, "toolTipModel");
			// Case model
			var caseId = {
				"No": ""
			};
			var cModel = new JSONModel(caseId);
			this.getView().setModel(cModel, "caseIdModel");
			this.superCases = [];
			this.filter = "";
			// Style sheet
			//jQuery.sap.includeStyleSheet("css/style_mdr6.css", "stylemdr6");
			//Router
			this.oRouter = this.getRouter();
			this.oRouter.attachRouteMatched(this.onRouteMatched, this);
			this.changePageTitle();
			// Mobile Usage Reporting: Version Distribution --> Counts Number of Devices
			try {
				var tracking = new GlobalITTracking("MDR Dashboards", "MDR10 - Case Hierarchy – V1.1.0");
			} catch (e) {
				console.log("Error: " + e);
			}
			// Mobile Usage Reporting: Events --> Counts Calls of the Application
			sap.git.usage.Reporting.addEvent(this.getOwnerComponent(), "MDR10 - Case Hierarchy – V1.1.0");
			// add event to the text area
			// this.getView().byId("TreeTextId").addEventDelegate({
			// 	 onmouseover: this.handlePopoverPress.bind(this),
			// 	 onclick: this.pressToDirect.bind(this),
			//   onmouseout: this.handlePopoverOut.bind(this)
			// });
		},

		onExit: function () {
			if (this._oPopover) {
				this._oPopover.destroy();
			}
		},

		changePageTitle: function () {
			var newPageTitle = "MDR10 - Cases Hierarchy";
			document.title = newPageTitle;
		},

		onRouteMatched: function (oEvent) {
			var sRouteName = oEvent.getParameter("name");
			this.readURL();
			this._customizeUI();
			if (sRouteName === "MDR10") {
				var oArgs;
				oArgs = oEvent.getParameter("arguments");
				var rootObj = this.startSearchCase(oArgs.caseId);
				var ID = {
					"No": "Case Hierarchy View for Case ID" + " " + oArgs.caseId
				};
				this.getView().getModel("caseIdModel").setData(ID);
				var rootNodes = this.searchSubCases(rootObj.caseID);
				//super case root
				var root = {
					"text": "Case " + rootObj.caseID + " " + rootObj.caseTitle + " with Status: " + rootObj.caseStatus,
					"title": "Detailed Super-Case Information",
					"id": rootObj.caseID
				};
				if (rootNodes !== []) {
					root["nodes"] = rootNodes;
				}
				this.getView().getModel("TreeModel").setData([root]);
			}
			this.getView().byId("Tree").setBusy(false);
		},

		//formatter: Formatter,
		_customizeUI: function () {
			this.oUIModel.setProperty("/theme", this.layout === "dark" ? "dark" : "blue");
			this.getView().byId("MDR10").addStyleClass(this.oUIModel.getProperty("/theme"));
			this.oUIModel.setProperty("/runTitle", this.run_title === "yes" ? true : false);
		},

		readURL: function () {
			if (jQuery.sap.getUriParameters().get("title") === null) {
				this.title = "MDR10 - Cases Hierarchy";
				this.oUIModel.setProperty("/title", "MDR10 - Cases Hierarchy");
			} else {
				this.title = jQuery.sap.getUriParameters().get("title");
				this.oUIModel.setProperty("/title", this.title);
			}
			// if (jQuery.sap.getUriParameters().get("run_title") === ""){
			//   this.run_title = "no";
			// }
		},

		// -------------------------------------------------------------------------------------------------------
		// --- Search Sub Cases ----------------------------------------------------------------------------------
		// -------------------------------------------------------------------------------------------------------
		searchSubCases: function searchSubCases(resultID) {
			var subCaseID = "";
			var subCaseTitle = "";
			var subCaseStatus = "";
			var filter = "";
			var count = 0;
			var subCasesObj = [];
			var subCasesTitleObj = [];
			var subCasesStatusObj = [];
			var subOdata2 = [];
			// Case ID
			if (resultID !== "" && resultID !== "0" && resultID !== undefined) {
				filter = "case_id%20eq%20'" + resultID + "'";
				count = 1;
			}
			// var hierarchyUrl = "https://" + this.env + "main." + "wdf.sap.corp/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/CaseHierarchyList?$filter=";
			// var hierarchyUrl = "/icp/sap/ZS_AGS_DASHBOARDS_SRV/CaseHierarchyList?$filter=";
			var hierarchyUrl = sap.ui.require.toUrl("corp/sap/mdrdashboards") 
				+  "/apim/ic/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/CaseHierarchyList?$filter=";
			if (count > 0) {
				hierarchyUrl += filter;
				jQuery.ajax({
					async: false,
					headers: {
						'AppIdentifier': 'FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ', //API Management: ID for MDR Dashboards
						'mccprofile': 'MDR10_SubCaseSearch'
					},
					url: hierarchyUrl,
					type: "get",
					dataType: "json",
					success: function (data) {
						//Start Case Hierarchy Search
						if (data.d.results.length !== 0) {
							//Operations on found Cases
							for (var i = 0; i < data.d.results.length; i++) {
								//CaseHierarchyList Logic: Find sub case
								if (data.d.results[i].relation === "sub") {
									subCasesObj.push(data.d.results[i].object_id);
									subCasesTitleObj.push(data.d.results[i].case_title);
									subCasesStatusObj.push(data.d.results[i].status_text);
								}
							}
						}
					},
					error: function () {
						sap.m.MessageBox.show("Error during sub cases search");
					}
				});
				for (var i = 0; i < subCasesObj.length; i++) {
					if (subCasesObj[i] !== undefined) {
						subCaseID = subCasesObj[i];
						subCaseTitle = subCasesTitleObj[i];
						subCaseStatus = subCasesStatusObj[i];
						var subOdata = {
							"text": "Case " + subCaseID + " " + subCaseTitle + " with Status: " + subCaseStatus,
							"title": "Detailed Sub-Case Information",
							"id": subCaseID
						};
						// tree depth
						var subNodeResult = this.searchSubCases(subCaseID);
						if (subNodeResult !== []) {
							subOdata.nodes = subNodeResult;
						}
						subOdata2.push(subOdata);
					}
				}
			}
			return subOdata2;
		},

		// -------------------------------------------------------------------------------------------------------
		// --- Start Case Hierarchy Search -----------------------------------------------------------------------
		// -------------------------------------------------------------------------------------------------------
		startSearchCase: function startSearchCase(case_id) {
			var filter = "";
			var count = 0;
			var checkSuperCase = false;
			var superCaseID = "";
			var superCaseTitle = "";
			var superCaseStatus = "";
			// Case ID
			if (case_id !== "" && case_id !== "0" && case_id !== undefined) {
				filter = "case_id%20eq%20'" + case_id + "'";
				count = 1;
				this.oTree = this.getView().byId("Tree");
			}
			// /int_bc/SVC/
			// var hierarchyUrl = "https://" + this.env + "main." + "wdf.sap.corp/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/CaseHierarchyList?$filter=";
			// var hierarchyUrl = "/icp/sap/ZS_AGS_DASHBOARDS_SRV/CaseHierarchyList?$filter=";
			var hierarchyUrl = sap.ui.require.toUrl("corp/sap/mdrdashboards") 
				+  "/apim/ic/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/CaseHierarchyList?$filter=";
			if (count > 0) {
				hierarchyUrl += filter;
				jQuery.ajax({
					async: false,
					headers: {
						'AppIdentifier': 'FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ', //API Management: ID for MDR Dashboards
						'mccprofile': 'MDR10_CaseHierarchySearch'
					},
					url: hierarchyUrl,
					type: "get",
					dataType: "json",
					success: function (data) {
						//Start Case Hierarchy Search
						if (data.d.results.length !== 0) {
							//Operations on found Cases
							for (var i = 0; i < data.d.results.length; i++) {
								//CaseHierarchyList Logic: Find Super Case
								if (data.d.results[i].relation === "sup") {
									checkSuperCase = true;
									//Get linked super case
									superCaseID = data.d.results[i].object_id;
									superCaseTitle = data.d.results[i].case_title;
									superCaseStatus = data.d.results[i].status_text;

									//Only one Super Case available
									break;
								}
								//Self could be the Super Case
								else if (data.d.results[i].relation === "sel") {
									checkSuperCase = false;
									//Get linked super case -> self
									superCaseID = data.d.results[i].object_id;
									superCaseTitle = data.d.results[i].case_title;
									superCaseStatus = data.d.results[i].status_text;
								} else {
									checkSuperCase = false;
								}
							}
							//END: Case Hierarchy Search						
						}
					},
					error: function (error) {
						sap.m.MessageBox.show("Error during search");
					}
				});
				var caseObject = new Object();
				caseObject.caseID = superCaseID;
				caseObject.caseTitle = superCaseTitle;
				caseObject.caseStatus = superCaseStatus;
				//Add first Super Case to Array
				this.superCases.push(caseObject);
				//Always do the parent check
				if (checkSuperCase === true) {
					//Fill Super Case Array
					var parentResult = this.searchParentCase(superCaseID);
					if (parentResult !== undefined) {
						//return this.searchParentCase(superCaseID);
						return parentResult;
					}
					return caseObject;
				}
				return caseObject;
			}
		},

		// -------------------------------------------------------------------------------------------------------
		// --- Start Parent Case Search --------------------------------------------------------------------------
		// -------------------------------------------------------------------------------------------------------
		searchParentCase: function searchParentCase(super_case) {
			var checkSuperCase = false;
			var superCaseID = "";
			var superCaseTitle = "";
			var superCaseStatus = "";
			// var hierarchyUrl = "https://" + this.env + "main." + "wdf.sap.corp/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/CaseHierarchyList?$filter=";
			// var hierarchyUrl = "/icp/sap/ZS_AGS_DASHBOARDS_SRV/CaseHierarchyList?$filter=";
			var hierarchyUrl = sap.ui.require.toUrl("corp/sap/mdrdashboards") 
				+  "/apim/ic/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/CaseHierarchyList?$filter=";
			var filter = "";
			filter = "case_id%20eq%20'" + super_case + "'and parent_case eq 'X'";
			hierarchyUrl += filter;
			if (super_case !== "0") {
				jQuery.ajax({
					async: false,
					headers: {
						'AppIdentifier': 'FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ', //API Management: ID for MDR Dashboards
						'mccprofile': 'MDR10_ParentCaseSearch'
					},
					url: hierarchyUrl,
					type: "get",
					dataType: "json",
					success: function (data) {
						//Start Parent Case Search
						if (data.d.results.length !== 0) {
							//Operations on found Cases
							for (var i = 0; i < data.d.results.length; i++) {
								if (data.d.results[i].parent_case === "X" && data.d.results[i].case_id !== "") {
									checkSuperCase = true;
									superCaseID = data.d.results[i].case_id;
									superCaseTitle = data.d.results[i].case_title;
									superCaseStatus = data.d.results[i].status_text;
									break;
								} else {
									checkSuperCase = false;
								}
							}
							//END: Parent Case Search						
						}
					},
					error: function () {
						//alert("Error during parent case search (missing authorizations)");
						sap.m.MessageBox.show("Error during parent case search (missing authorizations)");
					}
				});
				if (checkSuperCase === true) {
					var caseObject = new Object();
					caseObject.caseID = superCaseID;
					caseObject.caseTitle = superCaseTitle;
					caseObject.caseStatus = superCaseStatus;
					//Add first Super Case to Array
					this.superCases.push(caseObject);
					return caseObject;
				}
			}
		},

		// -------------------------------------------------------------------------------------------------------
		// --- onmouseover event ---------------------------------------------------------------------------------
		// -------------------------------------------------------------------------------------------------------
		handlePopoverPress: function (oEvent) {
			// if (jQuery(oEvent.target).hasClass("sapUiIcon") === true) {
			// if (jQuery(oEvent.target).hasClass("sapMSTIIcon sapUiIcon sapUiIconMirrorInRTL") === true) {
			// if (oEvent.target.tagName === "LI") {
			// var tarId = oEvent.target.id;
			// var tarId = oEvent.target.lastElementChild.children[0].id;
			this.getView().getModel("toolTipModel").setProperty("/busy", true);
			// var tarId = oEvent.target.id;
			// var oButton = sap.ui.getCore().byId(tarId);
			// var oIdObject = sap.ui.getCore().byId(tarId).getBindingContext("TreeModel").getObject();
			var oButton = oEvent.getSource();
			var oIdObject = oEvent.getSource().getBindingContext("TreeModel").getProperty();
			if (!this._oPopover) {
				Fragment.load({
					name: "corp/sap/mdrdashboards.fragments.MDR10Popover",
					controller: this
				}).then(function (pPopover) {
					this._oPopover = pPopover;
					this.getView().addDependent(this._oPopover);
					this._oPopover.openBy(oButton);
				}.bind(this));
			} else {
				this._oPopover.openBy(oButton);
			}
			// var resultId = oIdObject.id;
			// var resultId = sap.ui.getCore().byId(tarId).getParent().data("caseid");
			var resultId = oEvent.getSource().getBindingContext("TreeModel").getProperty().id;
			// var caseUrl = "/icp/sap/ZS_AGS_DASHBOARDS_SRV/CaseList?$filter=case_id eq '" + resultId + "'";
			var caseUrl = sap.ui.require.toUrl("corp/sap/mdrdashboards") 
				+  "/apim/ic/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/CaseList?$filter=case_id eq '" + resultId + "'";
			// this.getView().getModel("toolTipModel").setProperty("/busy", true);
			jQuery.ajax({
				async: false,
				headers: {
					'AppIdentifier': 'FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ', //API Management: ID for MDR Dashboards
					'mccprofile': 'MDR10_ReadCaseDetails'
				},
				url: caseUrl,
				type: "get",
				dataType: "json",
				success: function (data) {
					// Read Case Details
					if (data.d.results.length !== 0) {
						// Rich Tooltip Solution
						// var sHtml = "";
						// var ratingIcon = "";
						this.sHtml = "<ul>";
						this.sHtml += "<li><strong>Case ID: </strong>" + data.d.results[0].case_id + "</li>";
						this.sHtml += "<li><strong>Description: </strong>" + data.d.results[0].case_title + "</li>";
						this.sHtml += "<li><strong>Case Type: </strong>" + data.d.results[0].case_type_text + "</li>";
						this.sHtml += "<li><strong>Customer: </strong>" + data.d.results[0].customer_name + "</li>";
						this.sHtml += "<li><strong>Priority: </strong>" + data.d.results[0].priority_text + "</li>";
						this.sHtml += "<li><strong>Reason: </strong>" + data.d.results[0].reason_text + "</li>";
						this.sHtml += "<li><strong>Status: </strong>" + data.d.results[0].status_text + "</li>";
						this.sHtml += "<li><strong>Rating: </strong>" + data.d.results[0].rating_text + "</li>";
						this.sHtml += "<li><strong>Service Team: </strong>" + data.d.results[0].service_team + "</li>";
						this.sHtml += "<li><strong>Responsible Person: </strong>" + data.d.results[0].responsible_person + "</li>";
						this.sHtml += "</ul>";
						if (data.d.results[0].rating === "A") {
							this.ratingIcon = "sap-icon://status-positive";
							this.state = "Success";
						} else if (data.d.results[0].rating === "B") {
							this.ratingIcon = "sap-icon://status-critical";
							this.state = "Warning";
						} else if (data.d.results[0].rating === "C") {
							this.ratingIcon = "sap-icon://status-negative";
							this.state = "Error";
						}

					} else {
						this.sHtml = "<ul>";
						this.sHtml += "<li><strong>No result</strong>" + "</li>";
						this.sHtml += "</ul>";
					}
					var Tooltip = {
						text: this.sHtml,
						title: oIdObject.title,
						imageSrc: this.ratingIcon,
						state: this.state,
						busy: false
					};
					// this._oPopover.setBusy(false);
					this.getView().getModel("toolTipModel").setData(Tooltip);
					// oEvent.stopPropagation();
				}.bind(this),
				error: function () {
					sap.m.MessageBox.show("Error while retrieving case details");
				}
			});
		},

		// -------------------------------------------------------------------------------------------------------
		// --- click each item and direct to ---------------------------------------------------------------------
		// -------------------------------------------------------------------------------------------------------
		pressToDirect: function (oEvent) {
			var host = window.location.host;
			var sourceIC = "icp";
			if (host.search("dev") !== -1) {
				sourceIC = "icd";
			} else if (host.search("test") !== -1) {
				sourceIC = "ict";
			} else if (host.search("prod") !== -1){
				sourceIC = "icp";
			}
			//var oCaseId = oEvent.getSource().getBindingContext("TreeModel").getObject().id;
			// var tarId = oEvent.target.id;
			// var oCaseId = sap.ui.getCore().byId(tarId).getBindingContext("TreeModel").getObject().id;
			var oCaseId = oEvent.getSource().getBindingContext("TreeModel").getProperty().id;
			//var oCaseId = oEvent.getSource().getBindingContext("TreeModel").getObject().id;
			sap.m.URLHelper.redirect("https://" + sourceIC +
				".wdf.sap.corp/sap/bc/bsp/sap/crm_ui_start/default.htm?saprole=ZSU_DEFAULT&sap-language=EN&crm-object-type=" +
				"CRM_CMG&crm-object-action=B&crm-object-keyname=EXT_KEY&crm-object-value=" +
				oCaseId, true);
		},

		// -------------------------------------------------------------------------------------------------------
		// --- onmouseout event ----------------------------------------------------------------------------------
		// -------------------------------------------------------------------------------------------------------
		handlePopoverOut: function (oEvent) {
			if (jQuery(oEvent.target).hasClass("sapMSTIIcon sapUiIcon sapUiIconMirrorInRTL") === true) {
				this._oPopover.close();
			}
		},

		// -------------------------------------------------------------------------------------------------------
		// --- links ---------------------------------------------------------------------------------------------
		// -------------------------------------------------------------------------------------------------------
		customerView: function (oEvent) {
			sap.m.URLHelper.redirect("https://" 
				+ "fiorilaunchpad.sap.com/sites?hc_login#Help-Inbox&/create/ZINE/IMAS_SUD_MC/" 
				+ "Issue%20with%20'MCC%20Case%20Hierachy'/2//ICP/Issue%20Description%20and%20steps%20to%20reproduce%20this%20issue" 
				+ "//////01/01/////Business%20Applications%20(HR%2C%20Billing%2C%20Sales%2C%20Controlling%2C...)",
				true);
		},

		helpToDirect: function (oEvent) {
			sap.m.URLHelper.redirect("https://" + "go.sap.corp/case-hierarchy-app", true);
		},

		// -------------------------------------------------------------------------------------------------------
		// --- Collapse and Expand -------------------------------------------------------------------------------
		// -------------------------------------------------------------------------------------------------------
		onCollapseAllPress: function (oEvent) {
			var oTree = this.byId("Tree");
			oTree.collapseAll();
		},

		onExpandAllPress: function (oEvent) {
			var oTree = this.byId("Tree");
			oTree.expandToLevel(1000);
		}
	});
});