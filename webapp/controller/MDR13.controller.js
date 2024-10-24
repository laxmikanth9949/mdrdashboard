sap.ui.define([
	"corp/sap/mdrdashboards/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/FilterProcessor",
	"sap/ui/model/SorterProcessor",
	"corp/sap/mdrdashboards/model/formatterMDR13",
	"corp/sap/mdrdashboards/controls/TablePager",
	"corp/sap/mdrdashboards/controls/CustomPaginator",
	"corp/sap/mdrdashboards/HelpScreens/excel_download",
	"sap/m/MessageToast",
	"sap/base/Log",
	"sap/ui/Device",
	"corp/sap/mdrdashboards/libs/exp_pptx"

], function (BaseController, JSONModel, ODataModel, Filter, FilterOperator, FilterProcessor, SorterProcessor,
	FormatterMDR13, TablePager, CustomPaginator, excel_download, MessageToast, Log, Device, dummyPPT) {
	"use strict";

	return BaseController.extend("corp.sap.mdrdashboards.controller.MDR13", {

		onInit: function () {
			this.source_BC = "bcp";
			this.source_IC = "icp";
			this.filter = "";
			this.URL = "";
			this._iRowHeight = 40;
			this.refreshInterval = 600;
			this.flipInterval = 60;
			this.pauseFlip = false;
			this._realDataLength = {};
			this.getSourceBCAddr();
			this.getSourceICAddr();
			this.selectedYear = location.hostname;
			this.results_xls = [];
			this.changePageTitle();
			// Style sheet
			jQuery.sap.includeStyleSheet("css/style_mdr13.css", "stylemdr13");
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
				theme: sTheme,
				caseNumber: 0,
				redNumber: 0,
				yellowNumber: 0,
				sourceIC: this.source_IC,
				sourceBC: this.source_BC,
				maskData: "NO",
				title: "",
				refreshTime: "00:00",
				pauseFlip: false,
				runTitle: false
				});
			this.getView().setModel(this.oUIModel, "UIModel");
			// Create correct path to images
			var oRootPath = jQuery.sap.getModulePath("corp.sap.mdrdashboards");
			var oImageModel = new sap.ui.model.json.JSONModel({
				path : oRootPath
			});
			this.setModel(oImageModel, "imageModel");
			// Resize
			sap.ui.Device.resize.attachHandler(this.windowResize, this);
			// Mobile Usage Reporting: Version Distribution --> Counts Number of Devices
			try {
				var tracking = new GlobalITTracking("MDR Dashboards", "MDR13 - Open Complaints – V1.1.0");
			} catch (e) {
				/* eslint no-console: "error" */
				console.log("Error: " + e);
			}
			// Mobile Usage Reporting: Events --> Counts Calls of the Application
			sap.git.usage.Reporting.addEvent(this.getOwnerComponent(), "MDR13 - Open Complaints – V1.1.0");
			this.createDownloadXLS();
			this.showBusyDialog();
		},

		getSourceBCAddr: function () {
			var host = window.location.host;
			var sourceBC = "bcp";
			if ((host.search("dev-mallard") !== -1) || (host.search("mccdashboardrepository-dev") !== -1)  || (host.search("port5000") !== -1)) {
				sourceBC = "bcd";
			} else if ((host.search("test-kinkajou") !== -1) || (host.search("sapit-home-test-004") !== -1) || (host.search("mccdashboardrepository-test") !== -1)) {
				sourceBC = "bct";
			} else if ((host.search("prod-kestrel") !== -1) || (host.search("sapit-home-prod-004") !== -1) || (host.search("mccdashboardrepository.cfapps") !== -1)){
				sourceBC = "bcp";
			}
			this.source_BC = sourceBC;
			return this.source_BC;
		},

		getSourceICAddr: function () {
			var host = window.location.host;
			var sourceIC = "icp";
			if ((host.search("dev-mallard") !== -1) || (host.search("mccdashboardrepository-dev") !== -1)) {
				sourceIC = "icd";
			} else if ((host.search("test-kinkajou") !== -1) || (host.search("sapit-home-test-004") !== -1) || (host.search("mccdashboardrepository-test") !== -1)) {
				sourceIC = "ict";
			} else if ((host.search("prod-kestrel") !== -1) || (host.search("sapit-home-prod-004") !== -1) || (host.search("mccdashboardrepository.cfapps") !== -1)){
				sourceIC = "icp";
			}
			this.source_IC = sourceIC;
			return this.source_IC;
		},

		formatterMDR13: FormatterMDR13,
		
		changePageTitle: function () { 
          	var newPageTitle = "MDR13 - Open Complaints"; 
           	document.title = newPageTitle; 
       	},
        	
		onRouteMatched: function (oEvent) {
			var sRouteName = oEvent.getParameter("name");
			this.readURL();
			this._customizeUI();
			if (sRouteName === "MDR13") {
				this.checkAuthorization(); // --> Not pointing to BCx!
			//	this.loadModelFromBackend();
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
			// Collect BCx complaint data
			this.oDataModel = this.getModel("complaintModel");
			var header = {
				"AppIdentifier": "FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ",
				"mccprofile": "MDR13"
			};
			this.oDataModel.setHeaders(header);
			this.oDataModel.read("/complaintdataSet", {
				urlParameters: {
					$filter: this.filter
				},
				success: function (data) {
					this.hideBusyDialog();
					// Continue usual processing
					if (this.noAuth !== "x") {
						if (data.results.length === 0) {
							MessageToast.show("Data Collection completed, but no Data in Selection", {
								width: "360px",
								duration: 7000
							});
						}
					}
					this._processResult(data.results, this.results_xls);
					data.results = this._sortByDueDate(data.results);
					data.results = this._sortByPriority(data.results);
					this.results_xls = this._sortByDueDate(this.results_xls);
					this.results_xls = this._sortByPriority(this.results_xls);
					var allCaseModel = new JSONModel();
					allCaseModel.setSizeLimit(data.results.length);
					allCaseModel.setData(data);
					this.setModel(allCaseModel, "allPageCases");
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

		_processResult: function (results, results_xls) {
			var length = results.length;
			var nRed = 0;
			var nYellow = 0;
			var nOverdue = 0;
			for (var i = 0; i < length; i++) {
				// Rating
				if (results[i].Priority === "1" ) {
					results[i].PriorityText = "Very High";
					nRed++;
				} else if (results[i].Priority === "3") {
					results[i].PriorityText = "High";
					nYellow++;
				} else if (results[i].Priority === "5") {
					results[i].PriorityText = "Medium";
				} else if (results[i].Priority === "9") {
					results[i].PriorityText = "Low";
				} else {
					results[i].PriorityText = "-";
				}
				// Customer
				if (results[i].CustomerName === "" || results[i].CunstomerName === " ") {
					results[i].CustomerName = "N/A";
				}
				// Contract Type
				if (results[i].ContractType === "" ||
					results[i].ContractType === " " ||
					results[i].ContractType === "Blank" ||
					results[i].ContractType === "Unknown") {
					results[i].ContractType = "-";
				}
				// Overdue Icon
				if (results[i].Status !== "E0013" || results[i].Status !== "E0014")  {
					var currentDate = new Date();
					var currentDateMs = parseInt(currentDate.getTime(), 10);
					var dueDate = results[i].PlanEndDate;
					var dueDateMs = dueDate.getTime();
					if (dueDateMs < currentDateMs) {
						results[i].overdueIcon = "X";
						nOverdue++;
					} else {
						results[i].overdueIcon = "";
					}
				} else {
					results[i].overdueIcon = "";
				}
				// Due date (Planned End Date)
				results[i].PlanEndDateString = results[i].PlanEndDate.toString();
				var dueDateAll = this.formatDueDate(results[i].PlanEndDate);
				results[i].dueDate = dueDateAll.slice(0,11);
				results[i].dueTime = dueDateAll.slice(12,19);
				// Creation Date
				var creationDate = this.formatCreationDate(results[i].CreatedAt);
				results[i].creationDate = creationDate;
				results[i].creationTime = results[i].CreatedAt.slice(9,15);
				// Service Team
				if (results[i].ServiceTeamList === "") {
					results[i].ServiceTeamList = "N/A" + "\r\n" + "\r\n";
				} else {
					var index = results[i].ServiceTeamList.indexOf("/");
					if (index > -1) {
						results[i].ServiceTeamList = results[i].ServiceTeamList.slice(0, index);
					}
				}
				// Collect data for XML sheet //////////////////////////////////////////////////
				var j = i;
				results_xls[j] = {};
				results_xls[j].ID = results[i].ObjectId;
				results_xls[j].Priority = results[i].Priority;
				results_xls[j].PriorityText = results[i].PriorityText;
				results_xls[j].ProcessType = results[i].ProcessType;
				results_xls[j].Concatstatuser = results[i].Concatstatuser;
				results_xls[j].Reason = results[i].Codetext;
				results_xls[j].BP = results[i].SoldToParty;
				results_xls[j].Customer = results[i].SoldToPartyName;
				// Replace mutated vowels	
				results_xls[j].Customer = results_xls[j].Customer.replace("ä", "ae");
				results_xls[j].Customer = results_xls[j].Customer.replace("ö", "oe");
				results_xls[j].Customer = results_xls[j].Customer.replace("ü", "ue");
				results_xls[j].Customer = results_xls[j].Customer.replace("ß", "ss");
				results_xls[j].Rating = results[i].RatingTxt;
				results_xls[j].Description = results[i].Description;
				// Replace mutated vowels	
				results_xls[j].Description = results_xls[j].Description.replace("ä", "ae");
				results_xls[j].Description = results_xls[j].Description.replace("ö", "oe");
				results_xls[j].Description = results_xls[j].Description.replace("ü", "ue");
				results_xls[j].Description = results_xls[j].Description.replace("ß", "ss");
				results_xls[j].ContractType = results[i].ContractType;
				results_xls[j].Outcome = results[i].OutcomeTxt;
				results_xls[j].PlannedEndDate = results[i].dueDate;
				results_xls[j].CreationDate = results[i].creationDate;
				if (results[i].PersonRespName === "") {
					results_xls[j].EmployeeResponsible = "N/A";
				} else {
					results_xls[j].EmployeeResponsible = results[i].PersonRespName;
				}
				if (results[i].ComplMngrDesc === "") {
					results_xls[j].ComplaintManager = "N/A";
				} else {
					results_xls[j].ComplaintManager = results[i].ComplMngrDesc;
				}
				if (results[i].ServiceTeamList === "") {
					results_xls[j].ServiceTeam = "N/A";
				} else {
					results_xls[j].ServiceTeam = results[i].ServiceTeamList;
				}
				results_xls[j].Country = results[i].SoldToCtryTxt;
				results_xls[j].Link = this.formatterMDR13.complaintLink(this.source_BC, results[i].ObjectId);                         
			}
			this.oUIModel.setProperty("/allNumber", length);
			this.oUIModel.setProperty("/VHNumber", nRed);
			this.oUIModel.setProperty("/HNumber", nYellow);
			this.oUIModel.setProperty("/OverdueNumber", nOverdue);
			return results_xls;
		},

		formatDueDate: function (date) {
			var dateAll = "";
			var dueDate = "";
			var dueTime = "";
			var hours = "";
			var minutes = "";
			var ms = 0;
			// Modify the date to be displayed - 1
			if (date === "" || date === null) {
				dueDate = "N/A";
				dueTime = "N/A";
			} else {
				ms = date.getTime();
				date = new Date(ms);
				hours = date.getHours();
				if (hours <= 9) {
					hours = "0" + hours;
				}
				minutes = parseInt(date.getMinutes(), 10);
				if (minutes <= 9) {
					minutes = "0" + minutes;
				}
				dueTime = hours + ":" + minutes + " h";
			}
			// Modify the date to be displayed - 2
			var duedate = date;
			if (duedate){
				var day = duedate.getDate().toString();
				if (day.length === 1)
					day = "0" + day;
				var month = "";
				switch ((duedate.getMonth() + 1).toString()) {
				case '1':
					month = "Jan";
					break;
				case '2':
					month = "Feb";
					break;
				case '3':
					month = "Mar";
					break;
				case '4':
					month = "Apr";
					break;
				case '5':
					month = "May";
					break;
				case '6':
					month = "Jun";
					break;
				case '7':
					month = "Jul";
					break;
				case '8':
					month = "Aug";
					break;
				case '9':
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
				dueDate = day + " " + month + " " + duedate.getFullYear().toString();
				dateAll = dueDate + dueTime;
				return dateAll;
			}
		},

		formatCreationDate: function (date) {
			var day = date.slice(6,8);
			var year = date.slice(0,4);
			var month = date.slice(4,6).toString();
			switch (month) {
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
			var Date = day + " " + month + " " + year;
			return Date;
		},

		_sortByDueDate: function (data, sortDir) {
			if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.PlanEndDate) < (value2.PlanEndDate) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.PlanEndDate) < (value2.PlanEndDate) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
		},

		_sortByPriority: function (data, sortDir) {
			if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.Priority) < (value2.Priority) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.Priority) < (value2.Priority) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
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
			// Mask data
			if (jQuery.sap.getUriParameters().get("MaskData") !== null) {
				this.maskdata = jQuery.sap.getUriParameters().get("MaskData").toUpperCase();
			} else {
				this.maskdata = "NO";
			}
			this.oUIModel.setProperty("/maskData", this.maskdata);
			// Title
			if (jQuery.sap.getUriParameters().get("title") == null) {
				this.title = "MDR13 - Complaint List";
				this.oUIModel.setProperty("/title", "Incident List");
			} else {
				this.title = jQuery.sap.getUriParameters().get("title");
				this.oUIModel.setProperty("/title", this.title);
			}
			if (jQuery.sap.getUriParameters().get("run_title") === "")
				this.run_title = "no";
			// Service Team
			if (jQuery.sap.getUriParameters().get("ServiceTeamVisible") !== null)
				this.ServiceTeamVisible = jQuery.sap.getUriParameters().get("ServiceTeamVisible").toLowerCase();
			// Other parameters
			if (jQuery.sap.getUriParameters().get("refreshInterval") !== null)
				this.refreshInterval = 60 * jQuery.sap.getUriParameters().get("refreshInterval");
			if (jQuery.sap.getUriParameters().get("flipInterval") !== null)
				this.flipInterval = jQuery.sap.getUriParameters().get("flipInterval");
			// Test ////////
			this.filter = jQuery.sap.getUriParameters().get("filter");
			if (this.filter === null) {
				this.filter = "";
			}
			if (this.filter === "") {
			//	this.filter = "Status eq 'E0001'";
				this.filter = "(Status eq 'E0001' or Status eq 'E0002' or Status eq 'E0003' or Status eq 'E0008')";
			//	this.filter = "Rating eq 'C'";
			}
			// Dashboard Analyzer
			if (jQuery.sap.getUriParameters().get("da_test") !== null)
				this.da_test = jQuery.sap.getUriParameters().get("da_test");
		},

		checkAuthorization: function () {
			this.location = location;
			this.myODataModel = this.getModel();
			this.showBusyDialog();
			// Authorization checks:
			// 1. ??? - To be done!
			// 2. XMLHttpRequest.responseText --> General authorization
			var message = "";
			var that = this;
			this.noAuth = "";
			// Collect BCX authorization
			this.oDataModel = this.getModel("complaintModel");
			var header = {
				"AppIdentifier": "FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ",
				"mccprofile": "MDR13_AuthCheck"
			};
			this.oDataModel.setHeaders(header);			
			this.oDataModel.read("/complaintdataSet", {
				urlParameters: {
					$filter: this.filter
				},
				success: function (data) {
					if (that.myODataModel.oMetadata.bLoaded === false) {
						try {
							window.location.replace(that.location.href);
						}
						catch(e) {
							window.location = that.location.href;
						}
					}
					console.log("BCx - Authorization ok!");
					that.loadModelFromBackend();
				}.bind(that),
				error: function (error) {
					if (that.myODataModel.oMetadata.bLoaded === false) {
						try {
							window.location.replace(that.location.href);
						}
						catch(e) {
							window.location = that.location.href;
						}
					}
					console.log("BCx - Authorization Error");
					if (error.responseText) { 
					   if (error.responseText.indexOf("auth") > -1) {
							this.noAuth = "x";
							var message = "No Authorization to display Complaints!";
							MessageToast.show( message, {
								duration: 10000,
								width: "25em"  
							});
						}  	
					}
					that.hideBusyDialog();
					that.loadModelFromBackend();
				}.bind(that)
			});
		},

		_getPagerHeight: function () {
			// Pager height / footer
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
				var oPaginator = new CustomPaginator("table-paginator-MDR13", {
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
			//	console.log(d.ObjectId);
				return d.ObjectId;
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
			window.open("https://go.sap.corp/MDR13-info", "MDR13 - Info");
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
				PriorityText: "Priority",
				ComplID: "Complaint ID",
				BP: "BP",
				Customer: "Customer",
				ContractType: "Contract Type",
				Description: "Description",
				Outcome: "Outcome",
				PlannedEndDate: "Planned End Date",
				CreationDate: "Creation Date",
				Rating: "Rating",
				Status: "Status",
				Reason: "Reason",
				ComplMgt: "Complaint Manager",
				EmplResp: "Employee Responsible",
				ServiceTeam: "Service Team",
				Country: "Country",
				Link: "Link"
			});
			var excel_table = this.getView().byId("excel_download_table");
			if (excel_table == null) {
				var aColumnsdownload = [
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/PriorityText}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/ComplID}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/BP}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/Customer}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/ContractType}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/Description}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/Outcome}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/PlannedEndDate}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/CreationDate}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/Rating}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/Status}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/Reason}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/ComplMgt}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/EmplResp}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/ServiceTeam}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/Country}"
						})
					}),
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{xls_download>/Link}"
						})
					})
				];
				new sap.m.ColumnListItem("oTemplateOfferingsDownload", {
					cells: [
						new sap.m.Text({
							text: "{PriorityText}"
						}),
						new sap.m.Text({
							text: "{ID}"
						}),
						new sap.m.Text({
							text: "{BP}"
						}),
						new sap.m.Text({
							text: "{Customer}"
						}),
						new sap.m.Text({
							text: "{ContractType}"
						}),
						new sap.m.Text({
							text: "{Description}"
						}),
						new sap.m.Text({
							text: "{Outcome}"
						}),
						new sap.m.Text({
							text: "{PlannedEndDate}"
						}),
						new sap.m.Text({
							text: "{CreationDate}"
						}),
						new sap.m.Text({
							text: "{Rating}"
						}),
						new sap.m.Text({
							text: "{Concatstatuser}"
						}),
						new sap.m.Text({
							text: "{Reason}"
						}),
						new sap.m.Text({
							text: "{ComplaintManager}"
						}),
						new sap.m.Text({
							text: "{EmployeeResponsible}"
						}),
						new sap.m.Text({
							text: "{ServiceTeam}"
						}),
						new sap.m.Text({
							text: "{Country}"
						}),
						new sap.m.Text({
							text: "{Link}"
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
		}
	});
});