sap.ui.define([], function () {
	"use strict";
	return {
		
		title: function () {
			var title = jQuery.sap.getUriParameters().get("title");
			if (jQuery.sap.getUriParameters().get("title") === null) {
				title = "MDR3 - Top Issues";
			}
			var runTitle = jQuery.sap.getUriParameters().get("run_title");
			if (runTitle !== null) {
				runTitle = jQuery.sap.getUriParameters().get("run_title").toLowerCase();
			}
			var layout = jQuery.sap.getUriParameters().get("layout");
			var element;
			if (layout === "dark") {
				if (runTitle === "yes") {
					element = "<marquee class='titleMarqueeDark' scrolldelay='5' scrollamount='3'><H1 id='title'>" +
						title + "</H1></marquee>";
				} else {
					element = '<H1 id="title" class="titleDark">' + title + '</H1>';
				}
			} else {
				if (runTitle === "yes") {
					element = "<marquee class='titleMarquee' scrolldelay='5' scrollamount='3'><H1 id='title'>" +
						title + "</H1></marquee>";
				} else {
					element = '<H1 id="title" class="title">' + title + '</H1>';
				}
			}
			return element;
		},
		
		dashboardAnalyzerHeader: function () {
			var element = true;
			return element;
		},
		
		colorValue: function (rating_code) {
			if (rating_code === "C") {
				return '<div class="colorIndicator redIndicator"></div>';
			} else if (rating_code === "B") {
				return '<div class="colorIndicator yellowIndicator"></div>';
			} else if (rating_code === "A") {
				return '<div class="colorIndicator greenIndicator"></div>';
			} else {
				return "";
			}	
		},
		
		colorValueTooltip: function (rating_code) {
			if (rating_code === "C") {
				return "Rating: Red";
			} else if (rating_code === "B") {
				return "Rating: Yellow";
			} else if (rating_code === "A") {
				return "Rating: Green";
			} else {
				return "";
			} 
		},
		
		refPicture: function (cases) {
			var image = "";
			var layout = jQuery.sap.getUriParameters().get("layout");	
			var length = 0;
			var dispRef = "";
			var esc = "";
			if (cases !== null) {
				length = cases.results.length;
			} else {
				length = 0;
			}	
			if (length > 0) {
				for (var i = 0; i < length; i++) {
					esc = "";
					if (cases.results[i].case_type === "ZS01") {
						esc = "x";
					}
				}
				if (esc === "x") {
					if (layout === "dark") {
						image = "images/refEsc_2.png";
						return image;
					} else {
						image = "images/refEsc.png";
						return image;
					}
				} else {
					if (layout === "dark") {
						image = "images/refCustDark.png";
						return image;
					} else {
						image = "images/refCust.png";
						return image;
					}
				}
			} else {
				return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";	
			}
		},
		
		customerSapProductHeader1: function () {
			var crossIssue = jQuery.sap.getUriParameters().get("crossIssue");
			if (crossIssue === "yes") {
				return "SAP PRODUCT";
			} else {
				return "CUSTOMER NAME";
			}
		},
		
		customerSapProductHeader2: function () {
			var crossIssue = jQuery.sap.getUriParameters().get("crossIssue");
			if (crossIssue === "yes") {
				return "CUSTOMER NAME";
			} else {
				return "SAP PRODUCT";
			}
		},
		
		customerSapProductTooltip1: function () {
			var crossIssue = jQuery.sap.getUriParameters().get("crossIssue");
			if (crossIssue === "yes") {
				return "SAP Product";
			} else {
				return "Customer Name";
			}
		},
		
		customerSapProductTooltip2: function () {
			var crossIssue = jQuery.sap.getUriParameters().get("crossIssue");
			if (crossIssue === "yes") {
				return "Customer Name";
			} else {
				return "SAP Product";
			}
		},
		
		description: function(description, sMasked){
			if (sMasked === "yes" && description && description.length > 1) {
				return "**********";
			} else {
				return description;
			}	
		},
		
		descriptionTooltip: function(description, description_long, sMasked){
			if (sMasked === "yes" && description && description.length > 1) {
				return "Issue Description: **********";
			} else {
				if (description_long === "" || description_long === undefined) {
					description_long = "-";
				}
				return "Issue Title: " + "\r\n" + description + "\r\n" + "\r\n" + 
					   "Title Long: " + "\r\n" + description_long;
			}
		},
		
		overdueColTooltip: function () {
			var text = "Indicator for overdue Top/Cross Issues"
				+ "\n"
				+ "(Only for Top/Cross Issues with Status 'New' or 'In Process')";
			return text;
		},
		
		overdueIcon: function(overdueIcon) {
			var layout = jQuery.sap.getUriParameters().get("layout");
			if (layout !== "dark") {
				layout = "blue";
			}
			if ( overdueIcon === "X" ) {
				return "images/Warning_" + layout + ".png";
			}
		},
		
		dueDate: function(dueDate, request_end, overdueIcon) {
			var layout = jQuery.sap.getUriParameters().get("layout");
			var element = "";
			var date = new Date();
			if (request_end < date) {
				if (overdueIcon === "X" && layout !== "dark") {
					element = '<div><span' 
						+ ' title="Due Date (Requested End Date): ' + dueDate + '"'
						+ ' class="titleTextRed">' + dueDate + '</span></div>';
				} else {
					element = '<div><span' 
						+ ' title="Due Date (Requested End Date): ' + dueDate + '"'
						+ ' class="titleText">' + dueDate + '</span></div>';
				}
			} else {
				element = '<div><span' 
					+ ' title="Due Date (Requested End Date): ' + dueDate + '"'
					+ ' class="titleTextBlue">' + dueDate + '</span></div>';
			}
			return element;
		},
		
		serviceTeamVisibility: function () {
			var crossIssue = jQuery.sap.getUriParameters().get("crossIssue");
			if (crossIssue === "yes") {
				return false;
			} else {
				return true;
			}	
		},
		
		descriptionColumnWidth: function () {
			var crossIssue = jQuery.sap.getUriParameters().get("crossIssue");
			if (crossIssue === "yes") {
				return "21%";
			} else {
				return "15%";
			}	
		},
		
		productColumnWidth: function () {
			var crossIssue = jQuery.sap.getUriParameters().get("crossIssue");
			if (crossIssue === "yes") {
				return "21%";
			} else {
				return "15%";
			}	
		},
		
		customerNameColumnWidth: function () {
			var crossIssue = jQuery.sap.getUriParameters().get("crossIssue");
			if (crossIssue === "yes") {
				return "20%";
			} else {
				return "15%";
			}	
		},
		
		topIssueLink: function(sourceIC, top_issue_id) {
			return ["https://", 
			sourceIC,
			".wdf.sap.corp/",
			"sap(bD1lbiZjPTAwMSZkPW1pbg==)/bc/bsp/sap/crm_ui_start/default.htm?saprole=ZSU_DEFAULT&",
			"crm-object-type=BT116_SRVO&crm-object-action=B&sap-language=EN&crm-object-keyname=OBJECT_ID&crm-object-",
			"value=",
			top_issue_id].join("");
		},
		
		caseLink: function(sourceIC, caseId){
			return ["https://", 
			sourceIC,
			".wdf.sap.corp/sap/bc/bsp/sap/crm_ui_start/default.htm?saprole=ZSU_DEFAULT&crm-object-type=CRM_CMG&crm-object-action=B&sap-language=EN&crm-object-keyname=EXT_KEY&crm-object-value=",
			caseId].join("");
		}
	};
});		