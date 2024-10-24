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
	"sap/base/Log",
	'sap/ui/Device',
	'sap/m/MessageToast',
	'sap/m/MessageBox',
	"corp/sap/mdrdashboards/libs/exp_pptx"

], function (BaseController, JSONModel, Filter, FilterOperator, FilterProcessor, SorterProcessor,
	Formatter, TablePager, CustomPaginator, Log, Device, MessageToast, MessageBox, dummyPPT)
{
	"use strict";

	return BaseController.extend("corp.sap.mdrdashboards.controller.MDR7", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf corp.sap.mdrdashboards.view.MDR
		 */
		onInit: function () {
			var sRootPath = this.getRootPath();
			jQuery.sap.includeStyleSheet(sRootPath + "/css/style_mdr7.css","stylemdr7");
			this.source_IC = "icp";
			this.filter = "";
			this._iRowHeight = 40;
			this.refreshInterval = 1800;
			this.flipInterval = 30;
			this.pauseFlip = false;
			this._realDataLength = {};
			this._iCardHeight = 270;
			this._iCardWidth = 600;
			this.top_issues = 'yes';
			this.top_issues_2 = 'no';
			this._dataNotLoaded = true;
			// For export
			this._selectedCaseData = {};
			this._selectedCaseDataParties = {};
			this._selectedCaseDataNotes = {};
			this.getSourceICAddr();
			this.changePageTitle();
			this.oRouter = this.getRouter();
			this.oRouter.attachRouteMatched(this.onRouteMatched, this);
			var sTheme = "blue";
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
				showGoLiveDate: false,
				showProcessor: false,
				showPhase: false,
				showServiceTeam: false,
				showTopIssues: true,
				refreshTime: "00:00",
				pauseFlip: false,
				showReason:false,
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
			sap.ui.Device.resize.attachHandler(this.windowResize, this);
			// Mobile Usage Reporting - Version Distribution
			// --> Counts Number of Devices
			try {
				var tracking = new GlobalITTracking("MDR Dashboards", "MDR7 - Cases – V1.1.0");
			} catch (e) {
			 	console.log("Error: " + e);
			}
			// Mobile Usage Reporting - Events
			// --> Counts Calls of the Application
			sap.git.usage.Reporting.addEvent(this.getOwnerComponent(), "MDR7 - Cases – V1.1.0");
		},

		formatter: Formatter,

		changePageTitle: function () { 
            var newPageTitle = "MDR7 - Cases"; 
            document.title = newPageTitle; 
        },

		onRouteMatched: function (oEvent) {
			var sRouteName = oEvent.getParameter("name");
			this.readURL();
			this._customizeUI();
			if (sRouteName === "MDR7") {
				this.checkAuthorization();
			//	this.loadModelFromBackend(); // --> Now in checkAuthorization !!
				this.setRefreshTime();
				this._intervalTasks();
			}
		},

		_customizeUI: function () {
			/**
			 * show/hide Last changed date or Go live date
			 */
			this.oUIModel.setProperty("/showGoLiveDate", this.disp_date === "gl" ? true : false);
			/**
			 * show responsible / processor name
			 */
			this.oUIModel.setProperty("/showProcessor", this.disp_name === "proc" ? true : false);
			/**
			 * show Status/Phase
			 */
			this.oUIModel.setProperty("/showPhase", this.disp_phase === "yes" ? true : false);
			/**
			 * show/hide service team
			 */
			this.oUIModel.setProperty("/showServiceTeam", this.ServiceTeamVisible ? true : false);
			/**
			 * show/hide top issues
			 */
			this.oUIModel.setProperty("/showTopIssues", this.top_issues !== "no" || this.top_issues_2 === "yes" ? true : false);

			this.oUIModel.setProperty("/viewCard", this.listView === "yes" ? false : true);
			this.oUIModel.setProperty("/listView", this.listView);

			this.oUIModel.setProperty("/theme", this.layout === "dark" ? "dark" : "blue");
			this.oUIModel.setProperty("/layout", this.layout);

			this.getView().byId("dashboardPage").addStyleClass(this.oUIModel.getProperty("/theme"));
			/**
			 * show/hide reason/product
			 */
			 this.oUIModel.setProperty("/showReason", this.disp_reason === "yes" ? true : false);
			/**
			 * Run title
			 */
			this.oUIModel.setProperty("/runTitle", this.run_title === "yes" ? true : false);
		},


		readURL: function () {
			if (jQuery.sap.getUriParameters().get("MaskData") !== null) {
				this.maskdata = jQuery.sap.getUriParameters().get("MaskData").toUpperCase();
				this.oUIModel.setProperty("/maskData", this.maskdata);
			} else {
				this.maskdata = "NO";
			}

			if (jQuery.sap.getUriParameters().get("layout") !== null) {
				this.layout = jQuery.sap.getUriParameters().get("layout");
			} else {
				this.layout = "blue";
			}
			
			this.title = jQuery.sap.getUriParameters().get("title") == null ? "" : jQuery.sap.getUriParameters().get("title");
			this.oUIModel.setProperty("/title", this.title);

			if (jQuery.sap.getUriParameters().get("disp_date") !== null)
				this.disp_date = jQuery.sap.getUriParameters().get("disp_date");
				this.oUIModel.setProperty("/dispDate", this.disp_date);

			if (jQuery.sap.getUriParameters().get("disp_name") !== null)
				this.disp_name = jQuery.sap.getUriParameters().get("disp_name");
				this.oUIModel.setProperty("/dispName", this.disp_name);

			if (jQuery.sap.getUriParameters().get("disp_phase") !== null)
				this.disp_phase = jQuery.sap.getUriParameters().get("disp_phase");

			if (jQuery.sap.getUriParameters().get("disp_status") !== null)
				this.disp_status = jQuery.sap.getUriParameters().get("disp_status");

			if (jQuery.sap.getUriParameters().get("disp_reason") !== null)
				this.disp_reason = jQuery.sap.getUriParameters().get("disp_reason");

			if (jQuery.sap.getUriParameters().get("refreshInterval") !== null)
				this.refreshInterval = 60 * jQuery.sap.getUriParameters().get("refreshInterval");
			if (jQuery.sap.getUriParameters().get("flipInterval") !== null)
				this.flipInterval = jQuery.sap.getUriParameters().get("flipInterval");
			if (jQuery.sap.getUriParameters().get("listView") !== null) {
				this.listView = jQuery.sap.getUriParameters().get("listView").toLowerCase();
				this.oUIModel.setProperty("/listView", this.listView);
			}
			if (jQuery.sap.getUriParameters().get("logo") !== null)
				this.pic = jQuery.sap.getUriParameters().get("logo").toLowerCase();
			if (jQuery.sap.getUriParameters().get("ServiceTeamVisible") !== null)
				this.ServiceTeamVisible = jQuery.sap.getUriParameters().get("ServiceTeamVisible").toLowerCase();
			if (jQuery.sap.getUriParameters().get("ppt") !== null)
				this._selectedCase = jQuery.sap.getUriParameters().get("ppt");
			if (jQuery.sap.getUriParameters().get("top_issues") != null)
				this.top_issues = jQuery.sap.getUriParameters().get("top_issues");
			if (jQuery.sap.getUriParameters().get("top_issues_2") != null)
				this.top_issues_2 = jQuery.sap.getUriParameters().get("top_issues_2");
			if (jQuery.sap.getUriParameters().get("run_title") !== null)
				this.run_title = jQuery.sap.getUriParameters().get("run_title");
			/// Test ///////
			if (jQuery.sap.getUriParameters().get("da_test") !== null)
				this.da_test = jQuery.sap.getUriParameters().get("da_test");
			if (jQuery.sap.getUriParameters().get("noAuth") !== null)
				this.noAuth = jQuery.sap.getUriParameters().get("noAuth");
			// End Test ///////
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
			/// Test ////////////
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
			/// Endtest ////////

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
			// changetime=now-2days/0 -> Open End
			// changetime=0/now+3days -> Von Beginn bis zu dem Datum
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


		loadModelFromBackend: function () {
			if (this._dataNotLoaded) {
				this.showBusyDialog();
			}
			if (this.noAuth === "yes") {
				MessageToast.show("No Authorization to display Escalation Cases!");
				this.hideBusyDialog();
				this._dataNotLoaded = false;
				return;
			}
			var threshold = 1000;
			this.oDataModel = this.getComponentModel();
			var header = {
				"AppIdentifier": "FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ",
				"mccprofile": "MDR7"
			};
			this.oDataModel.setHeaders(header);			
			this.oDataModel.read("/CaseList", {
				urlParameters: {
					$filter: this.filter,
					$expand: "CaseQGates,Products",
				//	$expand: "CaseActivities,CaseQGates,Products",
					$top: threshold
				},
				success: function (data) {
					if (this._dataNotLoaded) {
						this.hideBusyDialog();
						this._dataNotLoaded = false;
					}
					var jsonModel = new JSONModel();
					jsonModel.setSizeLimit(data.results.length);
					if (data.results.length === 0) {
						if (this.noAuth !== "x" && this.noAuth !== "yes") {
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
					data.results = this._sortByCustomerName(data.results);
					data.results = this._sortByDate(data.results);
					data.results = this._sortByRating(data.results);
					jsonModel.setData(data);
					// Store data for table pagination
					var allCaseModel = new JSONModel();
					allCaseModel.setSizeLimit(data.results.length);
					allCaseModel.setData(data);
					this.setModel(allCaseModel, "allPageCases");
					this.initPagination();
					this.initPaginationForCardView();
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

		getHeadUrl: function() {
		 	var totalURL = window.location.href;
		 	var pos = totalURL.lastIndexOf("#");
		 	var headURL = totalURL.slice(0, pos);
		 	return headURL;
		},

		_processResult: function (results) {
			var headURL = this.getHeadUrl();
			var l = results.length;
			var nRed = 0;
			var nGreen = 0;
			var nYellow = 0;
			for (var i = 0; i < l; i++) {
				results[i].url = headURL;
				if (results[i].rating_text === "Red") {
					nRed++;
				}
				if (results[i].rating_text === "Green") {
					nGreen++;
				}
				if (results[i].rating_text === "Yellow") {
					nYellow++;
				}
				// For sorting and filter
				results[i].product_key = results[i].product_description + results[i].case_title;
				results[i].customer_key = results[i].customer_name;
				results[i].goLive_key = results[i].go_live;
				results[i].employee_key = results[i].responsible_person; // results[i].respPerson;
				results[i].processor_key = results[i].processor_person;
				results[i].serviceTeam_key = results[i].service_team_name;
				results[i].country_key = results[i].customer_country;
				results[i].delUnitText = this.setDeliveryUnitTxt(results[i].delivery_unit); /* encodeHtml? */
				results[i].lastChanged_key = results[i].change_time;
				results[i].phase_key = results[i].project_phase;
				results[i].caseStatus = results[i].status_text;
				// Dates
				if (jQuery.sap.getUriParameters().get("disp_date") !== null) {
					this.disp_date = jQuery.sap.getUriParameters().get("disp_date");
				}
				if (this.disp_date === "gl") {
					results[i].sortDate = results[i].goLive_key;
					if (results[i].goLive_key !== undefined && results[i].goLive_key !== null && results[i].goLive_key !== "") {
						// Convert golive date /////
						var yearInt = results[i].goLive_key.getFullYear();
						var monthInt = results[i].goLive_key.getMonth();
						var dayInt = results[i].goLive_key.getDate();
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
				} else if (this.disp_date === "cr") {
					results[i].sortDate = results[i].create_time;
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
					results[i].displaySortDate = formattedDate;
				} else {
					results[i].sortDate = results[i].lastChanged_key;
					var sdate = results[i].sortDate;
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
					results[i].displaySortDate = sdate.substring(6, 8) + " " + month + " " + sdate.substring(0, 4);
				}
				if (results[i].go_live === null) {
					results[i].go_live = "N/A";
					results[i].goLive_key = "";
				}
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
				// Top issue data collected as in MDR3 - Slow!
				if (this.top_issues_2 == "yes") {
					this.getTopIssues(results[i]);
					results[i].numberOfTopIssues = this._topIssueList.numberOfTopIssues;
					results[i].highestRatingOfTopIssues = this._topIssueList.highestRatingOfTopIssues;
				}
				if (this.top_issues != "yes" && this.top_issues_2 != "yes") {
					results[i].numberOfTopIssues = 0;
				}
				// Other fields
				if (results[i].product_description === "") {
					results[i].product_description = "-";
				}
				if (results[i].product_list === "") {
					results[i].product_list = "-";
				}
				if (results[i].reason_text === "") {
					results[i].reason_text = "-";
				}
				if (results[i].case_title === "") {
					results[i].case_title = "N/A";
				}
				/*
				if (results[i].customer_type_text === "" || results[i].customer_type_text === undefined) {
					results[i].customer_type_text = "-";
				}
				if (results[i].case_tag === "" || results[i].case_tag === undefined) {
					results[i].case_tag = "-";
				}
				*/
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

		getTopIssues: function (item) {
			var baseUrl = 
			//	this.source_PG + "/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/" 
				"/apim/ic/sap/opu/odata/sap/ZS_AGS_DASHBOARDS_SRV/"
				+ "TopIssueList?$expand=Parties&$orderby=priority_code%20asc,"
				+ "%20request_end%20desc&$filter=top_issue_case_id eq '" 
				+ item.case_id + "' and process_type eq 'ZS34' and"
				+ " (status_code eq 'Z1' or status_code eq 'Z2' or status_code eq 'Z7'"
				+ " or status_code eq 'Z8' or status_code eq 'Z5' or status_code eq 'Z6')"
				+ "&$format=json&sap-language=en";
			this._topIssueList = [];
			this._realDataLength.length = 0;
			this._topIssueList.numberOfTopIssues = 0;
			this._topIssueList.highestRatingOfTopIssues = '';
			this._topIssueList.counterA = 0;
			this._topIssueList.counterB = 0;
			this._topIssueList.counterC = 0;
			this._topIssueList.counterU = 0;
			jQuery.ajax({ // the variable is no need to define
				async: false,
				headers: {
					'AppIdentifier': 'FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ', //API Management: ID for MDR Dashboards
					'mccprofile': 'MDR7_GetTopIssues',
					"Content-Disposition": "attachment; filename=dummyfile.json"
				},
				url: baseUrl,
				type: "get",
				dataType: "json",
				success: function (data) {
					var jsonData = data.d.results;
					this._realDataLength.length = jsonData.length;
					if (jsonData.length > 0) {
						var k;
						for (k = 0; k < jsonData.length; k++) {
							this._topIssueList[k] = {};
							this._topIssueList[k].id = jsonData[k].top_issue_id;
							this._topIssueList[k].rating = jsonData[k].rating_code;
							if (this._topIssueList[k].rating == 'A') {
								this._topIssueList.counterA++;
							}
							if (this._topIssueList[k].rating == 'B') {
								this._topIssueList.counterB++;
							}
							if (this._topIssueList[k].rating == 'C') {
								this._topIssueList.counterC++;
							}
						}
						if (this._topIssueList.counterA > 0) {
							this._topIssueList.highestRatingOfTopIssues = 'A';
						}
						if (this._topIssueList.counterB > 0) {
							this._topIssueList.highestRatingOfTopIssues = 'B';
						}
						if (this._topIssueList.counterC > 0) {
							this._topIssueList.highestRatingOfTopIssues = 'C';
						}
						this._topIssueList.numberOfTopIssues = k;
					}
				}.bind(this)
			});
			return this;
		},


		_sortByRating: function (data) {
			function ratingToNumber(value) {
				var rating = 4;
				if (value.toLowerCase() === "red") {
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
			if (jQuery.sap.getUriParameters().get("disp_date") !== null) {
				this.disp_date = jQuery.sap.getUriParameters().get("disp_date");
			} else {
				this.disp_date = "lc";
			}
			if (this.disp_date === "gl") {
				function compareDate1(value1, value2) {
					return value1.sortDate < value2.sortDate ? -1 : 1;
				}
				data.sort(compareDate1);
			} else {
				function compareDate2(value1, value2) {
					return value1.sortDate.slice(0,8) < value2.sortDate.slice(0,8) ? -1 : 1;
				}
				data.sort(compareDate2);
			}
			return data;
		},


		_sortByCustomerName: function (data) {
			function compareCustname(value1, value2) {
				return value1.customer_key.toUpperCase() < value2.customer_key.toUpperCase() ? -1 : 1;
			}
			data.sort(compareCustname);
			return data;
		},

		checkAuthorization: function () {
			this.location = location;
			this.windowLocation = window.location;
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
					'mccprofile': 'MDR7_AuthCheck'
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
					// Check if MDR7 is called by MDR2 without ZS01 authorization
					this.noAuth = jQuery.sap.getUriParameters().get("noAuth");
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
					} else if ((auth3 === "no" && totalURL.indexOf("ZS01") > 0) || (this.noAuth === "yes")) {
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
					}	
				}.bind(that),
				complete : function (){
				}
			});
		},

		setDeliveryUnitTxt: function (deliveryUnit) {
			var unitMap = {
				'0000167980': 'Ariba', // Ariba
				'0004829451': 'Concur', // Concur
				'0003714250': 'Crossgate', // Crossgate
				'0014081318': 'CtrlS', // CtrlS
				'0008470002': 'Fieldglass', // Fieldglass
				'0009548097': 'Hybris', // hybris
				'0010351239': 'C4C', // C4C
				'0013014776': 'ByD', // ByD
				'0015453147': 'C4TE', // C4TE
				'0001212132': 'HEC', // HEC
				'0001804051': 'SAP IT', // SAP IT (ICP, BWP, SAPStore etc.)
				'0024688048': 'SCP', // SCP ( former HCI )
				//'0024688048': 'SCP', // SCP ( former HCP ) // there is a duplicate code in old version
				'0023880567': 'IBP', // IBP
				'0014215381': 'S/4Hana', // S/4 Hana
				'0000167698': 'SuccessFactors', // SuccessFactors
				'0001092494': 'BCX', // BCX
				'0022187741': 'CenturyLink', // CenturyLink
				'0022846399': 'HP', // HP
				'0021094140': 'IBM', // IBM
				'0008604698': 'Injazat', // Injazat
				'0017958862': 'NTT', // NTT
				'0001092747': 'T-System', // T-System
				'0011585500': 'Virtustream' // Virtustream
			};
			var sUnitTxt = ' ';
			if (deliveryUnit && deliveryUnit.length > 0 && unitMap[deliveryUnit]) {
				sUnitTxt = unitMap[deliveryUnit];
			}
			return sUnitTxt;
		},


		switchView: function () {
			var bCard = this.oUIModel.getProperty("/viewCard");
			this.oUIModel.setProperty("/viewCard", !bCard);
			setTimeout(function(){
				this.reCalcPaginationByRealCard();
			}.bind(this));
		},


		_getPagerHeight: function() {
			// pager height / footer
			var oTable = this.getView().byId("caseTable");
			var oFooter = oTable.getFooter();
			if (!oFooter) {
				return 77;
			}
			var iFooterHeight =oFooter.$().parent().height();
			Log.debug("iFooterHeight=", iFooterHeight);
			return iFooterHeight > 0 ? iFooterHeight : 77;
		},


		_getHeaderHeight: function() {
			var sTableId = this.getView().byId("caseTable").getId();
			var offsetOfHeader = jQuery("#"+ sTableId + "-tableCCnt").offset();
			var iHeaderHeight = offsetOfHeader && offsetOfHeader.top;
			Log.debug("iHeaderHeight=", iHeaderHeight);
			return iHeaderHeight > 0 ? iHeaderHeight : (48 + 64 + 60);
		},


		calcPagination: function() {
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
				var oPaginator = new CustomPaginator("mdr7-table-paginator", {
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
			if (this.oPaginator) {
				this.oPaginator.setCurrentPage(this.oUIModel.getProperty("/currentPage"));
				this.oPaginator.setNumberOfPages(this.oUIModel.getProperty("/numberOfPages"));
			}
		},


		getFilteredCases: function () {
			var allCaseModel = this.getModel("allPageCases");
			var filteredCaseModel = this.getModel("filteredCases");
			if (filteredCaseModel && filteredCaseModel.getData()) {
				Log.debug('getFilteredCases: filteredCaseModel.getData().results.length=' + filteredCaseModel.getData().results.length);
				return filteredCaseModel.getData().results;
			}
			if (allCaseModel && allCaseModel.getData()) {
				Log.debug('getFilteredCases: allCaseModel.getData().results.length=' + allCaseModel.getData().results.length);
				return allCaseModel.getData().results;
			}
			Log.debug('getFilteredCases: filteredCaseModel and allCaseModel are all empty');
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
			this.setModel(jsonModel, "caseModel");
		},


		sort: function (oEvent) {
			setTimeout(function () {
				var oTable = this.getView().byId("caseTable");
				var aSorters = oTable.getBinding().aSorters;
				this.aCurrentSorters = aSorters;
				this.sortByColumns(aSorters);
			}.bind(this));
		},


		sortByColumns: function(aSorters) {
			if (!aSorters || aSorters.length === 0) {
				return;
			}
			var allCases = this.getFilteredCases();
			var sortedCases = SorterProcessor.apply(allCases, aSorters, function (d, path) {
				return d[path];
			}, function (d) {
				return d.case_id;
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


		// Pagination for card view
		_getPagerHeightForCardView: function() {
			// pager height / footer
			var oPager = this.getView().byId("pagerForCardView");
			if (!oPager) {
				return 77;
			}
			var iFooterHeight =oPager.$().height();
			Log.debug("iFooterHeight in card view=", iFooterHeight);
			return iFooterHeight > 0 ? iFooterHeight + 40 : 77;
		},


		_getHeaderHeightForCardView: function() {
			var oCard = this.getView().byId("cardview");
			var offsetOfHeader = oCard.$().offset();
			var iHeaderHeight = offsetOfHeader && offsetOfHeader.top;
			Log.debug("iHeaderHeight=", iHeaderHeight);
			return iHeaderHeight > 0 ? iHeaderHeight : (48 + 64 + 60);
		},


		_getRealCardHeightAndWidth: function() {
			var oCard = this.getView().byId("cardview");
			var aCards = oCard.getContent();
			var ret = {};
			if (aCards && aCards.length > 0) {
				var iHeight = aCards[0].$().height();
				var iWidth = aCards[0].$().width();
				if (iHeight != null && iHeight > 0) {
					ret.height = iHeight;
				}
				if (iWidth != null && iWidth > 0) {
					ret.width = iWidth;
				}
			}
			return ret;
		},


		calcPaginationForCardView: function () {
			var allCaseModel = this.getModel("allPageCases");
			var iTotalRows = allCaseModel.getData().results.length;
			var iPagerHeight = this._getPagerHeightForCardView();
			var iHeaderHeight = this._getHeaderHeightForCardView();
			var iCardHeight = this._iCardHeight;
			var iCardWidth = this._iCardWidth;
			var iClientHeight = document.documentElement.clientHeight - iHeaderHeight - iPagerHeight;
			var iClientWidth = document.documentElement.clientWidth;
			Log.debug("In calcPaginationForCardView iClientWidth=" + iClientWidth + " iCardWidth=" + iCardWidth);
			var iMargin = this._getMarginOfCard();
			var iRows = Math.floor(iClientHeight / (iCardHeight + iMargin));
			if (iRows === 0)
				iRows = 1;
			if (iRows > 6)
				iRows = 6;
			var iColumns = Math.floor(iClientWidth / (iCardWidth + iMargin));
			if (iColumns === 0)
				iColumns = 1;
			if (iColumns > 6)
				iColumns = 6;
			Log.debug("In calcPaginationForCardView iRows=" + iRows + " iColumns=" + iColumns);
			var iNumPerPage = iRows * iColumns;
			this.oUIModel.setProperty("/numPerPageForCardView", iNumPerPage);
			this.oUIModel.setProperty("/currentPageForCardView", 1);
			this.oUIModel.setProperty("/numberOfPagesForCardView", Math.ceil(iTotalRows / iNumPerPage));
		},


		_getMarginOfCard: function() {
			var _iBreakPointTablet = 2560;
			var _iBreakPointDesktop = 4090;
			var _iBreakPointLargeDesktop = 5600;
			var iCntWidth = this.getView().byId("cardview").getParent().$().get(0).clientWidth;
			if (iCntWidth <= _iBreakPointTablet) {
				return 16;
			} else if ((iCntWidth > _iBreakPointTablet) && (iCntWidth <= _iBreakPointDesktop)) {
				return 18;
			} else if ((iCntWidth > _iBreakPointDesktop) && (iCntWidth <= _iBreakPointLargeDesktop)) {
				return 27;
			} else {
				return 36;
			}
		},


		onPageChangeForCardView: function (oEvent) {
			var oPaginator = this.getView().byId("pagerForCardView");
			var iCurrPage = oPaginator.getCurrentPage();
			this.updateOnePageDataToCardView(iCurrPage);
		},


		reCalcPaginationByRealCard: function() {
			var cardPos = this._getRealCardHeightAndWidth();
			var heightChanged = cardPos.height && cardPos.height !== this._iCardHeight;
			if (heightChanged) {
				this._iCardHeight = cardPos.height;
			}
			var widthChagned = cardPos.width && cardPos.width !== this._iCardWidth;
			if (widthChagned) {
				this._iCardWidth = cardPos.width;
			}
			if (heightChanged || widthChagned) {
				this.calcPaginationForCardView();
				this.updateOnePageDataToCardView(1);
				this.resetPaginationForCardView();
			}
		},


		initPaginationForCardView: function () {
			this.calcPaginationForCardView();
			this.updateOnePageDataToCardView(1);

			setTimeout(function () {
				this.reCalcPaginationByRealCard();
			}.bind(this));
		},


		resetPaginationForCardView: function () {
			var oPaginator = this.getView().byId("pagerForCardView");
			oPaginator.setCurrentPage(this.oUIModel.getProperty("/currentPageForCardView"));
			oPaginator.setNumberOfPages(this.oUIModel.getProperty("/numberOfPagesForCardView"));
		},


		updateOnePageDataToCardView: function (iCurrentPage) {
			this.oUIModel.setProperty("/currentPageForCardView", iCurrentPage);
			var allCases = this.getModel("allPageCases").getData().results;
			var iCasesPerPage = this.oUIModel.getProperty("/numPerPageForCardView");
			var data = {};
			var iStart = iCasesPerPage * (iCurrentPage - 1);
			var iEnd = iCasesPerPage * iCurrentPage;
			data.results = allCases.filter(function (elem, idx, arr) {
				return idx >= iStart && idx < iEnd;
			});
			var jsonModel = new JSONModel();
			jsonModel.setSizeLimit(data.results.length);
			jsonModel.setData(data);
			this.setModel(jsonModel, "cvCaseModel");
		},

		hasLoadedData: function() {
			return this.getModel("allPageCases") && this.getModel("allPageCases").getData() && this.getModel("allPageCases").getData().results.length > 0;
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
				// Flip page for list view
				var bCard = this.oUIModel.getProperty("/viewCard");
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
				// Flip page for card view
				if (bCard && !this.pauseFlip && (flipTimer >= this.flipInterval) && this.hasLoadedData()) {
					var oPaginatorForCardView = this.getView().byId("pagerForCardView");
					var iCurrPageForCardView = oPaginatorForCardView.getCurrentPage();
					if (iCurrPageForCardView < oPaginatorForCardView.getNumberOfPages()) {
						oPaginatorForCardView.setCurrentPage(iCurrPageForCardView + 1);
						this.updateOnePageDataToCardView(iCurrPageForCardView + 1);
					} else {
						oPaginatorForCardView.setCurrentPage(1);
						this.updateOnePageDataToCardView(1);
					}
					flipTimer = 0;
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


		windowResize: function(oEvent) {
			Log.debug("In windowResize: this._iRowHeight=", this._iRowHeight);
			if (!this.pagerInited) {
				return;
			}
			var viewCard = this.oUIModel.getProperty("/viewCard");
			Log.debug("In windowResize: viewCard=" + viewCard);
			// if (!viewCard) {
				// List view
				this.reCalcPaginationByRealRowHeight();
				this.calcPagination();
				this.updateOnePageDataToTable(1);
				this.resetPagination();
			// } else {
				// Card view
				setTimeout(function () {
					this.reCalcPaginationByRealCard();
					this.calcPaginationForCardView();
					this.updateOnePageDataToCardView(1);
					this.resetPaginationForCardView();
				}.bind(this), 300);
			// }
		},


		pauseFlip: function(oEvent) {
			this.pauseFlip = !this.pauseFlip;
			this.oUIModel.setProperty("/pauseFlip", this.pauseFlip);
		},


		openInfoPage: function (oEvent) {
			window.open("https://go.sap.corp/MDR7-info", "MDR7 - Info");
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
		
		openMDR6: function (oEvent) {
			var URL = window.location.href;
			URL = URL.split("#");
			URL = URL[0] + "#/MDR6";
		//	window.location.replace(URL);
			window.open(URL);
		},
		
		openMDR2: function (caseID, url ) {
			if (caseID === null) {
				return;
			}
			this.showBusyDialog();
			var that = this;
			var filter = "";
			var URLMDR2 = "";
			if (url !== null && url !== undefined) {
				var urlContainer = JSON.parse(JSON.stringify(url));
				var pos = url.indexOf("filter");
				var urlStart = urlContainer.slice(0, pos);
				var layout = jQuery.sap.getUriParameters().get("layout");
				if (layout === null) {
					layout = "&layout=blue";
				} else {
					layout = "&layout=" + jQuery.sap.getUriParameters().get("layout");
				}
				var maskData = jQuery.sap.getUriParameters().get("MaskData");
				if (maskData === null) {
					maskData = "&MaskData=no";
				} else {
					maskData = "&MaskData=" + jQuery.sap.getUriParameters().get("MaskData");
				}
				var refreshInterval = jQuery.sap.getUriParameters().get("refreshInterval");
				if (refreshInterval === null) {
					refreshInterval = "&refreshInterval=" + "1800";
				} else {
					refreshInterval = "&refreshInterval=" + jQuery.sap.getUriParameters().get("refreshInterval");
				}
			}	
			var caseActivities = "";
			this.filter = "case_id eq '" + caseID + "'";
			var header = {
				"AppIdentifier": "FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ",
				"mccprofile": "MDR7_OpenMDR2"
			};
			this.oDataModel.setHeaders(header);				
			this.oDataModel.read("/CaseList", {
				urlParameters: {
					$filter: this.filter,
					$expand: "CaseActivities"
				},
				success: function (data) {
					caseActivities = data.results[0].CaseActivities;
					if (caseActivities !== null && caseActivities !== undefined) {
						filter = "(activity_process_type eq 'ZS46') and ("
							+ "activity_status eq 'E0010' or activity_status eq 'E0011' or activity_status eq 'E0012' or "
							+ "activity_status eq 'E0018' or activity_status eq 'E0019' or activity_status eq 'E0020' or "
							+ "activity_status eq 'E0021' or activity_status eq 'E0022' or activity_status eq 'E0023' or "
							+ "activity_status eq 'E0024' or activity_status eq 'E0025' or activity_status eq 'E0026' or "
							+ "activity_status eq 'E0027'";
						filter = filter + ") and (";
						for (var i = 0; i < caseActivities.results.length; i++) {
							if (i < caseActivities.results.length - 1) {
								filter = filter + "activity_id eq '" + caseActivities.results[i].activity_id + "' or ";
							} else {
								filter = filter + "activity_id eq '" + caseActivities.results[i].activity_id + "')";
							}
						}
					} 
					// URL to MDR 2
					URLMDR2 = urlStart
						+ "&filter=" + filter
						+ "&title=Open ZS46 Activities for Case " + caseID 
						+ refreshInterval
						+ layout
						+ maskData
						+ "#/MDR2";
					that.hideBusyDialog();	
					window.open(URLMDR2);
				},
				error: function (error) {
					caseActivities = null;
					that.hideBusyDialog();
					MessageToast.show("Loading of activity data failed. Please access the CRM case directly to see the required data.", {
						duration: 30000
					});
				}
			});
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
					+ "sapit-customersupport-dev-mallard.launchpad.cfapps.eu10.hana.ondemand.com/site#mccworkbench-Display&/"
					+ selectedCase;
			} else if (this.source_IC === "ict") {
				// TEST environment
				URL = "https://"
					+ "sapit-home-test-004.launchpad.cfapps.eu10.hana.ondemand.com/site#mccworkbench-Display&/"
					+ selectedCase;
			} else if (this.source_IC === "icp") {
				// PROD environment
				URL = "https://"
					+ "sapit-home-prod-004.launchpad.cfapps.eu10.hana.ondemand.com/site#mccworkbench-Display&/"
					+ selectedCase;
			} else {
				// Error in determination of environment - Choose PROD environment to be on the safe side
				URL = "https://"
					+ "sapit-home-prod-004.launchpad.cfapps.eu10.hana.ondemand.com/site#mccworkbench-Display&/"
					+ selectedCase;
			}
			window.open(URL);
		},

		download: function(oEvent) {
			if (!this.downloadDialog) {
				// Modify location.href
				var index = location.href.lastIndexOf("#");
				var url = location.href.slice(0, index);
				url = url + "&MDR=7";
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
				// Modify location.href
				var index = location.href.lastIndexOf("#");
				var url = location.href.slice(0, index);
				url = url + "&MDR=7";
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
			if (viewCard) { // card view
				var oGrid = this.getView().byId("cardview");
				var oCard = oEvent.getSource().getParent().getParent().getParent();
				iIndex = oGrid.getContent().indexOf(oCard);
				oData = this.getView().byId("cardview").getBinding("content").getModel().getData();
				oRowData = oData.results[iIndex];
			} else { // List view
				iIndex = oEvent.getSource().getParent().getIndex();
				oData = oEvent.getSource().getParent().getParent().getBinding("rows").getModel().getData();
				oRowData = oData.results[iIndex];
			}
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