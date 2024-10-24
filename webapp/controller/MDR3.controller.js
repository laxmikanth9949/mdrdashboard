	sap.ui.define([
		"corp/sap/mdrdashboards/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/FilterProcessor",
		"sap/ui/model/SorterProcessor",
		"corp/sap/mdrdashboards/model/formatterMDR3",
		"corp/sap/mdrdashboards/controls/TablePager",
		"corp/sap/mdrdashboards/controls/CustomPaginator",
		"corp/sap/mdrdashboards/HelpScreens/excel_download",
		"sap/m/MessageToast",
		"sap/m/MessageBox",
		"sap/base/Log",
		"sap/ui/Device"
	], function (BaseController, JSONModel, Filter, FilterOperator, FilterProcessor, SorterProcessor,
		Formatter, TablePager, CustomPaginator, excel_download, MessageToast, MessageBox, Log, Device) {
		"use strict";
		
		return BaseController.extend("corp/sap/mdrdashboards.controller.MDR3", {

			onInit: function () {
				// Style sheet
				jQuery.sap.includeStyleSheet("css/style_mdr3.css","stylemdr3");
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
				this.flipInterval = 120;
				this.pauseFlip = false;
				this._realDataLength = {};
				this.layout = "";
				this.rolling = "";
				this.changePageTitle();
				this.results_xls = [];
				// Router /////
				this.oRouter = this.getRouter();
				this.oRouter.attachRouteMatched(this.onRouteMatched, this);
				// UI Model /////
				var sTheme = "blue";
				this.oUIModel = new JSONModel({
					results_xls: {},
					theme: sTheme,
					topIssueNumber: 0,
					redNumber: 0,
					yellowNumber: 0,
					sourceIC: this.source_IC,
					layout: "blue",
					title: "",
					runTitle: "no",
					maskData: "no",
					refreshTime: "00:00",
					pauseFlip: false
				});
				this.getView().setModel(this.oUIModel, "UIModel");
				// Resize
				sap.ui.Device.resize.attachHandler(this.windowResize, this);
				// Mobile Usage Reporting - Version Distribution
				// --> Counts Number of Devices
				try {
					var tracking = new GlobalITTracking("MDR Dashboards", "MDR3 - Top Issues - V1.1.0");
				} catch (e) {
					console.log("Error: " + e);
				}
				// Mobile Usage Reporting - Events
				// --> Counts Calls of the Application
				sap.git.usage.Reporting.addEvent(this.getOwnerComponent(), "MDR3 - Top Issues - V1.1.0");
				this.createDownloadXLS();
				this.showBusyDialog();
			},
			
			formatterMDR3: Formatter,
			
			changePageTitle: function () { 
            	var newPageTitle = "MDR3 - Top Issues"; 
            	document.title = newPageTitle; 
        	},			
			
			onRouteMatched: function (oEvent) {
				var sRouteName = oEvent.getParameter("name");
				this.readURL();
				this._customizeUI();
				if (sRouteName === "MDR3") {
					this.checkAuthorization();
				//	this.loadModelFromBackend(); // --> Now in checkAuthorization !!
					this.setRefreshTime();
					this._intervalTasks();
				}
			},

			_customizeUI: function () {
				this.oUIModel.setProperty("/theme", this.layout === "dark" ? "dark" : "blue");
				this.getView().byId("dashboardPage");
				this.getView().byId("dashboardPage").addStyleClass(this.layout);
			},
			
			loadModelFromBackend: function () {
				// Rolling filter
				//   rolling=x --> x = number of weeks
				//   start = today - x week
				//   end = today
				if (this.rolling.length !== 0) {
					var date = new Date();
					var year = date.getFullYear();
					var month = date.getMonth() + 1;
					var datum = date.getDate();
					var dateStart = new Date(date.getTime() - this.rolling * 7 * 24 * 60 * 60 * 1000);
					var endDate = year + "-" + month + "-" + datum + "T00:00:00";
					month = dateStart.getMonth() + 1;
					dateStart = dateStart.getFullYear() + "-" + month + "-" + dateStart.getDate() + "T00:00:00";
					this.filter = "(posting_date ge datetime'" + dateStart + "' and posting_date le datetime'" + endDate + "') and " + this.filter;
				}
				this.oDataModel = this.getComponentModel();
				var header = {
					"AppIdentifier": "FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ",
					"mccprofile": "MDR3"
				};
				this.oDataModel.setHeaders(header);							
				this.oDataModel.read("/TopIssueList", {
					urlParameters: {
						$filter: this.filter,
						$expand: "TopIssueCases,Parties"
					//	$expand: "Cases,Parties"
					//	$expand: "Parties"
					},
					success: function (data) {
						this.hideBusyDialog();
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
						data.results = this._sortByPriority(data.results);
						data.results = this._sortByDueDate(data.results);
						data.results = this._sortByRating(data.results, "desc");
						jsonModel.setData(data);
						// Store data for table pagination
						var allActivityModel = new JSONModel();
						allActivityModel.setSizeLimit(data.results.length);
						allActivityModel.setData(data);
						this.setModel(allActivityModel, "allPageCases");
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
				// Specify and initialize variables
				var l = results.length;
				var nRed = 0;
				var nGreen = 0;
				var nYellow = 0;
				var nAll = l;
				// Further processing
				for (var i = 0; i < l; i++) {
					// Rating
					if (results[i].rating_code === "C") {
						results[i].ratingCode = "5";
						nRed++;
					} else if (results[i].rating_code === "B") {
						results[i].ratingCode = "3";
						nYellow++;
					} else if (results[i].rating_code === "A") {
						results[i].ratingCode = "1";
						nGreen++;
					} else {
						results[i].ratingCode = "0";
					}
					// Cases
					var esc = "";
					var refCaseInd = 0;
					// $expand Cases
					if (results[i].Cases.results !== undefined && results[i].Cases.results !== null) {
						for (var j = 0; j < results[i].Cases.results.length; j++) {
							esc = "";
							if (results[i].Cases.results[j].case_type === "ZS01") {
								esc = "x";
							}
						}
						if (esc === "x") {
							refCaseInd = results[i].Cases.results.length + 100;
						} else {
							refCaseInd = results[i].Cases.results.length;
						}
					} else {
						refCaseInd = 0;
					}
					// $expand TopIssueCase
					if (results[i].TopIssueCases.results !== undefined && results[i].TopIssueCases.results !== null) {
						for (var j = 0; j < results[i].TopIssueCases.results.length; j++) {
							esc = "";
							if (results[i].TopIssueCases.results[j].case_type === "ZS01") {
								esc = "x";
							}
						}
						if (esc === "x") {
							refCaseInd = results[i].TopIssueCases.results.length + 100;
						} else {
							refCaseInd = results[i].TopIssueCases.results.length;
						}
					} else {
						refCaseInd = 0;
					}
					results[i].refCaseInd = refCaseInd;
					// Parties
					var lengthParties = results[i].Parties.results.length;
					if (lengthParties > 0) {
						for (var j = 0; j < lengthParties; j++) {
							// Replace mutated vowels
							results[i].Parties.results[j].parties_description_name = results[i].Parties.results[j].parties_description_name.replace("ä", "ae");
							results[i].Parties.results[j].parties_description_name = results[i].Parties.results[j].parties_description_name.replace("ö", "oe");
							results[i].Parties.results[j].parties_description_name = results[i].Parties.results[j].parties_description_name.replace("ü", "ue");
							results[i].Parties.results[j].parties_description_name = results[i].Parties.results[j].parties_description_name.replace("ß", "ss");
							// Customer name
							if (results[i].Parties.results[j].parties_function === "Sold-to Party" && results[i].Parties.results[j].parties_mainpartner === "X") {
								results[i].customerName = results[i].Parties.results[j].parties_description_name;
								results[i].customerBP = results[i].Parties.results[j].parties_bp_id;
							}
							if (results[i].Parties.results[j].parties_function === "Affected Customer" && results[i].Parties.results[j].parties_mainpartner === "X") {
								results[i].customerName = results[i].Parties.results[j].parties_description_name;
								results[i].customerBP = results[i].Parties.results[j].parties_bp_id;
							}
							// Service Team
							if (results[i].Parties.results[j].parties_function === "Service Team" && results[i].Parties.results[j].parties_mainpartner === "X") {
								results[i].serviceTeam = results[i].Parties.results[j].parties_description_name;
							}
							// Support Owner
							if (results[i].Parties.results[j].parties_function === "Employee Responsible" && results[i].Parties.results[j].parties_mainpartner === "X") {
								if (results[i].Parties.results[j].parties_description_name !== "") {
									results[i].agsOwner = results[i].Parties.results[j].parties_description_name;
								} else {
									results[i].agsOwner = results[i].Parties.results[j].parties_firstname + " " + results[i].Parties.results[j].parties_lastname;
								}	
							}
							if ( results[i].agsOwner === undefined || results[i].agsOwner === "" ) {
								results[i].agsOwner = "-";
								results[i].agsOwnerSort = "";
							} else {
								var indexBlank = results[i].agsOwner.lastIndexOf(" ");
								var firstName = results[i].agsOwner.slice(3, indexBlank);
								var surName = results[i].agsOwner.slice(indexBlank, results[i].agsOwner.length);
								results[i].agsOwnerSort = surName + firstName;
							}
							// Development Owner
							if (results[i].Parties.results[j].parties_function === "Development  Employee" || results[i].Parties.results[j].parties_function === "Development Employee") {
								if (results[i].Parties.results[j].parties_description_name !== "") {
									results[i].devOwner = results[i].Parties.results[j].parties_description_name;
								} else {
									results[i].devOwner = results[i].Parties.results[j].parties_firstname + " " + results[i].Parties.results[j].parties_lastname;
								}	
							}
						}	
					} else {
						results[i].agsOwner = "-";
					}
					// Description is empty...
					if ( results[i].description == undefined || results[i].description == "" ) {
						results[i].description = "-";
					} else {
						// Replace mutated vowels	
						results[i].description = results[i].description.replace("ä", "ae");
						results[i].description = results[i].description.replace("ö", "oe");
						results[i].description = results[i].description.replace("ü", "ue");
						results[i].description = results[i].description.replace("ß", "ss");
					}
					// Category is empty
					if ( results[i].category_desc === undefined || results[i].category_desc === "" ) {
						results[i].category_desc = "-";
					}
					// Issue type
					if (results[i].process_type === "ZS50") {
						results[i].issueType = "S";
						results[i].issueTypeText = "SolMan Top Issue";
					} else if (results[i].process_type === "ZS34") {
						results[i].issueType = "T";
						results[i].issueTypeText = "Top Issue";
					} else {
						results[i].issueType = "C";
						results[i].issueTypeText = "Cross Issue";
					}
					// Overdue Icon / Due Date
					if (results[i].request_end !== null && results[i].request_end !== undefined) {
						// Overdue Icon
						var currentDate = new Date();
						if (results[i].request_end < currentDate) {
							if (results[i].status_desc === "Open" || 
								results[i].status_desc === "New" || 
								results[i].status_desc === "In Process" || 
								results[i].status_desc === "in Process" || 
								results[i].status_desc === "in process") {
								results[i].overdueIcon = "X";   
							}
						}
						// Due Date
						var dateString = results[i].request_end.toString();
						var day = dateString.slice(8,10);
						var month = dateString.slice(4,7);
						var year = results[i].request_end.getFullYear().toString();
							var dueDate = day + " " + month + " " + year;
						results[i].dueDate = dueDate;
					} else {
						results[i].overdueIcon = ""; 
						results[i].dueDate = "N/A";
					}
					// Creation Date
					if (results[i].created_at !== null && results[i].created_at !== undefined) {
						dateString = results[i].created_at.toString();
						day = dateString.slice(6,8);
						month = dateString.slice(4,6);
						// Translate month
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
					year = dateString.slice(0,4);
							var creationDate = day + " " + month + " " + year;
						results[i].creationDate = creationDate;
					
					} else {
						results[i].creationDate = "N/A";
					}
					// Top / Cross Issue view ?
					this.maskdata = jQuery.sap.getUriParameters().get("MaskData");
					if (jQuery.sap.getUriParameters().get("MaskData") !== null) {
						this.maskdata = jQuery.sap.getUriParameters().get("MaskData").toLowerCase();
					}
					var crossIssue = jQuery.sap.getUriParameters().get("crossIssue");
					if (crossIssue === "yes") {
						results[i].text1 = results[i].affected_product;
						if (this.maskdata !== "yes") {
							results[i].text2 = results[i].customerName;
						} else {
							if (results[i].customerName && results[i].customerName.length > 1) {
								results[i].text2 = results[i].customerName.substr(0,2) + "********";
							} else {
								results[i].text2 = "**********";
							}
						}
					} else {
						if (this.maskdata !== "yes") {
							results[i].text1 = results[i].customerName;
						} else {
							if (results[i].customerName && results[i].customerName.length > 1) {
								results[i].text1 = results[i].customerName.substr(0,2) + "********";
							} else {
								results[i].text1 = "**********";
							}
						}
						results[i].text2 = results[i].affected_product;
					}
					// Collect data for XML sheet //////////////////////////////////////////////////
					var j = i;
					results_xls[j] = {};
				//	results_xls[j].firstColumn = " ";
					results_xls[j].Rating = results[i].rating_desc;
					results_xls[j].BP = results[i].customerBP;
					results_xls[j].Customer = results[i].customerName;
					results_xls[j].Description = results[i].description;
					results_xls[j].CreationDate = results[i].creationDate;
					results_xls[j].DueDate = results[i].dueDate;
					results_xls[j].Priority = results[i].priority_desc;
					results_xls[j].Status = results[i].status_desc;
					results_xls[j].ProcessType = results[i].process_type;
					results_xls[j].CategoryCode = results[i].category_desc;
					results_xls[j].AGSOwner = results[i].agsOwner;
					results_xls[j].DevelopmentOwner = results[i].devOwner;
					results_xls[j].ServiceTeam = results[i].serviceTeam
					results_xls[j].SAPProduct = results[i].affected_product;
					results_xls[j].IssueId = results[i].top_issue_id;
					results_xls[j].Link = this.formatterMDR3.topIssueLink(this.source_IC, results[i].top_issue_id);                         
				}
				// Counters 
				this.oUIModel.setProperty("/numberAll", nAll);
				this.oUIModel.setProperty("/numberRatingRed", nRed);
				this.oUIModel.setProperty("/numberRatingYellow", nYellow);
				this.oUIModel.setProperty("/numberRatingGreen", nGreen);
			},
			
			readURL: function () {
				// Layout
				if (jQuery.sap.getUriParameters().get("layout") !== null) {
					this.layout = jQuery.sap.getUriParameters().get("layout").toLowerCase();
				} else {
					this.layout = "blue";
					this.oUIModel.setProperty("/layout", "blue");
				}
				// Mask data
				if (jQuery.sap.getUriParameters().get("MaskData") !== null) {
					this.maskdata = jQuery.sap.getUriParameters().get("MaskData").toLowerCase();
				} else {
					this.maskdata = "no";
				}
				this.oUIModel.setProperty("/maskData", this.maskdata);
				// Title
				if (jQuery.sap.getUriParameters().get("title") == null) {
					this.title = "MDR3 - Top / Cross Issues";
					this.oUIModel.setProperty("/title", "Top / Cross Issues");
				} else {
					this.title = jQuery.sap.getUriParameters().get("title");
					this.oUIModel.setProperty("/title", this.title);
				}
				if (jQuery.sap.getUriParameters().get("run_title") === "")
					this.run_title = "no";	
				// Rolling filter
				if (jQuery.sap.getUriParameters().get("rolling") != null)
					this.rolling = jQuery.sap.getUriParameters().get("rolling");
				// Test ////////
				this.filter = jQuery.sap.getUriParameters().get("filter");
				if (this.filter === null) {
					this.filter = "";
				}
				if (this.filter === "") {
				/*
					this.filter = 
						"(case_id eq '20001283' or case_id eq '20000982' or case_id eq '20000134' or" +
						" case_id eq '20001021' or case_id eq '20001967' or case_id eq '20002107' or" +
						" case_id eq '20002107' or case_id eq '20002121' or case_id eq '20001001' or" +
						" case_id eq '20000332' or case_id eq '20000580' or case_id eq '20000601' or" +
						" case_id eq '20002106' or case_id eq '20000972' or case_id eq '20000751' or" +
						" case_id eq '20000432' or case_id eq '20000972' or case_id eq '20000751' or" +
						" case_id eq '20002181' or case_id eq '20002106' or case_id eq '20000751' or" +
						" case_id eq '20001040' or case_id eq '20000942' or case_id eq '20001124')";
				*/		
					this.filter = "(case_id eq '20001021' or case_id eq '20001283' or case_id eq '20000332' or case_id eq '20000580')";
				//	this.filter = "(rating_code eq 'B' or rating_code eq 'A')";
				//	this.filter = "(rating_code eq 'C' or rating_code eq 'B' or rating_code eq 'A')";
				//	this.filter = "(rating_code eq 'C' or rating_code eq 'B' or rating_code eq 'A' or rating_code eq '')";
				//	this.filter = "process_type eq 'ZS50'";
				//	this.filter = "process_type eq 'ZS34'";
				//	this.filter = "(priority_desc eq 'High' or priority_desc eq 'Low')";
				//	this.filter = "(posting_date ge datetime'2019-9-11T00:00:00' and posting_date le datetime'2019-11-20T00:00:00')";
				} else {
				//	while (this.filter.indexOf("top_issue_case_id") > 0) {
				//		this.filter = this.filter.replace("top_issue_case_id", "case_id");
				//	}
				// To be removed in the future - only case_id parameter should be used in the future!
				}
			},
				
			_sortByRating: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.ratingCode) < (value2.ratingCode) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.ratingCode) < (value2.ratingCode) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},	
				
			_sortByProduct: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.affected_product) < (value2.affected_product) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.affected_product) < (value2.affected_product) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},
				
			_sortByPriority: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.priority_code) < (value2.priority_code) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.priority_code) < (value2.priority_code) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
			},
				
			_sortByDueDate: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.request_end) < (value2.request_end) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.request_end) < (value2.request_end) ? -1 : 1;
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
				// 1. S_SCMG_CAS/ Z_ORD_OEPR      --> Case Type = ZS02 + Objecty Type = ZS38
				// 2. XMLHttpRequest.responseText --> General authorization
				var auth1 = "yes";
				var message = "";
				var that = this;
				this.noAuth = "";
				// Collect authorization
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
						'mccprofile': 'MDR3_AuthCheck'
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
						for (i = 0; i < jsonData.length; i++) {
							switch (jsonData[i].authorization_obect_name) {
								case "S_SCMG_CAS/ Z_ORD_OEPR": {	
									if (jsonData[i].authorzied == "no") {
										auth1 = "no";
										this.noAuth = "x";
									} 
									break;
								} 
							}
						}
						// Check authorization
						if (auth1 === "no") {
							that.message = "No authorization to display the requested data!" 
								+ "\n " 
								+ "\n For how to get additional authorization please check the following document:"
								+ "\n https://go.sap.corp/MCC-ICP-Profiles"
								+ "\n "
								+ "\n You can directly access this document via button 'OK'";
							MessageBox.show(
								message, {
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
						//	that.loadModelFromBackend();
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
						//	that.loadModelFromBackend();
						} else {
						//	that.loadModelFromBackend();
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
				var requestURL_Authorization = "/" 
				//	+ this.source_IC 
				//	+ "/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/AuthorizationCheckSet";
					+ "apim/ic/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/AuthorizationCheckSet";
				jQuery.ajax({
					async:  false,
					headers: {
						'AppIdentifier': 'FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ', //API Management: ID for MDR Dashboards
						'mccprofile': 'MDR3_AuthCheckEsc'
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
			
			openMDR7: function (Cases) {
				if (Cases !== null && Cases !== undefined) {
					if (Cases.results.length > 0) {
						var sourceIC = this.source_IC;
						var length = Cases.results.length;
						for (var i =0; i < length; i++) {
							//
							// Check if this is possible !!
							//
							if (Cases.results[i].case_type === "ZS01") {
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
						var CaseIDsFilter = "case_id eq %27";
						var CaseIDs = "";
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
								CaseIDsFilter += " or case_id eq %27" + Cases.results[l].case_id + "%27";
								CaseIDs += ", " + Cases.results[l].case_id;
							} else {
								CaseIDsFilter += Cases.results[l].case_id + "%27";
								CaseIDs = Cases.results[l].case_id;
							}
						}
						CaseIDsFilter += ")";
						title = title + CaseIDs;
						var host = window.location.host;
						var path = window.location.pathname;
						var URL = [
							"https://",
							host,
							path,
							"?hc_reset&filter=(",
							CaseIDsFilter,
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
			
			calcPagination: function () {
				var totalRows = this.getFilteredCases().length;
				var pagerHeight = 77;
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
					var oPaginator = new CustomPaginator("table-paginator-MDR3", {
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
				this.oPaginator.setCurrentPage(this.oUIModel.getProperty("/currentPage"));
				this.oPaginator.setNumberOfPages(this.oUIModel.getProperty("/numberOfPages"));
			},

			getFilteredCases: function () {
				var allActivityModel = this.getModel("allPageCases");
				var filteredCaseModel = this.getModel("filteredCases");
				if (filteredCaseModel && filteredCaseModel.getData()) {
					Log.debug('getFilteredCases: filteredCaseModel.getData().results.length=' + filteredCaseModel.getData().results.length);
					return filteredCaseModel.getData().results;
				}
				Log.debug('getFilteredCases: allActivityModel.getData().results.length=' + allActivityModel.getData().results.length);
				return allActivityModel.getData().results;
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
				if (aSorters === null || aSorters.length === 0) {
					return;
				}
				var allCases = this.getFilteredCases();
				var sortedCases = SorterProcessor.apply(allCases, aSorters, function (d, path) {
					return d[path];
				}, function (d) {
					return d.top_issue_id;
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
					var oTable = this.getView().byId("activityTable");
					var aFilters = oTable.getBinding().aFilters;
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
				window.open("https://go.sap.corp/MDR3-info", "MDR3 - Info");
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
					Rating: "Rating",
					Customer: "Customer Name",
					BP: "BP",
					Description: "Description",
					CreationDate: "Creation Date",
					DueDate: "Due Date",
					Priority: "Priority",
					Status: "Status",
					ProcessType: "Process Type",
					CategoryCode: "Category Code",
					AGSOwner: "Support Owner",
					DevelopmentOwner: "Development Owner",
					ServiceTeam: "Service Team",
					SAPProduct: "SAP Product",
					IssueId: "Issue ID",
					Link: "Link"
				});
				var excel_table = this.getView().byId("excel_download_table");
				if (excel_table == null) {
					var aColumnsdownload = [
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/Rating}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/Customer}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/BP}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/Description}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/CreationDate}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/DueDate}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/Priority}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/Status}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/ProcessType}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/CategoryCode}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/AGSOwner}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/DevelopmentOwner}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/ServiceTeam}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/SAPProduct}"
							})
						}),
						new sap.m.Column({
							header: new sap.m.Label({
								text: "{xls_download>/IssueId}"
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
								text: "{Rating}"
							}),
							new sap.m.Text({
								text: "{Customer}"
							}),
							new sap.m.Text({
								text: "{BP}"
							}),
							new sap.m.Text({
								text: "{Description}"
							}),
							new sap.m.Text({
								text: "{CreationDate}"
							}),
							new sap.m.Text({
								text: "{DueDate}"
							}),
							new sap.m.Text({
								text: "{Priority}"
							}),
							new sap.m.Text({
								text: "{Status}"
							}),
							new sap.m.Text({
								text: "{ProcessType}"
							}),
							new sap.m.Text({
								text: "{CategoryCode}"
							}),
							new sap.m.Text({
								text: "{AGSOwner}"
							}),
							new sap.m.Text({
								text: "{DevelopmentOwner}"
							}),
							new sap.m.Text({
								text: "{ServiceTeam}"
							}),
							new sap.m.Text({
								text: "{SAPProduct}"
							}),
							new sap.m.Text({
								text: "{IssueId}"
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