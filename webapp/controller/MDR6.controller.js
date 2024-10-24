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

	return BaseController.extend("corp.sap.mdrdashboards.controller.MDR6", {

		onInit: function () {
			this.source_IC = "icp";
			this.filter = "";
			this._iRowHeight = 60;
			this.refreshInterval = 1800;
			this.flipInterval = 30;
			this.pauseFlip = false;
			this._realDataLength = {};
			this.getSourceICAddr();
			this.selectedYear = location.hostname;
			this.changePageTitle();
			// Style sheet
			jQuery.sap.includeStyleSheet("css/style_mdr6.css", "stylemdr6");
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
				var tracking = new GlobalITTracking("MDR Dashboards", "MDR6 - Q-Gates – V1.1.0");
			} catch (e) {
				console.log("Error: " + e);
			}
			// Mobile Usage Reporting - Events
			// --> Counts Calls of the Application
			sap.git.usage.Reporting.addEvent(this.getOwnerComponent(), "MDR6 - Q-Gates – V1.1.0");
			this.showBusyDialog();
		},

		formatterMDR6: FormatterMDR6,
		
		changePageTitle: function () { 
           	var newPageTitle = "MDR6 - Q-Gates"; 
           	document.title = newPageTitle; 
       	},		
		
		onRouteMatched: function (oEvent) {
			var sRouteName = oEvent.getParameter("name");
			this.readURL();
			this._customizeUI();
			if (sRouteName === "MDR6") {
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
			this.oDataModel = this.getComponentModel();
			var header = {
				"AppIdentifier": "FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ",
				"mccprofile": "MDR6"
			};
			this.oDataModel.setHeaders(header);						
			this.oDataModel.read("/CaseList", {
				urlParameters: {
					$filter: this.filter,
					$expand: "CaseQGates,Products"
				},
				success: function (data) {
					this.hideBusyDialog();
					data.results.push(data.results[0]);
					var jsonModel = new JSONModel();
					jsonModel.setSizeLimit(data.results.length);
					this._processData(data.results);
					this._processResult(data.results);
					data.results = this._sortByRating(data.results);
					data.results = this._sortByDate(data.results);
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
					if (data.results.length > 999) {
						var errortext = "The display of results is restricted to 1000 records."
							+ "\n"
							+ "Please adopt your selection criteria to display less records.";
						MessageToast.show(errortext, {
							duration: 20000,
							width: "30em"
						});
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

		_processData: function (results) {
			for (var i = 0; i < results.length; i++) {	
				// Product
				results[i].product_list = "";
				if (results[i].main_product_description !== "") {
					results[i].product_list = results[i].main_product_description;
					for (var k=0; k < results[i].Products.results.length; k++) {
						if (results[i].Products.results[k].product_description !== "" && 
							results[i].main_product_description !== results[i].Products.results[k].product_description) {
							results[i].product_list = results[i].product_list + ", " + results[i].Products.results[k].product_description;
						}
					}	
				} else {
					for (var k=0; k < results[i].Products.results.length; k++) {
						if (results[i].Products.results[k].product_description !== "") {
							if (k === 0) {
								results[i].product_list = results[i].product_list + results[i].Products.results[k].product_description;
							} else {
								results[i].product_list = results[i].product_list + ", " + results[i].Products.results[k].product_description;
							}
						}
					}	
				}
				// Main product
				if (results[i].main_product_description === "") {
					results[i].main_product_description = "-";
				}
				// Modify data
				if (results[i].project_phase_text === "") {
					results[i].project_phase_text = "N/A";
				}
				if (results[i].category_text === "") {
					results[i].category_text = "N/A";
				}
				if (results[i].scenario_text === "") {
					results[i].scenario_text = "-";
				}	
				if (results[i].use_case_text === "") {
					results[i].use_case_text = "-";
				}
				if (results[i].product_description === "") {
					results[i].product_description = "-";
				}
				if (results[i].product_list === "") {
					results[i].product_list = "-";
				}
				// For export
				if (i === 0) {
				//	this._url_pdf_cases = "&CASE_ID=" + results[i].case_id;
					this._url_pdf_cases = "&CASE_ID=";
				} else if (i === 1) {
					this._url_pdf_cases = this._url_pdf_cases + results[i].case_id;
				} else {
					this._url_pdf_cases = this._url_pdf_cases + "," + results[i].case_id;
				}
			}	
		},

		_processResult: function (results) {
			// Date operations
			this.selectedYear = [];
			var currentDate = new Date();
			var month;
			var year = currentDate.getFullYear();
			this.selectedYear = [];
			for (var k = 0; k < 6; k++) {
				month = currentDate.getMonth() - 1;
				if (month == -1) {
					month = 11;
					this.selectedYear[month] = {};
					this.selectedYear[month].year = currentDate.getFullYear() - 1;
					currentDate.setDate(1);
					currentDate.setMonth(currentDate.getMonth() + 1);
				} else {
					this.selectedYear[month] = {};
					this.selectedYear[month].year = currentDate.getFullYear();
					currentDate.setDate(1);
					currentDate.setMonth(currentDate.getMonth() + 1);
				}
			}
			var that = this;
			var today = "";
			var month;
			var currentDate = new Date();
			var year = currentDate.getFullYear().toString();
			var day = currentDate.getDate();
			if (day < 10) {
				day = "0" + day;
			} else {
				String(day);
			}
			var monthInt = currentDate.getMonth() + 1;
			if (monthInt < 10) {
				month = "0" + monthInt;
			} else {
				month = String(monthInt);
			}
			today = year + month + day;
			// Further variables
			var l = results.length;
			var nRed = 0;
			var nGreen = 0;
			var nYellow = 0;
			// Process entries
			for (var i = 0; i < l; i++) {
				if (i == 0) {
					// Date for Today Line --> Create an additional row for this
					results[0] = {};
					results[0].rating_text = "TODAY";
					if (this.selectedYear[0] != undefined) {
						results[i].january = this.getTodayStatus(this.selectedYear[0].year + "01", today);
					} else {
						results[i].january = "<div></div>";
					}
					if (this.selectedYear[1] != undefined) {
						results[i].february = this.getTodayStatus(this.selectedYear[1].year + "02", today);
					} else {
						results[i].february = "<div></div>";
					}
					if (this.selectedYear[2] != undefined) {
						results[i].march = this.getTodayStatus(this.selectedYear[2].year + "03", today);
					} else {
						results[i].march = "<div></div>";
					}
					if (this.selectedYear[3] != undefined) {
						results[i].april = this.getTodayStatus(this.selectedYear[3].year + "04", today);
					} else {
						results[i].april = "<div></div>";
					}
					if (this.selectedYear[4] != undefined) {
						results[i].may = this.getTodayStatus(this.selectedYear[4].year + "05", today);
					} else {
						results[i].may = "<div></div>";
					}
					if (this.selectedYear[5] != undefined) {
						results[i].june = this.getTodayStatus(this.selectedYear[5].year + "06", today);
					} else {
						results[i].june = "<div></div>";
					}
					if (this.selectedYear[6] != undefined) {
						results[i].july = this.getTodayStatus(this.selectedYear[6].year + "07", today);
					} else {
						results[i].july = "<div></div>";
					}
					if (this.selectedYear[7] != undefined) {
						results[i].august = this.getTodayStatus(this.selectedYear[7].year + "08", today);
					} else {
						results[i].august = "<div></div>";
					}
					if (this.selectedYear[8] != undefined) {
						results[i].september = this.getTodayStatus(this.selectedYear[8].year + "09", today);
					} else {
						results[i].september = "<div></div>";
					}
					if (this.selectedYear[9] != undefined) {
						results[i].october = this.getTodayStatus(this.selectedYear[9].year + "10", today);
					} else {
						results[i].october = "<div></div>";
					}
					if (this.selectedYear[10] != undefined) {
						results[i].november = this.getTodayStatus(this.selectedYear[10].year + "11", today);
					} else {
						results[i].november = "<div></div>";
					}
					if (this.selectedYear[11] != undefined) {
						results[i].december = this.getTodayStatus(this.selectedYear[11].year + "12", today);
					} else {
						results[i].december = "<div></div>";
					}
				}
				if (i > 0) {
					if (results[i].rating_text === "Red") {
						nRed++;
					}
					if (results[i].rating_text === "Green") {
						nGreen++;
					}
					if (results[i].rating_text === "Yellow") {
						nYellow++;
					}
					// Q-Gates
					var length = results[i].CaseQGates.results.length;
					for (var j = 0; j < length; j++) {
						// Sort Q-Gates by start date
						var qgates = {};
						qgates.results = results[i].CaseQGates.results;
						results[i].CaseQGates = this._sortQGatesByStartDate(qgates);
						// Q-Gate number
						results[i].CaseQGates.results[j].qgate_number = j;
						// Check for completeness of qgate dates
						if (results[i].CaseQGates.results[j].qgate_start === "" || 
							results[i].CaseQGates.results[j].qgate_start === undefined ||
							results[i].CaseQGates.results[j].qgate_start === null ||
							results[i].CaseQGates.results[j].qgate_finish === "" ||
							results[i].CaseQGates.results[j].qgate_finish === undefined ||
							results[i].CaseQGates.results[j].qgate_finish === null) {
								break;
							} 
						// Q-Gate start
						var time = (results[i].CaseQGates.results[j].qgate_finish);
						time.setTime(results[i].CaseQGates.results[j].qgate_finish);
						var start = time.toDateString();
						month = time.getMonth() + 1;
						if (month < 10) {
							month = "0" + month;
						} else {
							String(month);
						}
						day = time.getDate();
						if (day < 10) {
							day = "0" + day;
						} else {
							String(day);
						}
						year = time.getFullYear();
						var end = year.toString() + month + day;
						time.setTime(results[i].CaseQGates.results[j].qgate_start);
						start = time.toDateString();
						month = time.getMonth() + 1;
						if (month < 10) {
							month = "0" + month;
						} else {
							String(month);
						}
						day = time.getDate();
						if (day < 10) {
							day = "0" + day;
						} else {
							String(day);
						}
						year = time.getFullYear();
						start = year.toString() + month + day;
						// Q-Gate severity
						var severity;
						switch (results[i].CaseQGates.results[j].qgate_severity) {
						case "00000":
							severity = "N";
							break;
						case "00001":
							severity = "N";
							break;
						case "00050":
							severity = "G";
							break;
						case "00100":
							severity = "Y";
							break;
						case "00200":
							severity = "R";
							break;
						case "00300":
							severity = "R";
							break;
						default:
							severity = "N";
							}
						// Q-Gate name
						if ( results[i].CaseQGates.results[j].qgate_name === "") {
							results[i].CaseQGates.results[j].qgate_name = "-";
						}
						// Q-Gate description
						if ( results[i].CaseQGates.results[j].qgate_desc === "") {
							results[i].CaseQGates.results[j].qgate_desc = "-";
						}
						// Q-Gate status
						if ( results[i].CaseQGates.results[j].qgate_status_txt === "") {
							results[i].CaseQGates.results[j].qgate_status_txt = "-";
						}
						// Q-Gate target phase
						if ( results[i].CaseQGates.results[j].qgate_target_phase_txt === "") {
							results[i].CaseQGates.results[j].qgate_target_phase_txt = "-";
						}
						// Q-Gate number
						switch (results[i].CaseQGates.results[j].qgate_number) {
						case 0:
							results[i].MS1Start = start + "-" + severity;
							results[i].MS1End = end + "-" + severity;
							results[i].CaseQGates.results[j].Description = results[i].CaseQGates.results[j].qgate_name;
							results[i].CaseQGates.results[j].qgate_status_text = results[i].CaseQGates.results[j].qgate_status_txt;
							results[i].CaseQGates.results[j].qgate_target_phase_txt = results[i].CaseQGates.results[j].qgate_target_phase_txt;
							break;
						case 1:
							results[i].MS2Start = start + "-" + severity;
							results[i].MS2End = end + "-" + severity;
							results[i].CaseQGates.results[j].Description = results[i].CaseQGates.results[j].qgate_name;
							results[i].CaseQGates.results[j].qgate_status_text = results[i].CaseQGates.results[j].qgate_status_txt;
							results[i].CaseQGates.results[j].qgate_target_phase_txt = results[i].CaseQGates.results[j].qgate_target_phase_txt;
							break;
						case 2:
							results[i].MS3Start = start + "-" + severity;
							results[i].MS3End = end + "-" + severity;
							results[i].CaseQGates.results[j].Description = results[i].CaseQGates.results[j].qgate_name;
							results[i].CaseQGates.results[j].qgate_status_text = results[i].CaseQGates.results[j].qgate_status_txt;
							results[i].CaseQGates.results[j].qgate_target_phase_txt = results[i].CaseQGates.results[j].qgate_target_phase_txt;
							break;
						case 3:
							results[i].MS4Start = start + "-" + severity;
							results[i].MS4End = end + "-" + severity;
							results[i].CaseQGates.results[j].Description = results[i].CaseQGates.results[j].qgate_name;
							results[i].CaseQGates.results[j].qgate_status_text = results[i].CaseQGates.results[j].qgate_status_txt;
							results[i].CaseQGates.results[j].qgate_target_phase_txt = results[i].CaseQGates.results[j].qgate_target_phase_txt;
							break;
						case 4:
							results[i].MS5Start = start + "-" + severity;
							results[i].MS5End = end + "-" + severity;
							results[i].CaseQGates.results[j].Description = results[i].CaseQGates.results[j].qgate_name;
							results[i].CaseQGates.results[j].qgate_status_text = results[i].CaseQGates.results[j].qgate_status_txt;
							results[i].CaseQGates.results[j].qgate_target_phase_txt = results[i].CaseQGates.results[j].qgate_target_phase_txt;
							break;
						}
					}
					// Collect start dates of the Q-Gates
					var MS1S = results[i].MS1Start;
					var MS1E = results[i].MS1End;
					var MS2S = results[i].MS2Start;
					var MS2E = results[i].MS2End;
					var MS3S = results[i].MS3Start;
					var MS3E = results[i].MS3End;
					var MS4S = results[i].MS4Start;
					var MS4E = results[i].MS4End;
					var MS5S = results[i].MS5Start;
					var MS5E = results[i].MS5End;
					// Create <div> element for each month column ///
					if (this.selectedYear[0] != undefined) {
						results[i].january = this.getInfo(this.selectedYear[0].year + "01", MS1S, MS1E, MS2S, MS2E, MS3S, MS3E, MS4S, MS4E, MS5S, MS5E, today, i, results);
					} else {
						results[i].january = "<div></div>";
					}
					if (this.selectedYear[1] != undefined) {
						results[i].february = this.getInfo(this.selectedYear[1].year + "02", MS1S, MS1E, MS2S, MS2E, MS3S, MS3E, MS4S, MS4E, MS5S, MS5E, today, i, results);
					} else {
						results[i].february = "<div></div>";
					}
					if (this.selectedYear[2] != undefined) {
						results[i].march = this.getInfo(this.selectedYear[2].year + "03", MS1S, MS1E, MS2S, MS2E, MS3S, MS3E, MS4S, MS4E, MS5S, MS5E, today, i, results);
					} else {
						results[i].march = "<div></div>";
					}
					if (this.selectedYear[3] != undefined) {
						results[i].april = this.getInfo(this.selectedYear[3].year + "04", MS1S, MS1E, MS2S, MS2E, MS3S, MS3E, MS4S, MS4E, MS5S, MS5E, today, i, results);
					} else {
						results[i].april = "<div></div>";
					}
					if (this.selectedYear[4] != undefined) {
						results[i].may = this.getInfo(this.selectedYear[4].year + "05", MS1S, MS1E, MS2S, MS2E, MS3S, MS3E, MS4S, MS4E, MS5S, MS5E, today, i, results);
					} else {
						results[i].may = "<div></div>";
					}
					if (this.selectedYear[5] != undefined) {
						results[i].june = this.getInfo(this.selectedYear[5].year + "06", MS1S, MS1E, MS2S, MS2E, MS3S, MS3E, MS4S, MS4E, MS5S, MS5E, today, i, results);
					} else {
						results[i].june = "<div></div>";
					}
					if (this.selectedYear[6] != undefined) {
						results[i].july = this.getInfo(this.selectedYear[6].year + "07", MS1S, MS1E, MS2S, MS2E, MS3S, MS3E, MS4S, MS4E, MS5S, MS5E, today, i, results);
					} else {
						results[i].july = "<div></div>";
					}
					if (this.selectedYear[7] != undefined) {
						results[i].august = this.getInfo(this.selectedYear[7].year + "08", MS1S, MS1E, MS2S, MS2E, MS3S, MS3E, MS4S, MS4E, MS5S, MS5E, today, i, results);
					} else {
						results[i].august = "<div></div>";
					}
					if (this.selectedYear[8] != undefined) {
						results[i].september = this.getInfo(this.selectedYear[8].year + "09", MS1S, MS1E, MS2S, MS2E, MS3S, MS3E, MS4S, MS4E, MS5S, MS5E, today, i, results);
					} else {
						results[i].september = "<div></div>";
					}
					if (this.selectedYear[9] != undefined) {
						results[i].october = this.getInfo(this.selectedYear[9].year + "10", MS1S, MS1E, MS2S, MS2E, MS3S, MS3E, MS4S, MS4E, MS5S, MS5E, today, i, results);
					} else {
						results[i].october = "<div></div>";
					}
					if (this.selectedYear[10] != undefined) {
						results[i].november = this.getInfo(this.selectedYear[10].year + "11", MS1S, MS1E, MS2S, MS2E, MS3S, MS3E, MS4S, MS4E, MS5S, MS5E, today, i, results);
					} else {
						results[i].november = "<div></div>";
					}
					if (this.selectedYear[11] != undefined) {
						results[i].december = this.getInfo(this.selectedYear[11].year + "12", MS1S, MS1E, MS2S, MS2E, MS3S, MS3E, MS4S, MS4E, MS5S, MS5E, today, i, results);
					} else {
						results[i].december = "<div></div>";
					}
				}
				// For sorting and filtering
				results[i].customer_key = results[i].customer_name;
				if (jQuery.sap.getUriParameters().get("disp_date") !== null) {
					var dispDate = jQuery.sap.getUriParameters().get("disp_date").toLowerCase();
				}
				if (dispDate === "lc") {
					results[i].date = results[i].change_time;
					var sdate = results[i].change_time;
					if (sdate) {
						var monthtmp = sdate.substr(0, 10).substring(4, 6);
						var month;
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
						var formattedDate = sdate.substring(6, 8) + " " + month + " " + sdate.substring(0, 4);
					}
					results[i].last_change = formattedDate;
					results[i].displaySortDate = formattedDate;
				} else if (dispDate === "cr") {
					results[i].date = results[i].create_time;
					var sdate = results[i].create_time;
					if (sdate) {
						var monthtmp = sdate.substr(0, 10).substring(4, 6);
						var month;
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
						var formattedDate = sdate.substring(6, 8) + " " + month + " " + sdate.substring(0, 4);
					}
					results[i].last_change = formattedDate;
					results[i].displaySortDate = formattedDate;
				} else {
					results[i].date = results[i].go_live;
					if (results[i].go_live !== undefined && results[i].go_live !== null && results[i].go_live !== "") {
						// Convert golive date /////
						var yearInt = results[i].go_live.getFullYear();
						var monthInt = results[i].go_live.getMonth();
						var dayInt = results[i].go_live.getDate();
						var month = "";
						// Set golive date /////
						switch (monthInt) {
							case 0:
								month = "Jan";
								break;
							case 1:
								month = "Feb";
								break;
							case 2:
								month = "Mar";
								break;
							case 3:
								month = "Apr";
								break;
							case 4:
								month = "May";
								break;
							case 5:
								month = "Jun";
								break;
							case 6:
								month = "Jul";
								break;
							case 7:
								month = "Aug";
								break;
							case 8:
								month = "Sep";
								break;
							case 9:
								month = "Oct";
								break;
							case 10:
								month = "Nov";
								break;
							case 11:
								month = "Dec";
								break;
						}
						results[i].displaySortDate = dayInt + " " + month + " " + yearInt;
					} else {
						results[i].displaySortDate = "";
					}
				}
			}
			if (l > 0) {
				l = l - 1;
				}
			this.oUIModel.setProperty("/caseNumber", l);
			this.oUIModel.setProperty("/redNumber", nRed);
			this.oUIModel.setProperty("/greenNumber", nGreen);
			this.oUIModel.setProperty("/yellowNumber", nYellow);
		},

		getInfo: function (month, MS1S, MS1E, MS2S, MS2E, MS3S, MS3E, MS4S, MS4E, MS5S, MS5E, today, i, results) {
			var addCont = "<div>";
			// Q-Gate 1 ////////
			// Q-Gate Start
			if (MS1S !== undefined && MS1E !== undefined && month === MS1S.substring(0, 6)) {
				var tagMS1S = MS1S.substring(6, 8);
				var tagMS1E = MS1E.substring(6, 8);
				var prozentMS1S = 100 / 31 * tagMS1S;
				var prozentMS1E = 100 / 31 * tagMS1E;
				var tmpProzent = 0;
				if (month == MS1E.substring(0, 6)) {
					tmpProzent = prozentMS1E - prozentMS1S;
				} else {
					tmpProzent = 100 - prozentMS1S;
				}
				// Start dot
				addCont += "<img src='images/MDR6/MS2_" + MS1S.substring(9, 10) + ".png' "
					+ "title='" + results[i].CaseQGates.results[0].Description
					+ " / " + results[i].CaseQGates.results[0].qgate_target_phase_txt
					+ " / Start: " + MS1S.substring(6, 8) + "-" + MS1S.substring(4, 6) + "-" + MS1S.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[0].qgate_status_text
					+ "'"
					+ " style='position: absolute; top: 2px; z-index: 110; left:" + (prozentMS1S - 5) + "%; "
					+ "height: 15px'></img>";
				// Bar
				addCont += "<span class='Start_MS1_" + MS1S.substring(9, 10) + "' "
					+ "title='" + results[i].CaseQGates.results[0].Description
					+ " / " + results[i].CaseQGates.results[0].qgate_target_phase_txt
					+ " / Start: " + MS1S.substring(6, 8) + "-" + MS1S.substring(4, 6) + "-" + MS1S.substring(0, 4)
					+ " / End: " + MS1E.substring(6, 8) + "-" + MS1E.substring(4, 6) + "-" + MS1E.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[0].qgate_status_text
					+ "'"
					+ " style='z-index: 100; top: 6px; width: " + tmpProzent + "%; left:" + (prozentMS1S - 0)
					+ "%'></span>";
			}
			// Q-Gate Middle
			if (MS1S !== undefined && MS1E !== undefined && month > MS1S.substring(0, 6) && month < MS1E.substring(0, 6)) {
				// Bar
				addCont += "<span class='Start_MS1_" + MS1S.substring(9, 10) + "' "
					+ "title='" + results[i].CaseQGates.results[0].Description
					+ " / " + results[i].CaseQGates.results[0].qgate_target_phase_txt
					+ " / Start: " + MS1S.substring(6, 8) + "-" + MS1S.substring(4, 6) + "-" + MS1S.substring(0, 4)
					+ " / End: " + MS1E.substring(6, 8) + "-" + MS1E.substring(4, 6) + "-" + MS1E.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[0].qgate_status_text
					+ "'"
					+ " style='z-index: 100; top: 6px; width: " + 100 + "%; left:" + 0
					+ "%'></span>";
			}
			// Q-Gate End
			if (MS1S !== undefined && MS1E !== undefined && month === MS1E.substring(0, 6)) {
				var tagMS1S = MS1S.substring(6, 8);
				var tagMS1E = MS1E.substring(6, 8);
				var prozentMS1S = 100 / 31 * tagMS1S;
				var prozentMS1E = 100 / 31 * tagMS1E;
				var tmpProzent = 0;
				if (month == MS1E.substring(0, 6)) {
					tmpProzent = prozentMS1E;
				} else {
					tmpProzent = 100 - prozentMS1S;
				}
				// Bar
				if (MS1S !== undefined && MS1E !== undefined && month === MS1S.substring(0, 6)) {
					addCont += "<span class='Start_MS1_" + MS1S.substring(9, 10) + "' "
						+ "title='" + results[i].CaseQGates.results[0].Description
						+ " / " + results[i].CaseQGates.results[0].qgate_target_phase_txt
						+ " / Start: " + tagMS1S + "-" + MS1S.substring(4, 6) + "-" + MS1S.substring(0, 4)
						+ " / End: " + tagMS1E + "-" + MS1E.substring(4, 6) + "-" + MS1E.substring(0, 4)
						+ " / " + results[i].CaseQGates.results[0].qgate_status_text
						+ "'"
						+ " style='z-index: 100; top: 6px; width: " + (tmpProzent - prozentMS1S) + "%; left:" + prozentMS1S
						+ "%'></span>";
				} else {
					addCont += "<span class='Start_MS1_" + MS1S.substring(9, 10) + "' "
						+ "title='" + results[i].CaseQGates.results[0].Description
						+ " / " + results[i].CaseQGates.results[0].qgate_target_phase_txt
						+ " / Start: " + tagMS1S + "-" + MS1S.substring(4, 6) + "-" + MS1S.substring(0, 4)
						+ " / End: " + tagMS1E + "-" + MS1E.substring(4, 6) + "-" + MS1E.substring(0, 4)
						+ " / " + results[i].CaseQGates.results[0].qgate_status_text
						+ "'"
						+ " style='z-index: 100; top: 6px; width: " + tmpProzent + "%; left:" + 0
						+ "%'></span>";
				}
				// End dot
				addCont += "<img src='images/MDR6/MS2_" + MS1S.substring(9, 10) + ".png' "
					+ "title='" + results[i].CaseQGates.results[0].Description
					+ " / " + results[i].CaseQGates.results[0].qgate_target_phase_txt
					+ " / End: " + tagMS1E + "-" + MS1E.substring(4, 6) + "-" + MS1E.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[0].qgate_status_text
					+ "'"
					+ " style='position: absolute; top: 2px; z-index: 110; left:" + (prozentMS1E - 5) + "%; "
					+ "height: 15px'></img>";
			}
			// Last Q-Gate status
			if (MS2S === undefined && MS2E === undefined) {
				if (MS1S !== undefined && MS1E !== undefined && month === MS1E.substring(0, 6)) {
					addCont += this.getLastQGateStatus(MS1E.substring(6, 8), MS1E.substring(4, 6), MS1E, today, "1");
				}
			}
			// Q-Gate 2 ////////
			// Q-Gate Start
			if (MS2S !== undefined && MS2E !== undefined && month === MS2S.substring(0, 6)) {
				var tagMS2S = MS2S.substring(6, 8);
				var tagMS2E = MS2E.substring(6, 8);
				var prozentMS2S = 100 / 31 * tagMS2S;
				var prozentMS2E = 100 / 31 * tagMS2E;
				var tmpProzent = 0;
				if (month == MS2E.substring(0, 6)) {
					tmpProzent = prozentMS2E - prozentMS2S;
				} else {
					tmpProzent = 100 - prozentMS2S;
				}
				// Start dot
				addCont += "<img src='images/MDR6/MS2_" + MS2S.substring(9, 10) + ".png' "
					+ "title='" + results[i].CaseQGates.results[1].Description
					+ " / " + results[i].CaseQGates.results[1].qgate_target_phase_txt
					+ " / Start: " + tagMS2S + "-" + MS2S.substring(4, 6) + "-" + MS2S.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[1].qgate_status_text
					+ "'"
					+ " style='position: absolute; top: 12px; z-index: 210; left:" + (prozentMS2S - 5) + "%; "
					+ "height: 15px'></img>";
				// Bar
				addCont += "<span class='Start_MS1_" + MS2S.substring(9, 10) + "' "
					+ "title='" + results[i].CaseQGates.results[1].Description
					+ " / " + results[i].CaseQGates.results[1].qgate_target_phase_txt
					+ " / Start: " + tagMS2S + "-" + MS2S.substring(4, 6) + "-" + MS2S.substring(0, 4)
					+ " / End: " + tagMS2E + "-" + MS2E.substring(4, 6) + "-" + MS2E.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[1].qgate_status_text
					+ "'"
					+ " style='z-index: 200; top: 16px; width: " + tmpProzent + "%; left:" + (prozentMS2S - 0)
					+ "%'></span>";
			}
			// Q-Gate Middle
			if (MS2S !== undefined && MS2E !== undefined && month > MS2S.substring(0, 6) && month < MS2E.substring(0, 6)) {
				// Bar
				addCont += "<span class='Start_MS1_" + MS2S.substring(9, 10) + "' "
					+ "title='" + results[i].CaseQGates.results[1].Description
					+ " / " + results[i].CaseQGates.results[1].qgate_target_phase_txt
					+ " / Start: " + MS2S.substring(6, 8) + "-" + MS2S.substring(4, 6) + "-" + MS2S.substring(0, 4)
					+ " / End: " + MS2E.substring(6, 8) + "-" + MS2E.substring(4, 6) + "-" + MS2E.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[1].qgate_status_text
					+ "'"
					+ " style='z-index: 200; top: 16px; width: " + 100 + "%; left:" + 0
					+ "%'></span>";
			}
			// Q-Gate End
			if (MS2S !== undefined && MS2E !== undefined && month === MS2E.substring(0, 6)) {
				var tagMS2S = MS2S.substring(6, 8);
				var tagMS2E = MS2E.substring(6, 8);
				var prozentMS2S = 100 / 31 * tagMS2S;
				var prozentMS2E = 100 / 31 * tagMS2E;
				var tmpProzent = 0;
				if (month == MS2E.substring(0, 6)) {
					tmpProzent = prozentMS2E;
				} else {
					tmpProzent = 100 - prozentMS2S;
				}
				// Bar
				if (MS2S !== undefined && MS2E !== undefined && month === MS2S.substring(0, 6)) {
					addCont += "<span class='Start_MS1_" + MS2S.substring(9, 10) + "' "
						+ "title='" + results[i].CaseQGates.results[1].Description
						+ " / " + results[i].CaseQGates.results[1].qgate_target_phase_txt
						+ " / Start: " + tagMS2S + "-" + MS2S.substring(4, 6) + "-" + MS2S.substring(0, 4)
						+ " / End: " + tagMS2E + "-" + MS2E.substring(4, 6) + "-" + MS2E.substring(0, 4)
						+ " / " + results[i].CaseQGates.results[1].qgate_status_text
						+ "'"
						+ " style='z-index: 200; top: 16px; width: " + (tmpProzent - prozentMS2S) + "%; left:" + prozentMS2S
						+ "%'></span>";
				} else {
					addCont += "<span class='Start_MS1_" + MS2S.substring(9, 10) + "' "
						+ "title='" + results[i].CaseQGates.results[1].Description
						+ " / " + results[i].CaseQGates.results[1].qgate_target_phase_txt
						+ " / Start: " + tagMS2S + "-" + MS2S.substring(4, 6) + "-" + MS2S.substring(0, 4)
						+ " / End: " + tagMS2E + "-" + MS2E.substring(4, 6) + "-" + MS2E.substring(0, 4)
						+ " / " + results[i].CaseQGates.results[1].qgate_status_text
						+ "'"
						+ " style='z-index: 200; top: 16px; width: " + tmpProzent + "%; left:" + 0
						+ "%'></span>";
				}
				// End dot
				addCont += "<img src='images/MDR6/MS2_" + MS2S.substring(9, 10) + ".png' "
					+ "title='" + results[i].CaseQGates.results[1].Description
					+ " / " + results[i].CaseQGates.results[1].qgate_target_phase_txt
					+ " / End: " + tagMS2E + "-" + MS2E.substring(4, 6) + "-" + MS2E.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[1].qgate_status_text
					+ "'"
					+ " style='position: absolute; top: 12px; z-index: 210; left:" + (prozentMS2E - 5) + "%; "
					+ "height: 15px'></img>";
			}
			// Last Q-Gate status
			if (MS3S === undefined && MS3E === undefined) {
				if (MS2S !== undefined && MS2E !== undefined && month === MS2E.substring(0, 6)) {
					addCont += this.getLastQGateStatus(MS2E.substring(6, 8), MS2E.substring(4, 6), MS2E, today, "2");
				}
			}
			// Q-Gate 3 ////////
			// Q-Gate Start
			if (MS3S !== undefined && MS3E !== undefined && month === MS3S.substring(0, 6)) {
				var tagMS3S = MS3S.substring(6, 8);
				var tagMS3E = MS3E.substring(6, 8);
				var prozentMS3S = 100 / 31 * tagMS3S;
				var prozentMS3E = 100 / 31 * tagMS3E;
				var tmpProzent = 0;
				if (month == MS3E.substring(0, 6)) {
					tmpProzent = prozentMS3E - prozentMS3S;
				} else {
					tmpProzent = 100 - prozentMS3S;
				}
				// Start dot
				addCont += "<img src='images/MDR6/MS2_" + MS3S.substring(9, 10) + ".png' "
					+ "title='" + results[i].CaseQGates.results[2].Description
					+ " / " + results[i].CaseQGates.results[2].qgate_target_phase_txt
					+ " / Start: " + tagMS3S + "-" + MS3S.substring(4, 6) + "-" + MS3S.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[2].qgate_status_text
					+ "'"
					+ " style='position: absolute; top: 22px; z-index: 310; left:" + (prozentMS3S - 5) + "%; "
					+ "height: 15px'></img>";
				// Bar
				addCont += "<span class='Start_MS1_" + MS3S.substring(9, 10) + "' "
					+ "title='" + results[i].CaseQGates.results[2].Description
					+ " / " + results[i].CaseQGates.results[2].qgate_target_phase_txt
					+ " / Start: " + tagMS3S + "-" + MS3S.substring(4, 6) + "-" + MS3S.substring(0, 4)
					+ " / End: " + tagMS3E + "-" + MS3E.substring(4, 6) + "-" + MS3S.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[2].qgate_status_text
					+ "'"
					+ " style='z-index: 300; top: 26px; width: " + tmpProzent + "%; left:" + (prozentMS3S - 0)
					+ "%'></span>";
			}
			// Q-Gate Middle
			if (MS3S !== undefined && MS3E !== undefined && month > MS3S.substring(0, 6) && month < MS3E.substring(0, 6)) {
				// Bar
				addCont += "<span class='Start_MS1_" + MS3S.substring(9, 10) + "' "
					+ "title='" + results[i].CaseQGates.results[2].Description
					+ " / " + results[i].CaseQGates.results[2].qgate_target_phase_txt
					+ " / Start: " + MS3S.substring(6, 8) + "-" + MS3S.substring(4, 6) + "-" + MS3S.substring(0, 4)
					+ " / End: " + MS3E.substring(6, 8) + "-" + MS3E.substring(4, 6) + "-" + MS3S.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[2].qgate_status_text
					+ "'"
					+ " style='z-index: 300; top: 26px; width: " + 100 + "%; left:" + 0
					+ "%'></span>";
			}
			// Q-Gate End
			if (MS3S !== undefined && MS3E !== undefined && month === MS3E.substring(0, 6)) {
				var tagMS3S = MS3S.substring(6, 8);
				var tagMS3E = MS3E.substring(6, 8);
				var prozentMS3S = 100 / 31 * tagMS3S;
				var prozentMS3E = 100 / 31 * tagMS3E;
				var tmpProzent = 0;
				if (month == MS3E.substring(0, 6)) {
					tmpProzent = prozentMS3E;
				} else {
					tmpProzent = 100 - prozentMS3S;
				}
				// Bar
				if (MS3S !== undefined && MS3E !== undefined && month === MS3S.substring(0, 6)) {
					addCont += "<span class='Start_MS1_" + MS3S.substring(9, 10) + "' "
						+ "title='" + results[i].CaseQGates.results[2].Description
						+ " / " + results[i].CaseQGates.results[2].qgate_target_phase_txt
						+ " / Start: " + tagMS3S + "-" + MS3S.substring(4, 6) + "-" + MS3S.substring(0, 4)
						+ " / End: " + tagMS3E + "-" + MS3E.substring(4, 6) + "-" + MS3S.substring(0, 4)
						+ " / " + results[i].CaseQGates.results[2].qgate_status_text
						+ "'"
						+ " style='z-index: 300; top: 26px; width: " + (tmpProzent - prozentMS3S) + "%; left:" + prozentMS3S
						+ "%'></span>";
				} else {
					addCont += "<span class='Start_MS1_" + MS3S.substring(9, 10) + "' "
						+ "title='" + results[i].CaseQGates.results[2].Description
						+ " / " + results[i].CaseQGates.results[2].qgate_target_phase_txt
						+ " / Start: " + tagMS3S + "-" + MS3S.substring(4, 6) + "-" + MS3S.substring(0, 4)
						+ " / End: " + tagMS3E + "-" + MS3E.substring(4, 6) + "-" + MS3S.substring(0, 4)
						+ " / " + results[i].CaseQGates.results[2].qgate_status_text
						+ "'"
						+ " style='z-index: 300; top: 26px; width: " + tmpProzent + "%; left:" + 0
						+ "%'></span>";
				}
				// End dot
				addCont += "<img src='images/MDR6/MS2_" + MS3S.substring(9, 10) + ".png' "
					+ "title='" + results[i].CaseQGates.results[2].Description
					+ " / " + results[i].CaseQGates.results[2].qgate_target_phase_txt
					+ " / End: " + tagMS3E + "-" + MS3E.substring(4, 6) + "-" + MS3S.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[2].qgate_status_text
					+ "'"
					+ " style='position: absolute; top: 22px; z-index: 310; left:" + (prozentMS3E - 5) + "%; "
					+ "height: 15px'></img>";
			}
			// Last Q-Gate status
			if (MS4S === undefined && MS4E === undefined) {
				if (MS3S !== undefined && MS3E !== undefined && month === MS3E.substring(0, 6)) {
					addCont += this.getLastQGateStatus(MS3E.substring(6, 8), MS3E.substring(4, 6), MS3E, today, "3");
				}
			}
			// Q-Gate 4 ////////
			// Q-Gate Start
			if (MS4S !== undefined && MS4E !== undefined && month === MS4S.substring(0, 6)) {
				var tagMS4S = MS4S.substring(6, 8);
				var tagMS4E = MS4E.substring(6, 8);
				var prozentMS4S = 100 / 31 * tagMS4S;
				var prozentMS4E = 100 / 31 * tagMS4E;
				var tmpProzent = 0;
				if (month == MS4E.substring(0, 6)) {
					tmpProzent = prozentMS4E - prozentMS4S;
				} else {
					tmpProzent = 100 - prozentMS4S;
				}
				// Start dot
				addCont += "<img src='images/MDR6/MS2_" + MS4S.substring(9, 10) + ".png' "
					+ "title='" + results[i].CaseQGates.results[3].Description
					+ " / " + results[i].CaseQGates.results[3].qgate_target_phase_txt
					+ " / Start: " + tagMS4S + "-" + MS4S.substring(4, 6) + "-" + MS4S.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[3].qgate_status_text
					+ "'"
					+ " style='position: absolute; top: 32px; z-index: 410; left:" + (prozentMS4S - 5) + "%; "
					+ "height: 15px'></img>";
				// Bar
				addCont += "<span class='Start_MS1_" + MS4S.substring(9, 10) + "' "
					+ "title='" + results[i].CaseQGates.results[3].Description
					+ " / " + results[i].CaseQGates.results[3].qgate_target_phase_txt
					+ " / Start: " + tagMS4S + "-" + MS4S.substring(4, 6) + "-" + MS4S.substring(0, 4)
					+ " / End: " + tagMS4E + "-" + MS4E.substring(4, 6) + "-" + MS4S.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[3].qgate_status_text
					+ "'"
					+ " style='z-index: 400; top: 36px; width: " + tmpProzent + "%; left:" + (prozentMS4S - 0)
					+ "%'></span>";
			}
			// Q-Gate Middle
			if (MS4S !== undefined && MS4E !== undefined && month > MS4S.substring(0, 6) && month < MS4E.substring(0, 6)) {
				// Bar
				addCont += "<span class='Start_MS1_" + MS4S.substring(9, 10) + "' "
					+ "title='" + results[i].CaseQGates.results[3].Description
					+ " / " + results[i].CaseQGates.results[3].qgate_target_phase_txt
					+ " / Start: " + MS4S.substring(6, 8) + "-" + MS4S.substring(4, 6) + "-" + MS4S.substring(0, 4)
					+ " / End: " + MS4E.substring(6, 8) + "-" + MS4E.substring(4, 6) + "-" + MS4S.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[3].qgate_status_text
					+ "'"
					+ " style='z-index: 400; top: 36px; width: " + 100 + "%; left:" + 0
					+ "%'></span>";
			}
			// Q-Gate End
			if (MS4S !== undefined && MS4E !== undefined && month === MS4E.substring(0, 6)) {
				var tagMS4S = MS4S.substring(6, 8);
				var tagMS4E = MS4E.substring(6, 8);
				var prozentMS4S = 100 / 31 * tagMS4S;
				var prozentMS4E = 100 / 31 * tagMS4E;
				var tmpProzent = 0;
				if (month == MS4E.substring(0, 6)) {
					tmpProzent = prozentMS4E;
				} else {
					tmpProzent = 100 - prozentMS4S;
				}
				// Bar
				if (MS4S !== undefined && MS4E !== undefined && month === MS4S.substring(0, 6)) {
					addCont += "<span class='Start_MS1_" + MS4S.substring(9, 10) + "' "
						+ "title='" + results[i].CaseQGates.results[3].Description
						+ " / " + results[i].CaseQGates.results[3].qgate_target_phase_txt
						+ " / Start: " + tagMS4S + "-" + MS4S.substring(4, 6) + "-" + MS4S.substring(0, 4)
						+ " / End: " + tagMS4E + "-" + MS4E.substring(4, 6) + "-" + MS4S.substring(0, 4)
						+ " / " + results[i].CaseQGates.results[3].qgate_status_text
						+ "'"
						+ " style='z-index: 400; top: 36px; width: " + (tmpProzent - prozentMS4S) + "%; left:" + prozentMS4S
						+ "%'></span>";
				} else {
					addCont += "<span class='Start_MS1_" + MS4S.substring(9, 10) + "' "
						+ "title='" + results[i].CaseQGates.results[3].Description
						+ " / " + results[i].CaseQGates.results[3].qgate_target_phase_txt
						+ " / Start: " + tagMS4S + "-" + MS4S.substring(4, 6) + "-" + MS4S.substring(0, 4)
						+ " / End: " + tagMS4E + "-" + MS4E.substring(4, 6) + "-" + MS4S.substring(0, 4)
						+ " / " + results[i].CaseQGates.results[3].qgate_status_text
						+ "'"
						+ " style='z-index: 400; top: 36px; width: " + tmpProzent + "%; left:" + 0
						+ "%'></span>";
				}
				// End dot
				addCont += "<img src='images/MDR6/MS2_" + MS4S.substring(9, 10) + ".png' "
					+ "title='" + results[i].CaseQGates.results[3].Description
					+ " / " + results[i].CaseQGates.results[3].qgate_target_phase_txt
					+ " / End: " + tagMS4E + "-" + MS4E.substring(4, 6) + "-" + MS4S.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[3].qgate_status_text
					+ "'"
					+ " style='position: absolute; top: 32px; z-index: 410; left:" + (prozentMS4E - 5) + "%; "
					+ "height: 15px'></img>";
			}
			// Last Q-Gate status
			if (MS5S === undefined && MS5E === undefined) {
				if (MS4S !== undefined && MS4E !== undefined && month === MS4E.substring(0, 6)) {
					addCont += this.getLastQGateStatus(MS4E.substring(6, 8), MS4E.substring(4, 6), MS4E, today, "4");
				}
			}
			// Q-Gate 5 ////////
			// Q-Gate Start
			if (MS5S !== undefined && MS5E !== undefined && month === MS5S.substring(0, 6)) {
				var tagMS5S = MS5S.substring(6, 8);
				var tagMS5E = MS5E.substring(6, 8);
				var prozentMS5S = 100 / 31 * tagMS5S;
				var prozentMS5E = 100 / 31 * tagMS5E;
				var tmpProzent = 0;
				if (month == MS5E.substring(0, 6)) {
					tmpProzent = prozentMS5E - prozentMS5S;
				} else {
					tmpProzent = 100 - prozentMS5S;
				}
				// Start dot
				addCont += "<img src='images/MDR6/MS2_" + MS5S.substring(9, 10) + ".png' "
					+ "title='" + results[i].CaseQGates.results[4].Description
					+ " / " + results[i].CaseQGates.results[4].qgate_target_phase_txt
					+ " / Start: " + tagMS5S + "-" + MS5S.substring(4, 6) + "-" + MS5S.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[4].qgate_status_text
					+ "'"
					+ " style='position: absolute; top: 42px; z-index: 510; left:" + (prozentMS5S - 5) + "%; "
					+ "height: 15px'></img>";
				// Bar
				addCont += "<span class='Start_MS1_" + MS5S.substring(9, 10) + "' "
					+ "title='" + results[i].CaseQGates.results[4].Description
					+ " / " + results[i].CaseQGates.results[4].qgate_target_phase_txt
					+ " / Start: " + tagMS5S + "-" + MS5S.substring(4, 6) + "-" + MS5S.substring(0, 4)
					+ " / End: " + tagMS5E + "-" + MS5E.substring(4, 6) + "-" + MS5S.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[4].qgate_status_text
					+ "'"
					+ " style='z-index: 500; top: 46px; width: " + tmpProzent + "%; left:" + (prozentMS5S - 0)
					+ "%'></span>";
			}
			// Q-Gate Middle
			if (MS5S !== undefined && MS5E !== undefined && month > MS5S.substring(0, 6) && month < MS5E.substring(0, 6)) {
				// Bar
				addCont += "<span class='Start_MS1_" + MS5S.substring(9, 10) + "' "
					+ "title='" + results[i].CaseQGates.results[4].Description
					+ " / " + results[i].CaseQGates.results[4].qgate_target_phase_txt
					+ " / Start: " + MS5S.substring(6, 8) + "-" + MS5S.substring(4, 6) + "-" + MS5S.substring(0, 4)
					+ " / End: " + MS5E.substring(6, 8) + "-" + MS5E.substring(4, 6) + "-" + MS5S.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[4].qgate_status_text
					+ "'"
					+ " style='z-index: 500; top: 46px; width: " + 100 + "%; left:" + 0
					+ "%'></span>";
			}
			// Q-Gate End
			if (MS5S !== undefined && MS5E !== undefined && month === MS5E.substring(0, 6)) {
				var tagMS5S = MS5S.substring(6, 8);
				var tagMS5E = MS5E.substring(6, 8);
				var prozentMS5S = 100 / 31 * tagMS5S;
				var prozentMS5E = 100 / 31 * tagMS5E;
				var tmpProzent = 0;
				if (month == MS5E.substring(0, 6)) {
					tmpProzent = prozentMS5E;
				} else {
					tmpProzent = 100 - prozentMS5S;
				}
				// Bar
				if (MS5S !== undefined && MS5E !== undefined && month === MS5S.substring(0, 6)) {
					addCont += "<span class='Start_MS1_" + MS5S.substring(9, 10) + "' "
						+ "title='" + results[i].CaseQGates.results[4].Description
						+ " / " + results[i].CaseQGates.results[4].qgate_target_phase_txt
						+ " / Start: " + tagMS5S + "-" + MS5S.substring(4, 6) + "-" + MS5S.substring(0, 4)
						+ " / End: " + tagMS5E + "-" + MS5E.substring(4, 6) + "-" + MS5S.substring(0, 4)
						+ " / " + results[i].CaseQGates.results[4].qgate_status_text
						+ "'"
						+ " style='z-index: 500; top: 46px; width: " + (tmpProzent - prozentMS5S) + "%; left:" + prozentMS5S
						+ "%'></span>";
				} else {
					addCont += "<span class='Start_MS1_" + MS5S.substring(9, 10) + "' "
						+ "title='" + results[i].CaseQGates.results[4].Description
						+ " / " + results[i].CaseQGates.results[4].qgate_target_phase_txt
						+ " / Start: " + tagMS5S + "-" + MS5S.substring(4, 6) + "-" + MS5S.substring(0, 4)
						+ " / End: " + tagMS5E + "-" + MS5E.substring(4, 6) + "-" + MS5S.substring(0, 4)
						+ " / " + results[i].CaseQGates.results[4].qgate_status_text
						+ "'"
						+ " style='z-index: 500; top: 46px; width: " + tmpProzent + "%; left:" + 0
						+ "%'></span>";
				}
				// End dot
				addCont += "<img src='images/MDR6/MS2_" + MS5S.substring(9, 10) + ".png' "
					+ "title='" + results[i].CaseQGates.results[4].Description
					+ " / " + results[i].CaseQGates.results[4].qgate_target_phase_txt
					+ " / End: " + tagMS5E + "-" + MS5E.substring(4, 6) + "-" + MS5S.substring(0, 4)
					+ " / " + results[i].CaseQGates.results[4].qgate_status_text
					+ "'"
					+ " style='position: absolute; top: 42px; z-index: 510; left:" + (prozentMS5E - 5) + "%; "
					+ "height: 15px'></img>";
			}
			// Last Q-Gate status
			if (MS5S !== undefined && MS5E !== undefined && month === MS5E.substring(0, 6)) {
				addCont += this.getLastQGateStatus(MS5E.substring(6, 8), MS5E.substring(4, 6), MS5E, today, "5");
			}
			// Today line
			if (month == today.substring(0, 6)) {
				var count = 0;
				count + 1;
				var tag = today.substring(6, 8);
				var prozentTodayLine = (100 / 31) * tag;
				addCont += "<div class='TodayLine' style='left:" + prozentTodayLine + "%'></div>";
			}
			return addCont;
		},

		getLastQGateStatus: function (tag, month, MS, today, i) {
			var topPercent;
			switch (i) {
				case "1":
					topPercent = "30";
					break;
				case "2":
					topPercent = "45";
					break;
				case "3":
					topPercent = "60";
					break;
				case "4":
					topPercent = "75";
					break;
				case "5":
					topPercent = "35";
					break;
				default:
					topPercent = "50";
			}
			var result = "<div>";
			var prozentMS = 100 / 31 * tag;
			var tmpProzent = 100 - prozentMS;
			var dateToday = new Date();
			var dateMS = new Date();
			dateMS.setFullYear(MS.substring(0, 4), ((MS.substring(4, 6) * 1) - 1), MS.substring(6, 8));
			if (((today.substring(0, 6) * 1) >= (MS.substring(0, 6) * 1)))	{
				var weeks = this.getCWFromDate(dateToday) - this.getCWFromDate(dateMS);
				if (weeks !== 0) {
					if (weeks < 0) {
						weeks = this.getCWFromDate(dateMS) - this.getCWFromDate(dateToday);
						result += "<div class='DaysAgo' style='z-index: 1000; top: " + topPercent + "%; position: absolute; left:"
							+ (prozentMS - 13) + "%;'> In " + weeks + " Weeks</div>";
					} else {
						result += "<div class='DaysAgo' style='z-index: 1000; top: " + topPercent + "%; position: absolute; left:"
							+ (prozentMS - 8) + "%;'> " + weeks + " Weeks ago</div>";
					}
				}
			} else {
				var weeks = (this.getCWFromDate(dateMS) - this.getCWFromDate(dateToday));
				var position = (prozentMS - 12);
				if (position > 45) {
					position = 2;
				} else {
					position = 75
					- position;
				}
				if (weeks < 0) {
					weeks = 52 - this.getCWFromDate(dateToday) + this.getCWFromDate(dateMS);
				}
				if (weeks !== 0) {
					result += "<div class='DaysAgo' style='z-index: 1000; right:"
						+ position
						+ "%;"
						+ "top: "
						+ topPercent
						+ "%; position: absolute'> In "
						+ weeks
						+ " Weeks</div>";
				}
			}
			result = result + "</div>";
			return result;
		},

		getTodayStatus: function (month, today) {
			var content = "<div>";
			var addCont = "";
			if (month == today.substring(0, 6)) {
				var tag = today.substring(6, 8);
				var monat = today.substring(4, 6);
				var year = today.substring(0, 4);
				var date = tag + "." + monat + "." + year;
				var prozentToday = (100 / 31 * tag) + 5;
				var prozentTodayLine = (100 / 31) * tag;
				addCont += "<div class='TodayLine' style='left:" + prozentTodayLine + "%'></div>";
				addCont += "<div class='Today' style='padding-left:"
					+ prozentToday + "%'>Today (" + date + ")</div>";
			} else {
				addCont += "";
			}
			content = content + addCont + "</div>";
			return content;
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
			// URL
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
			this.oUIModel.setProperty("/maskData", this.maskdata);
			// Title
			if (jQuery.sap.getUriParameters().get("title") == null) {
				this.title = "MDR6 - Q-Gates";
				this.oUIModel.setProperty("/title", "MDR6 - Q-Gates");
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
			if (jQuery.sap.getUriParameters().get("disp_date") === "")
				this.dispDate = "gl";
			// Test ////////////
			if (this.filter === "")
			//	this.filter =
			//		"customer_bp_id eq '0000160073' and (status eq 'New' or status eq 'In Process' or" +
			//		" status eq 'In Escalation' or status eq 'In Management Review') and case_type eq 'ZS02'";
			//	this.filter =
			//		"case_id eq '20002121' and case_type eq 'ZS02'";
			//	this.filter =
			//		"(case_id eq '20001283' or case_id eq '20000982' or case_id eq '20000134' or" +
			//		" case_id eq '20001021' or case_id eq '20001967' or case_id eq '20002107' or" +
			//		" case_id eq '20001040')" +
			//		" and case_type eq 'ZS02'";
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

		_sortByRating: function (data) {
			function ratingToNumber(value) {
				var rating = 4;
				if (value.toLowerCase() === "today") {
					rating = 5;
				} else if (value.toLowerCase() === "red") {
					rating = 1;
				} else if (value.toLowerCase() === "yellow") {
					rating = 2;
				} else if (value.toLowerCase() === "green") {
					rating = 3;
				} else { // no rating
					rating = 4;
				}
				return rating;
			}
			function compareRating(value1, value2) {
				return ratingToNumber(value1.rating_text) < ratingToNumber(value2.rating_text) ? -1 : 1;
			}
			data.sort(compareRating);
			return data;
		},

		_sortByDate: function (data) {
			function compareDate(value1, value2) {
				return value1.date < value2.date ? -1 : 1;
			}
			data.sort(compareDate);
			return data;
		},

		_sortQGatesByStartDate: function (qgates) {
			function compareDate(value1, value2) {
				return value1.qgate_start < value2.qgate_start ? -1 : 1;
			}
			qgates.results.sort(compareDate);
			return qgates;
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
					'mccprofile': 'MDR6_AuthCheck'
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
				var oPaginator = new CustomPaginator("table-paginator-MDR6", {
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

		sort: function (oEvent) {
			setTimeout(function () {
				var oTable = this.getView().byId("caseTable");
				var aSorters = oTable.getBinding().aSorters;
				this.aCurrentSorters = aSorters;
				this.sortByColumns(aSorters);
			//  Test
				oTable.invalidate();
			}.bind(this));
		},

		sortByColumns: function (aSorters) {
			if (!aSorters || aSorters.length === 0) {
				return;
			}
			var allCases = this.getFilteredCases();
			// Test 1
			// Remove today line
			var todayRow = allCases.pop();
			/////////
			var sortedCases = SorterProcessor.apply(allCases, aSorters, function (d, path) {
				return d[path];
			}, function (d) {
				return d.case_id;
			});
			// Test 2
			// Add today line
			sortedCases.push(todayRow);
			/////////
			var filteredCaseModel = new JSONModel();
			filteredCaseModel.setData({
				results: sortedCases
			});
			this.setModel(filteredCaseModel, "filteredCases");
			this.updateOnePageDataToTable(1);
			this.resetPagination();
			// Test
			// oTable.invalidate();
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
			window.open("https://go.sap.corp/MDR6-info", "MDR6 - Info");
		},

		openMDR6A: function (oEvent) {
			var URL = this.URL;
			URL = URL + "#/MDR6A";
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
					+ "/ac787746-45bc-46f6-8f49-d14fd57451fe.mccworkbench.comsapmccworkbench/index.html#/"
					+ selectedCase;
			} else if (this.source_IC === "ict") {
				// TEST environment
				URL = "https://"
					+ "sapit-customersupport-test-kinkajou.launchpad.cfapps.eu10.hana.ondemand.com"
					+ "/2835401d-0d19-4923-9323-f72f6cbb77a7.mccworkbench.comsapmccworkbench/index.html#/"
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
				url = url + "&MDR=6";
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
										//	+ location.href, "PPT", "resizable=1");
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
				url = url + "&MDR=6";
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
			// Card view
			var viewCard = this.oUIModel.getProperty("/viewCard");
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