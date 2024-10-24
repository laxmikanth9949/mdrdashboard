sap.ui.define([], function () {
	"use strict";
	return {
		title: function () {
			var url = window.location.href;
			var pos = url.search("MDR2");
			var title = jQuery.sap.getUriParameters().get("title");
			if (jQuery.sap.getUriParameters().get("title") === null) {
				if (pos > 0) {
					title = "MDR2 - Activities";
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
		
		goLiveInDanger: function (theme) {
			var element;
			if (theme === "blue") {
				element = "images/IncomingError.png";
			} else {
				element = "images/IncomingError_dark.png";
			}
			return element;
		},
		
		productionDown: function (theme) {
			var element;
			if (theme === "blue") {
				element = "images/Error.png";
			} else {
				element = "images/Error_dark.png";
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
		
		priority: function () {
			if (jQuery.sap.getUriParameters().get("hidePrio") !== null) {
				var hidePrio = jQuery.sap.getUriParameters().get("hidePrio").toLowerCase();
			}
			if (hidePrio === "yes") {
				return "0px";
			} else {
				return "6px";
			}
		},
		
		colorValue: function (activity_priority) {
			if (activity_priority === "1") {
				return '<div class="colorIndicator redIndicator"></div>';
			} else if (activity_priority === "3") {
				return '<div class="colorIndicator yellowIndicator"></div>';
			} else {
				return "";
			}	
		},
		
		colorValueTooltip: function (activity_priority) {
			if (activity_priority === "1") {
				return "Prio: Very High";
			} else if (activity_priority === "3") {
				return "Prio: High";
			} else {
				return "";
			} 
		},
		
		categoryIcons: function (activity_cat) {
			var element;
			var theme = jQuery.sap.getUriParameters().get("layout");
			var rootPath = jQuery.sap.getModulePath("corp.sap.mdrdashboards");
			var path = rootPath + "/images";
			if (theme !== "dark") {
				switch (activity_cat) {
						case "Z91":
							element = '<div class="category2">' + 
								'<img style="width: 1.5rem"' +
								' title="Business Down - Activity Category Z91" src="' + path + '"/Error.png">' +
								'</img></div>';
							break;
						case "Z90":
							element = '<div class="category1">' + 
								'<img style="width: 1.8rem"' +
								' title="GoLive in Danger - Activity Category Z90" src="' + path + '"/IncomingError.png">' +
								'</img></div>';
							break;
					}
			} else {
				switch (activity_cat) {
						case "Z91":
							element = '<div class="category2">' + 
								'<img style="width: 1.5rem"' +
								' title="Business Down - Activity Category Z91" src="' + path + '"/Error_dark.png">' +
								'</img></div>';
							break;
						case "Z90":
							element = '<div class="category1">' + 
								'<img style="width: 1.75rem"' +
								' title="GoLive in Danger - Activity Category Z90" src="' + path + '"/IncomingError_dark.png">' +
								'</img></div>';
							break;
					}
			}
			return element;
		},
		
		caseRefMDR2: function (ActivityCases, theme) {
			if (ActivityCases !== null) {
				var layout = jQuery.sap.getUriParameters().get("layout");
				var refCase1 = 0;
				var refCase2 = 0;
				var refCaseInd = 0;
				var image = "";
				var length = ActivityCases.results.length;
				// Which icon should be displayed?
				for (var i = 0; i < length; i++) {
					if (ActivityCases.results[i].case_type === "ZS01") {
						refCase1++;
					}
					if (ActivityCases.results[i].case_type === "ZS02") {
						refCase2++;
					}	
				}
				if (refCase1 > 0) {
					refCaseInd = 2;
					if (layout === "dark") {
						image = "images/refEsc_2.png";
						return image;
					} else {
						image = "images/refEsc.png";
						return image;
					}
				}
				if (refCase2 > 0 && refCase1 === 0) {
					refCaseInd = 1;
					if (layout === "dark") {
						image = "images/refCustDark.png";
						return image;
					} else {
						image = "images/refCust.png";
						return image;
					}
				}
				return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
			} else {
				return "";
			}
		},
		
		caseRefMDR2Tooltip: function (ActivityCases, theme) {
			if (ActivityCases !== null) {
				var layout = jQuery.sap.getUriParameters().get("layout");
				var refCase1 = 0;
				var refCase2 = 0;
				var refCaseInd = 0;
				var image = "";
				var length = ActivityCases.results.length;
				// Which icon should be displayed?
				for (var i = 0; i < length; i++) {
					if (ActivityCases.results[i].case_type === "ZS01") {
						return "Click on Icon for Details";
					}
					if (ActivityCases.results[i].case_type === "ZS02") {
						return "Click on Icon for Details";
					}	
				}
			}
			return "";
		},
	
		customerNameFormatter: function(name, sMasked){
			if(sMasked === "yes" && name && name.length > 1){
				return name.substr(0,2) + "********";
			}
			return name;
		},
		
		descriptionFormatter: function(description, sMasked){
			if (sMasked === "yes" && description && description.length > 1) {
				return "**********";
			} else {
				return description;
			}
		},
		
		categoryReasonResultHeaderFormatter: function () {
			var text = "";
			if (jQuery.sap.getUriParameters().get("disp_cat") !== null) {
				var disp = jQuery.sap.getUriParameters().get("disp_cat").toLowerCase();
			}
			if (disp === null || disp === undefined) {
				// Old behavior --> Display category and result
				text = "Category / Result";
			} else {
				if (disp === "result") {
					// Display result and reason
					text = "Result / Reason";
				} else if (disp === "reason") {
					// Display category and reason
					text = "Category / Reason";
				} else if (disp === "all") {
					// Display category, result and reason
					text = "Category / Result / Reason";
				} else {
					// Most likely a typo...
					text = "Category / Result";
				}	
			}
			return text;
		},
		
		categoryReasonResultFormatter: function (category, result, reason) {
			var text = "";
			if (jQuery.sap.getUriParameters().get("disp_cat") !== null) {
				var disp = jQuery.sap.getUriParameters().get("disp_cat").toLowerCase();
			}
			if (disp === null || disp === undefined) {
				// Old behavior --> Display category and result
				text = category + " / " + result;
			} else {
				if (disp === "result") {
					// Display result and reason
					text = result + " / " + reason;
				} else if (disp === "reason") {
					// Display category and reason
					text = category + " / " + reason;
				} else if (disp === "all") {
					// Display category, result and reason
					text = category + " / " + result + " / " + reason;
				} else {
					// Most likely a typo...
					text = category + " / " + result;
				}	
			}
			return text;
		},
		
		GUMaintAttr: function (customer_category, ActMainProductVersion) {
			var engagement;
			var element;
			if (customer_category !== null) {
				if (customer_category.indexOf("MAXATTENTION") > -1) {
					engagement = "Engagement";
				//	engagement = "EngagementMAX";
				} else {
					engagement = "Engagement";
				}
				element = "<div title='Global Ultimate Maintenance Attribute: " + customer_category 
					+ " / Product: " + ActMainProductVersion + "' class=" + engagement + ">" 
					+ customer_category + " / " + ActMainProductVersion + "</div>";
			}
			if (customer_category === "") {
				element = "<div title='Global Ultimate Maintenance Attribute: " + customer_category 
					+ " / Product: " + ActMainProductVersion + "' class=" + engagement + ">" 
					+ "-" + " / " + ActMainProductVersion + "</div>";
			}
			return element;
		},
		
		dateDisplay: function () {
			var text = "";
			if (jQuery.sap.getUriParameters().get("disp_date") !== null) {
				var dispDate = jQuery.sap.getUriParameters().get("disp_date").toLowerCase();
			}
			if (dispDate === "gl") {
				text = "GO LIVE DATE";
			} else {
				text = "DUE DATE";
			}
			return text;
		},
		
		overdueIconHeader: function (theme) {
			return "images/Warning_" + theme + ".png";
		},
		
		overdueIcon: function (activity_planned_date_to, activity_status, theme) {
			var layout = jQuery.sap.getUriParameters().get("layout");
			if (layout !== "dark") {
				layout = "blue";
			}
			var currentDate = new Date();
			if (activity_planned_date_to < currentDate && (activity_status !== "E0013" || activity_status !== "E0014"))
				return "images/Warning_" + layout + ".png";
		},
		
		activityDate: function (activity_golive_date, activity_planned_date_to, date, activity_create_date) {
			var element = "";
			// Select the date to be displayed
			if (jQuery.sap.getUriParameters().get("disp_date") !== null) {
				var dispDate = jQuery.sap.getUriParameters().get("disp_date").toLowerCase();
			}
			if (activity_golive_date === "") {
				activity_golive_date = "N/A";
			} else {
				activity_golive_date = activity_golive_date;
			}
			// Select the color of the date
			var currentDate = new Date();
			var layout = jQuery.sap.getUriParameters().get("layout");
			if (layout !== null) {
				layout = jQuery.sap.getUriParameters().get("layout").toLowerCase();
			}
			if (dispDate === "gl") {
				if (layout !== "dark") {
					if (date < currentDate && activity_golive_date !== "N/A") {
						element = '<div><span' 
						+ ' title="GoLive Date: ' + activity_golive_date + ' / Due Date (Activity Planned Date To): ' + activity_planned_date_to+ '"'
						+ ' class="Employee_NA">' + activity_golive_date + '<br />' + '</span>' 
						+ ' <span'
						+ ' title="Creation Date: ' + activity_create_date + '"'
						+ ' class="">' + activity_create_date + '</span></div>';
					} else {
						element = '<div><span' 
						+ ' title="GoLive Date: ' + activity_golive_date + ' / Due Date (Activity Planned Date To): ' + activity_planned_date_to+ '"'
						+ ' class="titleText">' + activity_golive_date + '<br />' + '</span>' 
						+ ' <span'
						+ ' title="Creation Date: ' + activity_create_date + '"'
						+ ' class="">' + activity_create_date + '</span></div>';
					}	
				} else {
					element = '<div><span' 
						+ ' title="GoLive Date: ' + activity_golive_date + ' / Due Date (Activity Planned Date To): ' + activity_planned_date_to+ '"'
						+ ' class="titleText">' + activity_golive_date + '<br />' + '</span>' 
						+ ' <span'
						+ ' title="Creation Date: ' + activity_create_date + '"'
						+ ' class="">' + activity_create_date + '</span></div>';
				}
			} else {
				if (layout !== "dark") {
					if (date < currentDate) {
						element = '<div><span' 
							+ ' title="Due Date (Activity Planned Date To): ' + activity_planned_date_to + ' / GoLive Date: ' + activity_golive_date + '"'
							+ ' class="Employee_NA">' + activity_planned_date_to + '<br />' + '</span>' 
							+ ' <span'
							+ ' title="Creation Date: ' + activity_create_date + '"'
							+ ' class="redText">' + activity_create_date + '</span></div>' ;
					} else {
						element = '<div><span' 
							+ ' title="Due Date (Activity Planned Date To): ' + activity_planned_date_to + ' / GoLive Date: ' + activity_golive_date + '"'
							+ ' class="titleText">' + activity_planned_date_to + '<br />' + '</span>' 
							+ ' <span'
							+ ' title="Creation Date: ' + activity_create_date + '"'
							+ ' class="">' + activity_create_date + '</span></div>';	
					}
				} else {
					element = '<div><span' 
						+ ' title="Due Date (Activity Planned Date To): ' + activity_planned_date_to + ' / GoLive Date: ' + activity_golive_date + '"'
						+ ' class="titleText">' + activity_planned_date_to + '<br />' + '</span>' 
						+ ' <span'
						+ ' title="Creation Date: ' + activity_create_date + '"'
						+ ' class="">' + activity_create_date + '</span></div>';
				} 
			}
			// Return the <div> element
			if (element) {
				return element;
			} else {
				return "<span></span>";
			}
		},

		ratingLED: function (activity_rating) {
			if (activity_rating === "R") {
				return "images/RedLed.gif";
			}
			if (activity_rating === "Y") {
				return "images/YellowLed.gif";
			}
			if (activity_rating === "G") {
				return "images/GreenLed.gif";
			}
			return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
		},
		
		ratingLEDTooltip: function (activity_rating) {
			if (activity_rating === "R") {
				return "Rating RED";
			}
			else if (activity_rating === "Y") {
				return "Rating YELLOW";
			}
			else if (activity_rating === "G") {
				return "Rating GREEN";
			}
			else {
				return "No Rating";
			}
			return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
		},
		
		activityPersName: function (activity_person_name) {
			var element;
			var layout = jQuery.sap.getUriParameters().get("layout");
			if (layout !== null) {
				layout = jQuery.sap.getUriParameters().get("layout").toLowerCase();
			}
			if (activity_person_name === "") {
				activity_person_name = "N/A";
				if (layout !== "dark") {
					element = '<div class="Employee_NA">' + activity_person_name + '</div>';
				} else {
					element = '<div class="titleText">' + activity_person_name + '</div>';
				}	
			} else {
				element = '<div class="titleText">' + activity_person_name + '</div>';
			}
			return element;
		},
		
		serviceTeamColHeader: function () {
			if (jQuery.sap.getUriParameters().get("ServiceTeamVisible") !== null) {
				var dispServiceTeam = jQuery.sap.getUriParameters().get("ServiceTeamVisible").toLowerCase();
			}
			if (dispServiceTeam === "true" || dispServiceTeam === "yes") {
				return "SERVICE TEAM";
			} else {
				return "";
			}
		},
		
		serviceTeam: function () {
			if (jQuery.sap.getUriParameters().get("ServiceTeamVisible") !== null) {
				var dispServiceTeam = jQuery.sap.getUriParameters().get("ServiceTeamVisible").toLowerCase();
			}
			if (dispServiceTeam === "true" || dispServiceTeam === "yes") {
				return "12%";
			} else {
				return "0px";
			}
		},
		
		country: function () {
			if (jQuery.sap.getUriParameters().get("disp_MU") !== null) {
				var dispMarketUnit = jQuery.sap.getUriParameters().get("disp_MU").toLowerCase();
			}
			if (dispMarketUnit === "true" || dispMarketUnit === "yes") {
				return "0px";
			} else {
				return "10%";
			}
		},
		
		countryColHeader: function () {
			if (jQuery.sap.getUriParameters().get("disp_MU") !== null) {
				var dispMarketUnit = jQuery.sap.getUriParameters().get("disp_MU").toLowerCase();
			}
			if (dispMarketUnit === "true" || dispMarketUnit === "yes") {
				return "";
			} else {
				return "COUNTRY";
			}
		},
		
		marketUnit: function () {
			if (jQuery.sap.getUriParameters().get("disp_MU") !== null) {
				var dispMarketUnit = jQuery.sap.getUriParameters().get("disp_MU").toLowerCase();
			}
			if (dispMarketUnit === "true" || dispMarketUnit === "yes") {
				return "10%";
			} else {
				return "0px";
			}
		},
		
		marketUnitColHeader: function () {
			if (jQuery.sap.getUriParameters().get("disp_MU") !== null) {
				var dispMarketUnit = jQuery.sap.getUriParameters().get("disp_MU").toLowerCase();
			}
			if (dispMarketUnit === "true" || dispMarketUnit === "yes") {
				return "MARKET UNIT";
			} else {
				return "";
			}
		},
		
		productVersion: function () {
			if (jQuery.sap.getUriParameters().get("pv_test") !== null) {
				var pv = jQuery.sap.getUriParameters().get("pv_test").toLowerCase();
			}
			if (pv === "true" || pv === "yes") {
				return "12%";
			} else {
				return "0px";;
			}
		},
		
		pv: function () {
			if (jQuery.sap.getUriParameters().get("pv_test") !== null) {
				var pv = jQuery.sap.getUriParameters().get("pv_test").toLowerCase();
			}
			if (pv === "true" || pv === "yes") {
				return "PRODUCT VERSION";
			} else {
				return "";
			}
		},
		
		pvID: function () {
			if (jQuery.sap.getUriParameters().get("pv_test") !== null) {
				var pv = jQuery.sap.getUriParameters().get("pv_test").toLowerCase();
			}
			if (pv === "true" || pv === "yes") {
				return "Product Version ID";
			} else {
				return "";
			}
		},
		
		activityLink: function (sourceIC, activity_id, activity_category) {
			var URL = "";
			if (activity_id !== "") {
				if (activity_category === "ZS35" || activity_category === "ZS49") {
					URL = "https://" + sourceIC +
						".wdf.sap.corp/sap(bD1lbiZjPTAwMSZkPW1pbg==)/bc/bsp/sap/crm_ui_start/default.htm?saprole=ZSU_DEFAULT&" +
						"crm-object-type=BT125_TASK&crm-object-action=B&sap-language=EN&crm-object-keyname=OBJECT_ID&crm-object-" + "value=" + activity_id;
				} else {
					URL = "https://" + sourceIC +
						".wdf.sap.corp/sap(bD1lbiZjPTAwMSZkPW1pbg==)/bc/bsp/sap/crm_ui_start/default.htm?saprole=ZSU_DEFAULT&" +
						"crm-object-type=BT126_APPT&crm-object-action=B&sap-language=EN&crm-object-keyname=OBJECT_ID&crm-object-" + "value=" + activity_id;
				}
				return URL;
			}
		},
		
		DelUnitIcon: function(delUnit, theme){
			switch (delUnit) {
	            
	            case '0026494750': // CIM
	            	return "images/delUnit/CIM_" + theme + ".png";
	            	
	            case '167980': // Ariba
	              return "images/delUnit/Ariba_" + theme + "_2.png";
	            
	            case '4829451': // Concur
	              return "images/delUnit/Concur_" + theme + "_2.png";
	            
	            case '3714250': // Crossgate
	              return "images/delUnit/crossgate_" + theme + ".png";
	            
	            case '14081318': // CtrlS
	              return "images/delUnit/CtrlS_" + theme + "_2.png";
	            
	            case '8470002': // Fieldglass
	              return "images/delUnit/Fieldglass_" + theme + "_2.png";
	            
	            case '9548097': // hybris
	              return "images/delUnit/hybris_" + theme + "_2.png";
	            
	            case '10351239': // C4C
	              return "images/delUnit/C4C_" + theme + "_2.png";
	            
	            case '13014776': // ByD
	              return "images/delUnit/ByD_" + theme + "_2.png";
	            
	            case '26954804': // C4P
	              return "images/delUnit/C4P_" + theme + "_2.png";
	            
	            case '1212132': // HEC
	              return "images/delUnit/HEC_" + theme + "_2.png";
	            
	            case '1804051': // SAP IT (ICP, BWP, SAPStore etc.)
	              return "images/delUnit/SAP_" + theme + "_2.png";
	            
	            case '26494752': // CPI ( former HCI )
	              return "images/delUnit/HCPI_" + theme + ".png";
	            
	            case '24688048': // SCP ( former HCI )
	              return "images/delUnit/HCPI_" + theme + ".png";
	              
	            case '23880567': // IBP
	              return "images/delUnit/IBP_" + theme + "_2.png";
	              
	            case '14215381': // S/4 Hana
	              return "images/delUnit/S4_" + theme + "_2.png";
	              
	            case '167698': // SuccessFactors
	              return "images/delUnit/SF_" + theme + ".png";
	             
	            case '12078858': // Amazon Web Services
	              return "images/delUnit/AWS_" + theme + "_2.png"; 
	              
	            case '1092494': // BCX
	              return "images/delUnit/BCX_" + theme + ".png";
	              
	            case '22187741': // CenturyLink
	              return "images/delUnit/Century_" + theme + "_2.png";
	              
	    		case '26226182': // DCX
	              return "images/delUnit/DCX_" + theme + ".png";  
	              
	            case '22846399': // HP
	              return "images/delUnit/HP_" + theme + "_2.png";
	              
	            case '21094140': // IBM
	              return "images/delUnit/IBM_" + theme + "_2.png";
	              
	            case '8604698': // Injazat
	              return "images/delUnit/Inja_" + theme + "_2.png";
	              
	            case '17958862': // NTT
	              return "images/delUnit/NTT_" + theme + "_2.png";
	              
	            case '7254653': // Samsung
	              return "images/delUnit/Samsung_" + theme + ".png";  
	              
	            case '1092747': // T-System
	              return "images/delUnit/T-systems_" + theme + ".png";
	            
	            case '2135872': // TIVIT
	              return "images/delUnit/TIVIT_" + theme + ".png";
	            
	            case '11585500': // Virtustream
	              return "images/delUnit/Virtustream_" + theme + ".png";
	            
	            case '16755384': // Obsolete
	            	return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
	            
	            case '':
	              return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
	            
	            default:
	              return "images/delUnit/empty_2.png";
	          }
		},
		
		DelUnitText: function (delivery_unit) {
			switch (delivery_unit) {
				case '0026494750': // CIM
					return "Cloud Identity Management";
				case '167980': // Ariba
					return "Ariba";
				case '4829451': // Concur
					return "Concur";
				case '3714250': // Crossgate
					return "Crossgate";
				case '14081318': // CtrlS
					return "CtrlS";
				case '8470002': // Fieldglass
					return "Fieldglass";
				case '9548097': // hybris
					return "Hybris";
				case '10351239': // C4C
					return "C4C";
				case '13014776': // ByD
					return "ByD";
				case '15453147': // C4TE
					return "C4TE";
				case '26954804': // Cloud for Analytics
					return "C4A";	
				case '1212132': // HEC
					return "HEC";
				case '1804051': // SAP IT (ICP, BWP, SAPStore etc.)
					return "SAP IT";
				case '26494752': // CPI ( former HCI )
					return "CPI";	
				case '24688048': // SCP ( former HCI )
					return "SCP";
				case '23880567': // IBP
					return "IBP";
				case '26009812': // Event Ticketing
					return "EVT";	
				case '18994393': // SPORTS1
					return "SPORTS1";	
				case '26494750': // Cloud Identity Management
					return "CIMgt";	
				case '14215381': // S/4 HANA Cloud Edition
					return "S/4HANA CE";
				case '167698': // SuccessFactors
					return "Success Factors";
				case '12078858': // AWS
					return "AWS";
				case '1092494': // BCX
					return "BCX";
				case '22187741': // CenturyLink
					return "CenturyLink";
				case '26226182': // DCX
					return "DCX";	
				case '22846399': // HP
					return "HP";
				case '21094140': // IBM
					return "IBM";
				case '8604698': // Injazat
					return "Injazat";
				case '17958862': // NTT
					return "NTT";
				case '7254653': // Samsung
					return "Samsung";
				case '1092747': // T-System
					return "T-Systems";
				case '2135872': // TIVIT
					return "TIVIT";	
				case '11585500': // Virtustream
					return "Virtustream";
				case '16755384': // Obsolete
		            return "";
				case '':
					return "";
				default:
					return "Delivery Unit: " + delivery_unit + " - Please check KBA 2243369 for further details.";
			}
		}	
	};
});