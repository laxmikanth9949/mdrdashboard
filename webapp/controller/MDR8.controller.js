sap.ui.define([
	"corp/sap/mdrdashboards/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	"sap/ui/model/FilterProcessor",
	"sap/ui/model/SorterProcessor",
	'corp/sap/mdrdashboards/model/formatter',
	"corp/sap/mdrdashboards/controls/TablePager",
	"corp/sap/mdrdashboards/controls/CustomPaginator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",	
	"sap/base/Log",
	'sap/ui/Device',
	"corp/sap/mdrdashboards/libs/exp_pptx"

], function (BaseController, JSONModel, Filter, FilterOperator, FilterProcessor, SorterProcessor,
	Formatter, TablePager, CustomPaginator, MessageToast, MessageBox, Log, Device, dummyPPT)
{
	"use strict";

	return BaseController.extend("corp.sap.mdrdashboards.controller.MDR8", {
		onInit: function () {
			jQuery.sap.includeStyleSheet("css/style_mdr7.css","stylemdr7");
			this.source_IC = "icp";
			this.filter = "";
			this.refreshInterval = 1800;
			this.flipInterval = 30;
			this.pauseFlip = false;
			this._dataNotLoaded = true;
			this.changePageTitle();
			// For export
			this._selectedCaseData = {};
 			this.getSourceICAddr();
			this.oRouter = this.getRouter();
			this.oRouter.attachRouteMatched(this.onRouteMatched, this);
			var sTheme = "blue";
			this.oUIModel = new JSONModel({
				theme: sTheme,
				caseNumber: 0,
				redNumber: 0,
				greenNumber: 0,
				yellowNumber: 0,
				casesEMEA: "loading...",
				casesLAC: "loading...",
				casesNA: "loading...",
				casesAPJ: "loading...",
				casesNotAss: "loading...",
				casesNotAssigned: "...",
				sourceIC: this.source_IC,
				maskData: "NO",
				title: "",
				pauseFlip: false,
				runTitle:false
			});
			this.getView().setModel(this.oUIModel, "UIModel");
			// Create correct path to images
			var oRootPath = jQuery.sap.getModulePath("corp.sap.mdrdashboards");
			var oImageModel = new sap.ui.model.json.JSONModel({
				path : oRootPath
			});
			this.setModel(oImageModel, "imageModel");
			// Resize
		//	sap.ui.Device.resize.attachHandler(this.windowResize, this);
			sap.ui.Device.resize.attachHandler(this.windowResize, window);
			// Mobile Usage Reporting - Version Distribution
			// --> Counts Number of Devices
			try {
				var tracking = new GlobalITTracking("MDR Dashboards", "MDR8 - Case Map – V1.1.0");
			} catch (e) {
				console.log("Error: " + e);
			}
			// Mobile Usage Reporting - Events
			// --> Counts Calls of the Application
			sap.git.usage.Reporting.addEvent(this.getOwnerComponent(), "MDR8 - Case Map – V1.1.0");
			this.showBusyDialog();
		},

		formatter: Formatter,
		
		changePageTitle: function () { 
           	var newPageTitle = "MDR8 - Case Map"; 
           	document.title = newPageTitle; 
        },		
		
		onRouteMatched: function (oEvent) {
			var sRouteName = oEvent.getParameter("name");
			this.readURL();
			this._customizeUI();
			if (sRouteName === "MDR8") {
				this.checkAuthorization();
			//	this.loadModelFromBackend(); // --> Now in checkAuthorization !!
				this.setRefreshTime();
				this._intervalTasks();
			}
		},

		loadModelFromBackend: function () {
			if (this._dataNotLoaded) {
				this.showBusyDialog();
			}
			this.oDataModel = this.getComponentModel();
			var header = {
				"AppIdentifier": "FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ",
				"mccprofile": "MDR8"
			};
			this.oDataModel.setHeaders(header);				
			this.oDataModel.read("/CaseList", {
				urlParameters: {
					$filter: this.filter,
					$expand: "CaseQGates"
				},
				success: function (data) {
					if (this._dataNotLoaded) {
						this.hideBusyDialog();
						this._dataNotLoaded = false;
					}
					var jsonModel = new JSONModel();
					jsonModel.setSizeLimit(data.results.length);
					if (this.noAuth !== "x") {
						if (data.results.length === 0) {
							MessageToast.show("Data Collection completed, but no Data in Selection", {
								width: "360px",
								duration: 7000
							});
						}
					}
					if (data.results.length > 999) {
						var errortext = "The display of results is restricted to 1000 records."
							+ "\n"
							+ "Please adopt your selection criteria to display less records.";
						MessageToast.show(errortext, {
							duration: 20000,
							width: "30em"
						});
					}
					this._processResult(data.results);
					jsonModel.setData(data);
					// Store data for table pagination
					var allCaseModel = new JSONModel();
					allCaseModel.setData(data);
					this.setModel(allCaseModel, "allPageCases");
				}.bind(this),
				error: function (error) {
					var index1 = error.responseText.indexOf("value");
					var index2 = error.responseText.indexOf("}");
					var errortext = "";
					if (index1 > -1) {
						errortext = error.message + ". " + error.responseText.slice(index1 + 8, index2 - 1);
					} else {
						errortext = error.message + ". " + error.responseText;
					}
					MessageToast.show(errortext, {
						duration: 20000,
						width: "40em"
					});
					this.hideBusyDialog();
				}.bind(this)
			});
		},

		_processResult: function (results) {
			var l = results.length;
			var nRed = 0;
			var nGreen = 0;
			var nYellow = 0;
			var casesEMEA = 0;
			var R_APJ = 0;
			var Y_APJ = 0;
			var G_APJ = 0;
			var N_APJ = 0;
			var R_EMEA = 0;
			var Y_EMEA = 0;
			var G_EMEA = 0;
			var N_EMEA = 0;
			var R_LAC = 0;
			var Y_LAC = 0;
			var G_LAC = 0;
			var N_LAC = 0;
			var R_NA = 0;
			var Y_NA = 0;
			var G_NA = 0;
			var N_NA = 0;
			var R_NAss = 0;
			var Y_NAss = 0;
			var G_NAss = 0;
			var N_NAss = 0;
			var casesLAC = 0;
			var casesNA = 0;
			var casesAPJ = 0;
			var casesNotAss = 0;
			for (var i = 0; i < l; i++) {
				if (results[i].rating_text === "Red") {
					nRed++;
				}
				if (results[i].rating_text === "Green") {
					nGreen++;
				}
				if (results[i].rating_text === "Yellow") {
					nYellow++;
				}
				// Assignment to regions
				switch (results[i].service_org) {
					case 'O 50008134':
						casesAPJ = casesAPJ + 1;
						if (results[i].rating_text === "Red") {
							R_APJ++;
						} else if (results[i].rating_text === "Green") {
							G_APJ++;
						} else if (results[i].rating_text === "Yellow") {
							Y_APJ++;
						} else {
							N_APJ++;
						}
						break;
					case 'O 50008010':
						casesEMEA = casesEMEA + 1;
						if (results[i].rating_text === "Red") {
							R_EMEA++;
						} else if (results[i].rating_text === "Green") {
							G_EMEA++;
						} else if (results[i].rating_text === "Yellow") {
							Y_EMEA++;
						} else {
							N_EMEA++;
						}
						break;
					case 'O 50008167':
						casesNA = casesNA + 1;
						if (results[i].rating_text === "Red") {
							R_NA++;
						} else if (results[i].rating_text === "Green") {
							G_NA++;
						} else if (results[i].rating_text === "Yellow") {
							Y_NA++;
						} else {
							N_NA++;
						}
						break;
					case 'O 50008174':
						casesLAC = casesLAC + 1;
						if (results[i].rating_text === "Red") {
							R_LAC++;
						} else if (results[i].rating_text === "Green") {
							G_LAC++;
						} else if (results[i].rating_text === "Yellow") {
							Y_LAC++;
						} else {
							N_LAC++;
						}
						break;
					default:
						casesNotAss = casesNotAss + 1;
						if (results[i].rating_text === "Red") {
							R_NAss++;
						} else if (results[i].rating_text === "Green") {
							G_NAss++;
						} else if (results[i].rating_text === "Yellow") {
							Y_NAss++;
						} else {
							N_NAss++;
						}
				}
				this.oUIModel.setProperty("/casesAPJ", casesAPJ);
				this.oUIModel.setProperty("/APJ_R", R_APJ);
				this.oUIModel.setProperty("/APJ_Y", Y_APJ);
				this.oUIModel.setProperty("/APJ_G", G_APJ);
				this.oUIModel.setProperty("/APJ_N", N_APJ);
				this.oUIModel.setProperty("/casesEMEA", casesEMEA);
				this.oUIModel.setProperty("/EMEA_R", R_EMEA);
				this.oUIModel.setProperty("/EMEA_Y", Y_EMEA);
				this.oUIModel.setProperty("/EMEA_G", G_EMEA);
				this.oUIModel.setProperty("/EMEA_N", N_EMEA);
				this.oUIModel.setProperty("/casesLAC", casesLAC);
				this.oUIModel.setProperty("/LAC_R", R_LAC);
				this.oUIModel.setProperty("/LAC_Y", Y_LAC);
				this.oUIModel.setProperty("/LAC_G", G_LAC);
				this.oUIModel.setProperty("/LAC_N", N_LAC);
				this.oUIModel.setProperty("/casesNA", casesNA);
				this.oUIModel.setProperty("/NA_R", R_NA);
				this.oUIModel.setProperty("/NA_Y", Y_NA);
				this.oUIModel.setProperty("/NA_G", G_NA);
				this.oUIModel.setProperty("/NA_N", N_NA);
				this.oUIModel.setProperty("/casesNotAss", casesNotAss);
				this.oUIModel.setProperty("/NAss_R", R_NAss);
				this.oUIModel.setProperty("/NAss_Y", Y_NAss);
				this.oUIModel.setProperty("/NAss_G", G_NAss);
				this.oUIModel.setProperty("/NAss_N", N_NAss);
				this.oUIModel.setProperty("/casesNotAssigned", casesNotAss);
				// for sorting and filter
				results[i].product_key = results[i].product_description + results[i].case_title;
				results[i].customer_key = results[i].customer_name;
				results[i].goLive_key = results[i].go_live;
				results[i].employee_key = results[i].responsible_person; // results[i].respPerson;
				results[i].processor_key = results[i].processor_person;
				results[i].serviceTeam_key = results[i].service_team_name;
				results[i].country_key = results[i].customer_country;
				results[i].lastChanged_key = results[i].change_time;
				results[i].phase_key = results[i].project_phase;
				results[i].caseStatus = results[i].status_text;
				// For export
				if (i < 1) {
					this._url_pdf_cases = "&CASE_ID=" + results[i].case_id;
				} else {
					this._url_pdf_cases = this._url_pdf_cases + "," + results[i].case_id;
				}
			}
			this.oUIModel.setProperty("/caseNumber", l);
			this.oUIModel.setProperty("/redNumber", nRed);
			this.oUIModel.setProperty("/greenNumber", nGreen);
			this.oUIModel.setProperty("/yellowNumber", nYellow);
		},

		_customizeUI: function () {
			this.oUIModel.setProperty("/theme", this.layout === "dark" ? "dark" : "blue");
			this.getView().byId("dashboardPage").addStyleClass(this.oUIModel.getProperty("/theme"));
			this.oUIModel.setProperty("/runTitle", this.run_title === "yes" ? true : false);
		},

		readURL: function () {
			// URL
			var totalURL = window.location.href;
			var pos = window.location.href.lastIndexOf("#");
			var headURL = totalURL.slice(0, pos);
			this.URL = headURL;
			// Other parameters
			if (jQuery.sap.getUriParameters().get("refreshInterval") !== null)
				this.refreshInterval = 60 * jQuery.sap.getUriParameters().get("refreshInterval");
			if (jQuery.sap.getUriParameters().get("flipInterval") !== null)
				this.flipInterval = jQuery.sap.getUriParameters().get("flipInterval");
			if (jQuery.sap.getUriParameters().get("ppt") !== null)
				this._selectedCase = jQuery.sap.getUriParameters().get("ppt");
			if (jQuery.sap.getUriParameters().get("run_title") !== null)
				this.run_title = jQuery.sap.getUriParameters().get("run_title");
			// Title
			if (jQuery.sap.getUriParameters().get("title") == null) {
				this.title = "MDR8 - Case Map";
				this.oUIModel.setProperty("/title", "MDR8 - Case Map");
			} else {
				this.title = jQuery.sap.getUriParameters().get("title");
				this.oUIModel.setProperty("/title", this.title);
			}
			// Mask data
			if (jQuery.sap.getUriParameters().get("MaskData") !== null) {
				this.maskdata = jQuery.sap.getUriParameters().get("MaskData").toUpperCase();
			} else {
				this.maskdata = "NO";
			}
			this.oUIModel.setProperty("/maskData", this.maskdata);
			// Test ////////////
			if (this.filter === "")
				this.filter =
				"(case_id eq '20001283' or case_id eq '20000982' or case_id eq '20000134' or" +
				" case_id eq '20001021' or case_id eq '20001967' or case_id eq '20002107' or" +
				" case_id eq '20002107' or case_id eq '20002121' or case_id eq '20001001' or" +
				" case_id eq '20000332' or case_id eq '20000580' or case_id eq '20000601' or" +
				" case_id eq '20002106' or case_id eq '20000972' or case_id eq '20000751' or" +
				" case_id eq '20000432' or case_id eq '20000972' or case_id eq '20000751' or" +
				" case_id eq '20002181' or case_id eq '20002106' or case_id eq '20000751' or" +
				" case_id eq '20001040' or case_id eq '20000942' or case_id eq '20001124')" +
				" and case_type eq 'ZS02'";
			// Dashboard analyzer
			if (jQuery.sap.getUriParameters().get("da_test") !== null)
				this.da_test = jQuery.sap.getUriParameters().get("da_test");
			var datetoday = new Date();
			var date = new Date();
			var month;
			
			// golivestart=now-2&goliveend=now+4
			if (jQuery.sap.getUriParameters().get("golivestart") !== null) {
				this.golivestart = parseInt(jQuery.sap.getUriParameters().get("golivestart").substring(3), 10);
				if (!isNaN(this.golivestart)) {
					date.setTime(datetoday.getTime() + this.golivestart * 7 * 24 * 60 * 60 * 1000);
					month = date.getMonth() + 1;
					var dateStart = date.getFullYear() + "-" + month + "-" + date.getDate() + "T00:00:00";
					this.filter = "go_live ge datetime'" + dateStart + "'";
				}
			}
			if (jQuery.sap.getUriParameters().get("goliveend") !== null) {
				this.goliveend = parseInt(jQuery.sap.getUriParameters().get("goliveend").substring(3), 10);
				if (!isNaN(this.golivestart)) {
					date.setTime(datetoday.getTime() + this.goliveend * 7 * 24 * 60 * 60 * 1000);
					month = date.getMonth() + 1;
					var dateEnd = date.getFullYear() + "-" + month + "-" + date.getDate() + "T00:00:00";
					if (jQuery.sap.getUriParameters().get("golivestart") === null) {
						this.filter = "go_live le datetime'" + dateEnd + "'";
					} else {
						this.filter += " and go_live le datetime'" + dateEnd + "'";
					}
				}
			}
			if (jQuery.sap.getUriParameters().get("filter") !== null) {
				if (jQuery.sap.getUriParameters().get("golivestart") === null && jQuery.sap.getUriParameters().get("goliveend") === null)
					this.filter = jQuery.sap.getUriParameters().get("filter");
				else
					this.filter += " and " + jQuery.sap.getUriParameters().get("filter");
			}

			// &created-1weeks or &created-7days (create_time ge '20150302000000' )
			if (jQuery.sap.getUriParameters().get("created") !== null) {
				var lv_created = jQuery.sap.getUriParameters().get("created");
				var lv_date_today = new Date();
				var lv_date_created = new Date();
				var lv_index = 1;
				var lv_general;
				var lv_month;
				var lv_day;
				var lv_month_today;
				var lv_day_today;
				if (lv_created.indexOf("weeks") > -1) {
					lv_general = lv_created.substring(3, lv_created.length - 5);
					lv_index = 7;
				} else if (lv_created.indexOf("days") > -1) {
					lv_general = lv_created.substring(3, lv_created.length - 4);
					lv_index = 1;
				} else
					lv_index = 0;
				if (lv_index != 0) {
					lv_date_created.setTime(lv_date_today.getTime() + lv_general * lv_index * 24 * 60 * 60 * 1000);
				}
				lv_month = (lv_date_created.getMonth() + 1).toString();
				if (lv_month.length == 1)
					lv_month = "0" + lv_month;
				lv_day = (lv_date_created.getDate()).toString();
				if (lv_day.length == 1)
					lv_day = "0" + lv_day;
				lv_month_today = (lv_date_today.getMonth() + 1).toString();
				if (lv_month_today.length == 1)
					lv_month_today = "0" + lv_month_today;
				lv_day_today = (lv_date_today.getDate()).toString();
				if (lv_day_today.length == 1)
					lv_day_today = "0" + lv_day_today;
				this.filter = "create_time ge '" + lv_date_created.getFullYear().toString() + lv_month + lv_day + "000000' " +
					"and create_time le '" + lv_date_today.getFullYear().toString() + lv_month_today + lv_day_today + "235959' and " + this.filter;
			}
			// qgstart=now-2days/now+3days
			// qgstart=now-2days/0 -> open End
			// qgstart=0/now+3days -> von beginn bis zu dem Datum
			if (jQuery.sap.getUriParameters().get("qgstart") !== null) {
				var lv_qgstart_from = jQuery.sap.getUriParameters().get("qgstart").substring(0, jQuery.sap.getUriParameters().get("qgstart").indexOf(
					"/"));
				var lv_qgstart_to = jQuery.sap.getUriParameters().get("qgstart").substring(jQuery.sap.getUriParameters().get("qgstart").indexOf(
					"/"));
				var lv_date_today = new Date();
				var lv_date_qgstart_from = new Date();
				var lv_date_qgstart_to = new Date();
				var lv_index = 0;
				var month;
				var lv_general_from;
				var lv_month_from;
				var lv_day_from;
				var lv_general_to;
				var lv_month_to;
				var lv_day_to;
				if (lv_qgstart_from.indexOf("month") > -1) {
					lv_general_from = lv_qgstart_from.substring(3, lv_qgstart_from.length - 5);
					lv_date_qgstart_from.setMonth(lv_date_today.getMonth() + parseInt(lv_general_from));
				} else if (lv_qgstart_from.indexOf("days") > -1) {
					lv_general_from = lv_qgstart_from.substring(3, lv_qgstart_from.length - 4);
					lv_date_qgstart_from.setTime(lv_date_today.getTime() + parseInt(lv_general_from) * 24 * 60 * 60 * 1000);
				} else
					lv_index = 1;
				lv_month_from = (lv_date_qgstart_from.getMonth() + 1).toString();
				if (lv_month_from.length == 1)
					lv_month_from = "0" + lv_month_from;
				lv_day_from = (lv_date_qgstart_from.getDate()).toString();
				if (lv_day_from.length == 1)
					lv_day_from = "0" + lv_day_from;
				if (lv_qgstart_to.indexOf("month") > -1) {
					lv_general_to = lv_qgstart_to.substring(4, lv_qgstart_to.length - 5);
					lv_date_qgstart_to.setMonth(lv_date_today.getMonth() + parseInt(lv_general_to));
				} else if (lv_qgstart_to.indexOf("days") > -1) {
					lv_general_to = lv_qgstart_to.substring(4, lv_qgstart_to.length - 4);
					lv_date_qgstart_to.setTime(lv_date_today.getTime() + parseInt(lv_general_to) * 24 * 60 * 60 * 1000);
				} else
					lv_index = 2;
				lv_month_to = (lv_date_qgstart_to.getMonth() + 1).toString();
				if (lv_month_to.length == 1)
					lv_month_to = "0" + lv_month_to;
				lv_day_to = (lv_date_qgstart_to.getDate()).toString();
				if (lv_day_to.length == 1)
					lv_day_to = "0" + lv_day_to;
				if (lv_index == 0) {
					this.filter += " and (qgate_start_date ge datetime'" + lv_date_qgstart_from.getFullYear().toString() + "-" + lv_month_from + "-" +
						lv_day_from + "T00:00:00' and " + "qgate_start_date le datetime'" + lv_date_qgstart_to.getFullYear().toString() +
						"-" + lv_month_to + "-" + lv_day_to + "T23:59:59')";
				} else if (lv_index == 1) {
					this.filter += " and (qgate_start_date le datetime'" + lv_date_qgstart_to.getFullYear().toString() + "-" + lv_month_to + "-" +
						lv_day_to + "T23:59:59')";
				} else if (lv_index == 2) {
					this.filter += " and (qgate_start_date ge datetime'" + lv_date_qgstart_from.getFullYear().toString() + "-" + lv_month_from + "-" +
						lv_day_from + "T00:00:00')";
				}
			}
			// qgfinish=now-2days/now+3days
			// qgfinish=now-2days/0 -> open End
			// qgfinish=0/now+3days -> von beginn bis zu dem Datum
			if (jQuery.sap.getUriParameters().get("qgfinish") !== null) {
				var lv_qgfinish_from = jQuery.sap.getUriParameters().get("qgfinish").substring(0, jQuery.sap.getUriParameters().get("qgfinish").indexOf(
					"/"));
				var lv_qgfinish_to = jQuery.sap.getUriParameters().get("qgfinish").substring(jQuery.sap.getUriParameters().get("qgfinish").indexOf(
					"/"));
				var lv_date_today = new Date();
				var lv_date_qgfinish_from = new Date();
				var lv_date_qgfinish_to = new Date();
				var lv_index = 0;
				var month;
				if (lv_qgfinish_from.indexOf("month") > -1) {
					lv_general_from = lv_qgfinish_from.substring(3, lv_qgfinish_from.length - 5);
					lv_date_qgfinish_from.setMonth(lv_date_today.getMonth() + parseInt(lv_general_from));
				} else if (lv_qgfinish_from.indexOf("days") > -1) {
					lv_general_from = lv_qgfinish_from.substring(3, lv_qgfinish_from.length - 4);
					lv_date_qgfinish_from.setTime(lv_date_today.getTime() + parseInt(lv_general_from) * 24 * 60 * 60 * 1000);
				} else
					lv_index = 1;
				lv_month_from = (lv_date_qgfinish_from.getMonth() + 1).toString();
				if (lv_month_from.length == 1)
					lv_month_from = "0" + lv_month_from;
				lv_day_from = (lv_date_qgfinish_from.getDate()).toString();
				if (lv_day_from.length == 1)
					lv_day_from = "0" + lv_day_from;
				if (lv_qgfinish_to.indexOf("month") > -1) {
					lv_general_to = lv_qgfinish_to.substring(4, lv_qgfinish_to.length - 5);
					lv_date_qgfinish_to.setMonth(lv_date_today.getMonth() + parseInt(lv_general_to));
				} else if (lv_qgfinish_to.indexOf("days") > -1) {
					lv_general_to = lv_qgfinish_to.substring(4, lv_qgfinish_to.length - 4);
					lv_date_qgfinish_to.setTime(lv_date_today.getTime() + parseInt(lv_general_to) * 24 * 60 * 60 * 1000);
				} else
					lv_index = 2;
				lv_month_to = (lv_date_qgfinish_to.getMonth() + 1).toString();
				if (lv_month_to.length == 1)
					lv_month_to = "0" + lv_month_to;

				lv_day_to = (lv_date_qgfinish_to.getDate()).toString();
				if (lv_day_to.length == 1)
					lv_day_to = "0" + lv_day_to;

				if (lv_index == 0) {
					this.filter += "and (qgate_finish_date ge datetime'" + lv_date_qgfinish_from.getFullYear().toString() + "-" + lv_month_from + "-" +
						lv_day_from + "T00:00:00' " + "and " + "qgate_finish_date le datetime'" +
						lv_date_qgfinish_to.getFullYear().toString() + "-" + lv_month_to + "-" + lv_day_to + "T23:59:59')";
				} else if (lv_index == 1) {
					this.filter += "and (qgate_finish_date le datetime'" + lv_date_qgfinish_to.getFullYear().toString() + "-" + lv_month_to + "-" +
						lv_day_to + "T23:59:59')";
				} else if (lv_index == 2) {
					this.filter += "and (qgate_finish_date ge datetime'" + lv_date_qgfinish_from.getFullYear().toString() + "-" + lv_month_from + "-" +
						lv_day_from + "T00:00:00')";
				}
			}
			// followUp=now-2days/now+3days
			// followUp=now-2days/0 -> open End
			// followUp=0/now+3days -> von beginn bis zu dem Datum
			var lv_followUp_from = "";
			var lv_followUp_to = "";
			if (jQuery.sap.getUriParameters().get("followUp") != null) {
				lv_followUp_from = jQuery.sap.getUriParameters().get("followUp").substring(0, jQuery.sap.getUriParameters().get("followUp").indexOf("/"));
				lv_followUp_to = jQuery.sap.getUriParameters().get("followUp").substring(jQuery.sap.getUriParameters().get("followUp").indexOf("/"));
			}
			if (jQuery.sap.getUriParameters().get("followup") != null) {
				lv_followUp_from = jQuery.sap.getUriParameters().get("followup").substring(0, jQuery.sap.getUriParameters().get("followup").indexOf("/"));
				lv_followUp_to = jQuery.sap.getUriParameters().get("followup").substring(jQuery.sap.getUriParameters().get("followup").indexOf("/"));
			}
			if ((jQuery.sap.getUriParameters().get("followUp") != null) || (jQuery.sap.getUriParameters().get("followup") != null)) {
				var lv_date_today = new Date();
				var lv_date_followUp_from = new Date();
				var lv_date_followUp_to = new Date();
				var lv_index = 0;
				var month;
				if (lv_followUp_from.indexOf("month") > -1) {
					lv_general_from = lv_followUp_from.substring(3, lv_followUp_from.length - 5);
					lv_date_followUp_from.setMonth(lv_date_today.getMonth() + parseInt(lv_general_from));
				} else if (lv_followUp_from.indexOf("days") > -1) {
					lv_general_from = lv_followUp_from.substring(3, lv_followUp_from.length - 4);
					lv_date_followUp_from.setTime(lv_date_today.getTime() + parseInt(lv_general_from) * 24 * 60 * 60 * 1000);
				} else
					lv_index = 1;
				lv_month_from = (lv_date_followUp_from.getMonth() + 1).toString();
				if (lv_month_from.length == 1)
					lv_month_from = "0" + lv_month_from;
				lv_day_from = (lv_date_followUp_from.getDate()).toString();
				if (lv_day_from.length == 1)
					lv_day_from = "0" + lv_day_from;
				if (lv_followUp_to.indexOf("month") > -1) {
					lv_general_to = lv_followUp_to.substring(4, lv_followUp_to.length - 5);
					lv_date_followUp_to.setMonth(lv_date_today.getMonth() + parseInt(lv_general_to));
				} else if (lv_followUp_to.indexOf("days") > -1) {
					lv_general_to = lv_followUp_to.substring(4, lv_followUp_to.length - 4);
					lv_date_followUp_to.setTime(lv_date_today.getTime() + parseInt(lv_general_to) * 24 * 60 * 60 * 1000);
				} else
					lv_index = 2;
				lv_month_to = (lv_date_followUp_to.getMonth() + 1).toString();
				if (lv_month_to.length == 1)
					lv_month_to = "0" + lv_month_to;
				lv_day_to = (lv_date_followUp_to.getDate()).toString();
				if (lv_day_to.length == 1)
					lv_day_to = "0" + lv_day_to;
				if (lv_index == 0) {
					this.filter += "and (follow_up ge datetime'" + lv_date_followUp_from.getFullYear().toString() + "-" + lv_month_from + "-" +
						lv_day_from + "T00:00:00' " + "and " + "follow_up le datetime'" + lv_date_followUp_to.getFullYear().toString() + "-" +
						lv_month_to + "-" + lv_day_to + "T23:59:59')";
				} else if (lv_index == 1) {
					this.filter += "and (follow_up ge datetime'1970-01-01T00:00:00' and follow_up le datetime'" + lv_date_followUp_to.getFullYear().toString() +
						"-" + lv_month_to + "-" + lv_day_to + "T23:59:59')";
				} else if (lv_index == 2) {
					this.filter += "and (follow_up ge datetime'" + lv_date_followUp_from.getFullYear().toString() + "-" + lv_month_from + "-" +
						lv_day_from + "T00:00:00' and follow_up le datetime'9999-12-31T00:00:00')";
				}
			}
			// changetime=now-2days/now+3days
			// changetime=now-2days/0 -> open End
			// changetime=0/now+3days -> von beginn bis zu dem Datum
			if (jQuery.sap.getUriParameters().get("changetime") !== null) {
				var lv_changetime_from = jQuery.sap.getUriParameters().get("changetime").substring(0, jQuery.sap.getUriParameters().get(
					"changetime").indexOf("/"));
				var lv_changetime_to = jQuery.sap.getUriParameters().get("changetime").substring(jQuery.sap.getUriParameters().get("changetime").indexOf(
					"/"));
				var lv_date_today = new Date();
				var lv_date_changetime_from = new Date();
				var lv_date_changetime_to = new Date();
				var lv_index = 0;
				var month;
				if (lv_changetime_from.indexOf("month") > -1) {
					lv_general_from = lv_changetime_from.substring(3, lv_changetime_from.length - 5);
					lv_date_changetime_from.setMonth(lv_date_today.getMonth() + parseInt(lv_general_from));
				} else if (lv_changetime_from.indexOf("days") > -1) {
					lv_general_from = lv_changetime_from.substring(3, lv_changetime_from.length - 4);
					lv_date_changetime_from.setTime(lv_date_today.getTime() + parseInt(lv_general_from) * 24 * 60 * 60 * 1000);
				} else
					lv_index = 1;
				lv_month_from = (lv_date_changetime_from.getMonth() + 1).toString();
				if (lv_month_from.length == 1)
					lv_month_from = "0" + lv_month_from;
				lv_day_from = (lv_date_changetime_from.getDate()).toString();
				if (lv_day_from.length == 1)
					lv_day_from = "0" + lv_day_from;
				if (lv_changetime_to.indexOf("month") > -1) {
					lv_general_to = lv_changetime_to.substring(4, lv_changetime_to.length - 5);
					lv_date_changetime_to.setMonth(lv_date_today.getMonth() + parseInt(lv_general_to));
				} else if (lv_changetime_to.indexOf("days") > -1) {
					lv_general_to = lv_changetime_to.substring(4, lv_changetime_to.length - 4);
					lv_date_changetime_to.setTime(lv_date_today.getTime() + parseInt(lv_general_to) * 24 * 60 * 60 * 1000);
				} else
					lv_index = 2;
				lv_month_to = (lv_date_changetime_to.getMonth() + 1).toString();
				if (lv_month_to.length == 1)
					lv_month_to = "0" + lv_month_to;
				lv_day_to = (lv_date_changetime_to.getDate()).toString();
				if (lv_day_to.length == 1)
					lv_day_to = "0" + lv_day_to;
				if (lv_index == 0) {
					this.filter += "and (change_time ge '" + lv_date_changetime_from.getFullYear().toString() + lv_month_from + lv_day_from +
						"000000' " + "and " + "change_time le '" + lv_date_changetime_to.getFullYear().toString() + lv_month_to + lv_day_to +
						"235959')";
				} else if (lv_index == 1) {
					this.filter += "and (change_time ge '19700101000000' and change_time le '" + lv_date_changetime_to.getFullYear().toString() +
						lv_month_to + lv_day_to + "235959')";
				} else if (lv_index == 2) {
					this.filter += "and (change_time ge '" + lv_date_changetime_from.getFullYear().toString() + lv_month_from + lv_day_from +
						"000000' and change_time le '99991231000000')";
				}
			}
			// createtime=now-2days/now+3days
			// createtime=now-2days/0 -> Open End
			// createtime=0/now+3days -> Von Beginn bis zu dem Datum
			if (jQuery.sap.getUriParameters().get("createtime") !== null) {
				var lv_createtime_from = jQuery.sap.getUriParameters().get("createtime").substring(0, jQuery.sap.getUriParameters().get("createtime").indexOf("/"));
				var lv_createtime_to = jQuery.sap.getUriParameters().get("createtime").substring(jQuery.sap.getUriParameters().get("createtime").indexOf("/"));
				var lv_date_today = new Date();
				var lv_date_createtime_from = new Date();
				var lv_date_createtime_to = new Date();
				var lv_index = 0;
				var month;
				if (lv_createtime_from.indexOf("month") > -1) {
					lv_general_from = lv_createtime_from.substring(3, lv_createtime_from.length - 5);
					lv_date_createtime_from.setMonth(lv_date_today.getMonth() + parseInt(lv_general_from));
				} else if (lv_createtime_from.indexOf("days") > -1) {
					lv_general_from = lv_createtime_from.substring(3, lv_createtime_from.length - 4);
					lv_date_createtime_from.setTime(lv_date_today.getTime() + parseInt(lv_general_from) * 24 * 60 * 60 * 1000);
				} else
					lv_index = 1;
				lv_month_from = (lv_date_createtime_from.getMonth() + 1).toString();
				if (lv_month_from.length == 1)
					lv_month_from = "0" + lv_month_from;
				lv_day_from = (lv_date_createtime_from.getDate()).toString();
				if (lv_day_from.length == 1)
					lv_day_from = "0" + lv_day_from;
				if (lv_createtime_to.indexOf("month") > -1) {
					lv_general_to = lv_createtime_to.substring(4, lv_createtime_to.length - 5);
					lv_date_createtime_to.setMonth(lv_date_today.getMonth() + parseInt(lv_general_to));
				} else if (lv_createtime_to.indexOf("days") > -1) {
					lv_general_to = lv_createtime_to.substring(4, lv_createtime_to.length - 4);
					lv_date_createtime_to.setTime(lv_date_today.getTime() + parseInt(lv_general_to) * 24 * 60 * 60 * 1000);
				} else
					lv_index = 2;
				lv_month_to = (lv_date_createtime_to.getMonth() + 1).toString();
				if (lv_month_to.length == 1)
					lv_month_to = "0" + lv_month_to;
				lv_day_to = (lv_date_createtime_to.getDate()).toString();
				if (lv_day_to.length == 1)
					lv_day_to = "0" + lv_day_to;
				if (lv_index == 0) {
					this.filter += "and (create_time ge '" + lv_date_createtime_from.getFullYear().toString() + lv_month_from + lv_day_from +
						"000000' " + "and " + "create_time le '" + lv_date_createtime_to.getFullYear().toString() + lv_month_to + lv_day_to +
						"235959')";
				} else if (lv_index == 1) {
					this.filter += "and (create_time ge '19700101000000' and create_time le '" + lv_date_createtime_to.getFullYear().toString() +
						lv_month_to + lv_day_to + "235959')";
				} else if (lv_index == 2) {
					this.filter += "and (create_time ge '" + lv_date_createtime_from.getFullYear().toString() + lv_month_from + lv_day_from +
						"000000' and create_time le '99991231000000')";
				}
			}
			this.layout = jQuery.sap.getUriParameters().get("layout");
			this.source_PG = '/' + this.source_IC;
		},

       checkAuthorization: function () {
			this.location = location;
			this.myODataModel = this.getModel();
			this.showBusyDialog();
			// Authorization checks:
			// 1. S_SCMG_CAS                  --> Customer cases in general
			// 2. ZS_CASE_CR                  --> Red customer cases
			// 3. S_SCMG_CAS_01               --> Escalation Cases
			// 4. XMLHttpRequest.responseText --> General authorization		
			var that = this;
			var auth1 = "yes";
			var auth2 = "yes";
			var auth3 = "yes";
			var message = "";
			this.noAuth = "";
			// Collect authorization in place
			// var requestURL_Authorization = "/" 
			//	+ this.source_IC 
			//	+ "/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/AuthorizationCheckSet";
			//	+ "apim/ic/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/AuthorizationCheckSet";
			var requestURL_Authorization = sap.ui.require.toUrl("corp/sap/mdrdashboards") 
				+ "/apim/ic/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/AuthorizationCheckSet";	
			jQuery.ajax({
				async:  false,
				headers: {
					'AppIdentifier': 'FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ', //API Management: ID for MDR Dashboards
					'mccprofile': 'MDR8_AuthCheck'
				},
				url:  requestURL_Authorization,
				type: "get",
				dataType: "json",
				success: function (data) {
					if (that.myODataModel.oMetadata.bLoaded === false) {
						try {
							window.location.replace(that.location.href);
						}
						catch(e) {
							window.location = that.location.href;
						}
					}
					var jsonData = data.d.results;
					console.log("Authorization Check Results:");
					for (var i = 0; i < jsonData.length; i++) {
						console.log(jsonData[i].authorization_obect_name + ": " + jsonData[i].authorzied);
					}
					for (var i = 0; i < jsonData.length; i++) {
						switch (jsonData[i].authorization_obect_name) {
							case "S_SCMG_CAS": {
								// General authorization for customer cases
								if (jsonData[i].authorzied == "no") {
									auth1 = "no";
								}	
								break;
							}
							case "ZS_CASE_CR": {
								// Authorization for red customer cases
								if (jsonData[i].authorzied == "no") {
									auth2 = "no";
								}
								break;
							}
							case "S_SCMG_CAS_01": {
								// Authorization for escalation cases
								if (jsonData[i].authorzied == "no") {
									auth3 = "no";
								}
								break;
							}
						}
					}
					// Raise message in case of missing authorization
					// Extract name of MDR
					var totalURL = window.location.href;
					var pos = window.location.href.lastIndexOf("#");
					var mdr = totalURL.slice(0 + 1);
					// Check authorization
					if (auth1 === "no") {
						this.noAuth = "x";
						that.message = "No authorization to display the requested data!" 
							+ "\n " 
							+ "\n For how to get additional authorization please check the following document:"
							+ "\n https://go.sap.corp/MCC-ICP-Profiles"
							+ "\n "
							+ "\n You can directly access this document via button 'OK'";
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
						that.loadModelFromBackend();
					} 
					if (auth2 === "no" && (totalURL.indexOf("red") > 0 || totalURL.indexOf("Red") > 0)) {
						that.noAuth = "x";
						message += "No authorization to display RED customer cases:" 
							+ "\n  "
							+ "\n No customer cases with a rating equal 'RED' are"
							+ "\n displayed, although these cases may match the"
							+ "\n selection criteria you specified when starting"
							+ "\n this dashboard.";
						MessageToast.show( message, {
							duration: 15000,
							width: "25em"  
						});
						that.loadModelFromBackend();
					} else if (auth3 === "no" && (totalURL.indexOf("ZS01") > 0)) {
						that.noAuth = "x";
						message += "No authorization to display escalation cases:" 
							+ "\n  "
							+ "\n No escalation cases (customer cases of type ZS01)"
							+ "\n are displayed, although these cases may match the"
							+ "\n selection criteria you specified when starting this"
							+ "\n dashboard.";
						MessageToast.show( message, {
							duration: 15000,
							width: "25em"  
						});
						that.loadModelFromBackend();						
					} else {
						that.loadModelFromBackend();
					}
				}.bind(that),
				error: function (XMLHttpRequest, textStatus, errorThrown) {
					if (that.myODataModel.oMetadata.bLoaded === false) {
						try {
							window.location.replace(that.location.href);
						}
						catch(e) {
							window.location = that.location.href;
						}
					}
					//-----------------------------------------
					// No Authorizations
					//-----------------------------------------
					if (XMLHttpRequest.responseText && (XMLHttpRequest.responseText.indexOf("passwort incorrect") > -1 || 
														XMLHttpRequest.responseText.indexOf("auth") > -1 || 
														XMLHttpRequest.responseText.indexOf("User or password incorrect") > -1)) {
						var that = this;
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
					}	
				}.bind(that),
				complete : function (){
				}
			});
		},
		
		_intervalTasks: function(){
			var refreshTimer = 0;
			var flipTimer = 0;
			setInterval(function() {
				refreshTimer++;
				if (refreshTimer >= this.refreshInterval || refreshTimer === 0) {
					this.setRefreshTime();
					this.loadModelFromBackend();
					refreshTimer = 0;
				}
			}.bind(this), 1000);
		},

		_paddingTimeDigit:function(timeDigits){
			if(timeDigits.length === 1){
				return "0" + timeDigits;
			}
			return timeDigits;
		},

		setRefreshTime: function(){
			var currentTime = new Date();
			var timeText;
			var mins = this._paddingTimeDigit(currentTime.getMinutes().toString());
			var hours = this._paddingTimeDigit(currentTime.getHours());
			timeText = hours + ":" + mins;
			this.oUIModel.setProperty("/refreshTime", timeText);
		},

		pauseFlip: function(oEvent) {
			this.pauseFlip = !this.pauseFlip;
			this.oUIModel.setProperty("/pauseFlip", this.pauseFlip);
		},

		windowResize: function (oEvent) {
			var pathname = window.location.pathname;
			var search = window.location.search;
			var hash = window.location.hash;
			window.location.replace(pathname + search + hash);
		//	window.location.reload(false);
		},

		openInfoPage: function(oEvent) {
			window.open("https://go.sap.corp/MDR8-info", "MDR8 - Info");
		},

		openMDR7: function (oEvent) {
			var URL = this.URL;
			URL = URL + "&listView=yes" + "#/MDR7";
			window.open(URL);
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

		download: function(oEvent) {
			if (!this.downloadDialog) {
				// Modify location.href
				var index = location.href.lastIndexOf("#");
				var url = location.href.slice(0, index);
				url = url + "&MDR=8";
				//	Encode '+' sign
				for (var j = 0; j < url.length; j++) {
					if (url.indexOf("+") > -1) {
						url = url.replace("+", "%2B");
					} else {
						break;
					}
				}
				// Create dialog				
				this.downloadDialog = new sap.m.Dialog("CaseDashboards", {
					title: "PPT Generation",
					content: [
						// new sap.ui.core.HTML({
						// 	content: "<p id='p1' style='margin:0;padding: 16px;'>Which format do you want to download?</p>"
						// }),
						new sap.ui.layout.VerticalLayout({
							width: "100%",
							content: [
								new sap.m.Button({
									text: "Generate detailed PPT",
									type: sap.m.ButtonType.Accept,
									width: "100%",
									press: function() {
										this.downloadDialog.close();
										window.open("https://" 
										+ this.source_IC 
										+ ".wdf.sap.corp/sap/crm/zscrm_cmg_print?" 
										+ "sap-language=EN" 
										+ "&output_format=PPTX" 
										+ this._url_pdf_cases 
										+ "&MDR_URL=" 
										+ url, "PPT", "resizable=1");
									//	+ location.href, "PPT", "resizable=1");	}.bind(this)
									}.bind(this)
								}),
								new sap.m.Button({
									text: "Cancel",
									type: sap.m.ButtonType.Reject,
									icon: "sap-icon://employee",
									width: "100%",
									press: function() {
										this.downloadDialog.close();
									}.bind(this)
								})
							]
						}).addStyleClass("sapUiContentPadding")
					]
				});
			}
			this.downloadDialog.open();
		},

		singleCaseDownload: function(oEvent) {
			// Not required here: No display of single cases!
		}
	});
});