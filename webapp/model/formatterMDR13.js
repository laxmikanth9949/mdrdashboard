sap.ui.define([], function () {
	"use strict";
	return {
		title: function () {
			var mdr = jQuery.sap.getUriParameters().get();
			var title = jQuery.sap.getUriParameters().get("title");
			if (jQuery.sap.getUriParameters().get("title") === null) {
				title = "MDR13 - Open Complaints";
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
		
		overdueIconHeader: function (theme) {
			return "images/Warning_" + theme + ".png";
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
		
		colorValue: function (priority, priorityText) {
			if (priority === "1") {
				return '<div class="colorIndicator redIndicator"></div>';
			} else if (priority === "3") {
				return '<div class="colorIndicator yellowIndicator"></div>';
			} else {
				return '<div class="colorIndicator noIndicator"></div>';
			}	
		},
		
		colorValueTooltip: function (priority) {
			if (priority === "1") {
				return "Prio: Very High";
			} else if (priority === "3") {
				return "Prio: High";
			} else if (priority === "5") {
				return "Prio: Medium";
			} else if (priority === "9") {
				return "Prio: Low";
			} else {
				return "No Priority";
			} 
		},
		
		customerName: function (name, sMasked){
			if(sMasked === "YES" && name && name.length > 1){
				return name.substr(0,2) + "********";
			}
			return name;
		},
		
		description: function(description, sMasked){
			if (sMasked === "YES" && description && description.length > 1) {
				return "**********";
			} else {
				return description;
			}
		},
		
		businessUnitColHeader: function () {
			if (jQuery.sap.getUriParameters().get("BusinessUnitVisible") !== null) {
				var dispBussUnit = jQuery.sap.getUriParameters().get("BusinessUnitVisible").toLowerCase();
			}
			if (dispBussUnit === "yes" || dispBussUnit === "true") {
				return "B.Unit";
			} else {
				return " ";
			}
		},
		
		businessUnit: function () {
			if (jQuery.sap.getUriParameters().get("BusinessUnitVisible") !== null) {
				var dispBussUnit = jQuery.sap.getUriParameters().get("BusinessUnitVisible").toLowerCase();
			}
			if (dispBussUnit === "yes" || dispBussUnit === "true") {
				return "5.5%";
			} else {
				return "0px";
			}
		},
		
		overdueIcon: function (overdueIcon) {
			var layout = jQuery.sap.getUriParameters().get("layout");
			if (layout !== "dark") {
				layout = "blue";
			}
			if (overdueIcon === "X") {
				return "images/Warning_" + layout + ".png";
			}	
		},
		
		displayDate1: function (overdueIcon, date, time) {
			var element = "";
			// Select the color of the date
			var layout = jQuery.sap.getUriParameters().get("layout");
			if (layout !== null) {
				layout = jQuery.sap.getUriParameters().get("layout").toLowerCase();
			}
			if (layout !== "dark") {
				if (overdueIcon === "X") {
					element = '<div' 
						+ ' title="Due Date (Planned End Date): ' + date 
						+ '" class="Employee_NA">' + date + '</div>';
				} else {
					element = '<div' 
						+ ' title="Due Date (Planned End Date): ' + date 
						+ '" class="titleText">' + date + '</div>';	
				}
			} else {
				element = '<div' 
					+ ' title="Due Date (Planned End Date): ' + date 
					+ '" class="titleText">' + date + '</div>';
			} 
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<div></div>";
			}
		},
		
		displayDate2: function (overdueIcon, date) {
			var element = "";
			// Select the color of the date
			var layout = jQuery.sap.getUriParameters().get("layout");
			if (layout !== null) {
				layout = jQuery.sap.getUriParameters().get("layout").toLowerCase();
			}
			if (layout !== "dark") {
				if (overdueIcon === "X") {
					element = '<div' 
						+ ' title="Creation Date: ' + date 
						+ '" class="textRed">' + date + '</div>' ;
				} else {
					element = '<div' 
						+ ' title="Creation Date: ' + date 
						+ '" class="text">' + date + '</div>';	
				}
			} else {
				element = '<div' 
					+ ' title="Creation Date: ' + date 
					+ '" class="text">' + date + '</div>';
			} 
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<div></div>";
			}
		},
		
		ratingLED: function (rating) {
			if (rating === "C") {
				return "images/RedLed.gif";
			}
			if (rating === "B") {
				return "images/YellowLed.gif";
			}
			if (rating === "A") {
				return "images/GreenLed.gif";
			}
			return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
		},
		
		ratingLEDTooltip: function (rating) {
			if (rating === "C") {
				return "Rating RED";
			}
			else if (rating === "B") {
				return "Rating YELLOW";
			}
			else if (rating === "A") {
				return "Rating GREEN";
			}
			else {
				return "No Rating";
			}
			return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
		},
		
		status: function (status) {
			var className;
			if (status === "New") {
				className = "titleTextBlue";
			} else {
				className = "titleText";
			}
			var element = '<div' 
					+ ' title="User Status: ' + status 
					+ '" class="' + className + '">' + status + '</div>';
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<div></div>";
			}
		},
		
		substatus: function (substatus) {
			if (substatus !== "" && substatus !== null) {
				var pos = substatus.indexOf(" "); 
				var string = substatus.slice(pos);
				return string;
			}
		},
		
		complMngr: function (theme, person) {
			var element = "";
			if (person === "") {
				person = "N/A";
				if (theme !== "dark") {
					element = '<div' 
						+ ' title="Complaint Manager: ' + person 
						+ '" class="Employee_NA">' + person + '</div>';
				} else {
					element = '<div' 
						+ ' title="Complaint Manager: ' + person 
						+ '" class="titleText">' + person + '</div>';
				}	
			} else {
				element = '<div' 
					+ ' title="Complaint Manager: ' + person 
					+ '" class="titleText">' + person + '</div>';
			}
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<div></div>";
			}
		},
		
		personResp: function (theme, person) {
			var element = "";
			if (person === "") {
				person = "N/A";
				if (theme !== "dark") {
					element = '<div' 
						+ ' title="Person Responsible: ' + person 
						+ '" class="Employee_NA_Normal">' + person + '</div>';
				} else {
					element = '<div' 
						+ ' title="Person Responsible: ' + person 
						+ '" class="text">' + person + '</div>';
				}
			} else {
				element = '<div' 
					+ ' title="Person Responsible: ' + person 
					+ '" class="text">' + person + '</div>';
			}
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<div></div>";
			}
		},
		
		serviceTeamColHeader: function () {
			if (jQuery.sap.getUriParameters().get("ServiceTeamVisible") !== null) {
				var dispServiceTeam = jQuery.sap.getUriParameters().get("ServiceTeamVisible").toLowerCase();
			}
			if (dispServiceTeam === "false" || dispServiceTeam === "no") {
				return "";
			} else {
				return "SERVICE TEAM";
			}
		},
		
		serviceTeam: function () {
			if (jQuery.sap.getUriParameters().get("ServiceTeamVisible") !== null) {
				var dispServiceTeam = jQuery.sap.getUriParameters().get("ServiceTeamVisible").toLowerCase();
			}
			if (dispServiceTeam === "false" || dispServiceTeam === "no") {
				return "0px";
			} else {
				return "10%";
			}
		},
		
		complaintLink: function (sourceBC, objectId) {
			var content;
			if (objectId !== "") {
				if (sourceBC === "bcp" || sourceBC === "BCP") {
            		content = "https://support.wdf.sap.corp/sap/bc/bsp/sap/crm_ui_start/default.htm?saprole=ZSONESUPPORT&crm-object-type=BT120_CPL" 
            			+ "&crm-object-action=B&crm-object-keyname=OBJECT_ID&crm-object-value=" 
            			+ objectId;
				} else if (sourceBC === "bct" || sourceBC === "BCT") {
					content = "https://qa-support.wdf.sap.corp/sap/bc/bsp/sap/crm_ui_start/default.htm?saprole=ZSONESUPPORT" 
            			+ "&crm-object-type=BT120_CPL&crm-object-action=B&sap-language=EN&crm-object-keyname=OBJECT_ID&crm-object-value=" 
            			+  objectId;
				} else {
            		content = "https://" 
            			+ sourceBC 
            			+ "main.wdf.sap.corp/sap/bc/bsp/sap/crm_ui_start/default.htm?saprole=ZSONESUPPORT" 
            			+ "&crm-object-type=BT120_CPL&crm-object-action=B&sap-language=EN&crm-object-keyname=OBJECT_ID&crm-object-value=" 
            			+  objectId;
				}
				return content;
        	}
		}
	};
});		