var columnNumber = 0;
var columnCounter = 0;
sap.ui.define([], function () {
	"use strict";
	return {
		
		title: function () {
			var title = jQuery.sap.getUriParameters().get("title");
			if (jQuery.sap.getUriParameters().get("title") === null) {
				var pos = window.location.href.lastIndexOf("MDR6A");
				if (pos > -1) {	
					title = "MDR6A - Q-Gate List";
				} else {
					title = "MDR6 - Q-Gates";
				}	
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
		
		colorValue: function (ratingText, status_text, project_phase_text) {
			if (ratingText === "Red") {
				return '<div title="Case Rating: ' + ratingText 
					+ ' / Case Status: ' + status_text
					+ ' / Project Phase: ' + project_phase_text
					+ '"' + ' class="colorIndicator redIndicator"></div>';
			}
			if (ratingText === "Green") {
				return '<div title="Case Rating: ' + ratingText 
					+ ' / Case Status: ' + status_text
					+ ' / Project Phase: ' + project_phase_text
					+ '"' + ' class="colorIndicator greenIndicator"></div>';
			}
			if (ratingText === "Yellow") {
				return '<div title="Case Rating: ' + ratingText 
					+ ' / Case Status: ' + status_text
					+ ' / Project Phase: ' + project_phase_text
					+ '"' + ' class="colorIndicator yellowIndicator"></div>';
			}
			return '<div title="No Case Rating'
					+ ' / Case Status: ' + status_text
					+ ' / Project Phase: ' + project_phase_text
					+ '"' + 'class="colorIndicator"></div>';
		},
		
		colorValueMDR6A: function (qgate_severity, qgate_severity_txt) {
			if (qgate_severity !== null && qgate_severity_txt !== null) {
				var sHeight = " style='height: 48px'";
				var element = "";
				if (qgate_severity === "00300") {
					element = '<div title="Q-Gate Rating: ' + qgate_severity_txt + '" class="colorIndicatorMDR6A redIndicator"'+sHeight+'></div>';
				} else if (qgate_severity === "00200") {
					element = '<div title="Q-Gate Rating: ' + qgate_severity_txt + '" class="colorIndicatorMDR6A redIndicator"'+sHeight+'></div>';
				} else if (qgate_severity === "00100") {
					element = '<div title="Q-Gate Rating: ' + qgate_severity_txt + '" class="colorIndicatorMDR6A yellowIndicator"'+sHeight+'></div>';
				} else if (qgate_severity === "00050") {
					element = '<div title="Q-Gate Rating: ' + qgate_severity_txt + '" class="colorIndicatorMDR6A greenIndicator"'+sHeight+'></div>';
				} else {
					element = '<div title="No Q-Gate Rating" class="colorIndicatorMDR6A"'+sHeight+'></div>';
				}
				return element;
			} 
			element = '<div class="colorIndicatorMDR6A"></div>';
			return element;
		},
	
		download: function (ratingText) {
			if (ratingText === "TODAY") {
				return "";
			} else {
				return "sap-icon://download";
			}
		},
		
		referenceCustomer: function (ref_cust) {
			var layout = jQuery.sap.getUriParameters().get("layout");
			if (ref_cust === "YES") {
				if (layout === "dark") {
					return "images/ReferenceCustomer_dark.jpg";
				} else {	
					return "images/ReferenceCustomer_blue.jpg";
				}
			}
		},
		
		colHeaderCustomer: function () {
			if (jQuery.sap.getUriParameters().get("disp_name") !== null) {
				var dispName = jQuery.sap.getUriParameters().get("disp_name").toLowerCase();
			}
			var name = "";
			if (dispName === "proc") {
				name = "Processor";
			} else {
				name = "Employee Responsible";
			}
			return name;
		},
		
		customerNameFormatter: function (name, sMasked) {
			if (sMasked === "YES" && name && name.length > 1) {
				return name.substr(0, 2) + "********";
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
		
		processor: function (processor_person, responsible_person) {
			if (jQuery.sap.getUriParameters().get("disp_name") !== null) {
				var dispName = jQuery.sap.getUriParameters().get("disp_name").toLowerCase();
			}
			var name = "";
			if (dispName === "proc") {
				if (processor_person !== undefined) {
					name = processor_person;
				} else {
					name = "-";
				}
			} else {
				if (responsible_person !== undefined) {
					name = responsible_person;
				} else {
					name = "-";
				}
			}
			return name;
		},
		
		caseStatus: function (status, category, description, phaseText, layout) {
			if (jQuery.sap.getUriParameters().get("MaskData") !== null) {
				var maskData = jQuery.sap.getUriParameters().get("MaskData").toLowerCase();
			}
			if (maskData === "yes") {
				description = "**********";
			}
			if (layout !== "dark") {
				return '<div title="Case Status: ' + status
					+ ' / Case Category: ' + category 
					+ '\n'
					+ 'Case Description: ' + description
					+ ' / Case Project Phase: ' + phaseText
					+ '"' + ' class="blackNumber">'
					+ status
					+ '</div>';
			} else {
				return '<div title="Case Status: ' + status
					+ ' / Case Category: ' + category 
					+ '\n'
					+ 'Case Description: ' + description
					+ ' / Case Project Phase: ' + phaseText
					+ '"' + ' class="whiteNumber">'
					+ status
					+ '</div>';
			}
		},
		
		processorMouseover: function (processor_person, responsible_person) {
			if (jQuery.sap.getUriParameters().get("disp_name") !== null) {
				var dispName = jQuery.sap.getUriParameters().get("disp_name").toLowerCase();
			}
			var name = "";
			if (processor_person === undefined || processor_person === "") {
				processor_person = "-";
			}
			if (responsible_person === undefined || responsible_person === "") {
				responsible_person = "-";
			}
			if (dispName === "proc") {
				name = "Processor: " + processor_person + " / Empl. Resp.: " + responsible_person;
			} else {
				name = "Empl. Resp.: " + responsible_person + " / Processor: " + processor_person;
			}
			return name;
		},
		
		colHeaderDate: function () {
			var text = "";
			if (jQuery.sap.getUriParameters().get("disp_date") !== null) {
				var dispDate = jQuery.sap.getUriParameters().get("disp_date").toLowerCase();
			}
			if (dispDate === "lc") {
				text = "LAST CHANGE";
			} else if (dispDate === "cr") {
				text = "CREATED AT";
			} else {
				text = "GO LIVE";
			}
			return text;
		},
		
		caseTitleFormatter: function (title, sMasked) {
			if (sMasked === "YES") {
				return "********";
			}
			return title;
		},
		
		tooltipOverdueIconMDR6A: function (qgateStartDate, qgateEndDate) {
			var date = new Date();
			var startDate = new Date(qgateStartDate);
			var endDate = new Date(qgateEndDate);
			// Compare dates
			if (startDate < date && endDate < date) {
				return "Q-Gate Start Date and End Date in the Past!";
			} else if (startDate < date && endDate >= date) {
				return "Q-Gate Start Date in the Past!";
			} else {
				return "";
			}
		},
		
		overdueIconMDR6A: function (qgateStartDate, qgateEndDate) {
			var layout = jQuery.sap.getUriParameters().get("layout");
			var date = new Date();
			var startDate = new Date(qgateStartDate);
			var endDate = new Date(qgateEndDate);
			// Compare dates
			if (startDate < date && endDate < date) {
				return "images/Warning_blue.png";
			} else if (startDate < date && endDate >= date) {
				if (layout === "dark") {
					return "images/Warning_dark.png";
				} else {
					return "images/Warning-reverse_new.png";
				}
			} else {
				return "";
			}
		},
		
		dateHeader: function () {
			var text = 
				"Explanation:" +
				"\n" +
				"A qgate is displayed when the related case matches the case-specific filter parameters" +
				"\n" +
				"and the qgate of this case meets the qgate-specific filter parameters.";
			return text;
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
				return "Case Rating: RED";
			}
			else if (rating === "B") {
				return "Case Rating: YELLOW";
			}
			else if (rating === "A") {
				return "Case Rating: GREEN";
			}
			else {
				return "No Rating";
			}
			return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
		},
		
		caseDate: function (go_live, create_time, change_time) {
			var currentDate = new Date();
			var divClass = "";
			var element = "";
			if (jQuery.sap.getUriParameters().get("disp_date") !== null) {
				var dispDate = jQuery.sap.getUriParameters().get("disp_date").toLowerCase();
			}
			// Convert golive date /////
			var yearInt = go_live.substring(7, 12);
			var monthString = go_live.substring(3, 6);
			var dayInt = go_live.substring(0, 2);
			var monthInt;
			switch (monthString) {
			case 'Jan':
				monthInt = 0;
				break;
			case 'Feb':
				monthInt = 1;
				break;
			case 'Mar':
				monthInt = 2;
				break;
			case 'Apr':
				monthInt = 3;
				break;
			case 'May':
				monthInt = 4;
				break;
			case 'Jun':
				monthInt = 5;
				break;
			case 'Jul':
				monthInt = 6;
				break;
			case 'Aug':
				monthInt = 7;
				break;
			case 'Sep':
				monthInt = 8;
				break;
			case 'Oct':
				monthInt = 9;
				break;
			case 'Nov':
				monthInt = 10;
				break;
			case 'Dec':
				monthInt = 11;
				break;
			}
			// Set golive date /////
			var sdate = "";
			yearInt = Number(yearInt);
			monthInt = Number(monthInt);
			dayInt = Number(dayInt);
			var goLiveDate = dayInt + " " + monthString + " " + yearInt;
			// Convert last change date and creation date into same format as golive date /////
			for (var i = 0; i < 2; i++) {
				if (i === 0) {
					sdate = change_time; 
				} else {
					sdate = create_time;
				}	
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
					if (i === 0) {
						var formattedChangeDate = sdate.substring(6, 8) + " " + month + " " + sdate.substring(0, 4);
					} else {
						var formattedCreateDate = sdate.substring(6, 8) + " " + month + " " + sdate.substring(0, 4);
					}
				}
			}	
			// Set <div> class /////
			if (dispDate === "lc" || dispDate === "cr") {
				if (goLiveDate > currentDate) {
					divClass = "titleTextBlue";
				} else {
					divClass = "titleText";
				}
			} else {
				divClass = "titleText";
			}
			// Correct go live date if missing /////
			if (go_live === "") {
				goLiveDate = "N/A";
			} 
			// Create <div> element	/////
			if (dispDate === "lc") {
				element = "<div class=" + divClass 
					+ " title='Last Change Date: " + formattedChangeDate 
					+ " / Creation Date: " + formattedCreateDate
					+ " / Go Live Date: " + goLiveDate + "'>" 
					+ formattedChangeDate + "<div";
			} else if (dispDate === "cr") {
				element = "<div class=" + divClass 
					+ " title='Creation Date: " + formattedCreateDate 
					+ " / Last Change Date: " + formattedChangeDate
					+ " / Go Live Date: " + goLiveDate + "'>" 
					+ formattedCreateDate + "<div";				
			} else {
				element = "<div class=" + divClass 
					+ " title='Go Live Date: " + goLiveDate 
					+ " / Creation Date: " + formattedCreateDate
					+ " / Last Change Date: " + formattedChangeDate + "'>" 
					+ goLiveDate + "<div";
			}
			return element;
		},
		
		dateMDR6A: function (qgStartDate, qgEndDate) {
			var layout = jQuery.sap.getUriParameters().get("layout");
			var element = "";
			var divClass1 = "";
			var divClass2 = "";
			var date = new Date();
			var startDate = new Date(qgStartDate);
			var endDate = new Date(qgEndDate);
			// Compare dates
			// Start date
			if (startDate < date) {
				divClass1 = "titleTextRed";
			} else {
				divClass1 = "titleText";
			}
			// End date
			if (endDate < date) {
				divClass2 = "textRed";
			} else {
				divClass2 = "text";
			}
			// Create and return <div> element
			if (layout === "dark") {
				element = '<div><span' 
					+ ' title="Q-Gate Start Date: ' + qgStartDate + '"'
					+ ' class="titleText">' + qgStartDate + '<br />' + '</span>' 
					+ ' <span'
					+ ' title="Q-Gate End Date: ' + qgEndDate + '"'
					+ ' class="">' + qgEndDate + '</span></div>';
			} else {
				// Layout = blue
				element = '<div><span' 
					+ ' title="Q-Gate Start Date: ' + qgStartDate + '"'
					+ ' class=' + divClass1 + '>' + qgStartDate + '<br />' + '</span>' 
					+ ' <span'
					+ ' title="Q-Gate End Date: ' + qgEndDate + '"'
					+ ' class=' + divClass2 + '>' + qgEndDate + '</span></div>';
			}		
			return element;
		},
		
		caseLink: function (sourceIC, caseId) {
			return ["https://",
				sourceIC,
				".wdf.sap.corp/sap/bc/bsp/sap/crm_ui_start/default.htm?saprole=ZSU_DEFAULT" +
				"&crm-object-type=CRM_CMG&crm-object-action=B" +
				"&sap-language=EN&crm-object-keyname=EXT_KEY&crm-object-value=",
				caseId
			].join("");
		},
		
		todayRow: function (ratingText) {
			if (ratingText === "TODAY") {
				return false;
			} else {
				return true;
			}
		},
		
		colHeaderMonth: function () {
			var element = false;
			var d = new Date();
			var month = d.getMonth() - 1;
			if (month === -1) {
				month = month + 12;
			}
			if (month > 11) {
				month = month - 12;
			}
			if (columnNumber === month) {
				element = true;
				columnCounter = columnCounter + 1;
			} else if (columnCounter > 0 && columnCounter < 6) {
				element = true;
				columnCounter = columnCounter + 1;
			}
			columnNumber = columnNumber + 1;
			return element;
		},
		
		displayDivElement: function (month) {
			var element = month;
			if (element) {
				return element;
			}
			return "<span></span>";
		},
		
		getFullDateFormat: function (date) {
			if (date) {
				var day = date.getDate().toString();
				if (day.length === 1)
					day = "0" + day;
				var month = "";
				switch ((date.getMonth() + 1).toString()) {
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
				return day + " " + month + " " + date.getFullYear().toString();
			}
			return "";
		}
	};
});