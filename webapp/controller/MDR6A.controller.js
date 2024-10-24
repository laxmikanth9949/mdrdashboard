sap.ui.define([
	"corp/sap/mdrdashboards/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	"sap/ui/model/FilterProcessor",
	"sap/ui/model/SorterProcessor",
	'corp/sap/mdrdashboards/model/formatterMDR6',
	"corp/sap/mdrdashboards/controls/TablePager",
	"corp/sap/mdrdashboards/controls/CustomPaginator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",	
	"sap/base/Log",
	'sap/ui/Device',
	"corp/sap/mdrdashboards/libs/exp_pptx"

], function (BaseController, JSONModel, Filter, FilterOperator, FilterProcessor, SorterProcessor,
	FormatterMDR6, TablePager, CustomPaginator, MessageToast, MessageBox, Log, Device, dummyPPT) {
	"use strict";

	return BaseController.extend("corp.sap.mdrdashboards.controller.MDR6A", {

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
			// Style sheet
			jQuery.sap.includeStyleSheet("css/style_mdr6a.css", "stylemdr6a");
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
				viewCard: false,
				theme: sTheme,
				caseNumber: 0,
				redNumber: 0,
				greenNumber: 0,
				yellowNumber: 0,
				sourceIC: this.source_IC,
				maskData: "NO",
				title: "",
				refreshTime: "00:00",
				pauseFlip: false,
				runTitle: false
			});
			this.getView().setModel(this.oUIModel, "UIModel");
			// Resize
			sap.ui.Device.resize.attachHandler(this.windowResize, this);
			// Mobile Usage Reporting - Version Distribution
			// --> Counts Number of Devices
			try {
				var tracking = new GlobalITTracking("MDR Dashboards", "MDR6A - Q-Gate List – V1.1.0");
			} catch (e) {
				console.log("Error: " + e);
			}
			// Mobile Usage Reporting - Events
			// --> Counts Calls of the Application
			sap.git.usage.Reporting.addEvent(this.getOwnerComponent(), "MDR6A - Q-Gate List – V1.1.0");
			this.showBusyDialog();
		},

		formatterMDR6: FormatterMDR6,
		
		changePageTitle: function () { 
           	var newPageTitle = "MDR6A - Q-Gate List"; 
           	document.title = newPageTitle; 
        },		
		
		onRouteMatched: function (oEvent) {
			var sRouteName = oEvent.getParameter("name");
			this.readURL();
			this._customizeUI();
			if (sRouteName === "MDR6A") {
				this.checkAuthorization();
			//	this.loadModelFromBackend(); // --> Now in checkAuthorization !!
				this.setRefreshTime();
				this._intervalTasks();
			}
		},

		_customizeUI: function () {
			this.oUIModel.setProperty("/theme", this.layout === "dark" ? "dark" : "blue");
			this.getView().byId("dashboardPage").addStyleClass(this.oUIModel.getProperty("/theme"));
			this.oUIModel.setProperty("/runTitle", this.run_title === "yes" ? true : false);
		},

		loadModelFromBackend: function () {
			// Check for qgates_exist filter
			var addCaseWithoutQGate ="yes";
			var url = window.location.href;
			var posQGateExistURL = url.indexOf("qgates_exist");
			if ( posQGateExistURL > -1 ) {
				url = url.slice ( posQGateExistURL + 13 );
				var pos = url.indexOf( "yes" );
				if ( pos > -1 && pos < 7 ) {
					// Means: qgates_exist = yes
					// Means: Cases without Q-Gates should not be added to list!
					addCaseWithoutQGate = "no";
				} else {
					// Means: qgates_exist <> yes
					// Means: Cases without Q-Gates should be added to list!
					addCaseWithoutQGate = "yes";
				}
			} else {
				// Means: qgates_exist parameter <> yes
				// Means: Cases without Q-Gates should not be added to list!
				addCaseWithoutQGate = "no";
			}
			// Collect case data
			this.oDataModel = this.getComponentModel();
			var header = {
				"AppIdentifier": "FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ",
				"mccprofile": "MDR6A"
			};
			this.oDataModel.setHeaders(header);						
			this.oDataModel.read("/CaseList", {
				urlParameters: {
					$filter: this.filter,
					$expand: "CaseQGates"
				},
				success: function (data) {
					this.hideBusyDialog();
					if (data.results.length > 999) {
						var errortext = "More than 1000 cases have been selected, but only 1000 cases are considered for the q-gate list."
							+ "\n"
							+ "This may lead to incomplete results in the q-gate list."
							+ "\n"
							+ "\n"
							+ "Please adopt your selection criteria to select less cases.";
						MessageToast.show(errortext, {
							duration: 20000,
							width: "30em"
						});
					}
					var caseLength = data.results.length;
					var qgateLength = 0;
					var dataCopy = {};
					dataCopy.results = [];
					for (var i = 0; i < caseLength; i++) {
						qgateLength = data.results[i].CaseQGates.results.length;
						if (qgateLength > 0) {
							for (var j = 0; j < qgateLength; j++) {
								var casedata = {};
								casedata.results = JSON.parse(JSON.stringify(data.results[i]));
								casedata.results.case_id = data.results[i].case_id;
								casedata.results.rating = data.results[i].rating;
								casedata.results.status_text = data.results[i].status_text;
								casedata.results.category_text = data.results[i].category_text;
								casedata.results.case_title = data.results[i].case_title;
								casedata.results.project_phase_text = data.results[i].project_phase_text;
								casedata.results.qgate_severity_txt = data.results[i].CaseQGates.results[j].qgate_severity_txt;
								casedata.results.qgateName = data.results[i].CaseQGates.results[j].qgate_name;
								casedata.results.qgateDesc = data.results[i].CaseQGates.results[j].qgate_desc;
								casedata.results.qgateStartDate = new Date(data.results[i].CaseQGates.results[j].qgate_start);
								casedata.results.qgateEndDate = new Date(data.results[i].CaseQGates.results[j].qgate_finish);
								casedata.results.qgStartDate = "";
								casedata.results.qgEndDate = "";
								casedata.results.qgateStatusText = data.results[i].CaseQGates.results[j].qgate_status_txt;
								casedata.results.qgateTargetPhase = data.results[i].CaseQGates.results[j].qgate_target_phase_txt;
								// Q-Gate Rating
								casedata.results.CaseQGates.results[j].qgate_rating_key = 0;
								if (data.results[i].CaseQGates.results[j].qgate_severity_txt === "Hazardous" ||
									data.results[i].CaseQGates.results[j].qgate_severity === "00300") {
									casedata.results.qgate_rating_key = 7;
									casedata.results.qgate_severity = "00300";
								} else if (data.results[i].CaseQGates.results[j].qgate_severity_txt === "Very Critical" ||
										   data.results[i].CaseQGates.results[j].qgate_severity === "00200") {
									casedata.results.qgate_rating_key = 5;
									casedata.results.qgate_severity = "00200";
								} else if (data.results[i].CaseQGates.results[j].qgate_severity_txt  === "Critical" ||
										   data.results[i].CaseQGates.results[j].qgate_severity === "00100") {
									casedata.results.qgate_rating_key = 3;
									casedata.results.qgate_severity = "00100";
								} else if (data.results[i].CaseQGates.results[j].qgate_severity_txt  === "OK" ||
										   data.results[i].CaseQGates.results[j].qgate_severity === "00050") {
									casedata.results.qgate_rating_key = 1;
									casedata.results.qgate_severity = "00050";
								} else {
									casedata.results.qgate_rating_key = 0;
									casedata.results.qgate_severity = "00000";
								}
								// Filter on Q-Gate dates ///////
								var severity_txt = data.results[i].CaseQGates.results[j].qgate_severity_txt;
								var start = new Date(data.results[i].CaseQGates.results[j].qgate_start);
								var end = new Date(data.results[i].CaseQGates.results[j].qgate_finish);
								var target_phase_text = data.results[i].CaseQGates.results[j].qgate_target_phase_txt;
								var qGateStatus = data.results[i].CaseQGates.results[j].qgate_status_txt;
								// 1. Analyze filter parameters
								var lv_filter = jQuery.sap.getUriParameters().get("filter");
								if (lv_filter === undefined || lv_filter === null) {
									lv_filter =	"case_type eq 'ZS02'";
								}
								var pos_s1 = lv_filter.indexOf("qgate_start_date");
								if ( pos_s1 > -1 ) {
									var lv_qgate_finish_date = lv_filter.slice(pos_s1 + 29, pos_s1 + 39);
									var url_s1year = lv_qgate_finish_date.slice(0,4);
									var url_s1month = lv_qgate_finish_date.slice(5,7);
									var url_s1day = lv_qgate_finish_date.slice(8,10);
									var url_s1date = new Date('"' + url_s1year + "-"  + url_s1month + "-" + url_s1day + '"');
									var comp_s1 = lv_filter.slice(pos_s1 + 17, pos_s1 + 19);
								}	
								var pos_s2 = lv_filter.lastIndexOf("qgate_start_date");
								if ( pos_s2 > -1 && pos_s1 != pos_s2 ) {
									var lv_qgate_finish_date = lv_filter.slice(pos_s2 + 29, pos_s2 + 39);
									var url_s2year = lv_qgate_finish_date.slice(0,4);
									var url_s2month = lv_qgate_finish_date.slice(5,7);
									var url_s2day = lv_qgate_finish_date.slice(8,10);
									var url_s2date = new Date('"' + url_s2year + "-" + url_s2month + "-" + url_s2day + '"');
									var comp_s2 = lv_filter.slice(pos_s2 + 17, pos_s2 + 19);
								}
								var pos_f1 = lv_filter.indexOf("qgate_finish_date");
								if ( pos_f1 > -1 ) {
									var lv_qgate_finish_date = lv_filter.slice(pos_f1 + 30, pos_f1 + 40);
									var url_f1year = lv_qgate_finish_date.slice(0,4);
									var url_f1month = lv_qgate_finish_date.slice(5,7);
									var url_f1day = lv_qgate_finish_date.slice(8,10);
									var url_f1date = new Date('"' + url_f1year + "-" + url_f1month + "-" + url_f1day + '"');
									var comp_f1 = lv_filter.slice(pos_f1 + 18, pos_f1 + 20);
								}
								var pos_f2 = lv_filter.lastIndexOf("qgate_finish_date");
								if ( pos_f2 > -1 && pos_f1 != pos_f2 ) {
									var lv_qgate_finish_date = lv_filter.slice(pos_f2 + 30, pos_f2 + 40);
									var url_f2year = lv_qgate_finish_date.slice(0,4);
									var url_f2month = lv_qgate_finish_date.slice(5,7);
									var url_f2day = lv_qgate_finish_date.slice(8,10);
									var url_f2date = new Date('"' + url_f2year + "-" + url_f2month +"-" + url_f2day + '"');
									var comp_f2 = lv_filter.slice(pos_f2 + 18, pos_f2 + 20);
								}
								// 2. Check if Q-Gate is within date selection
								var qGateInSelection = 'Y';
								// 2.1. Check if qgate start date filter is active	
								if ( pos_s1 > -1 || pos_s2 > -1 ) {
									// At least one qgate start date filter is used
									// Check all combinations of dates and comparison operators
									// Q-Gate start date 1
									if ( pos_s1 > -1 && comp_s1 == 'ge' ) {
										if ( url_s1date >= start ) { qGateInSelection = 'N'; }
									}
									if ( pos_s1 > -1 && comp_s1 == 'eq' ) {
										if ( url_s1date != start ) { qGateInSelection = 'N'; }
									}
									if ( pos_s1 > -1 && comp_s1 == 'le' ) {
										if ( url_s1date <= start ) { qGateInSelection = 'N'; }
									}
									// Q-Gate start date 2
									if ( pos_s2 > -1 && comp_s2 == 'ge' ) {
										if ( url_s2date >= start ) { qGateInSelection = 'N'; }
									}
									if ( pos_s2 > -1 && comp_s2 == 'eq' ) {
										if ( url_s2date != start ) { qGateInSelection = 'N'; }
									}
									if ( pos_s2 > -1 && comp_s2 == 'le' ) {
										if ( url_s2date <= start ) { qGateInSelection = 'N'; }
									}
								} else {
									// Q-Gate start date filter is not used
									// Check rolling filters for qgate start date
									if (jQuery.sap.getUriParameters().get("qgstart") != null) {
										var lv_qgstart_from = jQuery.sap.getUriParameters().get("qgstart").substring(0, jQuery.sap.getUriParameters().get("qgstart").indexOf("/"));
										var lv_qgstart_to = jQuery.sap.getUriParameters().get("qgstart").substring(jQuery.sap.getUriParameters().get("qgstart").indexOf("/"));
										var lv_date_today = new Date();
										var lv_date_qgstart_from = new Date();
										var lv_date_qgstart_to = new Date();
										var index = 0;
										var day;
										var month;
										var year;
										var lv_general_from;
										var lv_general_to;
										var lv_month_from;
										var lv_month_to;
										var lv_day_from;
										var lv_day_to;
										// 'Day' or 'Month' used for 'from' date?
										if (lv_qgstart_from.indexOf("month") > -1) {
											lv_general_from = lv_qgstart_from.substring(3, lv_qgstart_from.length - 5);
											lv_date_qgstart_from.setMonth(lv_date_today.getMonth() + parseInt(lv_general_from));
										} else if (lv_qgstart_from.indexOf("days") > -1) {
											lv_general_from = lv_qgstart_from.substring(3, lv_qgstart_from.length - 4);
											lv_date_qgstart_from.setTime(lv_date_today.getTime() + parseInt(lv_general_from) * 24 * 60 * 60 * 1000);
										} else {
											index = 1; // From date = 0						
										}
										lv_month_from = (lv_date_qgstart_from.getMonth() + 1).toString();
										if (lv_month_from.length == 1)
											lv_month_from = "0" + lv_month_from;
										lv_day_from = (lv_date_qgstart_from.getDate()).toString();
										if (lv_day_from.length == 1)
											lv_day_from = "0" + lv_day_from;
										// 'Day' or 'Month' used for 'to' date?
										if (lv_qgstart_to.indexOf("month") > -1) {
											lv_general_to = lv_qgstart_to.substring(4, lv_qgstart_to.length - 5);
											lv_date_qgstart_to.setMonth(lv_date_today.getMonth() + parseInt(lv_general_to));
										} else if (lv_qgstart_to.indexOf("days") > -1) {
											lv_general_to = lv_qgstart_to.substring(4, lv_qgstart_to.length - 4);
											lv_date_qgstart_to.setTime(lv_date_today.getTime() + parseInt(lv_general_to) * 24 * 60 * 60 * 1000);
										} else {
											index = 2; // To date = 0							
										}				
										// To date
										lv_month_to = (lv_date_qgstart_to.getMonth() + 1).toString();
										if (lv_month_to.length == 1)
											lv_month_to = "0" + lv_month_to;
										lv_day_to = (lv_date_qgstart_to.getDate()).toString();
										if (lv_day_to.length == 1)
											lv_day_to = "0" + lv_day_to;
										// Create full year time stamp to compare with
										if ( index == 0 ) {
											var start_date_from = new Date('"' + lv_date_qgstart_from.getFullYear().toString() + "-" + lv_month_from + "-" + lv_day_from + '"');
											var start_date_to = new Date('"' + lv_date_qgstart_to.getFullYear().toString() + "-" + lv_month_to + "-" + lv_day_to + '"');
										}
										if ( index == 1 ) {
											var start_date_from = new Date("1970-01-01");
											var start_date_to = new Date('"' + lv_date_qgstart_to.getFullYear().toString() + "-" + lv_month_to + "-" + lv_day_to + '"');
										}	
										if ( index == 2 ) {
											var start_date_from = new Date('"' + lv_date_qgstart_from.getFullYear().toString() + "-" + lv_month_from + "-" + lv_day_from + '"');
											var start_date_to = new Date("99991231");
										}
										// Compare and decide if Q-Gate is in range
										if ( start < start_date_from ) { qGateInSelection = 'N'; }
										if ( start > start_date_to ) { qGateInSelection = 'N'; }
									}
								}	
								// 2.2. Check if qgate end date filter parameters are active	
								if ( pos_f1 > -1 || pos_f2 > -1 ) {	
									// At least one qgate finish date filter is used
									// Check all combinations of dates and comparison operators
									// Q-Gate finish date 1
									if ( pos_f1 > -1 && comp_f1 == 'ge' ) {
										if ( url_f1date >= end ) { qGateInSelection = 'N'; }
									}
									if ( pos_f1 > -1 && comp_f1 == 'eq' ) {
										if ( url_f1date != end ) { qGateInSelection = 'N'; }
									}
									if ( pos_f1 > -1 && comp_f1 == 'le' ) {
										if ( url_f1date <= end ) { qGateInSelection = 'N'; }
									}
									// Q-Gate finish date 2
									if ( pos_f2 > -1 && comp_f2 == 'ge' ) {
										if ( url_f2date >= end ) { qGateInSelection = 'N'; }
									}
									if ( pos_f2 > -1 && comp_f2 == 'eq' ) {
										if ( url_f2date != end ) { qGateInSelection = 'N'; }
									}
									if ( pos_f2 > -1 && comp_f2 == 'le' ) {
										if ( url_f2date <= end ) { qGateInSelection = 'N'; }
									}
								} else {
									// Q-Gate finish date filter is not used
									// Check rolling filters for qgate end date
									if (jQuery.sap.getUriParameters().get("qgfinish") != null) {
										var lv_qgfinish_from = jQuery.sap.getUriParameters().get("qgfinish").substring(0, jQuery.sap.getUriParameters().get("qgfinish").indexOf("/"));
										var lv_qgfinish_to = jQuery.sap.getUriParameters().get("qgfinish").substring(jQuery.sap.getUriParameters().get("qgfinish").indexOf("/"));
										var lv_date_today = new Date();
										var lv_date_qgfinish_from = new Date();
										var lv_date_qgfinish_to = new Date();
										var index = 0;
										var day;
										var month;
										var year;
										// 'Day' or 'Month' used for 'from' date?
										if (lv_qgfinish_from.indexOf("month") > -1) {
											lv_general_from = lv_qgfinish_from.substring(3, lv_qgfinish_from.length - 5);
											lv_date_qgfinish_from.setMonth(lv_date_today.getMonth() + parseInt(lv_general_from));
										} else if (lv_qgfinish_from.indexOf("days") > -1) {
											lv_general_from = lv_qgfinish_from.substring(3, lv_qgfinish_from.length - 4);
											lv_date_qgfinish_from.setTime(lv_date_today.getTime() + parseInt(lv_general_from) * 24 * 60 * 60 * 1000);
										} else {
											index = 1; // From date = 0
										}	
										lv_month_from = (lv_date_qgfinish_from.getMonth() + 1).toString();
										if (lv_month_from.length == 1)
											lv_month_from = "0" + lv_month_from;
										lv_day_from = (lv_date_qgfinish_from.getDate()).toString();
										if (lv_day_from.length == 1)
											lv_day_from = "0" + lv_day_from;
										// 'Day' or 'Month' used for 'to' date?
										if (lv_qgfinish_to.indexOf("month") > -1) {
											lv_general_to = lv_qgfinish_to.substring(4, lv_qgfinish_to.length - 5);
											lv_date_qgfinish_to.setMonth(lv_date_today.getMonth() + parseInt(lv_general_to));
										} else if (lv_qgfinish_to.indexOf("days") > -1) {
											lv_general_to = lv_qgfinish_to.substring(4, lv_qgfinish_to.length - 4);
											lv_date_qgfinish_to.setTime(lv_date_today.getTime() + parseInt(lv_general_to) * 24 * 60 * 60 * 1000);
										} else {
											index = 2; // To date = 0						
										}
										// To date
										lv_month_to = (lv_date_qgfinish_to.getMonth() + 1).toString();
										if (lv_month_to.length == 1)
											lv_month_to = "0" + lv_month_to;
										lv_day_to = (lv_date_qgfinish_to.getDate()).toString();
										if (lv_day_to.length == 1)
											lv_day_to = "0" + lv_day_to;
										// Create full year time stamp to compare with
										if ( index == 0 ) {
											var start_date_from = new Date('"' + lv_date_qgfinish_from.getFullYear().toString() + "-" + lv_month_from + "-" + lv_day_from + '"');
											var start_date_to = new Date('"' + lv_date_qgfinish_to.getFullYear().toString() + "-" + lv_month_to + "-" + lv_day_to + '"');
										}
										if ( index == 1 ) {
											var start_date_from = new Date("1970-01-01");
											var start_date_to = new Date('"' + lv_date_qgfinish_to.getFullYear().toString() + "-" + lv_month_to + "-" + lv_day_to + '"');
										}	
										if ( index == 2 ) {
											var start_date_from = new Date('"' + lv_date_qgfinish_from.getFullYear().toString() + "-" + lv_month_from + "-" + lv_day_from + '"');
											var start_date_to = new Date("99991231");
										}
										// Compare and decide if Q-Gate is in range
										if ( end < start_date_from ) { qGateInSelection = 'N'; }
										if ( end > start_date_to ) { qGateInSelection = 'N'; }
									}
								};
								// 2.3. Q-Gate Status
								var qGateStatusInSelection = 'N';
								var filter = lv_filter;
								var posStatusURL = filter.indexOf("qgate_status");
								// Check if filter qgate_status is used
								if ( posStatusURL > -1 ) {
									for (var k = 0; k < 10; k++) {
										var posStatusURL = filter.indexOf("qgate_status");
										if ( posStatusURL > -1 ) {
											filter = filter.slice ( posStatusURL + 17 );
											var pos2 = filter.indexOf( "'" );
											var statusURL = filter.slice ( 0, pos2 );
											if ( statusURL == qGateStatus ) {
												qGateStatusInSelection = 'Y';
												break;
											}
										} else {
											break;
										}
									}
								} else {
									// Filter qgate_status is not used!
									qGateStatusInSelection = 'Y';
								}		
								if ( qGateStatusInSelection == 'N' ) {
									qGateInSelection = 'N';
								}
								// 2.4. Q-Gate Rating
								var qGateRatingInSelection = 'N';
								var filter = lv_filter;
								var posRatingURL = filter.indexOf("qgate_rating");
								// Check if filter qgate_rating is used
								if ( posRatingURL > -1) {
									for (var k = 0; k < 10; k++) {
										var posRatingURL = filter.indexOf("qgate_rating");
										if ( posRatingURL > -1 ) {
											filter = filter.slice ( posRatingURL + 17 );
											var pos2 = filter.indexOf( "'" );
											var ratingURL = filter.slice ( 0, pos2 );
											if ( ratingURL == severity_txt ) {
												qGateRatingInSelection = 'Y';
												break;
											}
										} else {
											break;
										}
									}
								} else {
									// Filter qgate_rating is not used!
									qGateRatingInSelection = 'Y';
								}
								if ( qGateRatingInSelection == 'N' ) {
									qGateInSelection = 'N';
								}
								// 2.5. Q-Gate Target Phase
								var qGateTargetPhaseInSelection = 'N';
								var filter = lv_filter;
								var posTargetPhaseURL = filter.indexOf("qgate_target_phase");
								// Check if filter qgate_target_phase is used
								if ( posTargetPhaseURL > -1 ) {
									for (var k = 0; k < 10; k++) {
										var posTargetPhaseURL = filter.indexOf("qgate_target_phase");
										if ( posTargetPhaseURL > -1) {
											filter = filter.slice ( posTargetPhaseURL + 23 );
											var pos2 = filter.indexOf( "'" );
											var targetPhaseURL = filter.slice ( 0, pos2 );
												if ( targetPhaseURL == target_phase_text ) {
													qGateTargetPhaseInSelection = 'Y';
													break;
												}
										} else {
											break;
										}
									}
								} else {
									// Filter qgate_rating is not used!
									qGateTargetPhaseInSelection = 'Y';
								}
								if ( qGateTargetPhaseInSelection == 'N' ) {
									qGateInSelection = 'N';
								}
								// Final decission is done here!
								if (qGateInSelection == 'Y') {
									dataCopy.results.push(casedata.results);
								}
							}	
						} else {
							if (addCaseWithoutQGate === "yes") {
								data.results[i].qgateName = "Case without Q-Gates";
								data.results[i].qgateDesc = "-";
								data.results[i].qgateStartDate = "";
								data.results[i].qgateEndDate = "";
								data.results[i].qgStartDate = "";
								data.results[i].qgEndDate = "";
								data.results[i].qgateStatusText = "-"
								data.results[i].qgateTargetPhase = "-";
								dataCopy.results.push(data.results[i]);
							}
						}
					}
					data.results = JSON.parse(JSON.stringify(dataCopy.results));
					// Continue usual processing
					var jsonModel = new JSONModel();
					jsonModel.setSizeLimit(data.results.length);
					this._processResult(data.results);
					data.results = this._sortByRating(data.results, "desc");
					data.results = this._sortByStartDate(data.results);
					this._caseList = data.results;
					jsonModel.setData(data);
					var allCaseModel = new JSONModel();
					allCaseModel.setSizeLimit(data.results.length);
					allCaseModel.setData(data);
					this.setModel(allCaseModel, "allPageCases");
					if (this.noAuth !== "x") {
						if (data.results.length === 0) {
							MessageToast.show("Data Collection completed, but no Data in Selection", {
								width: "360px",
								duration: 7000
							});
						}
					}
					this.initPagination();
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
			for (var i = 0; i < l; i++) {
				// Q-Gate Rating
				results[i].qgate_rating_key = 0;
				if (results[i].qgate_severity_txt === "Hazardous") {
					results[i].qgate_rating_key = 7;
					nRed++;
				}
				if (results[i].qgate_severity_txt === "Very Critical") {
					results[i].qgate_rating_key = 5;
					nRed++;
				}
				if (results[i].qgate_severity_txt  === "Critical") {
					results[i].qgate_rating_key = 3;
					nYellow++;
				}
				if (results[i].qgate_severity_txt  === "OK") {
					results[i].qgate_rating_key = 1;
					nGreen++;
				}
				// Q-Gate dates
				if (results[i].qgateStartDate != "") {
					var dStart = new Date(results[i].qgateStartDate);
					var qgStart = dStart.toString();
					var qgStartDay = qgStart.slice(8,10);
					var qgStartMonth = qgStart.slice(4,7);
					var qgStartYear = qgStart.slice(11,15);
					results[i].qgStartDate = qgStartDay + " " + qgStartMonth + " " + qgStartYear;
					var dEnd = new Date(results[i].qgateEndDate);
					var qgEnd = dEnd.toString();
					var qgEndDay = qgEnd.slice(8,10);
					var qgEndMonth = qgEnd.slice(4,7);
					var qgEndYear = qgEnd.slice(11,15);
					results[i].qgEndDate = qgEndDay + " " + qgEndMonth + " " + qgEndYear;
				} else {
					results[i].qgateStartDate = "99991231";
					results[i].qgStartDate = "-";
					results[i].qgEndDate = "";
				}
				// Modify data
				if (results[i].qgateName === "") {
					results[i].qgateName = "-";
				}
				if (results[i].qgateDesc === "") {
					results[i].qgateDesc = "-";
				}
				if (results[i].category_text === "") {
					results[i].category_text = "-";
				}
				if (results[i].case_title === "") {
					results[i].case_title = "-";
				}
				if (results[i].status_text === "") {
					results[i].status_text = "-";
				}
				if (results[i].project_phase_text === "") {
					results[i].project_phase_text = "-";
				}
				if (results[i].service_team_name === "") {
					results[i].service_team_name = "N/A";
				}
				if (results[i].responsible_person === "") {
					results[i].responsible_person = "-";
				}
				if (results[i].processor_person === "") {
					results[i].processor_person = "-";
				}
				if (results[i].qgateTargetPhase === "") {
					results[i].qgateTargetPhase = "-";
				}
				if (results[i].qgateStatusText === "") {
					results[i].qgateStatusText = "-";
				}
				// Other data
				if (i < 1) {
					this._url_pdf_cases = "&CASE_ID=" + results[i].case_id;
				} else {
					if (results[i].case_id !== results[i-1].case_id) {
						this._url_pdf_cases = this._url_pdf_cases + "," + results[i].case_id;
					}
				}
			}
			this.oUIModel.setProperty("/caseNumber", l);
			this.oUIModel.setProperty("/redNumber", nRed);
			this.oUIModel.setProperty("/greenNumber", nGreen);
			this.oUIModel.setProperty("/yellowNumber", nYellow);
		},

		getCWFromDate: function (getdate) {
			var a, b, c, d, e, f, g, n, s, w;
			var $y, $m, $d;
			$y = getdate.getFullYear();
			$m = getdate.getMonth() + 1;
			$d = getdate.getDate();
			if ($m <= 2) {
				a = $y - 1;
				b = (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0);
				c = ((a - 1) / 4 | 0) - ((a - 1) / 100 | 0) + ((a - 1) / 400 | 0);
				s = b - c;
				e = 0;
				f = $d - 1 + (31 * ($m - 1));
			} else {
				a = $y;
				b = (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0);
				c = ((a - 1) / 4 | 0) - ((a - 1) / 100 | 0) + ((a - 1) / 400 | 0);
				s = b - c;
				e = s + 1;
				f = $d + ((153 * ($m - 3) + 2) / 5) + 58 + s;
			}
			g = (a + b) % 7;
			d = (f + g - e) % 7;
			n = (f + 3 - d) | 0;
			if (n < 0) {
				w = 53 - ((g - s) / 5 | 0);
			} else if (n > 364 + s) {
				w = 1;
			} else {
				w = (n / 7 | 0) + 1;
			}
			$y = $m = $d = null;
			return w;
		},

		readURL: function () {
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
			this.oUIModel.setProperty("/theme", this.layout === "dark" ? "dark" : "blue");
			this.oUIModel.setProperty("/layout", this.layout);
			// Mask data
			if (jQuery.sap.getUriParameters().get("MaskData") !== null) {
				this.maskdata = jQuery.sap.getUriParameters().get("MaskData").toUpperCase();
			} else {
				this.maskdata = "NO";
			}
			this.oUIModel.setProperty("/maskData", this.maskdata);
			// Title
			if (jQuery.sap.getUriParameters().get("title") == null) {
				this.title = "MDR6A - Q-Gate List";
				this.oUIModel.setProperty("/title", "Q-Gate List");
			} else {
				this.title = jQuery.sap.getUriParameters().get("title");
				this.oUIModel.setProperty("/title", this.title);
			}
			if (jQuery.sap.getUriParameters().get("run_title") === "")
				this.run_title = "no";
			// Other parameters
			if (jQuery.sap.getUriParameters().get("refreshInterval") !== null)
				this.refreshInterval = 60 * jQuery.sap.getUriParameters().get("refreshInterval");
			if (jQuery.sap.getUriParameters().get("flipInterval") !== null)
				this.flipInterval = jQuery.sap.getUriParameters().get("flipInterval");
			// Test ////////////
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
			//	this.filter =
			//		"customer_bp_id eq '0000160073' and (status eq 'New' or status eq 'In Process' or" +
			//		" status eq 'In Escalation' or status eq 'In Management Review') and case_type eq 'ZS02'";
			//	this.filter =
			//		"(case_id eq '20001283' or case_id eq '20000982' or case_id eq '20000134' or" +
			//		" case_id eq '20001021' or case_id eq '20001967') and case_type eq 'ZS02'";
			//	this.filter =
			//		"(case_id eq '20002125' or case_id eq '20000982' or case_id eq '20000134' or" +
			//		" case_id eq '20001021' or case_id eq '20001967') and case_type eq 'ZS02'";
			//	this.filter =
			//		"case_id eq '20001967' and case_type eq 'ZS02'";
			//	this.filter =
			//		"(case_id eq '20000601' or case_id eq '20002181' or case_id eq '20001283')" +
			//		" and case_type eq 'ZS02'";
			// Dashboard analyzer
			if (jQuery.sap.getUriParameters().get("da_test") !== null)
				this.da_test = jQuery.sap.getUriParameters().get("da_test");
			// PPT
			if (jQuery.sap.getUriParameters().get("ppt") !== null)
				this._selectedCase = jQuery.sap.getUriParameters().get("ppt");
			// End Test ////////
			// URL parameters with dates
			var datetoday = new Date();
			var date = new Date();
			var month;
			// golivestart=now-2&goliveend=now+4
			if (jQuery.sap.getUriParameters().get("golivestart") !== null) {
				this.golivestart = jQuery.sap.getUriParameters().get("golivestart").substring(3);
				date.setTime(datetoday.getTime() + this.golivestart * 7 * 24 * 60 * 60 * 1000);
				month = date.getMonth() + 1;
				var dateStart = date.getFullYear() + "-" + month + "-" + date.getDate() + "T00:00:00";
				this.filter = "go_live ge datetime'" + dateStart + "'";
			}
			if (jQuery.sap.getUriParameters().get("goliveend") !== null) {
				this.goliveend = jQuery.sap.getUriParameters().get("goliveend").substring(3);
				date.setTime(datetoday.getTime() + this.goliveend * 7 * 24 * 60 * 60 * 1000);
				month = date.getMonth() + 1;
				var dateEnd = date.getFullYear() + "-" + month + "-" + date.getDate() + "T00:00:00";
				if (jQuery.sap.getUriParameters().get("golivestart") === null) {
					this.filter = "go_live le datetime'" + dateEnd + "'";
				} else {
					this.filter += " and go_live le datetime'" + dateEnd + "'";
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
					this.filter += " and (qgate_start_date ge datetime'" + lv_date_qgstart_from.getFullYear().toString() + "-" + lv_month_from +
						"-" +
						lv_day_from + "T00:00:00' and " + "qgate_start_date le datetime'" + lv_date_qgstart_to.getFullYear().toString() +
						"-" + lv_month_to + "-" + lv_day_to + "T23:59:59')";
				} else if (lv_index == 1) {
					this.filter += " and (qgate_start_date le datetime'" + lv_date_qgstart_to.getFullYear().toString() + "-" + lv_month_to + "-" +
						lv_day_to + "T23:59:59')";
				} else if (lv_index == 2) {
					this.filter += " and (qgate_start_date ge datetime'" + lv_date_qgstart_from.getFullYear().toString() + "-" + lv_month_from +
						"-" +
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
					this.filter += "and (qgate_finish_date ge datetime'" + lv_date_qgfinish_from.getFullYear().toString() + "-" + lv_month_from +
						"-" +
						lv_day_from + "T00:00:00' " + "and " + "qgate_finish_date le datetime'" +
						lv_date_qgfinish_to.getFullYear().toString() + "-" + lv_month_to + "-" + lv_day_to + "T23:59:59')";
				} else if (lv_index == 1) {
					this.filter += "and (qgate_finish_date le datetime'" + lv_date_qgfinish_to.getFullYear().toString() + "-" + lv_month_to + "-" +
						lv_day_to + "T23:59:59')";
				} else if (lv_index == 2) {
					this.filter += "and (qgate_finish_date ge datetime'" + lv_date_qgfinish_from.getFullYear().toString() + "-" + lv_month_from +
						"-" +
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
					this.filter += "and (follow_up ge datetime'1970-01-01T00:00:00' and follow_up le datetime'" + lv_date_followUp_to.getFullYear()
						.toString() +
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
				var lv_changetime_to = jQuery.sap.getUriParameters().get("changetime").substring(jQuery.sap.getUriParameters().get("changetime")
					.indexOf(
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
				if (iHeight !== null && iHeight > 0) {
					iHeight = iHeight;
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
				var oPaginator = new CustomPaginator("table-paginator-MDR6A", {
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

		_sortByStartDate: function (data, sortDir) {
			if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.qgateStartDate) < (value2.qgateStartDate) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.qgateStartDate) < (value2.qgateStartDate) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
		},

		_sortByRating: function (data, sortDir) {
			if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.qgate_rating_key) < (value2.qgate_rating_key) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.qgate_rating_key) < (value2.qgate_rating_key) ? -1 : 1;
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
			//	return d.case_id;
				console.log(d.case_id + "-" + (d.qgateTargetPhase?d.qgateTargetPhase:"") + "-" + (d.qgateStartDate?d.qgateStartDate:""));
				return d.case_id + "-" + (d.qgateTargetPhase?d.qgateTargetPhase:" ") + "-" + (d.qgateStartDate?d.qgateStartDate:"");
			});
			var filteredCaseModel = new JSONModel();
			filteredCaseModel.setData({
				results: sortedCases
			});
			this.setModel(filteredCaseModel, "filteredCases");
			this.updateOnePageDataToTable(1);
			this.resetPagination();
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
					'mccprofile': 'MDR6A_AuthCheck'
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
						that.noAuth = "x";
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

		filters: function (oEvent) {
			setTimeout(function () {
				var oTable = this.getView().byId("caseTable");
				var aFilters = oTable.getBinding().aFilters;
				var allCaseModel = this.getModel("allPageCases");
				var filteredCases = allCaseModel.getData().results;
				if (aFilters !== null && aFilters.length > 0) {
					filteredCases = allCaseModel.getData().results.filter(function (item, index) {
						return aFilters.reduce(function (acc, filter) {
							//Log.error(item[filter.sPath]);
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
				var aSorters = this.aCurrentSorters; //oTable.getBinding().aSorters;
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
					this.loadModelFromBackend();
					refreshTimer = 0;
				}
				//flip page for list view
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
			window.open("https://go.sap.corp/MDR6_A-info", "MDR6A - Info");
		},

		openMDR6: function (oEvent) {
			var URL = this.URL;
			URL = URL + "#/MDR6";
			window.location.replace(URL);
		},

		openMDR7: function (oEvent) {
			var URL = this.URL;
			URL = URL + "#/MDR7";
			window.open(URL);
		},

		openMCCWorkbench: function (oEvent) {
			var iIndex = oEvent.getSource().getParent().getIndex();
			var oData = oEvent.getSource().getParent().getParent().getBinding("rows").getModel().getData();
			var oRowData = oData.results[iIndex];
			var selectedCase = oRowData.case_id;
			var host = 	window.location.host;
			var URL = "";
			if (this.source_IC === "icd") {
				// DEV environment
				URL = "https://" 
					+ "sapit-customersupport-dev-mallard.launchpad.cfapps.eu10.hana.ondemand.com"
					+ "/ac787746-45bc-46f6-8f49-d14fd57451fe.mccworkbench.comsapmccworkbench-23.09.10/index.html#/"
					+ selectedCase;
			} else if (this.source_IC === "ict") {
				// TEST environment
				URL = "https://"
					+ "fiorilaunchpad-sapitcloudt.dispatcher.hana.ondemand.com/sites#mccissuetracking-Display&/"
					+ selectedCase;
			} else if (this.source_IC === "icp") {
				// PROD environment
				URL = "https://"
					+ "fiorilaunchpad.sap.com/sites#mccworkbench-Display&/"
					+ selectedCase;
			} else {
				// Error - Choose PROD environment
				URL = "https://"
					+ "fiorilaunchpad.sap.com/sites#mccworkbench-Display&/"
					+ selectedCase;
			}
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
				url = url + "&MDR=6A";
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
										//  + location.href, "PPT", "resizable=1");
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
			if (!this.singleCaseDownloadDialog) {
				var DEV = "mdrdashboards-br339jmc4c";   // icd
				var TEST = "mdrdashboards-sapitcloudt"; // ict
				var PROD = "mdrdashboards-sapitcloud";  // icp
				// Modify location.href
				var index = location.href.lastIndexOf("#");
				var url = location.href.slice(0, index);
				url = url + "&MDR=6A";
				//	Encode '+' sign
				for (var j = 0; j < url.length; j++) {
					if (url.indexOf("+") > -1) {
						url = url.replace("+", "%2B");
					} else {
						break;
					}
				}
				// Create dialog				
				this.singleCaseDownloadDialog = new sap.m.Dialog("CaseDashboardsSingle", {
					title: "Additional Options",
					height: "100%",
					width: "100%",
					resizable: true,
					content: [
						new sap.ui.layout.VerticalLayout({
							width: "100%",
							content: [
								new sap.m.Button({
									text: "MCC One Dashboard",
									type: sap.m.ButtonType.Accept,
									width: "100%",
									press: function() {
										this.singleCaseDownloadDialog.close();
										var URL = "";
										var host = "";
										var newHost = "";
										if (this ._selectedERP === 0 || this._selectedERP === "") {
											// No ERP number in case
											MessageToast.show("No ERP customer number maintained in Engagement Case", {
												duration: 10000
											});
											if (this.source_IC === "icd") {
												// DEV environment
												URL = "https:" 
													+ "//sapit-customersupport-dev-mallard.launchpad.cfapps.eu10.hana.ondemand.com" 
													+ "/a2cdeadc-4fa1-4a11-8abc-f6b59fa48c66.mcconedashboard.comsapmcconedashboard";
											} else if (this.source_IC === "ict") {
												// TEST environment
												URL = [
													"https://",
													"sapit-home-test-004.launchpad.cfapps.eu10.hana.ondemand.com",
													"/site/Home#mcconedashboard-Display",
													ERP
												].join("");
											} else if (this.source_IC === "icp") {
												// PROD environment
												URL = [
													"https://",
													"sapit-home-prod-004.launchpad.cfapps.eu10.hana.ondemand.com",
													"/site/Home#mcconedashboard-Display",
													ERP
												].join("");
											} else {
												// Error in determination of environment - Choose PROD environment to be on the safe side
												URL = [
													"https://",
													"sapit-home-prod-004.launchpad.cfapps.eu10.hana.ondemand.com",
													"/site/Home#mcconedashboard-Display",
													ERP
												].join("");
											}
										} else {
											// ERP number in case
											var ERP = ("0000000000" + this._selectedERP).slice(-10);
											if (this.source_IC === "icd") {
												// DEV environment
												URL = "https:" 
													+ "//sapit-customersupport-dev-mallard.launchpad.cfapps.eu10.hana.ondemand.com" 
													+ "/a2cdeadc-4fa1-4a11-8abc-f6b59fa48c66.mcconedashboard.comsapmcconedashboard/index.html#/Customer/"
													+ ERP;
											} else if (this.source_IC === "ict") {
												// TEST environment
												URL = [
													"https://",
													"sapit-home-test-004.launchpad.cfapps.eu10.hana.ondemand.com",
													"/site/Home#mcconedashboard-Display&/Customer/",
													ERP
												].join("");
											} else if (this.source_IC === "icp") {
												// PROD environment
												URL = [
													"https://",
													"sapit-home-prod-004.launchpad.cfapps.eu10.hana.ondemand.com",
													"/site/Home#mcconedashboard-Display&/Customer/",
													ERP
												].join("");
											} else {
												// Error in determination of environment - Choose PROD environment to be on the safe side
												URL = [
													"https://",
													"sapit-home-prod-004.launchpad.cfapps.eu10.hana.ondemand.com",
													"/site/Home#mcconedashboard-Display&/Customer/",
													ERP
												].join("");
											}
										}
										window.open(URL);
									}.bind(this)
								}),
								new sap.m.Button({
									text: "Open MCC Workbench",
									type: sap.m.ButtonType.Accept,
									width: "100%",
									press: function() {
										this.singleCaseDownloadDialog.close();
										var host = 	window.location.host;
										var index = host.indexOf("sapitcloudt");
										var URL = "";
										if (this.source_IC === "icd") {
											// DEV environment
											URL = "https://" 
												+ "sapit-customersupport-dev-mallard.launchpad.cfapps.eu10.hana.ondemand.com/site#mccworkbench-Display&/"
												+ this._selectedCase;
										} else if (this.source_IC === "ict") {
											// TEST environment
											URL = "https://"
												+ "sapit-home-test-004.launchpad.cfapps.eu10.hana.ondemand.com/site#mccworkbench-Display&/"
												+ this._selectedCase;
										} else if (this.source_IC === "icp") {
											// PROD environment
											URL = "https://"
												+ "sapit-home-prod-004.launchpad.cfapps.eu10.hana.ondemand.com/site#mccworkbench-Display&/"
												+ this._selectedCase;
										} else {
											// Error in determination of environment - Choose PROD environment to be on the safe side
											URL = "https://"
												+ "sapit-home-prod-004.launchpad.cfapps.eu10.hana.ondemand.com/site#mccworkbench-Display&/"
												+ this._selectedCase;
										}
										window.open(URL);
									}.bind(this)
								}),
								new sap.m.Button({
									text: "Open Case Hierarchy",
									type: sap.m.ButtonType.Accept,
									width: "100%",
									press: function() {
										this.singleCaseDownloadDialog.close();
										var host = window.location.host;
										var path = window.location.pathname;
										var URL = "https://" 
											+ host
											+ path
											+ "#/MDR10/"
											+ this._selectedCase;
										window.open(URL);
									}.bind(this)
								}),
								new sap.m.Button({
									text: "Generate detailed PPT",
									type: sap.m.ButtonType.Accept,
									width: "100%",
									press: function() {
										this.singleCaseDownloadDialog.close();
										window.open("https://"
											+ this.source_IC
											+ ".wdf.sap.corp/sap/crm/zscrm_cmg_print?"
											+ "sap-language=EN"
											+ "&output_format=PPTX"
											+ "&CASE_ID="
											+ this._selectedCase
											+ "&MDR_URL="
											+ url, "PPT", "resizable=1");
										//	+ location.href, "PPT", "resizable=1");											
									}.bind(this)
								}),
								new sap.m.Button({
									text: "Cancel",
									type: sap.m.ButtonType.Reject,
									icon: "sap-icon://employee",
									width: "100%",
									press: function() {
										this.singleCaseDownloadDialog.close();
									}.bind(this)
								})
							]
						})
					],
				}).addStyleClass("sapUiContentPadding");
			}
			var iIndex, oData, oRowData;
			iIndex = oEvent.getSource().getParent().getParent().getIndex();
			oData = oEvent.getSource().getParent().getParent().getParent().getBinding("rows").getModel().getData();
			oRowData = oData.results[iIndex];
			this._selectedCase = oRowData.case_id;
			this._selectedSysID = oRowData.sap_system_number;
			this._selectedGU = oRowData.global_ultimate_id;
			var tmp = "0000000000" + parseInt(oRowData.customer_bp_id, 10);
			var tmplength = tmp.length - 10;
			tmp = tmp.substring(tmplength, tmp.length);
			this._selectedBP = tmp;
			this._selectedERP = oRowData.customer_r3_no;
			this.singleCaseDownloadDialog.open();
		}
	});
});