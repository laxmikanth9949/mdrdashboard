	sap.ui.define([
		"corp/sap/mdrdashboards/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/FilterProcessor",
		"sap/ui/model/SorterProcessor",
		"corp/sap/mdrdashboards/model/formatterMDR2",
		"corp/sap/mdrdashboards/controls/TablePager",
		"corp/sap/mdrdashboards/controls/CustomPaginator",
		"corp/sap/mdrdashboards/HelpScreens/excel_download",
		"sap/m/MessageBox",
		"sap/m/MessageToast",
		"sap/base/Log",
		"sap/ui/Device"
	], function (BaseController, JSONModel, Filter, FilterOperator, FilterProcessor, SorterProcessor,
		Formatter, TablePager, CustomPaginator, excel_download, MessageBox, MessageToast, Log, Device) {
		"use strict";

		return BaseController.extend("corp/sap/mdrdashboards.controller.MDR2", {

			onInit: function () {
				// Style sheet
				jQuery.sap.includeStyleSheet("css/style_mdr2.css","stylemdr2");
				// Create correct path to images
				var oRootPath = jQuery.sap.getModulePath("corp.sap.mdrdashboards");
				var oImageModel = new sap.ui.model.json.JSONModel({
					path : oRootPath
				});
				this.setModel(oImageModel, "imageModel");
				// Source IC* //////
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
				// Other parameters ///////
				this.filter = "";
				this._iRowHeight = 56;
				this.refreshInterval = 1800;
				this.flipInterval = 30;
				this.pauseFlip = false;
				this._realDataLength = {};
				this.layout = "";
				this.results_xls = [];
				this._customMenuData = {};
				this.changePageTitle();
				this.noAuth = "";
				// Router /////
				this.oRouter = this.getRouter();
				this.oRouter.attachRouteMatched(this.onRouteMatched, this);
				// UI Model /////
				var sTheme = "blue";
				this.oUIModel = new JSONModel({
					results_xls: {},
				//	viewCard: false,
					theme: sTheme,
					activityNumber: 0,
					redNumber: 0,
					greenNumber: 0,
					yellowNumber: 0,
					sourceIC: this.source_IC,
					layout: "blue",
					sorter: "",
					title: "",
					runTitle: "no",
					maskData: "no",
					resp_empty_only: "no",
					due_date_expired: "no",
					showGoLiveDate: false,
					showProcessor: false,
					showPhase: false,
					showServiceTeam: false,
					refreshTime: "00:00",
					pauseFlip: false
				});
				this.getView().setModel(this.oUIModel, "UIModel");
				// Resize
				sap.ui.Device.resize.attachHandler(this.windowResize, this);
				// Mobile Usage Reporting - Version Distribution
				// --> Counts Number of Devices
				try {
					var tracking = new GlobalITTracking("MDR Dashboards", "MDR2: Activities - V1.1.0");
				} catch (e) {
					console.log("Error: " + e);
				}
				// Mobile Usage Reporting - Events
				// --> Counts Calls of the Application
				sap.git.usage.Reporting.addEvent(this.getOwnerComponent(), "MDR2: Activities - V1.1.0");
				this.createDownloadXLS();
				this.showBusyDialog();
			},

			formatterMDR2: Formatter,
			
			changePageTitle: function () { 
            	var newPageTitle = "MDR2 - Activities"; 
            	document.title = newPageTitle; 
        	},			
			
			onRouteMatched: function (oEvent) {
				var sRouteName = oEvent.getParameter("name");
				this.readURL();
				this._customizeUI();
				if (sRouteName === "MDR2") {
					this.checkAuthorization();
				//	this.loadModelFromBackend(); // --> Now in checkAuthorization !!
					this.setRefreshTime();
					this._intervalTasks();
				}
			},

			_customizeUI: function () {
				this.oUIModel.setProperty("/showGoLiveDate", this.disp_date === "gl" ? true : false);
				this.oUIModel.setProperty("/showServiceTeam", this.ServiceTeamVisible ? true : false);
				this.oUIModel.setProperty("/theme", this.layout === "dark" ? "dark" : "blue");
				this.getView().byId("dashboardPage");
				this.getView().byId("dashboardPage").addStyleClass(this.layout);
			},

			loadModelFromBackend: function () {
				this.oDataModel = this.getComponentModel();
				var header = {
					"AppIdentifier": "FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ",
					"mccprofile": "MDR2"
				};
				this.oDataModel.setHeaders(header);			
				this.oDataModel.read("/ActivityList", {
					urlParameters: {
						$filter: this.filter,
						$expand: "ActivityCases"
					},
					success: function (data) {
						this.hideBusyDialog();
						// URL filter parameter: resp_empty_only
						if (jQuery.sap.getUriParameters().get("resp_empty_only") !== null)
							this.resp_empty_only = jQuery.sap.getUriParameters().get("resp_empty_only");
						if (this.resp_empty_only === "yes") {
							if (data.results.length > 0) {
								var dataCopy = JSON.parse(JSON.stringify(data));
								dataCopy.results = [];
								for (var j = 0; j < data.results.length; j++) {
									if (data.results[j].activity_person_resp === "") {
										dataCopy.results.push(data.results[j]);
									}
								}
								data = dataCopy;
							}
						}
						// URL filter parameter: due_date_expired
						if (jQuery.sap.getUriParameters().get("due_date_expired") !== null)
							this.due_date_expired = jQuery.sap.getUriParameters().get("due_date_expired");
						if (this.due_date_expired === "yes") {
							if (data.results.length > 0) {
								var dataCopy = JSON.parse(JSON.stringify(data));
								dataCopy.results = [];
								for (var j = 0; j < data.results.length; j++) {
									var time = new Date();
									if (data.results[j].activity_planned_date_to != null) {
										time = data.results[j].activity_planned_date_to;
										time = time.getTime();
									} else {
										time = 0;
									}
									var currentTime = new Date();
									currentTime = currentTime.getTime();
									if (time < currentTime) {
										dataCopy.results.push(data.results[j]);
									}
								}
								data = dataCopy;
							}
						}
						// General processing
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
						this._processResult(data.results, this.results_xls);
						// Sorting with / without URL parameter sorter=xyz
						if (this.sorter === "") {
							data.results = this._sortByDate(data.results, "asc");
							data.results = this._sortByRating(data.results);
						} else {
							var key = this.sorter.substring(0, this.sorter.indexOf("/"));
							var sortDir = this.sorter.substring(this.sorter.indexOf("/") + 1, this.sorter.length);
							if (key === "prioKey")
								data.results = this._sortByPriority(data.results, sortDir);
							if (key === "refCustSort")
								data.results = this._sortByRefCustSort(data.results, sortDir);
							if (key === "customer")
								data.results = this._sortByCustomer(data.results, sortDir);
							if (key === "issue")
								data.results = this._sortByIssue(data.results, sortDir);
							if (key === "dueTimeKey")
								data.results = this._sortByDueDate(data.results, sortDir);
							if (key === "ratingKey")
								data.results = this._sortByRating(data.results, sortDir);
							if (key === "statusKey")
								data.results = this._sortByStatus(data.results, sortDir);
							if (key === "employee")
								data.results = this._sortByEmployee(data.results, sortDir);
							if (key === "country")
								data.results = this._sortByCountry(data.results, sortDir);
							if (key === "delUnitText")
								data.results = this._sortByDelUnit(data.results, sortDir);
							if (key === "activity_id")
								data.results = this._sortByActivityId(data.results, sortDir);
						}
						jsonModel.setData(data);
						// Store data for table pagination
						var allActivityModel = new JSONModel();
						allActivityModel.setSizeLimit(data.results.length);
						allActivityModel.setData(data);
						this.setModel(allActivityModel, "allPageCases");
						this.initPagination();
						
						this.addCustomMenu(data);
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
						// Message toast (and not message box) because application would stop in show rooms
						this.hideBusyDialog();
					}.bind(this)
				});
			},

			_processResult: function (results, results_xls) {
				// Specify and initialize variables
				var l = results.length;
				var nRed = 0;
				var nGreen = 0;
				var nYellow = 0;
				var nOverdue = 0;
				var priority = "";
				var activityID = 0;
				// Read URL parameter
				if (jQuery.sap.getUriParameters().get("disp_date") !== null)
					var disp_date = jQuery.sap.getUriParameters().get("disp_date");
				// Process data
				for (var i = 0; i < l; i++) {
					// Priority
					priority = " ";
					if (results[i].activity_priority === "1") {
						nRed++;
						priority = "Red";
					}
					if (results[i].activity_priority === "3") {
						nYellow++;
						priority = "Yellow";
					}
					if (results[i].activity_priority === "5") {
						nGreen++;
						priority = "Green";
					}
					results[i].priority = priority;
					results[i].prioKey = results[i].activity_priority;
					// Reference to Cases
					if (results[i].ActivityCases !== null) {
						var refCase1 = 0;
						var refCase2 = 0;
						var refCaseInd = "";
						var length = results[i].ActivityCases.results.length;
						for (var j = 0; j < length; j++) {
							if (results[i].ActivityCases.results[j].case_type === "ZS01") {
								refCase1++;
							}
							if (results[i].ActivityCases.results[j].case_type === "ZS02") {
								refCase2++;
							}
						}
						if (refCase1 > 0) {
							refCaseInd = "2";
						}
						if (refCase2 > 0 && refCase1 === 0) {
							refCaseInd = "1";
						}
					}
					results[i].refCaseInd = refCaseInd;
					// Customer Name / GU Maintenance Attribute
					results[i].customer_name = results[i].customer_name;
					results[i].customer_category = results[i].customer_category;
					// SAP Product
					if (results[i].ActMainProductVersion === ""){
						results[i].ActMainProductVersion = "-";
					}
					// Description
					// Replace mutated vowels	
					results[i].activity_description = results[i].activity_description.replace("ä", "ae");
					results[i].activity_description = results[i].activity_description.replace("ö", "oe");
					results[i].activity_description = results[i].activity_description.replace("ü", "ue");
					results[i].activity_description = results[i].activity_description.replace("ß", "ss");
					// Reason
					if (results[i].activity_reason_desc === "") {
						results[i].activity_reason_desc = "-";
					}
					if (results[i].activity_reason_text === "") {
						results[i].activity_reason_text = "-";
					}
					// Result
					if (results[i].activity_result_desc === "") {
						results[i].activity_result_desc = "-";
					}
					if (results[i].activity_result_text === "") {
						results[i].activity_result_text = "-";
					}
					// Overdue Icon
					if (jQuery.sap.getUriParameters().get("disp_date") !== null) {
						disp_date = jQuery.sap.getUriParameters().get("disp_date");
					}
					var currentDate = new Date();
					if (results[i].activity_planned_date_to < currentDate && (results[i].activity_status !== "E0013" || results[i].activity_status !==
							"E0014")) {
						nOverdue++;
						results[i].overdueIcon = "X";
					}
					// Date --> Golive Date / Due Date
					if (disp_date === "gl") {
						results[i].date = results[i].activity_golive_date;
					} else {
						results[i].date = results[i].activity_planned_date_to;
					}
					results[i].lastChanged_key = results[i].change_time;
					if (results[i].date !== null) {
						results[i].dateString = results[i].date.toString();
					} else {
						results[i].dateString = "-";
					}
					// Other Dates
					results[i].dateGoLive = results[i].activity_golive_date;
					results[i].dateCreated = results[i].activity_create_date;
					results[i].datePlanned = results[i].activity_planned_date;
					results[i].datePlannedTo = results[i].activity_planned_date_to;
					// Rating
					if (results[i].activity_rating === "R") {
						results[i].activity_rating_i = 1;
					} else if (results[i].activity_rating === "Y") {
						results[i].activity_rating_i = 2;
					} else if (results[i].activity_rating === "G") {
						results[i].activity_rating_i = 3;
					} else {
						results[i].activity_rating_i = 10;
					}
					results[i].activity_rating = results[i].activity_rating;
					results[i].activity_status_desc = results[i].activity_status_desc;
					results[i].statusFilter = results[i].activity_status + " " + results[i].activity_status_desc;
					// Employee Responsible
					var name1 = results[i].activity_person_name.substring(0, results[i].activity_person_name.indexOf(" "));
					var name2 = results[i].activity_person_name.substring(results[i].activity_person_name.indexOf(" "), results[i].activity_person_name
						.length);
					var fullName = name2 + " " + name1;
					results[i].fullName = fullName;
					results[i].activity_person_name = results[i].activity_person_name;
					// Service Team
					results[i].activity_service_team_name = results[i].activity_service_team_name;
					// Country
					results[i].country = results[i].country;
					// Activity ID
					results[i].activityID = Number(results[i].activity_id);
					// Delivery Unit
					results[i].activity_delivery_unit = results[i].activity_delivery_unit;
					results[i].delUnitText = this.setDeliveryUnitTxt(results[i].activity_delivery_unit);
					// Others
					results[i].phase_key = results[i].project_phase;
					results[i].product_key = results[i].product_description + results[i].case_title;
					// Collect data for XML sheet //////////////////////////////////////////////////
					var j = i;
					results_xls[j] = {};
					results_xls[j].firstColumn = " ";
					results_xls[j].process_type = results[i].activity_process_type + "/" + results[i].activity_process_type_description;
					results_xls[j].priority = results[i].activity_priority_desc;
					results_xls[j].status = results[i].activity_status_desc;
					results_xls[j].actCategory = results[i].activity_cat_desc;
					results_xls[j].category = results[i].activity_cat_text;
					results_xls[j].activity_bp = results[i].activity_activity_partner;
					results_xls[j].activity_customer = results[i].account_name_F + " " + results[i].account_name_L;
					// Replace mutated vowels	
					results_xls[j].activity_customer = results_xls[j].activity_customer.replace("ä", "ae");
					results_xls[j].activity_customer = results_xls[j].activity_customer.replace("ö", "oe");
					results_xls[j].activity_customer = results_xls[j].activity_customer.replace("ü", "ue");
					results_xls[j].activity_customer = results_xls[j].activity_customer.replace("ß", "ss");
					if (results[i].activity_rating === "R") {
						results_xls[j].rating = "Red";
					} else if (results[i].activity_rating === "Y") {
						results_xls[j].rating = "Yellow";
					} else if (results[i].activity_rating === "G") {
						results_xls[j].rating = "Green";
					} else {
						results_xls[j].rating = "";
					}
					results_xls[j].activity_description = results[i].activity_description;
					// Replace mutated vowels	
					results_xls[j].activity_description = results_xls[j].activity_description.replace("ä", "ae");
					results_xls[j].activity_description = results_xls[j].activity_description.replace("ö", "oe");
					results_xls[j].activity_description = results_xls[j].activity_description.replace("ü", "ue");
					results_xls[j].activity_description = results_xls[j].activity_description.replace("ß", "ss");
					results_xls[j].issue = results[i].activity_description;
					results_xls[j].result = results[i].act_text;
					results_xls[j].reason = results[i].activity_reason_desc;
					results_xls[j].msg = results[i].activity_product_component;
					results_xls[j].country = results[i].country;
					results_xls[j].dueTimeKey = new Date(results[i].activity_planned_date_to);
					results_xls[j].goLiveKey = new Date(results[i].dateGoLive);
					var date = new Date(results[i].activity_golive_date);
					var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
					var monthName = "";
					if (results[i].activity_golive_date != null) {
						monthName = months[date.getMonth()];
						results_xls[j].dateGoLive = date.getDate() + " " + monthName + " " + date.getFullYear();
					} else {
						results_xls[j].dateGoLive = "N/A";
					}
					date = results[i].activity_create_date;
					if (results[i].activity_create_date != null) {
						monthName = months[date.getMonth()];
						results_xls[j].dateCreated = date.getDate() + " " + monthName + " " + date.getFullYear();
					} else {
						results_xls[j].dateCreated = "N/A";
					}
					date = results[i].activity_planned_date;
					if (results[i].activity_planned_date != null) {
						monthName = months[date.getMonth()];
						results_xls[j].datePlanned = date.getDate() + " " + monthName + " " + date.getFullYear();
					} else {
						results_xls[j].datePlanned = "N/A";
					}
					if (results[i].activity_person_name === "") {
						results_xls[j].employee = "N/A";
					} else {
						results_xls[j].employee = results[i].activity_person_name;
					}
					if (results[i].activity_service_team_name === "") {
						results_xls[j].serviceTeam = "N/A";
					} else {
						results_xls[j].serviceTeam = results[i].activity_service_team_name;
					}
					results_xls[j].id = Number(results[i].activity_id);
					results_xls[j].activity_id = Number(results[i].activity_id);
					results_xls[j].delUnitText = results[i].ActivityDeliveryUnitName;
					results_xls[j].market_unit = results[i].market_unit;
					results_xls[j].market_unit_desc = results[i].market_unit_desc;
					results_xls[j].link = this.formatterMDR2.activityLink(this.source_IC, results[i].activity_id, results[i].activity_category);
				}
				this.oUIModel.setProperty("/activityNumber", l);
				this.oUIModel.setProperty("/redNumber", nRed);
				this.oUIModel.setProperty("/greenNumber", nGreen);
				this.oUIModel.setProperty("/yellowNumber", nYellow);
				this.oUIModel.setProperty("/overdueNumber", nOverdue);
				return results_xls;
			},

			readURL: function () {
				// Layout
				if (jQuery.sap.getUriParameters().get("layout") !== null) {
					this.layout = jQuery.sap.getUriParameters().get("layout").toLowerCase();
				} else {
					this.layout = "blue";
				}
				// Mask data
				if (jQuery.sap.getUriParameters().get("maskData") !== null) {
					this.maskdata = jQuery.sap.getUriParameters().get("maskData").toLowerCase();
				} else if (jQuery.sap.getUriParameters().get("MaskData") !== null) {
					this.maskdata = jQuery.sap.getUriParameters().get("MaskData").toLowerCase();
				} else {
					this.maskdata = "no";
				}
				this.oUIModel.setProperty("/maskData", this.maskdata);
				// Title
				if (jQuery.sap.getUriParameters().get("title") == null) {
					this.title = "MDR2 - Activities";
					this.oUIModel.setProperty("/title", "Activities");
				} else {
					this.title = jQuery.sap.getUriParameters().get("title");
					this.oUIModel.setProperty("/title", this.title);
				}
				if (jQuery.sap.getUriParameters().get("run_title") === "")
					this.run_title = "no";
				// Other parameters
				if (jQuery.sap.getUriParameters().get("disp_date") !== null)
					this.disp_date = jQuery.sap.getUriParameters().get("disp_date").toLowerCase();
				if (jQuery.sap.getUriParameters().get("resp_empty_only") !== null)
					this.resp_empty_only = jQuery.sap.getUriParameters().get("resp_empty_only").toLowerCase();
				if (jQuery.sap.getUriParameters().get("due_date_expired") !== null)
					this.due_date_expired = jQuery.sap.getUriParameters().get("due_date_expired").toLowerCase();
				if (jQuery.sap.getUriParameters().get("refreshInterval") !== null)
					this.refreshInterval = 60 * jQuery.sap.getUriParameters().get("refreshInterval");
				if (jQuery.sap.getUriParameters().get("flipInterval") !== null)
					this.flipInterval = jQuery.sap.getUriParameters().get("flipInterval");
				if (jQuery.sap.getUriParameters().get("ServiceTeamVisible") !== null)
					this.ServiceTeamVisible = jQuery.sap.getUriParameters().get("ServiceTeamVisible").toLowerCase();
				// Sorter
				if (jQuery.sap.getUriParameters().get("sorter") != null)
					this.sorter = jQuery.sap.getUriParameters().get("sorter");
				else
					this.sorter = "";
				// Test ////////
				this.filter = jQuery.sap.getUriParameters().get("filter");
				if (this.filter === null) {
					this.filter = "";
				}
				if (this.filter === "") {
				//	this.filter = "(activity_cat eq 'Z90' or activity_cat eq 'Z91' or activity_cat eq 'ZB2')";
				//	this.filter = "activity_cat eq 'Z90'";
				//	this.filter = "activity_cat eq 'Z91'";
				//  this.filter = "activity_cat eq 'ZB2'";
					this.filter = "(activity_status eq 'E0010' or activity_status eq 'E0011') and " +
								  "(activity_cat eq 'Z91' or activity_cat eq 'ZB2')";
				}
				////////////////
				// URL filter working with dates ///////
				//  due_date=now-2days/now+2days
				// 	due_date=now-2days/0 -> Open End
				//  due_date=0/now+3days -> From the beginning until the specified date
				if (jQuery.sap.getUriParameters().get("due_date") != null) {
					var dueDate1 = jQuery.sap.getUriParameters().get("due_date").substring(0, jQuery.sap.getUriParameters().get("due_date").indexOf("/"));
					var dueDate2 = jQuery.sap.getUriParameters().get("due_date").substring(jQuery.sap.getUriParameters().get("due_date").indexOf("/"));
					var generalFrom = "";
					var monthFrom = "";
					var dayFrom = "";
					var generalTo = "";
					var monthTo = "";
					var dayTo = "";
					var dateToday   = new Date();
      				var dueDateFrom = new Date();
      				var dueDateTo   = new Date();
      				var index = 0;
      				var month;
      				// Extract first occurence of due date in URL
      				if (dueDate1.indexOf("months") > -1) {
      					generalFrom = dueDate1.substring(3, dueDate1.length - 5);
      					dueDateFrom.setMonth(dateToday.getMonth() + parseInt(generalFrom));
      				} else if (dueDate1.indexOf("days") > -1) {
      					generalFrom = dueDate1.substring(3, dueDate1.length - 4);
      					dueDateFrom.setTime(dateToday.getTime() + parseInt(generalFrom) * 24 * 60 * 60 * 1000);
      				} else
      					index = 1;
      				monthFrom = (dueDateFrom.getMonth() + 1).toString();
      				if (monthFrom.length == 1)
      					monthFrom = "0" + monthFrom;
      				dayFrom = (dueDateFrom.getDate()).toString();
      				if (dayFrom.length == 1)
      					dayFrom = "0" + dayFrom;
      				// Extract second occurence of due date in URL
      				if (dueDate2.indexOf("months") > -1) {
      					generalTo = dueDate2.substring(4, dueDate2.length - 5);
      					dueDateTo.setMonth(dateToday.getMonth() + parseInt(generalTo));
      				} else if (dueDate2.indexOf("days") > -1) {
      					generalTo = dueDate2.substring(4, dueDate2.length - 4);
      					dueDateTo.setTime(dateToday.getTime() + parseInt(generalTo) * 24 * 60 * 60 * 1000);
      				} else
      					index = 2;
    				monthTo = (dueDateTo.getMonth() + 1).toString();
      				if (monthTo.length == 1)
      					monthTo = "0" + monthTo;
      				dayTo = (dueDateTo.getDate()).toString();
      				if (dayTo.length == 1)
      					dayTo = "0" + dayTo;
      				// Process the extracted data to created filter for URL
      				if (index == 0) {
      					this.filter += " and (activity_planned_date_to ge datetime'"
      						+ dueDateFrom.getFullYear().toString()
		      				+ "-"
      						+ monthFrom
      						+ "-"
		      				+ dayFrom
      						+ "T00:00:00' and "
      						+ "activity_planned_date_to le datetime'"
		      				+ dueDateTo.getFullYear().toString()
      						+ "-"
      						+ monthTo
		      				+ "-"
      						+ dayTo
      						+ "T23:59:59')";
		      		} else if (index == 1) {
      					this.filter += " and (activity_planned_date_to le datetime'"
      						+ dueDateTo.getFullYear().toString()
		      				+ "-"
      						+ monthTo
      						+ "-"
      						+ dayTo
      						+ "T23:59:59')";
		      		} else if (index == 2) {
      					this.filter += " and (activity_planned_date_to ge datetime'"
      						+ dueDateFrom.getFullYear().toString()
		      				+ "-"
      						+ monthFrom
      						+ "-"
		      				+ dayFrom
      						+ "T00:00:00')";
      				}
				}
			},

			_sortByPriority: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.activity_priority) < (value2.activity_priority) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.activity_priority) < (value2.activity_priority) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},

			_sortByRefCustSort: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.refCaseInd) < (value2.refCaseInd) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.refCaseInd) < (value2.refCaseInd) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},

			_sortByCustomer: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.customer_name.toLowerCase()) < (value2.customer_name.toLowerCase()) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.customer_name.toLowerCase()) < (value2.customer_name.toLowerCase()) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},

			_sortByIssue: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.activity_description.toLowerCase()) < (value2.activity_description.toLowerCase()) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.activity_description.toLowerCase()) < (value2.activity_description.toLowerCase()) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},

			_sortByDate: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.date) < (value2.date) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.date) < (value2.date) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},

			_sortByDueDate: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.activity_planned_date_to) < (value2.activity_planned_date_to) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.activity_planned_date_to) < (value2.activity_planned_date_to) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},

			_sortByRating: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.activity_rating_i) < (value2.activity_rating_i) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.activity_rating_i) < (value2.activity_rating_i) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},

			_sortByStatus: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.activity_status_desc) < (value2.activity_status_desc) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.activity_status_desc) < (value2.activity_status_desc) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},

			_sortByEmployee: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.fullName) < (value2.fullName) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.fullName) < (value2.fullName) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},

			_sortByCountry: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.country) < (value2.country) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.country) < (value2.country) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},

			_sortByDelUnit: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.delUnitText) < (value2.delUnitText) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.delUnitText) < (value2.delUnitText) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},
			
			_sortByActivityId: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (parseInt(value1.activity_id)) < (parseInt(value2.activity_id)) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (parseInt(value1.activity_id)) < (parseInt(value2.activity_id)) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},	
			
			checkAuthorization: function () {
				this.location = location;
				this.myODataModel = this.getModel();
				this.showBusyDialog();
				// Authorization checks:
				// 1. Z_ORD_OEPR                  --> Activities in general
				// 2. XMLHttpRequest.responseText --> General authorization
				var auth1 = "yes";
				var message = "";
				var that = this;
				this.noAuth = "";
				// Collect authorization
				var requestURL_Authorization = sap.ui.require.toUrl("corp/sap/mdrdashboards") 
					+ "/apim/ic/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/AuthorizationCheckSet";
				jQuery.ajax({
					async:  false,
					headers: {
						'AppIdentifier': 'FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ', //API Management: ID for MDR Dashboards
						'mccprofile': 'MDR2_AuthCheck'
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
								case "Z_ORD_OEPR": {	
									if (jsonData[i].authorzied == "no") {
										auth1 = "no";
										this.noAuth = "x";
									} 
									break;
								} 
							}
						}
						// Raise messagetoast in case of missing authorization
						if (auth1 === "no") {
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
							that.hideBusyDialog();
						} else {
							that.loadModelFromBackend();
						}
					},
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
						if (XMLHttpRequest.responseText && (XMLHttpRequest.responseText.indexOf("auth")) > -1) {
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
							that.loadModelFromBackend();
						} else {
							that.loadModelFromBackend();
						}
					},
					complete : function (){
					}
				});
			},

			checkAuthEsc: function () {
				// Authorization checks:
				// S_SCMG_CAS_01 --> Escalation Cases
				var auth3 = "yes";
				var message = "";
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
						'mccprofile': 'MDR2_AuthCheckEsc'
					},
					url:  requestURL_Authorization,
					type: "get",
					dataType: "json",
					success: function (data) {
						var jsonData = data.d.results;
						for (var i =0; i < jsonData.length; i++) {
							switch (jsonData[i].authorization_obect_name) {
								case "S_SCMG_CAS_01": {
									// Authorization for escalation cases
									if (jsonData[i].authorzied == "no") {
										auth3 = "no";
									}
									break;
								}
							}
						}
						// Raise messagebox in case of missing authorization
						// Check authorization
						if (auth3 === "no") {
							this.noAuth = "yes";
						} else {
							this.noAuth = "no";
						}
					}.bind(this),
					error: function () {
					},
					complete : function (){
					}
				});
			},
						
			setDeliveryUnitTxt: function (activity_delivery_unit) {
				var unitMap = {
					"167980": 'Ariba', // Ariba
					"4829451": 'Concur', // Concur
					"3714250": 'Crossgate', // Crossgate
					"14081318": 'CtrlS', // CtrlS
					"8470002": 'Fieldglass', // Fieldglass
					"9548097": 'Hybris', // hybris
					"10351239": 'C4C', // C4C
					"26954804": 'C4P', // C4P
					"13014776": 'ByD', // ByD
					"15453147": 'C4TE', // C4TE
					"1212132": 'HEC', // HEC
					"26494752": "HCP", //CPI ( former HCI )
					"1804051": 'SAP IT', // SAP IT (ICP, BWP, SAPStore etc.)
					"24688048": 'SCP', // SCP ( former HCI )
					"23880567": 'IBP', // IBP
					"14215381": 'S/4Hana', // S/4 Hana
					"167698": 'SuccessFactors', // SuccessFactors
					"1092494": 'BCX', // BCX
					"22187741": 'CenturyLink', // CenturyLink
					"22846399": 'HP', // HP
					"21094140": 'IBM', // IBM
					"8604698": 'Injazat', // Injazat
					"17958862": 'NTT', // NTT
					"2135872": 'TIVIT', // TIVIT
					"1092747": 'T-System', // T-System
					"11585500": 'Virtustream' // Virtustream
				};
				var sUnitTxt = " ";
				if (activity_delivery_unit && activity_delivery_unit.length > 0 && unitMap[activity_delivery_unit]) {
					sUnitTxt = unitMap[activity_delivery_unit];
				}

				return sUnitTxt;
			},

			openMDR7: function (ActivityCases) {
				if (ActivityCases !== null && ActivityCases !== undefined) {
					if (ActivityCases.results.length > 0) {
						var sourceIC = this.source_IC;
						var length = ActivityCases.results.length;
						for (var i =0; i < length; i++) {
							if (ActivityCases.results[i].case_type === "ZS01") {
								this.checkAuthEsc();
								break;
							}
						}
						// Create URL to create link to MDR7 with the cases assigned to this activity
						var noAuth = "";
						if (this.noAuth === "yes") {
							noAuth = "&noAuth=yes";
						} else {
							noAuth = "&noAuth=no";
						}
						this.noAuth = "";
						var activityCaseIDsFilter = "case_id eq %27";
						var activityCaseIDs = "";
						var title = jQuery.sap.getUriParameters().get("title");
						if (title === null) {
							title = "&title=CaseID = ";
						} else {
							title = "&title=" + jQuery.sap.getUriParameters().get("title") + " - CaseID = ";
						}
						var layout = jQuery.sap.getUriParameters().get("layout");
						if (layout === null) {
							layout = "&layout=blue";
						} else {
							layout = "&layout=" + jQuery.sap.getUriParameters().get("layout");
						}
						var maskData = "";
						if (jQuery.sap.getUriParameters().get("maskData") !== null) {
							maskData = "&MaskData=" + jQuery.sap.getUriParameters().get("maskData").toLowerCase();
						} else if (jQuery.sap.getUriParameters().get("MaskData") !== null) {
							maskData = "&MaskData=" + jQuery.sap.getUriParameters().get("MaskData").toLowerCase();
						} else {
							maskData = "&MaskData=no";
						}
						for (var l = 0; l < length; l++) {
							if (l > 0) {
								activityCaseIDsFilter += " or case_id eq %27" + ActivityCases.results[l].transactions_case_id + "%27";
								activityCaseIDs += ", " + ActivityCases.results[l].transactions_case_id;
							} else {
								activityCaseIDsFilter += ActivityCases.results[l].transactions_case_id + "%27";
								activityCaseIDs = ActivityCases.results[l].transactions_case_id;
							}
						}
						activityCaseIDsFilter += ")";
						title = title + activityCaseIDs;
						var host = window.location.host;
						var path = window.location.pathname;
						var URL = [
							"https://",
							host,
							path,
							"?hc_reset&filter=(",
							activityCaseIDsFilter,
							title,
							maskData,
							layout,
							noAuth,
							"&listView=no",
							"#/MDR7"
						].join("");
						window.open(URL);
					}
				}
			},

			calcPagination: function () {
				var totalRows = this.getFilteredCases().length;
				var pagerHeight = 80;
				var headerHeight = 48 + 64 + 60;
				var rowHeight = 40;
				var sizeHeightNew = document.documentElement.clientHeight - pagerHeight;
				var iNumPerPage = Math.floor((sizeHeightNew - headerHeight) / rowHeight);
				this.oUIModel.setProperty("/numPerPage", iNumPerPage);
				this.oUIModel.setProperty("/currentPage", 1);
				this.oUIModel.setProperty("/numberOfPages", Math.ceil(totalRows / iNumPerPage));
			},

			reCalcPaginationByRealRowHeight: function () {
				var iRealRowHeight = this._getRealTableRowHeight();
				//Log.error("in reCalcPagination 1 iRealRowHeight=" + iRealRowHeight);
				if (iRealRowHeight && iRealRowHeight === this._iRowHeight) {
					return;
				}
				//Log.error("in reCalcPagination 2 iRealRowHeight=" + iRealRowHeight);
				this._iRowHeight = iRealRowHeight;
				this.calcPagination();
				this.updateOnePageDataToTable(1);
				this.resetPagination();
			},

			_getRealTableRowHeight: function () {
				var oTable = this.getView().byId("activityTable");
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
				var oTable = this.getView().byId("activityTable");
				if (!this.oPaginator) {
					var oPaginator = new CustomPaginator("mdr2-table-paginator", {
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
			},

			resetPagination: function () {
				if (this.oPaginator) {
					this.oPaginator.setCurrentPage(this.oUIModel.getProperty("/currentPage"));
					this.oPaginator.setNumberOfPages(this.oUIModel.getProperty("/numberOfPages"));
				}
			},

			getFilteredCases: function () {
				var allActivityModel = this.getModel("allPageCases");
				var filteredCaseModel = this.getModel("filteredCases");
				if (filteredCaseModel && filteredCaseModel.getData()) {
					Log.debug('getFilteredCases: filteredCaseModel.getData().results.length=' + filteredCaseModel.getData().results.length);
					return filteredCaseModel.getData().results;
				}

				if (allActivityModel && allActivityModel.getData()) {
					Log.debug('getFilteredCases: allActivityModel.getData().results.length=' + allActivityModel.getData().results.length);
					return allActivityModel.getData().results;
				}
				Log.debug('getFilteredCases: filteredCaseModel and allActivityModel are all empty!!');
				return [];
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
				this.setModel(jsonModel, "activityModel"); // +
			},

			sort: function (oEvent) {
				setTimeout(function () {
					var oTable = this.getView().byId("activityTable");
					var aSorters = oTable.getBinding().aSorters;
					this.aCurrentSorters = aSorters;
					this.sortByColumns(aSorters);
				}.bind(this));
			},

			sortByColumns: function (aSorters) {
				if (aSorters == null || aSorters.length === 0) {
					return;
				}
				var allCases = this.getFilteredCases();
				var sortedCases = SorterProcessor.apply(allCases, aSorters, function (d, path) {
					return d[path];
				}, function (d) {
					return d.activity_id;
				});
				var filteredCaseModel = new JSONModel();
				filteredCaseModel.setData({
					results: sortedCases
				});
				this.setModel(filteredCaseModel, "filteredCases");
				this.updateOnePageDataToTable(1);
				this.resetPagination();
			},
			
			filterActivity: function (oEvent) {
				this._filterActivity(oEvent);
			},
			_filterActivity: function (oEvent, aExistedFilters) {
				setTimeout(function () {
					var oTable = this.getView().byId("activityTable");
					var aFilters = aExistedFilters || oTable.getBinding().aFilters;
					// if (aFilters == null || aFilters.length === 0) {
					// 	this.sort();
					// 	return;
					// }

					var allActivityModel = this.getModel("allPageCases");
					var filteredCases = allActivityModel.getData().results;

					if (aFilters !== null && aFilters.length > 0) {
						filteredCases = allActivityModel.getData().results.filter(function (item, index) {
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

			hasLoadedData: function() {
				return this.getModel("allPageCases") && this.getModel("allPageCases").getData() && this.getModel("allPageCases").getData().results.length > 0;
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
					var bCard = this.oUIModel.getProperty("/viewActivity");
					flipTimer++;
					if (!bCard && this.oPaginator && !this.pauseFlip && (flipTimer >= this.flipInterval) && this.hasLoadedData()) {
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
				window.open("https://go.sap.corp/MDR2-info", "MDR2 - Info");
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
					priority: "Priority",
					employee: "Employee",
					serviceTeam: "Service Team",
					status: "Status",
					actCategory: "Act Category",
					activity_customer: "Customer",
					activity_bp: "BP",
					rating: "Rating",
					issue: "Issue",
					result: "Result",
					reason: "Reason",
					id: "ID",
					process_type: "Process Type",
					msg: "Msg",
					country: "Country",
					dueTimeKey: "Due Time",
					datePlanned: "Date Planned",
					dateCreated: "Date Created",
					dateGoLive: "Date GoLive",
					marketUnit: "Market Unit",
					marketUnitDesc: "Market Unit Description",
					delUnitText: "Delivery Unit",
					link: "Link"
				});
				var excel_table = this.getView().byId("excel_download_table");
				if (excel_table == null) {
					var aColumnsdownload = [
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/process_type}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/priority}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/status}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/actCategory}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/activity_bp}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/activity_customer}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/rating}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/issue}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/result}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/reason}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/msg}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/country}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/dueTimeKey}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/datePlanned}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/dateGoLive}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/dateCreated}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/employee}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/serviceTeam}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/id}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/marketUnit}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/marketUnitDesc}"
							})
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/delUnitText}"
							})	
						}), new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/link}"
							})
						})
					];
					new sap.m.ColumnListItem("oTemplateOfferingsDownload", {
						cells: [
							new sap.m.Text({
								text: "{process_type}"
							}), new sap.m.Text({
								text: "{priority}"
							}), new sap.m.Text({
								text: "{status}"
							}), new sap.m.Text({
								text: "{actCategory}"
							}), new sap.m.Text({
								text: "{activity_bp}"
							}), new sap.m.Text({
								text: "{activity_customer}"
							}), new sap.m.Text({
								text: "{rating}"
							}), new sap.m.Text({
								text: "{issue}"
							}), new sap.m.Text({
								text: "{result}"
							}), new sap.m.Text({
								text: "{reason}"
							}), new sap.m.Text({
								text: "{msg}"
							}), new sap.m.Text({
								text: "{country}"
							}), new sap.m.Text({
								text: "{dueTimeKey}"
							}), new sap.m.Text({
								text: "{datePlanned}"
							}), new sap.m.Text({
								text: "{dateGoLive}"
							}), new sap.m.Text({
								text: "{dateCreated}"
							}), new sap.m.Text({
								text: "{employee}"
							}), new sap.m.Text({
								text: "{serviceTeam}"
							}), new sap.m.Text({
								text: "{id}"
							}), new sap.m.Text({
								text: "{market_unit}"
							}), new sap.m.Text({
								text: "{market_unit_desc}"
							}), new sap.m.Text({
								text: "{delUnitText}"	
							}), new sap.m.Text({
								text: "{link}"
							})
						]
					});
					excel_table = new sap.m.Table("excel_download_table", {
						columns: aColumnsdownload
					});
					excel_table.setModel(xls_download, "xls_download");
					excel_table.setVisible(false);
					this.getView().byId("dashboardPage").addContent(excel_table);
				}
			},
			
			addCustomMenu: function(data) {
				var that = this;
				var aCustomCols = ["customer_name", "activity_status_desc", "activity_person_name", "activity_service_team_name", "country"];
				// var aCustomCols = ["customer_name"];
				if (data.results.length > 0) {
					aCustomCols.forEach(function(sCol) {
						that._customMenuData[sCol] = new Set();
						data.results.forEach(function(d) {
							that._customMenuData[sCol].add(d[sCol]);
						});
					});
				}
				
				this.addCustomMenuForOneCol("customer_name", "customer_name");
				this.addCustomMenuForOneCol("activity_status_desc", "activity_status_desc");
				this.addCustomMenuForOneCol("activity_person_name", "activity_person_name");
				this.addCustomMenuForOneCol("activity_service_team_name", "activity_service_team_name");
				this.addCustomMenuForOneCol("country", "country");
			},
			
			addCustomMenuForOneCol: function(sColId, sProp) {
				var oNameCol = this.getView().byId(sColId);
				var that = this;
				//clean existed menuitems
				oNameCol.getMenu().getItems().forEach(function(oMI, idx) {
					if (idx > 2) {
						oMI.destroy();
					}
				});
				
				var aMenuItemData = this._customMenuData[sProp];
				var index = 0;
				aMenuItemData && Array.from(aMenuItemData).sort(function(a, b){
					return a.localeCompare(b, {}, {sensitivity: "base"});
				}).forEach(function(v) {
					if (index < 20) {
						var oMItem = new sap.ui.unified.MenuItem({
							text: v,
							select: that.onCustomFilter.bind(that)
						});
						oNameCol.getMenu().addItem(oMItem);
					}
					index++;
				});
			},
			
			resetExistedSort: function(aSorters) {
				var oTable = this.getView().byId("activityTable");
				oTable.getColumns().forEach(function(oCol) {
					oCol.setSorted(false);
				});
				oTable.getBinding().aSorters = aSorters;
			},
			
			onCustomSort: function(oEvent) {
				var oItem = oEvent.getSource();
				var oCurrentColumn = oItem.getParent().getParent();
				
				var aSorters = [new sap.ui.model.Sorter(oCurrentColumn.getSortProperty(), oItem.getText().indexOf("Descending") !== -1)];
				this.resetExistedSort(aSorters);
				
				oCurrentColumn.setSortOrder(oItem.getText().replace("Sort ", ""));
				oCurrentColumn.setSorted(true);
				
				this.sort();
			},
			
			onCustomFilter: function(oEvent) {
				var oItem = oEvent.getSource();
				var oCurrentColumn = oItem.getParent().getParent();
				// var bFiltered = oCurrentColumn.getFiltered();
				var selected = oItem.getIcon() === "";
				//reset icon
				oCurrentColumn.getMenu().getItems().forEach(function(oMI, index) {
					//if (oMI.getText().indexOf("Sort ") === -1) {
					if (index > 2) {
						oMI.setIcon("");
					}
				});
				oItem.setIcon(selected ? "sap-icon://accept" : "");
				
				var oTable = this.getView().byId("activityTable");
				if (selected) {
					// if (!bFiltered) {
						var aFilters = oTable.getBinding().aFilters;
						if (!aFilters) {
							aFilters = [];
						}
						
						var sOperator = oCurrentColumn.getFilterProperty() === "statusFilter" ? FilterOperator.EndsWith : FilterOperator.EQ;
						aFilters.push(new sap.ui.model.Filter({
							path: oCurrentColumn.getFilterProperty(),
							operator: sOperator,
							value1: oItem.getText()
						}));
						
						oTable.getBinding().aFilters = aFilters;
						oCurrentColumn.setFiltered(true);
					// } else {
					// 	var selfFilters = oTable.getBinding().aFilters.filter(function(f) { 
					// 		return f.getPath() === oCurrentColumn.getFilterProperty();
					// 	});
					// 	if (selfFilters && selfFilters.length > 0 ) {
					// 		selfFilters[0].setValue1(oItem.getText());
					// 	}
					// }
				} else {
					var leftFilters = oTable.getBinding().aFilters.filter(function(f) { 
						return f.getPath() !== oCurrentColumn.getFilterProperty();
					});
					oTable.getBinding().aFilters = leftFilters;
					oCurrentColumn.setFiltered(false);
				}
				
				this._filterActivity(null, oTable.getBinding().aFilters);
			},
			
			onCustomSearchFilter: function(oEvent) {
				var oItem = oEvent.getSource();
				var oCurrentColumn = oItem.getParent().getParent();
				var sFilter = oItem.getValue();
				
				oCurrentColumn.getMenu().getItems().forEach(function(oMI, index) {
					if (index < 3) {
						oMI.setIcon("");
					}
				});
				
				var oTable = this.getView().byId("activityTable");
				if (sFilter && sFilter.length > 0) {
					var aFilters = oTable.getBinding().aFilters;
						if (!aFilters) {
							aFilters = [];
						}
						aFilters = aFilters.filter(function(f) { 
							return f.getPath() !== oCurrentColumn.getFilterProperty();
						});
						
						var sOperator = FilterOperator.Contains;
						aFilters.push(new sap.ui.model.Filter({
							path: oCurrentColumn.getFilterProperty(),
							operator: sOperator,
							value1: sFilter
						}));
						
						oTable.getBinding().aFilters = aFilters;
						oCurrentColumn.setFiltered(true);
				} else {
					var leftFilters = oTable.getBinding().aFilters.filter(function(f) { 
						return f.getPath() !== oCurrentColumn.getFilterProperty();
					});
					oTable.getBinding().aFilters = leftFilters;
					oCurrentColumn.setFiltered(false);
				}
				
				this._filterActivity(null, oTable.getBinding().aFilters);
				
			}
			
		});
	});