sap.ui.define([], function () {
	"use strict";
	return {
		
		title: function () {
			var title = jQuery.sap.getUriParameters().get("title");
			if (jQuery.sap.getUriParameters().get("title") === null) {
				title = "MDR4 - Service Orders";
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
			/*
			var daTest = "";
			if (jQuery.sap.getUriParameters().get("da_test") !== null) {
				daTest = jQuery.sap.getUriParameters().get("da_test").toLowerCase();
			}
			if (daTest === "yes") {
				element = true;
			} else {
				element = false;
			}
			*/
			return element;
		},
		
		colorValue: function (Rating) {
			if (Rating === "C") {
				return '<div class="colorIndicator redIndicatorMDR4"></div>';
			} else if (Rating === "B") {
				return '<div class="colorIndicator yellowIndicatorMDR4"></div>';
			} else if (Rating === "A") {
				return '<div class="colorIndicator greenIndicatorMDR4"></div>';
			} else {
				return "<div></div>";
			}	
		},
		
		colorValueTooltip: function (Rating) {
			if (Rating === "C") {
				return "Rating: Red";
			} else if (Rating === "B") {
				return "Rating: Yellow";
			} else if (Rating === "A") {
				return "Rating: Green";
			} else if (Rating === "" || Rating === " ") {
				return "No Rating";
			} else {	
				return "Rating: " + Rating;
			} 
		},
		
		caseRef: function (CaseId) {
			if (CaseId !== "") {
				var image = "";
				var layout = jQuery.sap.getUriParameters().get("layout");
				if (layout === "dark") {
					image = "images/refCustDark.png";
					return image;
				} else {
					image = "images/refCust.png";
					return image;
				}
			}
			return "";
		},
		
		maskCustomerName: function (customerName, maskData) {
			if (maskData === "yes" && customerName && customerName.length > 1) {
				return customerName.substr(0,2) + "********";
			}
			return customerName;
		},
		
		description: function(description, sMasked){
			if (sMasked === "yes" && description && description.length > 1) {
				return "**********";
			} else {
				return description;
			}
		},
		
		noTextHeader: function () {
			var text = " " + "\r\n" + "\r" + "\n" + " ";
			return text;
		},	
		
		customerHeader: function () {
			var text = "Country" + "\r\n" + "\r" + "\n" + " ";
			return text;
		},
		
		servProdHeader: function () {
			var text = "(of Service Order Item 10)" + "\r\n" + "\r" + "\n" + " ";
			return text;
		},
		
		dateHeader1Tooltip: function () {
			var text = "Requested Delivery Date" 
				+ "\n"
				+ "Required Start Date"
				+ "\n"
				+ "Required End Date";
			return text;
		},
		
		dateHeader2Tooltip: function () {
			var text = "Session Date" 
				+ "\n" 
				+ "GoLive Date";
			return text;
		},
		
		dateHeader1: function () {
			var text = "Req. Start Date" + "\r\n" + "Req. End Date";
			return text;
		},
		
		dateHeader2: function () {
			var text = "GoLive Date" + "\r\n" + "\r" + "\n" + " ";
			return text;
		},
		
		dateColorRecDelDate: function (textInShort, textInLong,  dateIn1, dateIn2) {
			var element = "";
			var currentDate = new Date();
			var layout = jQuery.sap.getUriParameters().get("layout");
			if (layout !== null) {
				layout = jQuery.sap.getUriParameters().get("layout").toLowerCase();
			}
		//	if (dateIn2 < currentDate || dateIn1 === "N/A") {
		//		element = '<div><span class="titleTextSmallRed" title="' + textInLong + " " + dateIn1 + '">' + textInShort + dateIn1 + '</span></div>';
		//	} else {
				element = '<div><span class="titleTextSmall" title="' + textInLong + " " + dateIn1 + '">' + textInShort + dateIn1 + '</span></div>';
		//	}
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<span></span>";
			}
		},
		
		dateColorGoliveDate: function (textInShort, textInLong,  dateIn1, dateIn2, dateIn3) {
			var element = "";
			var currentDate = new Date();
			var layout = jQuery.sap.getUriParameters().get("layout");
			if (layout !== null) {
				layout = jQuery.sap.getUriParameters().get("layout").toLowerCase();
			}
		//	if (dateIn2 < currentDate ||  dateIn1 === "N/A") {
		//		element = '<div><span class="titleTextRed" title="' + textInLong + " " + dateIn1 + '">' + textInShort + dateIn1 + '</span></div>';
		//	} else {
				element = '<div><span class="titleText" title="' + textInLong + " " + dateIn1 + '">' + textInShort + dateIn1 + '</span></div>';
		//	}
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<span></span>";
			}
		},
		
		status: function () {
			var text = "(of Service Order Item)" + "\r\n" + "\r" + "\n" + " ";
			return text;
		},
		
		servTeamHeader: function () {
			var text = "Employee Responsible" + "\r\n" + "\r" + "\n" + " ";
			return text;
		},
		
		servOrderHeader: function () {
			var text = "(Serv. Ord. ID / Item)" + "\r\n" + "\r" + "\n" + " ";
			return text;
		},
		
		linkToServiceOrder: function (sourceIC, ServiceOrderId) {
			return ["https://", 
				sourceIC,
				".wdf.sap.corp/",
				"sap(bD1lbiZjPTAwMSZkPW1pbg==)/bc/bsp/sap/crm_ui_start/default.htm?saprole=ZSU_DEFAULT&",
				"crm-object-type=BT116_SRVO&crm-object-action=B&sap-language=EN&crm-object-keyname=OBJECT_ID&crm-object-value=",
				ServiceOrderId
			].join("");
		}
	
	};
});	