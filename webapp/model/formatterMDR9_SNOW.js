sap.ui.define([], function () {
	"use strict";
	return {
		
		runtimeTest: function (runtime) {
			var runtimeTest = jQuery.sap.getUriParameters().get("RuntimeTest");
			var text = "";
			if (runtimeTest !== null) {
				runtimeTest = jQuery.sap.getUriParameters().get("RuntimeTest").toLowerCase();
			}
			if (runtimeTest === "yes") {
				text = "Data Load Time: " + runtime + " s";
			} else {
				text = "";
			}
			return text;
		},
		
		title: function () {
			var title = jQuery.sap.getUriParameters().get("title");
			if (jQuery.sap.getUriParameters().get("title") === null) {
				title = "MDR9_NOW - ServiceNow Cases";
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
		
		colorValue: function (priority, priorityText) {
			if (priority === "1") {
				return '<div class="colorIndicator redIndicator"></div>';
			} else if (priority === "2") {
				return '<div class="colorIndicator yellowIndicator"></div>';
			} else if (priority === "3") {
				return '<div class="colorIndicator greenIndicator"></div>';	
		//	} else if (priority === "4") {
		//		return '<div class="colorIndicator darkgreenIndicator"></div>';	
			} else {
				return '<div class="colorIndicator noIndicator"></div>';
			}	
		},
		
		colorValueTooltip: function (priority) {
			if (priority === "1") {
				return "Prio: Very High";
			} else if (priority === "2") {
				return "Prio: High";
			} else if (priority === "3") {
				return "Prio: Medium";
			} else if (priority === "4") {
				return "Prio: Low";	
			} else {
				return "None";
			} 
		},
		
		customerName: function (name, number, sMasked) {
			if (sMasked === "YES" && name && name.length > 1){
				return name.substr(0,2) + "********";
			}
			return name;
		},
		
		customer: function (name, number, sMasked) {
			if (sMasked === "YES" && name && name.length > 1){
				return "Customer Name: " + name.substr(0,2) + "********";
			} else {
				return "Customer Name: " + name + " / Partner Number: " + number;
			}
		},
		
		description1: function(description, sMasked){
			var tooltip = "";
			if (sMasked === "YES" && description && description.length > 1) {
				tooltip = "**********";
			} else {
				tooltip = description;
			}
			return tooltip;
		},
		
		description2: function(short_description, description, sMasked){
			var desc = "";
			var shortDesc = "";
			var tooltip = "";
			if (sMasked === "YES" && description && description.length > 1) {
				desc = "**********";
			} else {
				desc = description;
			}
			if (sMasked === "YES" && short_description && short_description.length > 1) {
				shortDesc = "**********";
			} else {
				shortDesc = short_description;
			}
			tooltip = "Short Description: "
				+ shortDesc
				+ "\n"
				+ "\n"
				+ "Description: "
				+ desc;
			return tooltip;	
		},		
		
		businessImpact: function (businessImpact, sMasked) {
			var impact = "";
			if (sMasked === "YES" && businessImpact && businessImpact.length > 1) {
				impact = "**********";
			} else {
				impact = businessImpact;
			}
			return impact;
		},
		
		contractType: function (contractType) {
			var conType = "";
			var conTypeList = "";
			var extract = "";
			if (contractType !== null && contractType !== undefined) {
				for (var i=0; i < contractType.length; i++) {
					if (i === 0) {
						extract = contractType.substr(0,32);
						if (extract === "") {
							break;
						}
					} else {
						contractType = contractType.replace(extract, "");
						contractType = contractType.replace(",", "");
						extract = contractType.substr(0,32);
						if (extract === "") {
							break;
						}
					}
					switch (extract) {
						case 'N/A':
							conType = "N/A";
							break;
						case '':
							conType = "N/A";
							break;		
						case '1':
							conType = "CPS";
							break;	
						case '1a976bdd1b10c01420c8fddacd4bcba7':
							conType = "CPS";
							break;
						case '06ebc2841be9b3009307dceacd4bcb97':
							conType = "ES";
							break;
						case '06ebc2841be9b3009307dceacd4bcb99':
							conType = "PSLE-SEC";
							break;
						case '0aebc2841be9b3009307dceacd4bcb9a':
							conType = "CPC";
							break;
						case '0eebc2841be9b3009307dceacd4bcb9b':
							conType = "PSLA";
							break;
						case '0eebc2841be9b3009307dceacd4bcba9':
							conType = "SL";
							break;
						case '42ebc2841be9b3009307dceacd4bcb9c':
							conType = "MP";
							break;
						case '42ebc2841be9b3009307dceacd4bcbaa':
							conType = "MA4";
							break;
						case '46ebc2841be9b3009307dceacd4bcb98':
							conType = "STD";
							break;
						case '4aebc2841be9b3009307dceacd4bcb99':
							conType = "ES-SEC";
							break;
						case '4eebc2841be9b3009307dceacd4bcb9a':
							conType = "TSLDI";
							break;
						case '4eebc2841be9b3009307dceacd4bcba8':
							conType = "MA";
							break;
						case '82ebc2841be9b3009307dceacd4bcb9b':
							conType = "ORSL";
							break;	
						case '82ebc2841be9b3009307dceacd4bcba9':
							conType = "AE";
							break;	
						case '86ebc2841be9b3009307dceacd4bcbaa':
							conType = "xMA4";
							break;	
						case '8aebc2841be9b3009307dceacd4bcb98':
							conType = "PSLE";
							break;	
						case '8eebc2841be9b3009307dceacd4bcb99':
							conType = "CES";
							break;	
						case 'c2ebc2841be9b3009307dceacd4bcb9a':
							conType = "CPremium";
							break;	
						case 'c6ebc2841be9b3009307dceacd4bcb9b':
							conType = "PC";
							break;	
						case 'c6ebc2841be9b3009307dceacd4bcba9':
							conType = "SLA";
							break;	
						case 'ceebc2841be9b3009307dceacd4bcb98':
							conType = "SEC";
							break;	
						default:
							conType = "Not specified";
					}
					if (i === 0) {
						conTypeList = conTypeList + conType;
					} else {
						if (extract !== "") {
							conTypeList = conTypeList + ", " + conType;
						}
					}
				}
			}
			return conTypeList;
		},
		
		contractTypeValueHelp: function (contractType) {
			var conType = "";
			switch (contractType) {
				case 'N/A':
					conType = "N/A";
					break;
				case '':
					conType = "N/A";
					break;
				case '1':	
					conType = "AA - SAP Active Attention";
					break;	
				case '1a976bdd1b10c01420c8fddacd4bcba7':
					conType = "CPS - Cloud Preferred Success";
					break;	
				case '06ebc2841be9b3009307dceacd4bcb97':
					conType = "ES - SAP Enterprise Support";
					break;
				case '206ebc2841be9b3009307dceacd4bcb99':
					conType = "PSLE-SEC - PSLE Secure";
					break;
				case '0aebc2841be9b3009307dceacd4bcb9a':
					conType = "CPC - Cloud Preferred Care";
					break;
				case '0eebc2841be9b3009307dceacd4bcb9b':
					conType = "PSLA - SAP Extended SLA";
					break;
				case '0eebc2841be9b3009307dceacd4bcba9':
					conType = "SL - Customer Specific SLA";
					break;
				case '42ebc2841be9b3009307dceacd4bcb9c':
					conType = "MP - Multiposting Support";
					break;
				case '42ebc2841be9b3009307dceacd4bcbaa':
					conType = "MA4 - Accelerated Incident Management";
					break;
				case '46ebc2841be9b3009307dceacd4bcb98':
					conType = "STD - SAP Standard Support";
					break;
				case '4aebc2841be9b3009307dceacd4bcb99':
					conType = "ES-SEC - Enterprise Support - Secure";
					break;
				case '4eebc2841be9b3009307dceacd4bcb9a':
					conType = "TSLDI - Technical Supp. for Large Independent DB";
					break;
				case '4eebc2841be9b3009307dceacd4bcba8':
					conType = "MA - SAP Max Attention";
					break;
				case '82ebc2841be9b3009307dceacd4bcb9b':
					conType = "ORSL - Ongoing Response SLA";
					break;
				case '82ebc2841be9b3009307dceacd4bcba9':
					conType = "AE - SAP Active Embedded";
					break;	
				case '86ebc2841be9b3009307dceacd4bcbaa':
					conType = "xMA4 - Extended Accelerated Incident Management";
					break;	
				case '8aebc2841be9b3009307dceacd4bcb98':
					conType = "PSLE - SAP Product Support for Large Enterprise";
					break;	
				case '8eebc2841be9b3009307dceacd4bcb99':
					conType = "CES - Enterprise Support Cloud Edition";
					break;	
				case 'c2ebc2841be9b3009307dceacd4bcb9a':
					conType = "CPremium - Cloud Premium Care";
					break;	
				case 'c6ebc2841be9b3009307dceacd4bcb9b':
					conType = "PC - SAP Preferred Caren-Premise Edition";
					break;	
				case 'c6ebc2841be9b3009307dceacd4bcba9':
					conType = "SLA - Service Level Agreement";
					break;	
				case 'ceebc2841be9b3009307dceacd4bcb98':
					conType = "SEC - Advanced Secure Support";
					break;	
				default:
					conType = "Not specified";
			}
			return conType;
		},
		
		systemType: function (systemId, instno, systemType) {
			var element = '<div' 
				+ ' class="text" maxLines="1" title="System ID: ' + systemId + ' (' + systemType + ') - Inst.No.: ' + instno + '">' 
				+ systemId + " / " + instno + '</div>';
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<div></div>";
			}
			
		},
		
		escalationType: function (escalationType) {
			var escType = "";
			switch (escalationType) {
				case '0':
					escType = "Business Down Situation";
					break;
				case '2':
					escType = "Premium Engagement Critical Incident";
					break;
				case '4':
					escType = "Critical Customer Situation";
					break;
				case '5':
					escType = "Critical Incident";
					break;
				default:
					escType = escalationType;
			}
			return escType;
		},
		
		escalation: function (type, reason, time, state, short_desc) {
			var escType = "";
			switch (type) {
				case '0':
					escType = "Business Down Situation";
					break;
				case '2':
					escType = "Premium Engagement Critical Incident";
					break;
				case '4':
					escType = "Critical Customer Situation";
					break;
				case '5':
					escType = "Critical Incident";
					break;
				default:
				//	escType = "N/A";
					escType = type;
			}
			if (short_desc === "") {
				short_desc = "-";
			}
			var text = "Escalation Type: "
				+ escType
				+ "\n"
				+ "Escalation State: "
				+ state
				+ "\n"
				+ "Escalation Time: "
				+ time;
			return text;
		},
		
		overdueIconHeader: function (theme) {
			return "images/Warning_" + theme + ".png";
		},
		
		overdueIconHeader2: function (theme) {
			return "images/Warning-yellow_2.png";
		},
		
		overdueIcon: function (state, date) {
			var layout = jQuery.sap.getUriParameters().get("layout");
			if (layout !== "dark") {
				layout = "blue";
			}
			if (state === "100") {
				return "images/Warning-yellow_2.png";
			} else if (state === "101") {
				return "images/Warning_" + layout + ".png";
			}	
		},
		
		displayDate1: function (date, lastChange, active) {
			if (date === null || date === "") {
				return "<div>" + "-" + "</div>";
			}
			var element = "";
			var year = "";
			var monthtmp = "";
			var month = "";
			var day = "";
			var fullDate = "";
			var fullDateLC = "";
			var time = "";
			var timeLC = "";
			// Extract date and time
			for (var i = 0; i < 2; i++) {
				if (i === 0) {
					year = date.slice(0,4);
					monthtmp = date.slice(5,7);
					month = "";
					day = date.slice(8,10);
					fullDate = "";
					time = date.slice(11,19);
				} else {
					if (lastChange !== null && lastChange !== "") {
						year = lastChange.slice(0,4);
						monthtmp = lastChange.slice(5,7);
						month = "";
						day = lastChange.slice(8,10);
						fullDateLC = "";
						timeLC = lastChange.slice(11,19);
					}	
				}
				// Convert month
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
				// Create full date
				if (i === 0) {
					fullDate = day + " " + month + " " + year;
				} else {
					fullDateLC = day + " " + month + " " + year;
				}	
			}
			// Set active = true
			active = "true";
			// Create <div> element
			if (active === "true") {
				element = '<div'
					+ ' title="Case opened at: ' + fullDate + " - " + time + ' h' 
					+ '\nLast Update on: ' + fullDateLC + " - " + timeLC + ' h' 
					+ '"'
					+ ' class="titleText">'
					+ fullDate + '</div>';
			} else {
				element = '<div'
					+ ' title="Case opened at: ' + fullDate + " - " + time + ' h' 
					+ '\nLast Update on: ' + fullDateLC + " - " + timeLC + ' h' 
					+ '"'
					+ ' class="titleTextGrey">'
					+ fullDate + '</div>';
			}
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<div>" + "-" + "</div>";
			}
		},
		
		displayDate2: function (date) {
			if (date === null || date === "") {
				return "<div>" + " - " + "</div>";
			}
			var element = "";
			// Extract date and time
			var year = date.slice(0,4);
			var monthtmp = date.slice(5,7);
			var month = "";
			var day = date.slice(8,10);
			var fullDate = "";
			var time = date.slice(11,19);
			// Convert month
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
			// Create full date
			fullDate = day + " " + month + " " + year;
			// Create <div> element
			element = '<div' + ' class="text">' + fullDate + '</div>';
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<div>" + "-" + "</div>";
			}
		},
		
		displayDate3: function (date) {
			if (date === null || date === "" || date === undefined) {
				return "<div>" + " - " + "</div>";
			}
			var layout = jQuery.sap.getUriParameters().get("layout");
			var element = "";
			// Extract date and time
			var year = date.slice(0,4);
			var monthtmp = date.slice(5,7);
			var month = "";
			var day = date.slice(8,10);
			var fullDate = "";
			var time = date.slice(11,19);
			// Convert month
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
			// Current date
			var currDate = new Date();
			var compDate = new Date(year, monthtmp - 1, day);
			// Create full date
			fullDate = day + " " + month + " " + year;
			// Create <div> element
			if (compDate < currDate) {
				if (layout === "dark") {
					element = '<div'
						+ ' title="Due Date for next Action: ' + fullDate + " - " + time + ' h' + '"'
						+ ' class="titleText" maxLines="1">'
						+ fullDate + '</div>';
				} else {
					element = '<div'
						+ ' title="Due Date for next Action: ' + fullDate + " - " + time + ' h' + '"'
						+ ' class="Employee_NA" maxLines="1">'
						+ fullDate + '</div>';
				}
			} else {
				element = '<div'
					+ ' title="Due Date for next Action: ' + fullDate + " - " + time + ' h' + '"'
					+ ' class="titleText">'
					+ fullDate + '</div>';
			}
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<div>" + "-" + "</div>";
			}
		},

		state: function (state, actionStatusText, resolutionCode, resolvedBy, resolvedAt) {
			// Translate status code
			var status = "";
			switch (state) {
				case '':
					status = "-";
					break;
				case '1':
					status = "New";
					break;
				case '2':
					status = "Undefined State";
					break;
				case '3':
					status = "Closed";
					break;
				case '6':
					status = "Resolved";
					break;
				case '10':
					status = "In Progress";
					break;
				case '18':
					status = "Awaiting Info";
					break;
				default:
					status = state;	
			}
			// Resolution code
			if (resolutionCode !== "" && resolutionCode !== undefined && resolutionCode !== null) {
				var resCode = "\n"
					+ "\n"
					+ "Resolution Code: "
					+ resolutionCode.toUpperCase();
			} else {
				resCode = "";
			}
			// Resolved by
			if (resolvedBy !== "" && resolvedBy !== undefined && resolvedBy !== null) {
				var resBy = "\n"
					+ "Resolved by: "
					+ resolvedBy;
			} else {
				resBy = "";
			}
			// Resolved at
			if (resolvedAt !== "" && resolvedAt !== undefined && resolvedAt !== null) {
				var resAt = "\n"
					+ "Resolved at: "
					+ resolvedAt;
			} else {
				resAt = "";
			}
			// Create <div> element
			var className;
			if (status === "Awaiting Info" && actionStatusText === "Awaiting Requester") {
				className = "titleTextBlue";
			} else {
				className = "titleText";
			}
			var element = '<div' 
					+ ' title="State: ' + status + resCode + resAt
					+ '" class="' + className + '">' + status + '</div>';
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<div></div>";
			}
		},
		
		actionStatus: function (state, actionStatusText) {
			// Create <div> element
			var className;
			if (state === "18" && actionStatusText === "Awaiting Requester") {
				className = "textBlueBold";
			} else {
				className = "text";
			}
			var element = '<div' 
					+ ' title="Action Status: ' + actionStatusText
					+ '" class="' + className + '">' + actionStatusText + '</div>';
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<div></div>";
			}
		},
		
		processor: function (Processor, Contact, sMasked) {
			var layout = jQuery.sap.getUriParameters().get("layout");
			var element = "";
			var name1 = "";
			var name2 = "";
			if (sMasked === "YES" && Contact && Contact.length > 1){
				Contact = "********";
			}
			if (Processor === "N/A") {
				if (layout === "dark") {
					element = element = '<div' 
						+ ' title="No Processor assigned' + " - Contact: " + Contact
						+ '" class="titleText" maxLines="1">' + Processor + '</div>' ;
				} else {
					element = element = '<div' 
						+ ' title="No Processor assigned' + " - Contact: " + Contact
						+ '" class="Employee_NA" maxLines="1">' + Processor + '</div>' ;
				}
			} else {
				element = element = '<div' 
					+ ' title="Processor: ' + Processor + " - Contact: " + Contact
					+ '" class="titleText" maxLines="1">' + Processor + '</div>' ;
			}
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<div></div>";
			}
		},
		
		reporterName: function (name, sMasked){
			if(sMasked === "YES" && name && name.length > 1){
				return name.substr(0,2) + "********";
			}
			return name;
		},
		
		activeColWidth: function () {
			var dispActive = "";	
			if (jQuery.sap.getUriParameters().get("ActiveVisible") !== null) {
				dispActive = jQuery.sap.getUriParameters().get("ActiveVisible").toLowerCase();
			}
			if (jQuery.sap.getUriParameters().get("Activevisible") !== null) {
				dispActive = jQuery.sap.getUriParameters().get("activevisible").toLowerCase();
			}
			if (dispActive === "true" || dispActive === "yes") {
				return "5%";
			} else {
				return "0px";
			}
		},
		
		activeColTitle: function () {
			var dispActive = "";	
			if (jQuery.sap.getUriParameters().get("ActiveVisible") !== null) {
				dispActive = jQuery.sap.getUriParameters().get("ActiveVisible").toLowerCase();
			}
			if (jQuery.sap.getUriParameters().get("Activevisible") !== null) {
				dispActive = jQuery.sap.getUriParameters().get("activevisible").toLowerCase();
			}
			if (dispActive === "true" || dispActive === "yes") {
				return "ACTIVE";
			} else {
				return "";
			}
		},
		
		activeSystemColTitle: function () {
			var dispActive = "";	
			if (jQuery.sap.getUriParameters().get("ActiveVisible") !== null) {
				dispActive = jQuery.sap.getUriParameters().get("ActiveVisible").toLowerCase();
			}
			if (jQuery.sap.getUriParameters().get("Activevisible") !== null) {
				dispActive = jQuery.sap.getUriParameters().get("activevisible").toLowerCase();
			}
			if (dispActive === "true" || dispActive === "yes") {
				return "ACT. SYS.";
			} else {
				return "";
			}
		},
		
		timesColWidth: function () {
			var dispTimes = "";	
			if (jQuery.sap.getUriParameters().get("TimesVisible") !== null) {
				dispTimes = jQuery.sap.getUriParameters().get("TimesVisible").toLowerCase();
			}
			if (dispTimes === "true" || dispTimes === "yes") {
				return "6.7%";
			} else {
				return "0px";
			}
		},
		
		timesColTitle: function () {
			var dispTimes = "";	
			if (jQuery.sap.getUriParameters().get("TimesVisible") !== null) {
				dispTimes = jQuery.sap.getUriParameters().get("TimesVisible").toLowerCase();
			}
			if (dispTimes === "true" || dispTimes === "yes") {
				return "TIME AGENT";
			} else {
				return "";
			}
		},
		
		timesColText: function () {
			var dispTimes = "";	
			if (jQuery.sap.getUriParameters().get("TimesVisible") !== null) {
				dispTimes = jQuery.sap.getUriParameters().get("TimesVisible").toLowerCase();
			}
			if (dispTimes === "true" || dispTimes === "yes") {
				return "Time Customer";
			} else {
				return "";
			}
		},
		
		timesColTooltip: function () {
			var text = "";
			var dispTimes = "";	
			if (jQuery.sap.getUriParameters().get("TimesVisible") !== null) {
				dispTimes = jQuery.sap.getUriParameters().get("TimesVisible").toLowerCase();
			}
			if (dispTimes === "true" || dispTimes === "yes") {
				text = 
					"Time Agent:" +
					"\n" + 
					"Duration of processing at SAP side." + 
					"\n" +
					"\n" + 
					"Time Customer:" + 
					"\n" + 
					"Duration how long case stayed at customer side.";
			} 
			return text;
		},
		
		caseColTooltip: function () {
			var text = 
				"Case ID:" +
				"\n" + 
				"ServiceNow Case ID" + 
				"\n" + 
				"\n" + 
				"SAP Case Number:" +
				"\n" +
				"Number of related Incident in BCP";
			return text;
		},
		
		ServiceNowID: function (leadingSystem) {
			if (leadingSystem === "sno") {
				return false;
			} else {
				return true;
			}
		},
		
		SAPCaseID: function (leadingSystem) {
			if (leadingSystem !== "sno") {
				return false;
			} else {
				return true;
			}
		}
	};
});		