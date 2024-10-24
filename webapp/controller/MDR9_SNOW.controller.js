sap.ui.define([
	"corp/sap/mdrdashboards/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/FilterProcessor",
	"sap/ui/model/SorterProcessor",
	"corp/sap/mdrdashboards/model/formatterMDR9_SNOW",
	"corp/sap/mdrdashboards/model/MCCAuthHelper",
	"corp/sap/mdrdashboards/controls/TablePager",
	"corp/sap/mdrdashboards/controls/CustomPaginator",
	"corp/sap/mdrdashboards/HelpScreens/excel_download",
	"sap/m/MessageToast",
	"sap/base/Log",
	"sap/ui/Device",
	"corp/sap/mdrdashboards/libs/exp_pptx"

], function (BaseController, JSONModel, ODataModel, Filter, FilterOperator, FilterProcessor, 
	SorterProcessor, FormatterMDR9_SNOW, MCCAuthHelper, TablePager, CustomPaginator, excel_download,
	MessageToast, Log, Device, dummyPPT) {
	"use strict";

	return BaseController.extend("corp.sap.mdrdashboards.controller.MDR9_SNOW", {

		onInit: function () {
			this.source_IC = "icp";
			this.filter = "";
			this.URL = "";
			this._iRowHeight = 40;
			this.refreshInterval = 1800;
			this.flipInterval = 30;
			this.pauseFlip = false;
			this._realDataLength = {};
			this.getSourceICAddr();
			this.selectedYear = location.hostname;
			this.changePageTitle();
			this.results_xls = [];
			this.startTime = new Date();
			// Style sheet
			jQuery.sap.includeStyleSheet("css/style_mdr9.css", "stylemdr9");
			// Create correct path to images
			var oRootPath = jQuery.sap.getModulePath("corp.sap.mdrdashboards");
			var oImageModel = new sap.ui.model.json.JSONModel({
				path : oRootPath
			});
			this.setModel(oImageModel, "imageModel");
			// Router
			this.oRouter = this.getRouter();
			this.oRouter.attachRouteMatched(this.onRouteMatched, this);
			// For export
			this._selectedCaseData = {};
			this._selectedCaseDataParties = {};
			this._selectedCaseDataNotes = {};
			var sTheme = "blue";
			// Model
			this.oUIModel = new JSONModel({
				results_xls: {},
				viewCard: false,
				theme: sTheme,
				caseNumber: 0,
				redNumber: 0,
				yellowNumber: 0,
				sourceIC: this.source_IC,
				maskData: "NO",
				title: "",
				refreshTime: "00:00",
				pauseFlip: false,
				runTitle: false,
				startTime: this.startTime,
				endTime: 0,
				runtime: ""
			});
			this.getView().setModel(this.oUIModel, "UIModel");
			// Resize
			sap.ui.Device.resize.attachHandler(this.windowResize, this);
			// Mobile Usage Reporting: Version Distribution --> Counts Number of Devices
			try {
				var tracking = new GlobalITTracking("MDR Dashboards", "MDR9 - ServiceNow Cases – V1.1.0");
			} catch (e) {
				console.log("Error: " + e);
			}
			// Mobile Usage Reporting: Events --> Counts Calls of the Application
			sap.git.usage.Reporting.addEvent(this.getOwnerComponent(), "MDR9 - ServiceNow Cases – V1.1.0");
			this.createDownloadXLS();
			this.showBusyDialog();
		},
		
		formatterMDR9_SNOW: FormatterMDR9_SNOW,
		
		changePageTitle: function () { 
           	var newPageTitle = "MDR9_NOW - ServiceNow Cases"; 
           	document.title = newPageTitle; 
       	},		
	
		onRouteMatched: function (oEvent) {
			var sRouteName = oEvent.getParameter("name");
			this.readURL();
			this._customizeUI();
			if (sRouteName === "MDR9_NOW") {
				var svalue = this.filter;
				this.checkAuthorization(svalue);
			//	this.loadSnowCaseData(svalue); // --> Now in checkAuthorization !!				
				this.setRefreshTime();
				this._intervalTasks();
			}
		},

		_customizeUI: function () {
			this.oUIModel.setProperty("/theme", this.layout === "dark" ? "dark" : "blue");
			this.getView().byId("dashboardPage").addStyleClass(this.oUIModel.getProperty("/theme"));
			this.oUIModel.setProperty("/runTitle", this.run_title === "yes" ? true : false);
		},
		
		getSourceBCAddr: function () {
			var host = window.location.host;
			var sourceBC = "bcp";
			if ((host.search("dev-mallard") !== -1) || (host.search("mccdashboardrepository-dev") !== -1) || (host.search("port5000") !== -1)) {
				sourceBC = "bcd";
			} else if ((host.search("test-kinkajou") !== -1) || (host.search("sapit-home-test-004") !== -1) || (host.search("mccdashboardrepository-test") !== -1)) {
				sourceBC = "bct";
			} else if ((host.search("prod-kestrel") !== -1) || (host.search("sapit-home-prod-004") !== -1) || (host.search("mccdashboardrepository.cfapps") !== -1)){
				sourceBC = "bcp";
			}
			this.source_BC = sourceBC;
			return this.source_BC;
		},
		
		loadSnowCaseData: function (sValue) {
			this.showBusyDialog();
			var that = this;
			var filter = jQuery.sap.getUriParameters().get("filter");
			if (filter === null) {
			//	filter = "numberLIKE2020%5eORcorrelation_idLIKE2020";
				filter = "active_escalation.opened_at>0";
			}
			if (filter !== null) {
				var indexTitle = window.location.href.indexOf("title=");
				if (indexTitle === 0 || indexTitle < 0) {
					indexTitle = 10000;
				}
				for (var j = 0; j < filter.length; j++) {
					if (filter.indexOf("&now_test=yes") > -1 && filter.indexOf("&now_test=yes") < indexTitle) {
						filter = filter.replace("&now_test=yes", "");
					}
					if (filter.indexOf("^") > -1 && filter.indexOf("^") < indexTitle) {
						filter = filter.replace("^", "%5e");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {
					if (filter.indexOf(" and ") > -1 && filter.indexOf(" and ") < indexTitle) {
						filter = filter.replace(" and ", "%5e");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {
					if (filter.indexOf("'") > -1 && filter.indexOf("'") < indexTitle) {
						filter = filter.replace("'", "");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {
					if (filter.indexOf("%27") > -1 && filter.indexOf("%27") < indexTitle) {
						filter = filter.replace("%27", "");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {
					if (filter.indexOf("%20and%20") > -1 && filter.indexOf("%20and%20") < indexTitle) {
						filter = filter.replace("%20and%20", "%5e");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {	
					if (filter.indexOf(" or ") > -1 && filter.indexOf(" or ") < indexTitle) {
						filter = filter.replace(" or ", "%5eOR");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {
					if (filter.indexOf("%20or%20") > -1 && filter.indexOf("%20or%20") < indexTitle) {
						filter = filter.replace("%20or%20", "%5eOR");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {
					if (filter.indexOf(" eq ") > -1 && filter.indexOf(" eq ") < indexTitle) {
						filter = filter.replace(" eq ", "=");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {	
					if (filter.indexOf("%20eq%20") > -1 && filter.indexOf("%20eq%20") < indexTitle) {
						filter = filter.replace("%20eq%20", "=");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {
					if (filter.indexOf(" gt ") > -1 && filter.indexOf(" gt ") < indexTitle) {
						filter = filter.replace(" gt ", ">");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {	
					if (filter.indexOf("%20gt%20") > -1 && filter.indexOf("%20gt%20") < indexTitle) {
						filter = filter.replace("%20gt%20", ">");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {
					if (filter.indexOf(" ge ") > -1 && filter.indexOf(" ge ") < indexTitle) {
						filter = filter.replace(" ge ", ">=");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {	
					if (filter.indexOf("%20ge%20") > -1 && filter.indexOf("%20ge%20") < indexTitle) {
						filter = filter.replace("%20ge%20", ">=");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {	
					if (filter.indexOf("(") > -1 && filter.indexOf("(") < indexTitle) {
						filter = filter.replace("(", "");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {
					if (filter.indexOf(" lt ") > -1 && filter.indexOf(" lt ") < indexTitle) {
						filter = filter.replace(" lt ", "<");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {	
					if (filter.indexOf("%20lt%20") > -1 && filter.indexOf("%20lt%20") < indexTitle) {
						filter = filter.replace("%20lt%20", "<");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {
					if (filter.indexOf(" le ") > -1 && filter.indexOf(" le ") < indexTitle) {
						filter = filter.replace(" le ", "<=");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {	
					if (filter.indexOf("%20le%20") > -1 && filter.indexOf("%20le%20") < indexTitle) {
						filter = filter.replace("%20le%20", "<=");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {	
					if (filter.indexOf("(") > -1 && filter.indexOf("(") < indexTitle) {
						filter = filter.replace("(", "");
					} else {
						break;
					}
				}
				for (j = 0; j < filter.length; j++) {	
					if (filter.indexOf(")") > -1 && filter.indexOf(")") < indexTitle) {
						filter = filter.replace(")", "");
					} else {
						break;
					}
				}
			}
			var sUrl;
			if (jQuery.sap.getUriParameters().get("dispEscRecords") !== null) {
				this.dispEscRecords = jQuery.sap.getUriParameters().get("dispEscRecords");
				if (this.dispEscRecords === "yes") {
					if (filter === null || filter === "active_escalation.opened_at>0") {
						filter = "state=101%5E" 
							+ "assignment_group=55b8cbc61b217850614e744c8b4bcb18%5EORassignment_group=e782a6a51b38081020c8fddacd4bcb44%5E"
							+ "u_request_reason=8%5EORu_request_reason=7%5EORu_request_reason=9%5E"
							+ "u_escalation_type=0";
					}	
				//	sUrl = "/servicenow/api/now/table/sn_customerservice_escalation?sysparm_query=" + filter; // All fields...
				//	sUrl = "/apim/hcsm/api/now/table/sn_customerservice_escalation?sysparm_query=" + filter; // API Management
					sUrl = sap.ui.require.toUrl("corp/sap/mdrdashboards") + "/apim/hcsm/api/now/table/sn_customerservice_escalation?sysparm_query=" + filter; // API Management
				}	
			} else {
			//	sUrl = "/servicenow/api/now/table/sn_customerservice_case?sysparm_query=" 
			//	sUrl = "/apim/hcsm/api/now/table/sn_customerservice_case?sysparm_query=" 
				sUrl = sap.ui.require.toUrl("corp/sap/mdrdashboards") + "/apim/hcsm/api/now/table/sn_customerservice_case?sysparm_query="
					+ filter
					+ "&sysparm_fields="
					+ "account.country, account.name, account.number, action_status, active_escalation, active_escalation.opened_at, " 
					+ "active_escalation.u_request_reason, active_escalation.state, active_escalation.u_escalation_type, active_escalation.short_description,"
					+ "assigned_to.name, assignment_group.name, "
					+ "business_impact, closed_at, contact_name, description, parent, parent.number, number, opened_at, priority, resolution_code, "
					+ "resolved_at, resolved_by, short_description, sold_product.name, sold_product.number, state, sys_id, u_app_component.u_name, "
					+ "u_app_component.u_short_description, u_case_number, u_contract_type_list, u_next_action_reason, u_reason, u_responsible_party, "
					+ "u_install_base_item.u_sid, u_install_base_item.number, u_install_base_item.u_environment, u_last_user_updated_on, u_next_action_due";
			}	
			// Source IC* - Only needed to identify landscape type (DEV, TEST, PROD)
			var host = window.location.host;
			var pos = host.search("br339jmc4c");
			if (pos > 0) {
				this.source_IC = "icd";
			} else {	
				pos = host.search("sapitcloudt");
				if (pos > 0) {
					this.source_IC = "ict";
				} else {	
					pos = host.search("sapitcloud");
					if (pos > 0) {
						this.source_IC = "icp";
					}	
				}
			}
			// Call of API
			$.ajax({
				method: "GET",
				contentType: "application/json",
				url: sUrl,
				headers: {
					'AppIdentifier': 'FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ', //API Management: ID for Workbench
					'mccprofile': 'MDR9_NOW'
				},
				success: function (oData) {
					// Continue usual processing
					var data = {};
					data.results = [];
					oData.result.forEach(function (x) {
						data.results.push({
							"account_country": x["account.country"],
							"account_name": x["account.name"],
							"account_number": x["account.number"],
							"action_status": x.action_status,
							"active_escalation": x["active_escalation"],
							"active_escalation_opened_at": x["active_escalation.opened_at"],
							"active_escalation_state": x["active_escalation.state"],
							"active_escalation_type": x["active_escalation.u_escalation_type"],
							"active_escalation_reason": x["active_escalation.u_request_reason"],
							"active_escalation_short_desc": x["active_escalation.short_description"],
							"assigned_to_name": x["assigned_to.name"],
							"assignment_group_name": x["assignment_group.name"],
							"business_impact": x.business_impact,
							"closed_at": x.closed_at,
							"contact_name": x["contact.name"],
							"description": x.description,
							"environment": x["u_install_base_item.u_environment"],
							"major_case_state": x.major_case_state,
							"number": x.number,
							"opened_at": x.opened_at,
							"parent": x.parent,
							"parent_number": x["parent.number"],
							"priority": x.priority,
							"resolution_code": x.resolution_code,
							"resolved_at": x.resolved_at,
							"resolved_by": x.resolved_by,
							"short_description": x.short_description,
							"state": x.state,
							"sys_id": x.sys_id,
							"u_app_component": x["u_app_component.u_name"],
							"u_app_component_desc": x["u_app_component.u_short_description"],
							"u_case_number": x.u_case_number,
							"u_contract_type_list": x.u_contract_type_list,
							"u_install_base_item_number": x["u_install_base_item.number"],
							"u_install_base_item_u_sid": x["u_install_base_item.u_sid"],
							"u_last_user_updated_by": x.u_last_user_updated_by,
							"u_last_user_updated_on": x.u_last_user_updated_on,
							"u_next_action_due": x.u_next_action_due,
							"u_next_action_reason": x.u_next_action_reason,
							"u_reason": x.u_reason,
							"u_responsible_party": x.u_responsible_party,
							"u_sold_product_name": x["sold_product.name"],
							"u_sold_product_number": x["sold_product.number"]
						});
					});
					var myPromise = new Promise(function(myResolve) {
						that._processResult(data.results, that.results_xls);
						myResolve("OK");
					});	
					myPromise.then(
						function(value) {
							data.results = that._sortByDueDate(data.results);
							data.results = that._sortByPriority(data.results);
							var allCaseModel = new JSONModel();
							allCaseModel.setSizeLimit(data.results.length);
							if (that.noAuth !== "x") {
								if (data.results.length === 0) {
									MessageToast.show("Data Collection completed, but no Data in Selection", {
										width: "360px",
										duration: 7000
									});
									that.hideBusyDialog();
								}
							}
							allCaseModel.setData(data);
							that.setModel(allCaseModel, "allPageCases");
							that.initPagination();
						}
					);
				}.bind(this),
				error: function (error) {
					var index1 = error.responseText.indexOf("value");
					var index2 = error.responseText.indexOf("}");
					var errortext = "";
					if (index1 > -1) {
						errortext = "ServiceNow API unavailable - " + error.message + ". " + error.responseText.slice(index1 + 8, index2 - 1);
					} else {
						errortext = "ServiceNow API unavailable - " + error.message + ". " + error.responseText;
					}
					MessageToast.show(errortext, {
						duration: 20000,
						width: "40em"
					});
					this.hideBusyDialog();
				}.bind(this)
			});
		},
	
		_processResult: function (results, results_xls) {
			var that = this;
			if (jQuery.sap.getUriParameters().get("TimesVisible") !== null) {
				this.timesVisible = jQuery.sap.getUriParameters().get("TimesVisible");
			} else {
				this.timesVisible = "No";
			}
			var length = results.length;
			var nEsc1 = 0;
			var nEsc2 = 0;
			var nRed = 0;
			var nYellow = 0;
			var nGreen1 = 0;
			var nGreen2 = 0;
			var msCustomer = 0;
			var msAgent = 0;
			var sysidString = "";
			var timeWithCustomer = "";
			var timeWithSAP = "";
			var sys_id = "";
			for (var i = 0; i < length; i++) {
				// Rating
				if (results[i].priority === "" ) {
					results[i].priority = "5";
					results[i].PrioTxt = "None";
				} else if (results[i].priority === "1" ) {
					results[i].PrioTxt = "Very High - Error";
					nRed++;
				} else if (results[i].priority === "2") {
					results[i].PrioTxt = "High - Warning";
					nYellow++;
				} else if (results[i].priority === "3") {
					results[i].PrioTxt = "Medium";
					nGreen1++;
				} else if (results[i].priority === "4") {
					results[i].PrioTxt = "Low";
					nGreen2++;	
				} else {
					results[i].priority = "5";
					results[i].PrioTxt = "None";
				}
				// Customer
				if (results[i].account_name === "") {
					results[i].account_name = "?";
				}
				// Contract type
				if (results[i].u_contract_type_list === "") {
					results[i].u_contract_type_list = "N/A";
				}
				// Country
				if (results[i].account_country === "") {
					results[i].account_country = "Not specified";
				}
				// System
				if (results[i].u_install_base_item_sid === "") {
					results[i].u_install_base_item_sid = "-";
				}
				// Installation number
				if (results[i].u_install_base_item_number === "" || 
					results[i].u_install_base_item_number === undefined || 
					results[i].u_install_base_item_number === null || 
					results[i].u_install_base_item_number === "000000000000000") {
					results[i].installation_number = "-";
				} else {
					if (results[i].u_install_base_item_number.length > 0) {
						if (results[i].u_install_base_item_number.length !== 10) {
							results[i].installation_number = results[i].u_install_base_item_number.slice(8, results[i].u_install_base_item_number.length);
						} else {
							results[i].installation_number = results[i].u_install_base_item_number;
						}	
					}
				}
				// Product
				if (results[i].product === "" || results[i].product === undefined) {
					results[i].product = "-";
				} else {
					var test = "";
				}
				// Description and Business Impact
				var k = 0;
				for (k = 0; k < 2; k++) {
					var text = "";
					if (k === 0) {
						text = results[i].description;
					} else {
						text = results[i].business_impact;
					}
					if (text === "" || text === undefined) {
						text = "-";
					} else {
						var j = 0;
						for (j = 0; j < text.length; j++) {
							text = text.replace("<p>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("</p>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("<html>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("</html>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("<head>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("</head>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("<body>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("</body>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("<div>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("</div>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("<br>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("</br>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("<br />", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("</span>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("<strong>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("</strong>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("<ul>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("</ul>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("<ol>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("</ol>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("<u>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("</u>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("<li>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("</li>", "");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("&amp", " ");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("&#39;", "'");
						}
						for (j = 0; j < text.length; j++) {
							text = text.replace("&#43;", "+");
						}
						for (j = 0; j < text.length; j++) {
							var index1 = text.indexOf("<span");
							var index2 = text.indexOf('">');
							var sliced = text.slice(index1, index2 + 2);
							text = text.replace(sliced, "");
						}
						for (j = 0; j < text.length; j++) {
							index1 = text.indexOf("<html");
							index2 = text.indexOf('">');
							sliced = text.slice(index1, index2 + 2);
							text = text.replace(sliced, "");
						}
						for (j = 0; j < text.length; j++) {
							index1 = text.indexOf("<a href");
							index2 = text.indexOf('">');
							sliced = text.slice(index1, index2 + 2);
							text = text.replace(sliced, "");
						}
						for (j = 0; j < text.length; j++) {
							index1 = text.indexOf("<img");
							index2 = text.indexOf('">');
							sliced = text.slice(index1, index2 + 2);
							text = text.replace(sliced, "");
						}
						for (j = 0; j < text.length; j++) {
							index1 = text.indexOf("<p style");
							index2 = text.indexOf('">');
							sliced = text.slice(index1, index2 + 2);
							text = text.replace(sliced, "");
						}
						for (j = 0; j < text.length; j++) {
							index1 = text.indexOf("<ul type");
							index2 = text.indexOf('">');
							sliced = text.slice(index1, index2 + 2);
							text = text.replace(sliced, "");
						}
						for (j = 0; j < text.length; j++) {
							index1 = text.indexOf("<table width");
							index2 = text.indexOf('">');
							sliced = text.slice(index1, index2 + 2);
							text = text.replace(sliced, "");
						}
					}
					if (text === "" || text.length < 2 ) {
						text = "-";
					}					
					if (k === 0) {
						results[i].description = text;
					} else {
						results[i].business_impact = text;
					}
				}
				// Case active ?
				if (results[i].active == "true") {
					results[i].Active = "X";
				} else {
					results[i].Active = "";
				}
				// Escalation - 1
				if (results[i].active_escalation_state === "101") {
					nEsc1++;
				}
				if (results[i].active_escalation_state === "100") {
					nEsc2++;
				}
				// Escalation - 2
				if (results[i].active_escalation_opened_at === "") {
					results[i].active_escalation_opened_at = "-";
				} else {
					if (results[i].active_escalation_opened_at !== undefined) {
						var year = results[i].active_escalation_opened_at.slice(0, 4);
						var month = results[i].active_escalation_opened_at.slice(5, 7);
						var day = results[i].active_escalation_opened_at.slice(8, 10);
						var remain = results[i].active_escalation_opened_at.slice(10, results[i].active_escalation_opened_at.length);
						results[i].active_escalation_opened_at = day + "-" + month + "-" + year + remain;
					}
				}
				// Escalation - 3
				var status = "";
				switch (results[i].active_escalation_state) {
					case '':
						status = "-";
						break;
					case '100':
						status = "Requested";
						break;
					case '101':
						status = "Escalated";
						break;
					default:
						status = results[i].active_escalation_state;
				}
				results[i].active_escalation_state_txt = status;
				// Escalation - 4
				if (results[i].u_escalation_reason === "") {
					results[i].u_escalation_reason = "N/A";
				}
				// Escalation - 5
				var type = "";
				if (results[i].active_escalation_type) {
					switch (results[i].active_escalation_type) {
						case "undefined":
							type = "-";
							break;
						case "2":
							type = "Critical Customer Situation";
							break;	
						case "3":
							type = "Critical Incident Management";
							break;
						default:
							type = results[i].active_escalation_type.value;
					}
				}
				if (results[i].active_escalation_type === "") {
					results[i].active_escalation_type_txt = "N/A";
				} else {
					results[i].active_escalation_type_txt = type;
				}
				// Opened at date
				if (results[i].opened_at === "") {
					results[i].opened_at = "-";
				}
				var	year = results[i].opened_at.slice(0,4);
				var	monthtmp = results[i].opened_at.slice(5,7);
				var	month = "";
				var	day = results[i].opened_at.slice(8,10);
				var	fullDate = "";
				switch (monthtmp) {
					case '01':
						month = "Jan";
						break;
					case '02':
						month = "Feb";
						break;
					case '03':
						month = "Mar";
						break;
					case '04':
						month = "Apr";
						break;
					case '05':
						month = "May";
						break;
					case '06':
						month = "Jun";
						break;
					case '07':
						month = "Jul";
						break;
					case '08':
						month = "Aug";
						break;
					case '09':
						month = "Sep";
						break;
					case '10':
						month = "Oct";
						break;
					case '11':
						month = "Nov";
						break;
					case '12':
						month = "Dec";
					break;
				}
				results[i].opened_at_string = fullDate = day + " " + month + " " + year
				// Next action due date
				if (results[i].u_next_action_due !== "" && results[i].u_next_action_due !== undefined) {
					year = results[i].u_next_action_due.slice(0,4);
					monthtmp = results[i].u_next_action_due.slice(5,7);
					month = "";
					day = results[i].u_next_action_due.slice(8,10);
					fullDate = "";
					// Convert month
					switch (monthtmp) {
						case '01':
							month = "Jan";
							break;
						case '02':
							month = "Feb";
							break;
						case '03':
							month = "Mar";
							break;
						case '04':
							month = "Apr";
							break;
						case '05':
							month = "May";
							break;
						case '06':
							month = "Jun";
							break;
						case '07':
							month = "Jul";
							break;
						case '08':
							month = "Aug";
							break;
						case '09':
							month = "Sep";
							break;
						case '10':
							month = "Oct";
							break;
						case '11':
							month = "Nov";
							break;
						case '12':
							month = "Dec";
						break;
					}
					results[i].u_next_action_due_string = day + " " + month + " " + year;
				}
				if (results[i].u_next_action_due_string === "" || results[i].u_next_action_due_string === undefined ) {
					results[i].u_next_action_due_string = "-";
				}
				// Close notes
				if (results[i].close_notes === "") {
					results[i].close_notes = "-";
				}
				// Case Component
				if (results[i].u_app_component === "") {
					results[i].u_app_component = "N/A";
				}
				// User assignment
				if (results[i].assigned_to_name === "") {
					results[i].assigned_to_name = "N/A";
				}
				// Contact
				if (results[i].contact_name === "") {
					results[i].contact_name = "N/A";
				}	
				// Status
				// Translate status code
				var status = "";
				switch (results[i].state) {
					case '':
						status = "-";
						break;
					case '1':
						status = "New";
						break;
					case '3':
						status = "Closed";
						break;
					case '6':
						status = "Resolved";
						break;
					case '10':
						status = "In Progress";
						break;
					case '18':
						status = "Awaiting Info";
						break;
					default:
						status = results[i].state;
				}
				results[i].status = status;
				// Action Status
				var actionStatusText = "";
				switch (results[i].action_status) {
					case '':
						actionStatusText = "-";
						break;
					case '-10':
						actionStatusText = "Awaiting Requester";
						break;	
					case '-20':
						actionStatusText = "Awaiting Incident";
						break;
					case '-30':
						actionStatusText = "Awaiting Problem";
						break;	
					case '-40':
						actionStatusText = "Awaiting Change";
						break;
					case '-50':
						actionStatusText = "In Progress by Partner";
						break;
					case '-60':
						actionStatusText = "Awaiting Requester by Partner";
						break;
					case '-80':
						actionStatusText = "Awaiting Service Request";
						break;	
					case '-90':
						actionStatusText = "Pending Release / Hotfix";
						break;	
					case '-100':
						actionStatusText = "Pending Permanent Fix";
						break;
					case '-110':
						actionStatusText = "Cancelled";
						break;	
					case '-130':
						actionStatusText = "Solution Confirmed";
						break;	
					case '-140':
						actionStatusText = "Auto Closure";
						break;		
					default:
						actionStatusText = results[i].action_status;
				}
				results[i].actionStatusText = actionStatusText;
				// State / Action Status --> For sorting
				results[i].stateSort = results[i].status + results[i].actionStatusText;
				// Times 
				if (this.timesVisible.toLowerCase() === "yes") {
				//	var sUrl = "/servicenow/api/now/table/metric_instance?sysparm_query=id=" + results[i].sys_id;
					var sUrl = "/apim/hcsm/api/now/table/metric_instance?sysparm_query=id=" + results[i].sys_id;
					var myPromise = new Promise(function(myResolve, myReject) {
						// Call of API
						that.showBusyDialog();
						$.ajax({
							method: "GET",
							contentType: "application/json",
							url: sUrl,
							headers: {
								'AppIdentifier': 'FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ', //API Management: ID for Workbench
								'mccprofile': 'MDR9_NOW_ReadTimes'
							},
							success: function (oData) {
								if (oData.result) {
									msAgent = 0;
									msCustomer = 0;
									for (var j = 0; j < oData.result.length; j++) {
										var dateAgent = "";
										var dateCustomer = "";
										if (oData.result[j].field === "u_timeline_agent_customer") {
											if (oData.result[j].value === false || oData.result[j].value === "false") {
												if (oData.result[j].duration !== "") {
													dateAgent = new Date(oData.result[j].duration);
													msAgent = msAgent + dateAgent.getTime();
												}
											} else if (oData.result[j].value === true || oData.result[j].value === "true") {
												if (oData.result[j].duration !== "") {
													dateCustomer = new Date(oData.result[j].duration);
													msCustomer = msCustomer + dateCustomer.getTime();
												}
											}
										}
										sys_id = oData.result[j].id.value;
									}
									myResolve("OK");
								} else {
									myReject("Not ok");
								}
							},
							error: function(error) {
								myReject("Not ok");
							}
						});	
					});
					var counter = 0;
					myPromise.then(
						function(value) {
							counter++;
							for (var i = 0; i < length; i++) {
								if (results[i].sys_id === sys_id) {
									var d, h, m, s;
									var ms = 0;
									var date = new Date();
									var offset = date.getTimezoneOffset();
									// Correct incorrect maintenance in case
									if (msAgent < 0) {
										msAgent = 0;
									}
									if (msCustomer < 0) {
										msCustomer = 0;
									}
									// Translate milliseconds into readable format
									for (var n = 0; n < 2; n++) {
						 				if (n === 0) {
						 					ms = msAgent;
						 				} else {
						 					ms = msCustomer;
						 				}
						 				s = Math.floor(ms / 1000); 
										m = Math.floor(s / 60); 
										m = m - offset;
										s = s % 60; ;
										h = Math.floor(m / 60); 
										m = m % 60; 
										d = Math.floor(h / 24); 
										h = h % 24; 
										if (n === 0) {
											if (ms === 0) {
												results[i].timeAgent = "0 Min.";
											} else {
							 					results[i].timeAgent = d + " Days, " + h + " Hours, " + m + " Min.";
											}
						 				} else {
						 					if (ms === 0) {
												results[i].timeCustomer = "0 Min.";
											} else {
												results[i].timeCustomer = d + " Days, " + h + " Hours, " + m + " Min."; 
											}	
						 				}
						 			}
				 					results[i].timeAgentMS = msAgent;
				 					results[i].timeCustomerMS = msCustomer;
									// Update dashboard
				 					var allCaseModel = new JSONModel();
									allCaseModel.setSizeLimit(results.length);
									var data = {};
									data.results = results;
				 					allCaseModel.setData(data);
				 					if (counter === length - 1) {
										that.setModel(allCaseModel, "allPageCases");
										that.getModel("allPageCases").updateBindings(true);
										that.initPagination();
										that.hideBusyDialog();
										that.endTime = new Date();
										var runtime = that.endTime - that.startTime;
										runtime = runtime / 1000;
										runtime = runtime.toFixed(0);
										that.oUIModel.setProperty("/runtime", runtime);
									}
								}
							}
						}
					);
				} else {
					// Runtime
					this.endTime = new Date();
					var runtime = this.endTime - this.startTime;
					runtime = runtime / 1000;
					runtime = runtime.toFixed(0);
					this.oUIModel.setProperty("/runtime", runtime);
					this.hideBusyDialog();
				}
				// Major Case
				if (results[i].parent !== "") {
					results[i].parent = "X";
				}
				// Active System
					results[i].u_responsible_party = results[i].u_responsible_party.toUpperCase();
				// ServiceNow Case ID
				if (results[i].number !== undefined) {
					var caseNumberLength = results[i].number.length;
					if (caseNumberLength !== 16) {
						// Case ID corrupt...
						var caseNumberCorr = parseInt(results[i].number.slice(2,12));
						var date = results[i].opened_at;
						var year = "";
						if (date === null || date === "") {
							year = "-";
						} else {
							year = date.slice(0,4);
						}	
						results[i].caseID = caseNumberCorr + " / " + year;
					} else {	
						// Case ID ok...
						var caseComplete = results[i].number.slice(2,16);
						var caseYear = caseComplete.slice(0,4);
						var caseNumber = parseInt(caseComplete.slice(5,16));
						results[i].caseID = caseNumber + " / " + caseYear;
					}
				} else {
					results[i].number = "";
					results[i].caseID = "-";
				}
				if (this.source_IC === "icd") {
				//	results[i].url = "https://sapextdev.service-now.com/now/workspace/agent/record/sn_customerservice_case/" + results[i].sys_id;
					results[i].url = "https://dev.itsm.services.sap/now/cwf/agent/record/sn_customerservice_case/" + results[i].sys_id;
				} else if (this.source_IC === "ict") {
				//	results[i].url = "https://sapexttest.service-now.com/now/workspace/agent/record/sn_customerservice_case/" + results[i].sys_id;
					results[i].url = "https://test.itsm.services.sap/now/cwf/agent/record/sn_customerservice_case/" + results[i].sys_id;
				} else if (this.source_IC === "icp") {
				//	results[i].url = "https://itsm.services.sap/nav_to.do?uri=%2Fsn_customerservice_case.do%3Fsysparm_query%3Dcorrelation_id%3D" + results[i].correlation_id;
				//	results[i].url = "https://itsm.services.sap/workspace/record/sn_customerservice_case/" + results[i].sys_id;
					results[i].url = "https://itsm.services.sap/now/cwf/agent/record/sn_customerservice_case/" + results[i].sys_id;
				}	
				// SAP Case ID
				if (results[i].u_case_number !== undefined) {
					var nan = results[i].u_case_number.indexOf("NaN");
					var number = "";
					var year = "";
					if (nan > 0) {
						results[i].SAPCaseNumber = "-";
					} else {
						// SAP Case ID - Display
						var pos = results[i].u_case_number.indexOf("(");
						results[i].SAPCaseNumber = results[i].u_case_number.slice(0, pos - 1);
						pos = results[i].SAPCaseNumber.indexOf("/");
						number = results[i].SAPCaseNumber.slice(0, pos);
						year = results[i].SAPCaseNumber.slice(pos + 1, results[i].SAPCaseNumber.length);
						results[i].SAPCaseNumber = number + " / " + year;
						// SAP Case ID - URL
						var sourceBC = this.getSourceBCAddr();
						pos = results[i].u_case_number.indexOf("(");
						results[i].pointer = results[i].u_case_number.slice(pos + 1, results[i].u_case_number.length - 1);
						if (sourceBC === "bcd") {
							results[i].urlSAPCase = "https://bcdmain.wdf.sap.corp/sap/support/message/" + results[i].pointer;
						} else if (sourceBC === "bct") {
							results[i].urlSAPCase = "https://qa-support.wdf.sap.corp/sap/support/message/" + results[i].pointer;
						} else {	
							results[i].urlSAPCase = "https://bcp.wdf.sap.corp/sap/support/message/" + results[i].pointer;
						}
					}
				} else {
					results[i].SAPCaseNumber = "-";
					results[i].urlBC = "";
				}
				// Collect data for XML sheet
				results_xls[i] = {};
				results_xls[i].Priority = results[i].priority;
				results_xls[i].Active = results[i].Active;
				results_xls[i].EscalationOpenedAt = results[i].active_escalation_opened_at;
				results_xls[i].EscalationState = results[i].active_escalation_state_txt;
				results_xls[i].EscalationType = results[i].active_escalation_type_txt;
				results_xls[i].EscalationReason = results[i].u_escalation_reason;
				results_xls[i].AccountName = results[i].account_name;
				results_xls[i].AccountNumber = results[i].account_number;
				results_xls[i].ContractType = results[i].u_contract_type_list;
				results_xls[i].Country = results[i].account_country;
				results_xls[i].System = results[i].u_sold_product_name;
				results_xls[i].SystemID = results[i].u_install_base_item_u_sid;
				results_xls[i].InstNo = results[i].u_install_base_item_number;
				results_xls[i].CaseDescription = results[i].description;
				results_xls[i].BusinessImpact = results[i].business_impact;
				results_xls[i].OpenedAt = results[i].opened_at;
				results_xls[i].LastUpdate = results[i].u_last_user_updated_on;
				results_xls[i].CaseState = results[i].state;
				results_xls[i].ActionStatus = results[i].action_status;
				results_xls[i].NextActionDue = results[i].u_next_action_due;
				results_xls[i].NextActionReason = results[i].u_next_action_reason;
				results_xls[i].CaseComp = results[i].u_app_component;
				results_xls[i].CaseCompDesc = results[i].u_app_component_desc;
				results_xls[i].CaseAssignedTo = results[i].assigned_to_name;
				results_xls[i].GroupAssignment = results[i].assignment_group_name;
				results_xls[i].MajorCase = results[i].parent;
				results_xls[i].CaseID = results[i].u_case_number;
				results_xls[i].SAPCaseNumber = results[i].top_issue_id;
				results_xls[i].Link = results[i].url;                         
			}
			// Fill UI parameters
			this.oUIModel.setProperty("/allNumber", length);
			this.oUIModel.setProperty("/EscNumber1", nEsc1);
			this.oUIModel.setProperty("/EscNumber2", nEsc2);
			this.oUIModel.setProperty("/VHNumber", nRed);
			this.oUIModel.setProperty("/HNumber", nYellow);
			this.oUIModel.setProperty("/MNumber", nGreen1);
			this.oUIModel.setProperty("/LNumber", nGreen2);
			this.oUIModel.setProperty("/runtime", runtime);
		},
		
		readURL: function () {
			// Test
			var href = window.location.href; // returns the href (URL) of the current page
			var host = window.location.hostname; // returns the domain name of the web host
			var path = window.location.pathname; // returns the path and filename of the current page
			var prot = window.location.protocol; // returns protocol
			var port = window.location.port; // returns port
			// Entire URL
			var totalURL = window.location.href;
			var pos = window.location.href.lastIndexOf("#");
			var headURL = totalURL.slice(0, pos);
			this.URL = headURL;
			// Layout
			if (jQuery.sap.getUriParameters().get("layout") !== null) {
				this.layout = jQuery.sap.getUriParameters().get("layout");
			} else {
				this.layout = "blue";
			}
			// Mask data
			if (jQuery.sap.getUriParameters().get("MaskData") !== null) {
				this.maskdata = jQuery.sap.getUriParameters().get("MaskData").toUpperCase();
			} else {
				this.maskdata = "NO";
			}
			this.oUIModel.setProperty("/MaskData", this.maskdata);
			// Title
			if (jQuery.sap.getUriParameters().get("title") == null) {
				this.title = "MDR9_NOW - ServiceNow Cases";
				this.oUIModel.setProperty("/title", "Incident List");
			} else {
				this.title = jQuery.sap.getUriParameters().get("title");
				this.oUIModel.setProperty("/title", this.title);
			}
			if (jQuery.sap.getUriParameters().get("run_title") !== null) {
				this.run_title = jQuery.sap.getUriParameters().get("run_title");
			}	
			// Filter
			this.filter = jQuery.sap.getUriParameters().get("filter");
			if (this.filter === null) {
				this.filter = "";
			}
			if (this.filter === "") {
				this.filter = "priority=2";
			}
			// Other parameters
			if (jQuery.sap.getUriParameters().get("refreshInterval") !== null) {
				this.refreshInterval = 60 * jQuery.sap.getUriParameters().get("refreshInterval");
			}	
			if (jQuery.sap.getUriParameters().get("flipInterval") !== null) {
				this.flipInterval = jQuery.sap.getUriParameters().get("flipInterval");
			}	
			/// Test ///////
			if (jQuery.sap.getUriParameters().get("da_test") !== null) {
				this.da_test = jQuery.sap.getUriParameters().get("da_test");	
			}	
		},

		checkAuthorization: function (svalue) {
			var that = this;
				MCCAuthHelper.authorize()
				.done(function () {
					that.hideBusyDialog();
					that.loadSnowCaseData(svalue);
				})
				.fail(function (error) {
					// Handle authentication error   
					sap.m.MessageToast.show("Authorization for ServiceNow failed.");
					that.hideBusyDialog();
				});
		},
		
		/*
		checkAuthorization: function (svalue) {
			// Authorization checks:
			// 1. ??? - To be done!
			// 2. XMLHttpRequest.responseText --> General authorization
			var message = "";
			var that = this;
			this.noAuth = "";
			// Collect authorization
			var requestURL_Authorization = "/" 
				+ this.source_IC 
				+ "/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/AuthorizationCheckSet";
			jQuery.ajax({
				async:  false,
				url:  requestURL_Authorization,
				type: "get",
				dataType: "json",
				success: function (data) {
					var jsonData = data.d.results;
					console.log("Authorization Check Results:");
					for (var i = 0; i < jsonData.length; i++) {
						console.log(jsonData[i].authorization_obect_name + ": " + jsonData[i].authorzied);
					}
					that.loadSnowCaseData(svalue)
				}.bind(that),
				error: function (XMLHttpRequest, textStatus, errorThrown) {
					//-----------------------------------------
					// No Authorizations
					//-----------------------------------------
					if (XMLHttpRequest.responseText && 
					   (XMLHttpRequest.responseText.indexOf("No authorization") > 0 ||
						XMLHttpRequest.responseText.indexOf("authorization") > 0)) {
						this.noAuth = "x";
						that.message = "No authorization to display requested data!" 
							+ "\n  " 
							+ "\n For how to get additional authorization please check the following document:"
							+ "\n https://go.sap.corp/MCC-ICP-Profiles"
							+ "\n"
							+ "\n You can directly access this document via button 'OK'"
							+ "\n ";
						MessageBox.show(
							that.message, {
								icon: MessageBox.Icon.ERROR,
								title: "Authorization Check",
								actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CLOSE],
								emphasizedAction: sap.m.MessageBox.Action.OK,
								onClose: function (oAction) {
									if (oAction === "OK") {
										window.open("https://go.sap.corp/MCC-ICP-Profiles");
									}
								}
							}
						);
						that.hideBusyDialog();
						that.loadSnowCaseData(svalue)
					} else {
						that.hideBusyDialog();
						that.loadSnowCaseData(svalue)
					}
				}.bind(that),
				complete : function (){
				}
			});
		},		
		*/
		
		_getPagerHeight: function () {
			// pager height / footer
			var oTable = this.getView().byId("caseTable");
			var oFooter = oTable.getFooter();
			if (!oFooter) {
				return 77;
			}
			var iFooterHeight = oFooter.$().parent().height();
			Log.debug("iFooterHeight=", iFooterHeight);
			return iFooterHeight > 0 ? iFooterHeight : 77;
		},
		
		_getHeaderHeight: function () {
			var sTableId = this.getView().byId("caseTable").getId();
			var offsetOfHeader = jQuery("#" + sTableId + "-tableCCnt").offset();
			var iHeaderHeight = offsetOfHeader && offsetOfHeader.top;
			Log.debug("iHeaderHeight=", iHeaderHeight);
			return iHeaderHeight > 0 ? iHeaderHeight : (48 + 64 + 60);
		},
		
		calcPagination: function () {
			var totalRows = this.getFilteredCases().length;
			var pagerHeight = this._getPagerHeight();
			var headerHeight = this._getHeaderHeight();
			var rowHeight = this._iRowHeight;
			var sizeHeightNew = document.documentElement.clientHeight - pagerHeight;
			var iNumPerPage = Math.floor((sizeHeightNew - headerHeight) / rowHeight);
			this.oUIModel.setProperty("/numPerPage", iNumPerPage);
			this.oUIModel.setProperty("/currentPage", 1);
			this.oUIModel.setProperty("/numberOfPages", Math.ceil(totalRows / iNumPerPage));
		},
		
		reCalcPaginationByRealRowHeight: function () {
			var iRealRowHeight = this._getRealTableRowHeight();
			Log.debug("in reCalcPagination 1 iRealRowHeight=" + iRealRowHeight);
			if (iRealRowHeight && iRealRowHeight === this._iRowHeight) {
				return;
			}
			Log.debug("in reCalcPagination 2 iRealRowHeight=" + iRealRowHeight);
			this._iRowHeight = iRealRowHeight;
			this.calcPagination();
			this.updateOnePageDataToTable(1);
			this.resetPagination();
		},
		
		_getRealTableRowHeight: function () {
			var oTable = this.getView().byId("caseTable");
			var aRows = oTable.getRows();
			if (aRows && aRows.length > 0) {
				var iHeight = aRows[0].$().height();
				if (iHeight != null && iHeight > 0) {
					return iHeight;
				}
			}
			return this._iRowHeight;
		},
		
		initPagination: function () {
			this.calcPagination();
			this.updateOnePageDataToTable(1);
			var oTable = this.getView().byId("caseTable");
			if (!this.oPaginator) {
				var oPaginator = new CustomPaginator("table-paginator-MDR9_NOW", {
					currentPage: this.oUIModel.getProperty("/currentPage"),
					numberOfPages: this.oUIModel.getProperty("/numberOfPages"),
					page: function (oEvent) {
						var iCurrPage = oPaginator.getCurrentPage();
						this.updateOnePageDataToTable(iCurrPage);
					}.bind(this)
				});
				this.oPaginator = oPaginator;
				oTable.setFooter(this.oPaginator);
			}
			Log.debug("In initPagination: this._iRowHeight=", this._iRowHeight);
			oTable.setRowHeight(this._iRowHeight);
			setTimeout(function () {
				this.reCalcPaginationByRealRowHeight();
			}.bind(this));
			this.pagerInited = true;
		},
		
		resetPagination: function () {
			this.oPaginator.setCurrentPage(this.oUIModel.getProperty("/currentPage"));
			this.oPaginator.setNumberOfPages(this.oUIModel.getProperty("/numberOfPages"));
		},
		
		getFilteredCases: function () {
			var allCaseModel = this.getModel("allPageCases");
			var filteredCaseModel = this.getModel("filteredCases");
			if (filteredCaseModel && filteredCaseModel.getData()) {
				Log.debug('getFilteredCases: filteredCaseModel.getData().results.length=' + filteredCaseModel.getData().results.length);
				return filteredCaseModel.getData().results;
			}
			Log.debug('getFilteredCases: allCaseModel.getData().results.length=' + allCaseModel.getData().results.length);
			return allCaseModel.getData().results;
		},
		
		updateOnePageDataToTable: function (iCurrentPage) {
			this.oUIModel.setProperty("/currentPage", iCurrentPage);
			var allCases = this.getFilteredCases();
			var iCasesPerPage = this.oUIModel.getProperty("/numPerPage");
			var data = {};
			var iStart = iCasesPerPage * (iCurrentPage - 1);
			var iEnd = iCasesPerPage * iCurrentPage;
			data.results = allCases.filter(function (elem, idx, arr) {
				return idx >= iStart && idx < iEnd;
			});
			var jsonModel = new JSONModel();
			jsonModel.setSizeLimit(data.results.length);
			jsonModel.setData(data);
			this.setModel(jsonModel, "caseModel");
		},
		
		_sortByPriority: function (data, sortDir) {
			if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.priority) < (value2.priority) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.priority) < (value2.priority) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
		},
		
		_sortByDueDate: function (data, sortDir) {
			if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.u_next_action_due) < (value2.u_next_action_due) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.u_next_action_due) < (value2.u_next_action_due) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
		},

		sort: function (oEvent) {
			setTimeout(function () {
				var oTable = this.getView().byId("caseTable");
				var aSorters = oTable.getBinding().aSorters;
				this.aCurrentSorters = aSorters;
				this.sortByColumns(aSorters);
			}.bind(this));
		},
		
		sortByColumns: function (aSorters) {
			if (!aSorters || aSorters.length === 0) {
				return;
			}
			var allCases = this.getFilteredCases();
			var sortedCases = SorterProcessor.apply(allCases, aSorters, function (d, path) {
				return d[path];
			}, function (d) {
				return d.number;
			});
			var filteredCaseModel = new JSONModel();
			filteredCaseModel.setData({
				results: sortedCases
			});
			this.setModel(filteredCaseModel, "filteredCases");
			this.updateOnePageDataToTable(1);
			this.resetPagination();
		},
		
		filters: function (oEvent) {
			setTimeout(function () {
				var oTable = this.getView().byId("caseTable");
				var aFilters = oTable.getBinding().aFilters;
				var allCaseModel = this.getModel("allPageCases");
				var filteredCases = allCaseModel.getData().results;
				if (aFilters !== null && aFilters.length > 0) {
					filteredCases = allCaseModel.getData().results.filter(function (item, index) {
						return aFilters.reduce(function (acc, filter) {
							filter.fnTest = null;
							return acc && FilterProcessor._evaluateFilter(filter, item, function (d, path) {
								return d[path];
							});
						}, true);
					});
				}
				var filteredCaseModel = new JSONModel();
				filteredCaseModel.setData({
					results: filteredCases
				});
				this.setModel(filteredCaseModel, "filteredCases");
				this.calcPagination();
				this.updateOnePageDataToTable(1);
				this.resetPagination();
				var aSorters = this.aCurrentSorters;
				this.sortByColumns(aSorters);
			}.bind(this));
		},
		
		_intervalTasks: function () {
			var refreshTimer = 0;
			var flipTimer = 0;
			setInterval(function () {
				refreshTimer++;
				if (refreshTimer >= this.refreshInterval || refreshTimer === 0) {
					this.setRefreshTime();
					this.loadSnowCaseData();
					refreshTimer = 0;
				}
				var bCard = this.oUIModel.getProperty("/viewCard");
				flipTimer++;
				if (!bCard && this.oPaginator && !this.pauseFlip && (flipTimer >= this.flipInterval)) {
					var iCurrPage = this.oPaginator.getCurrentPage();
					if (iCurrPage < this.oPaginator.getNumberOfPages()) {
						this.oPaginator.setCurrentPage(iCurrPage + 1);
						this.updateOnePageDataToTable(iCurrPage + 1);
					} else {
						this.oPaginator.setCurrentPage(1);
						this.updateOnePageDataToTable(1);
					}
					flipTimer = 0;
				}
			}.bind(this), 1000);
		},
		
		_paddingTimeDigit: function (timeDigits) {
			if (timeDigits.length === 1) {
				return "0" + timeDigits;
			}
			return timeDigits;
		},
		
		setRefreshTime: function () {
			var currentTime = new Date();
			var timeText;
			var mins = this._paddingTimeDigit(currentTime.getMinutes().toString());
			var hours = this._paddingTimeDigit(currentTime.getHours());
			timeText = hours + ":" + mins;
			this.oUIModel.setProperty("/refreshTime", timeText);
		},
		
		windowResize: function (oEvent) {
			Log.debug("In windowResize: this._iRowHeight=", this._iRowHeight);
			if (!this.pagerInited) {
				return;
			}
			var viewCard = this.oUIModel.getProperty("/viewCard");
			Log.debug("In windowResize: viewCard=" + viewCard);
			this.reCalcPaginationByRealRowHeight();
			this.calcPagination();
			this.updateOnePageDataToTable(1);
			this.resetPagination();
		},
		
		pauseFlip: function (oEvent) {
			this.pauseFlip = !this.pauseFlip;
			this.oUIModel.setProperty("/pauseFlip", this.pauseFlip);
		},
		
		openInfoPage: function (oEvent) {
			window.open("https://go.sap.corp/MDR9_NOW-info", "MDR9_NOW - Info");
		},
		
		openDashboardAnalyzer: function (oEvent) {
			var url_da = window.location.href;
			// Check for filter
			var filterExist = false;
			if (url_da.indexOf("filter") !== -1) {
				filterExist = true;
			}
			// Compose Dashboard Builder and Analyzer URL
			url_da = url_da.split("#");
			url_da[1] = "#/?tab=Analyze";
			// Pass MDR URL as a parameter when opening the DB&A
			var url_mdr = window.location.href;
			url_mdr = url_mdr.split("#/");
			var mdr_url = "&URL=" + url_mdr[0];
			var mdr_mdr = "&MDR=" + url_mdr[1];
			// Create final URL and open DB&A
			if (filterExist === true) {
				var finalURL = url_da[0] + mdr_url + mdr_mdr + url_da[1];
			} else {
				var finalURL = url_da[0] + "?hc_reset" + mdr_url + mdr_mdr + url_da[1];
			}
			window.open(finalURL);
		},

		getDialogFragment: function () {
			if (!this.dialog) {
				this.dialog = sap.ui.xmlfragment(this.oView.getId(),
					"corp.sap.mdrdashboards.fragments.ConfidentialDialog", this);
				this.oView.addDependent(this.dialog);
			}
			return this.dialog;
		},
		
		Download: function () {
			var dialog = this.getDialogFragment();
			dialog.open();
		},
		
		Cancel: function () {
			var dialog = this.getDialogFragment();
			dialog.close();
		},
		
		downloadXLS: function(oEvent) {
			var tableId = "";
			var xls = this.results_xls;
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setSizeLimit(xls.length);
			oModel.setData(xls);
			var oTable = sap.ui.getCore().byId("excel_download_table");
			oTable.setModel(oModel);
			oTable.bindAggregation("items", {
				path: "/",
				template: sap.ui.getCore().byId("oTemplateOfferingsDownload")
			});
			oTable.setVisible(true);
			oTable.rerender();
			tableId = oTable;
			tableToExcel("excel_download_table", "Table");
			oTable.setVisible(false);
			// Close dialog
			var dialog = this.getDialogFragment();
			dialog.close();
		},
		
		createDownloadXLS: function (oEvent) {
				var xls_download = new sap.ui.model.json.JSONModel();
				xls_download.setData({
					Priority: "Priority",
					EscalationOpenedAt: "Escalation Opened At",
					EscalationState: "Escalation State",
					EscalationType: "Escalation Type",
					AccountName: "Customer Name",
					AccountNumber: "Partner Number",
					ContractType: "Contract Type",
					Country: "Country",
					System: "System",
					SystemID: "System ID",
					InstNo: "Installation No.",
					CaseDescription: "Case Description",
					BusinessImpact: "Business Impact",
					OpenedAt: "Opened At",
					LastUpdate: "Last Update",
					CaseState: "Case State",
					ActionStatus: "Action Status",
					NextActionDue: "Next Action Due",
					NextActionReason: "NextActionReason",
					CaseComp: "Case Comp.",
					CaseCompDesc: "Case Comp. Desc.",
					CaseAssignedTo: "Case Assigned To",
					GroupAssignment: "Group Assignment",
					CaseID: "Case ID",
					SAPCaseNumber: "SAP Case No.",
					Link: "Link"
				});
				var excel_table = this.getView().byId("excel_download_table");
				if (excel_table == null) {
					var aColumnsdownload = [
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/Priority}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/EscalationOpenedAt}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/EscalationState}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/EscalationType}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/AccountName}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/AccountNumber}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/ContractType}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/Country}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/System}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/SystemID}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/InstNo}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/CaseDescription}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/BusinessImpact}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/OpenedAt}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/LastUpdate}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/CaseState}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/ActionStatus}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/NextActionDue}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/NextActionReason}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/CaseComp}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/CaseCompDesc}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/CaseAssignedTo}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/GroupAssignment}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/CaseID}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/SAPCaseNumber}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/Link}"
							})
						}),
					];
					new sap.m.ColumnListItem("oTemplateOfferingsDownload", {
						cells: [
							new sap.m.Text({
								text: "{Priority}"
							}),
							new sap.m.Text({
								text: "{EscalationOpenedAt}"
							}),
							new sap.m.Text({
								text: "{EscalationState}"
							}),
							new sap.m.Text({
								text: "{EscalationType}"
							}),
							new sap.m.Text({
								text: "{AccountName}"
							}),
							new sap.m.Text({
								text: "{AccountNumber}"
							}),
							new sap.m.Text({
								text: "{ContractType}"
							}),
							new sap.m.Text({
								text: "{Country}"
							}),
							new sap.m.Text({
								text: "{System}"
							}),
							new sap.m.Text({
								text: "{SystemID}"
							}),
							new sap.m.Text({
								text: "{InstNo}"
							}),
							new sap.m.Text({
								text: "{CaseDescription}"
							}),
							new sap.m.Text({
								text: "{BusinessImpact}"
							}),
							new sap.m.Text({
								text: "{OpenedAt}"
							}),
							new sap.m.Text({
								text: "{LastUpdate}"
							}),
							new sap.m.Text({
								text: "{CaseState}"
							}),
							new sap.m.Text({
								text: "{ActionStatus}"
							}),
							new sap.m.Text({
								text: "{NextActionDue}"
							}),
							new sap.m.Text({
								text: "{NextActionReason}"
							}),
							new sap.m.Text({
								text: "{CaseComp}"
							}),
							new sap.m.Text({
								text: "{CaseCompDesc}"
							}),
							new sap.m.Text({
								text: "{CaseAssignedTo}"
							}),
							new sap.m.Text({
								text: "{GroupAssignment}"
							}),
							new sap.m.Text({
								text: "{CaseID}"
							}),
							new sap.m.Text({
								text: "{SAPCaseNumber}"
							}),
							new sap.m.Text({
								text: "{Link}"
							}),
						]
					});
					excel_table = new sap.m.Table("excel_download_table", {
						columns: aColumnsdownload
					});
					excel_table.setModel(xls_download, "xls_download");
					excel_table.setVisible(false);
					this.getView().byId("dashboardPage").addContent(excel_table);
				}
			}
	});
});