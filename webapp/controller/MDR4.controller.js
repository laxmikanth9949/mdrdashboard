sap.ui.define([
		"corp/sap/mdrdashboards/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/FilterProcessor",
		"sap/ui/model/SorterProcessor",
		"corp/sap/mdrdashboards/model/formatterMDR4",
		"corp/sap/mdrdashboards/controls/TablePager",
		"corp/sap/mdrdashboards/controls/CustomPaginator",
		"sap/m/MessageToast",
		"sap/m/MessageBox",		
		"sap/base/Log",
		"sap/ui/Device"
	], function (BaseController, JSONModel, Filter, FilterOperator, FilterProcessor, SorterProcessor,
		Formatter, TablePager, CustomPaginator, MessageToast, MessageBox, Log, Device) {
		"use strict";
		
		return BaseController.extend("corp/sap/mdrdashboards.controller.MDR4", {

			onInit: function () {
				// Style sheet
				jQuery.sap.includeStyleSheet("css/style_mdr4.css","stylemdr4");
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
				this._iRowHeight = 60;
				this.refreshInterval = 1800;
				this.flipInterval = 30;
				this.pauseFlip = false;
				this._realDataLength = {};
				this.layout = "";
				this.changePageTitle();
				// Router /////
				this.oRouter = this.getRouter();
				this.oRouter.attachRouteMatched(this.onRouteMatched, this);
				// UI Model /////
				var sTheme = "blue";
				this.oUIModel = new JSONModel({
					theme: sTheme,
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
					var tracking = new GlobalITTracking("MDR Dashboards", "MDR4 - Service Orders - V1.1.0");
				} catch (e) {
					console.log("Error: " + e);
				}
				// Mobile Usage Reporting - Events
				// --> Counts Calls of the Application
				sap.git.usage.Reporting.addEvent(this.getOwnerComponent(), "MDR4 - Service Orders - V1.1.0");
				this.showBusyDialog();
			},
			
			formatterMDR4: Formatter,
			
			changePageTitle: function () { 
            	var newPageTitle = "MDR4 - Service Orders"; 
            	document.title = newPageTitle; 
        	},			
			
			onRouteMatched: function (oEvent) {
				var sRouteName = oEvent.getParameter("name");
				this.readURL();
				this._customizeUI();
				if (sRouteName === "MDR4") {
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
				this.oDataModel = this.getComponentModel();
				var header = {
					"AppIdentifier": "FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ",
					"mccprofile": "MDR4"
				};
				this.oDataModel.setHeaders(header);							
				this.oDataModel.read("/ServiceOrderSet", {
					urlParameters: {
						$filter: this.filter
					},
					success: function (data) {
						this.hideBusyDialog();
						// General processing
						var jsonModel = new JSONModel();
						jsonModel.setSizeLimit(data.results.length);
						if (this.noAuth !== "x") {
							if (data.results.length === 0) {
								MessageToast.show("No Data in Selection / No Authorization to display Data", {
									width: "400px",
									duration: 7000
								});
							}
						}
						this._processResult(data.results);
						data.results = this._sortBySessionDate(data.results, "desc");
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

			_processResult: function (results) {
				// Specify and initialize variables
				var l = results.length;
				var nRed = 0;
				var nGreen = 0;
				var nYellow = 0;
				var nAll = l;
				// Further processing
				for (var i = 0; i < l; i++) {
					// Rating
					if (results[i].Rating === "C") {
						results[i].ratingCode = 5;
						results[i].ratingText = "Red";
						nRed++;
					} else if (results[i].Rating === "B") {
						results[i].ratingCode = 3;
						results[i].ratingText = "Yellow";
						nYellow++;
					} else if (results[i].Rating === "A") {
						results[i].ratingCode = 1;
						results[i].ratingText = "Green";
						nGreen++;
					} else {
						results[i].ratingCode = 0;
						results[i].ratingText = "";
					}
					// Reference to case
					if (results[i].CaseId !== "") {
						results[i].refCaseInd = "X";
					}
					// Dates
					if (results[i].RequestedDeliveryDate === undefined || 
						results[i].RequestedDeliveryDate === null || 
						results[i].RequestedDeliveryDate === " " || 
						results[i].RequestedDeliveryDate === "" ||
						results[i].RequestedDeliveryDate.getTime() < 1) {
						results[i].RequestedDeliveryDate = new Date(results[i].RequestedDeliveryDate.setFullYear(9999, 12, 31));
					}
					results[i].recDelDate     = this.getDate(results[i].RequestedDeliveryDate);
					results[i].recDelDateTS   = "Rec.Del.: ";
					results[i].recDelDateTL   = "Recommended Delivery Date: ";
					results[i].reqStartDate   = this.getDate(results[i].RequestedStart);
					results[i].reqStartDateTS = "Req.Start: ";
					results[i].reqStartDateTL = "Required Start Date: ";
					results[i].reqEndDate     = this.getDate(results[i].RequestedEnd);
					results[i].reqEndDateTS   = "Req. End: ";
					results[i].reqEndDateTL   = "Required End Date: ";
					results[i].goliveDate     = this.getDate(results[i].GoliveDate);
					results[i].goliveDateTS   = "GoLive: ";
					results[i].goliveDateTL   = "GoLive Date: ";
					results[i].sessionDate    = this.getDate(results[i].SessionDate);
					results[i].sessionDateTS  = "Session: ";
					results[i].sessionDateTL  = "Session Date: ";
					// Service Team
					if (results[i].ServiceTeamId === "") {
						results[i].ServiceTeamId = "-";
					}
					if (results[i].ServiceTeamName === "") {
						results[i].ServiceTeamName = "-";
					}
					var index1 = results[i].ServiceTeamName.indexOf(" ");
					var index2 = results[i].ServiceTeamName.indexOf("SEORG");
					if (index1 > -1 && index2 > -1) {
						results[i].ServiceTeamName = results[i].ServiceTeamName.slice(index1, results[i].ServiceTeamName.length);
					}
					// Service Order ID
					results[i].serviceOrderKey = results[i].ServiceOrderId + " / " + parseInt(results[i].SessItemNumber);
				}
				// Counters 
				this.oUIModel.setProperty("/numberAll", nAll);
				this.oUIModel.setProperty("/numberRatingRed", nRed);
				this.oUIModel.setProperty("/numberRatingYellow", nYellow);
				this.oUIModel.setProperty("/numberRatingGreen", nGreen);
			},
			
			getDate: function (dateIn) {
				var dateIn = dateIn.toDateString();;
				var dateOut = "";
				var day = "";
				var month = "";
				var year = "";
				if (dateIn !== null && dateIn !== undefined && dateIn !== "") {
					day = dateIn.slice(8,10);
					month = dateIn.slice(4,7);
					year = dateIn.slice(11,15);
					dateOut = day + " " + month + " " + year;
					if (dateOut === "01 Jan 1970" || dateOut === "31 Jan 1000") {
						dateOut = "N/A";
					}
				} else {
					dateOut = "N/A";
				}
				return dateOut;
			},
			
			_sortBySessionDate: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.SessionDate) < (value2.SessionDate) ? -1 : 1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.SessionDate) < (value2.SessionDate) ? 1 : -1;
					}
					data.sort(compare);
				}
				return data;
			},	
		
			_sortByRating: function (data, sortDir) {
				if (sortDir === "desc") {
					function compare(value1, value2) {
						return (value1.Rating) < (value2.Rating) ? 1 : -1;
					}
					data.sort(compare);
				} else {
					function compare(value1, value2) {
						return (value1.Rating) < (value2.Rating) ? -1 : 1;
					}
					data.sort(compare);
				}
				return data;
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
					this.title = "MDR4 - Service Orders";
					this.oUIModel.setProperty("/title", "Service Orders");
				} else {
					this.title = jQuery.sap.getUriParameters().get("title");
					this.oUIModel.setProperty("/title", this.title);
				}
				if (jQuery.sap.getUriParameters().get("run_title") === "")
					this.run_title = "no";	
				// Filter
				this.filter = jQuery.sap.getUriParameters().get("filter");
				if (this.filter === null) {
					this.filter = "";
				}
				if (this.filter === "") {
				//	this.filter = "(Rating ne '')";
				//	this.filter = "(Rating ne '' or Rating eq '')";   // --> All Service Orders: 3424 !!
				//	this.filter = "(ServiceTeamId eq '1114730')"; // 207
				//	this.filter = "(ServiceTeamId eq '1033694')"; // 339
				//	this.filter = "(ServiceTeamId eq '1111006')"; //   3
				//	this.filter = "(ServiceTeamId eq '4639780')"; // 169
				//	this.filter = "(ServiceTeamId eq '1130846')"; //  66
				//	this.filter = "(ServiceTeamId eq '1058893')"; // 655
				//	this.filter = "(ServiceTeamId eq '4639780' or ServiceTeamId eq '1130846')";
				//	this.filter = "(CustomerId eq '160073' or CustomerId eq '875961')";
				//	this.filter = "(CustomerId eq '159936')";
				//	this.filter = "(ServiceTeamId eq '1114730' or ServiceTeamId '1033694' or ServiceTeamId = '1111006' or" +
				//                " ServiceTeamId = '4639780' or ServiceTeamId = '1130846' or ServiceTeamId = '1058893')";
				//	this.filter = "(ServiceOrderId eq '73004197')";
				//	this.filter = "(SessionDateTimeframe eq 'LAST YEAR' or SessionDateTimeframe eq 'THIS YEAR' or SessionDateTimeframe eq 'NEXT YEAR')";
				//	this.filter = "(SessionDateTimeframe eq 'LAST YEAR') or (market_unit eq 'DE' or market_unit eq 'US')";
				//	this.filter = "(number_int eq '0000000010')";
				//	this.filter = "";
					this.filter = "CustomerId eq '0000160073' and SessionDateTimeframe eq 'THIS YEAR'";
				}	
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
				var auth1 = "yes";
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
						'mccprofile': 'MDR4_AuthCheck'
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
						that.loadModelFromBackend();
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
							that.hideBusyDialog();
							that.loadModelFromBackend();
						} else {
							that.hideBusyDialog();
							that.loadModelFromBackend();
						}
					}.bind(that),
					complete : function (){
					}
				});	
			},
			
			openMDR7: function (CaseId) {
				if (CaseId !== null && CaseId !== undefined) {
					// Create URL to create link to MDR7 with the cases assigned to this activity
					var activityCaseIDsFilter = "case_id eq %27" + CaseId + "%27";
					var activityCaseIDs = CaseId;
					activityCaseIDsFilter += ")";
					var title = jQuery.sap.getUriParameters().get("title");
					if (title === null) {
						title = "&title=CaseID: ";
					} else {
						title = "&title=" + jQuery.sap.getUriParameters().get("title") + " - CaseID: ";
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
						"&listView=no",
						"#/MDR7"
					].join("");
					window.open(URL);
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
				var headerHeight = 48 + 64 + 70;
				var rowHeight = 60;
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
				if (!this.oPaginator) {
					this.calcPagination();
					this.updateOnePageDataToTable(1);
					var oTable = this.getView().byId("activityTable");
					if (!this.oPaginator) {
						var oPaginator = new CustomPaginator("table-paginator-MDR4", {
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
				//  return d.ServiceOrderId;
					return d.serviceOrderKey;
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
				window.open("https://go.sap.corp/MDR4-info", "MDR4 - Info");
			}

		});
	});			