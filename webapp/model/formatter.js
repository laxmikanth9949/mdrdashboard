sap.ui.define([], function () {
	"use strict";
	return {

		dashboardAnalyzerHeader: function () {
			var element = true;
			return element;
		},
		
		noData: function (data) {
			var element = "";
			if (data.length > 0) {
				element = "";
			} else {
				element = "No data";
			}
			return element;
		},
		
		product: function (prodDesc, prodVers, product, prodLine, prodCat) {
			var tooltip = "";
			if (product === "" || product === undefined || product === null) {
				tooltip = "Product: " + prodDesc;
			} else {
				tooltip = "Product Version: " + prodVers + "\n"
						+ "Product: " + product + "\n"
						+ "Product Line: " + prodLine + "\n"
						+ "Product Category: " + prodCat;
			}	
			return tooltip;
		},
		
		colorValue: function (ratingText){
			var sHeight = " style='height:"+(this._iRowHeight-1)+"px'";
			if(this.oUIModel.getProperty("/viewCard")){
				sHeight = "";
			}
			if(ratingText === "Red"){
				return '<div title="Rating: Red" class="colorIndicator redIndicator"'+sHeight+'></div>';
			}
			if(ratingText === "Green"){
				return '<div title="Rating: Green" class="colorIndicator greenIndicator"'+sHeight+'></div>';
			}
			if(ratingText === "Yellow"){
				return '<div title="Rating: Yellow" class="colorIndicator yellowIndicator"'+sHeight+'></div>';
			}
			return '<div class="colorIndicator"'+sHeight+'></div>';
		},

		statusCardBottom: function (status,layout) {
			var element = "";
			if (status === "New") {
				if (layout !== "dark") {
					element = "statusNew";
				} else {
					element = "statusNewDark";
				}
			} else {
				if (layout !== "dark") {
					element = "statusBright";
				} else {
					element = "statusDark";
				}
			}
			return element;
		},

		dateHeader: function() {
			var header = "";
			var dateType = jQuery.sap.getUriParameters().get("disp_date");
			if (dateType === "gl") {
				header = "GO LIVE";
			} else if (dateType === "cr") {
				header = "CREATED AT";
			} else {
				header = "LAST CHANGED";
			}
			return header;
		},

		displayDate: function (golive, lastchange, created_at, layout) {
			var element;
			var dateType = jQuery.sap.getUriParameters().get("disp_date");
			if (dateType === "gl") {
				if (layout === "dark") {
					element = '<span class="titleText" '
						+ 'title="GoLive Date: ' + golive + ' / Last Change Date: '	+ lastchange + ' / Creation Date: ' + created_at +  '">'
						+ '<span class="whiteNumber"' + '">' + golive + '</span>'
						+ '</span>';
				} else {
					if (golive === "N/A") {
						element = '<span class="titleText" '
							+ 'title="GoLive Date: ' + golive + ' / Last Change Date: '	+ lastchange + ' / Creation Date: ' + created_at + '">'
							+ '<span class="blueNumber"' + '">' + golive + '</span>'
							+ '</span>';
					} else {
						element = '<span class="titleText" '
							+ 'title="GoLive Date: ' + golive + ' / Last Change Date: '	+ lastchange + ' / Creation Date: ' + created_at + '">'
							+ '<span class="blackNumber"' + '">' + golive + '</span>'
							+ '</span>';
					}
				}
			} else if (dateType === "cr") {
				element = '<span class="titleText" '
						+ 'title="Creation Date: ' + created_at + ' / Last Change Date: ' + lastchange + ' / GoLive Date: ' + golive +  '">'
						+ '<span class="titleText"' + '">' + created_at + '</span>'
						+ '</span>';
			} else {
				element = '<span class="titleText" '
						+ 'title="Last Change Date: ' + lastchange + ' / Creation Date: ' + created_at + ' / GoLive Date: ' + golive +  '">'
						+ '<span class="titleText"' + '">' + lastchange + '</span>'
						+ '</span>';
			}
			return element;
		},

		displayDateCV: function (golive, lastchange, created_at, layout) {
			var element;
			var dateType = jQuery.sap.getUriParameters().get("disp_date");
			if (dateType === "gl") {
				if (layout === "dark") {
					if (golive === "N/A") {
						element = '<span class="titleText" '
							+ 'title="GoLive Date: ' + golive + ' / Last Change Date: '	+ lastchange + ' / Creation Date: ' + created_at + '">'
							+ '<span class="whiteNumber"' + '">' + golive + '</span>'
							+ '</span>';
					} else {
						element = '<span class="titleText" '
							+ 'title="GoLive Date: ' + golive + ' / Last Change Date: '	+ lastchange + ' / Creation Date: ' + created_at + '">'
							+ '<span class="blackNumber"' + '">' + golive + '</span>'
							+ '</span>';
					}
				} else {
					if (golive === "N/A") {
						element = '<span class="titleText" '
							+ 'title="GoLive Date: ' + golive + ' / Last Change Date: '	+ lastchange + ' / Creation Date: ' + created_at + '">'
							+ '<span class="blueNumber"' + '">' + golive + '</span>'
							+ '</span>';
					} else {
						element = '<span class="titleText" '
							+ 'title="GoLive Date: ' + golive + ' / Last Change Date: '	+ lastchange + ' / Creation Date: ' + created_at + '">'
							+ '<span class="blackNumber"' + '">' + golive + '</span>'
							+ '</span>';
					}
				}
			} else if (dateType === "cr") {
				element = '<span class="titleText" '
						+ 'title="Creation Date: ' + created_at + ' / Last Change Date: ' + lastchange + ' / GoLive Date: ' + golive +  '">'
						+ '<span class="titleText"' + '">' + created_at + '</span>'
						+ '</span>';
			} else {
				element = '<span class="titleText" '
						+ 'title="Last Change Date: ' + lastchange + ' / Creation Date: ' + created_at + ' / GoLive Date: ' + golive +  '">'
						+ '<span class="titleText"' + '">' + lastchange + '</span>'
						+ '</span>';
			}
			return element;
		},

		statusPhaseHeader: function (dispPhase) {
			var header = "";
			if (dispPhase !== true) {
				header = "STATUS";
			} else {
				header = "PROJECT PHASE";
			}
			return header;
		},

		statusPhaseTooltip: function (dispPhase, status, phase) {
			var tooltip = "";
			if (dispPhase !== true) {
				tooltip = "Status: " + status + " - Project Phase: " + phase;
			} else {
				tooltip = "Project Phase: " + phase + " - Status: " + status;
			}
			return tooltip;
		},

		statusPhase: function (dispPhase, status, phase, layout) {
			if (phase === "") {
				phase = "N/A";
			}
			var element = "";
				if (dispPhase === true) {
					// Display phase
					if (layout !== "dark") {
						// Blue layout
						element = '<div class="titleText" '
							+ 'title="Project Phase: ' 
							+ phase + ' - Status: '	+ status	+ '">'
							+ '<span class="blackNumber"' + '">' + phase + '</span>'
							+ '</div>';
					} else {
						// --> Dark layout
						element = '<div class="titleText" '
							+ 'title="Project Phase: ' + phase + ' - Status: '	+ status	+ '">'
							+ '<span class="whiteNumber"' + '">' + phase + '</span>'
							+ '</div>';
					}
				} else {
					// Display status
					if (layout !== "dark") {
						// Blue layout
							if (status === "New") {
								// Display in blue
								element = '<span class="titleText" '
									+ 'title="Status: ' + status + ' - Project Phase: '	+ phase	+ '">'
									+ '<span class="blueNumber"' + '">' + status + '</span>'
									+ '</span>';
							} else {
								// All other status in black
								element = '<div class="titleText" '
									+ 'title="Status: ' + status + ' - Project Phase: '	+ phase	+ '">'
									+ '<span class="titleText"' + '">' + status + '</span>'
									+ '</div>';
							}
					} else {
						// Dark layout
						if (status === "New") {
							// Display in blue
							element = '<span class="titleText" '
								+ 'title="Status: ' + status + ' - Project Phase: '	+ phase	+ '">'
								+ '<span class="whiteNumber"' + '">' + status + '</span>'
								+ '</span>';
						} else {
							// Display in white
							element = '<div class="titleText" '
								+ 'title="Status: ' + status + ' - Project Phase: '	+ phase	+ '">'
								+ '<span class="whiteNumber"' + '">' + status + '</span>'
								+ '</div>';
						}
					}
				}
			return element;
		},

		statusPhaseCardview: function (dispPhase, status, phase, layout) {
			if (phase === "") {
				phase = "N/A";
			}
			var element = "";
				if (dispPhase === true) {
					// Display phase
					if (layout !== "dark") {
						// Blue layout
						element = '<div class="titleText" style="white-space: nowrap" '
							+ 'title="Project Phase: ' + phase + ' - Status: '	+ status	+ '">'
							+ '<span class="blackNumber"' + '">' + phase + '</span>'
							+ '</div>';
					} else {
						// --> Dark layout
						element = '<div class="titleText" style="white-space: nowrap" '
							+ 'title="Project Phase: ' + phase + ' - Status: '	+ status	+ '">'
							+ '<span class="blackNumber"' + '">' + phase + '</span>'
							+ '</div>';
					}
				} else {
					// Display status
					if (layout !== "dark") {
						// Blue layout
							if (status === "New") {
								// Display in blue
								element = '<span class="titleText" style="white-space: nowrap" '
									+ 'title="Status: ' + status + ' - Project Phase: '	+ phase	+ '">'
									+ '<span class="blueNumber"' + '">' + status + '</span>'
									+ '</span>';
							} else {
								// All other status in black
								element = '<div class="titleText" style="white-space: nowrap" '
									+ 'title="Status: ' + status + ' - Project Phase: '	+ phase	+ '">'
									+ '<span class="titleText"' + '">' + status + '</span>'
									+ '</div>';
							}
					} else {
						// Dark layout
						if (status === "New") {
							// Display in white
							element = '<div class="titleText" style="white-space: nowrap"" '
								+ 'title="Status: ' + status + ' - Project Phase: '	+ phase	+ '">'
								+ '<span class="whiteNumber"' + '">' + status + '</span>'
								+ '</div>';
						} else {
							// All other stati in black
							element = '<div class="titleText" style="white-space: nowrap" '
								+ 'title="Status: ' + status + ' - Project Phase: '	+ phase	+ '">'
								+ '<span class="blackNumber"' + '">' + status + '</span>'
								+ '</div>';
						}
					}
				}
			return element;
		},

		topIssueHeader: function (showTopIssues) {
			var header= "";
			if (showTopIssues !== true) {
				header = "Activities";
			} else {
				header = "TopIssues / Activities";
			}
			return header;
		},

		/*
		topIssuesAndActivities: function (topNumber, rating, activity, caseID, url, caseActivities, bShowTopIssues, layout){
			if (caseID === null) {
				return;
			}
			var filter = "";
			// Top Issue Color and Mouse-Over
			var sClass = "";
			var sClassA = "";
			var sLeveText = "";
			if (rating === "A") {
				sClass = "greenNumber";
				sLeveText = " (Highest Rating: GREEN)";
			}
			if (rating === "B") {
				sClass = "yellowNumber";
				sLeveText = " (Highest Rating: YELLOW)";
			}
			if (rating === "C") {
				sClass = "redNumber";
				sLeveText = " (Highest Rating: RED)";
			}
			if (rating !== 'A' && rating !== 'B' && rating !== 'C') {
				if (layout !== "dark") {
					sClass = "whiteNumber";
				} else {
					sClass = "blackNumber";
				}
			}
			if (!rating && topNumber != "0") {
				if (layout !== "dark") {
					sClass = "blackNumber";
				} else {
					sClass = "whiteNumber";
				}
				sLeveText = " (No Rating found)";
			}
			if (topNumber == "0") {
				if (layout !== "dark") {
					sClass = "blackNumber";
				} else {
					sClass = "whiteNumber";
				}
			}
			// Activities
			if (layout !== "dark") {
				sClassA = "blackNumber";
			} else {
				sClassA = "whiteNumber";
			}
			// URLs
			var URLMDR2 = "";
			var URLMDR3 = "";
			if (url != null) {
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
				// Create filter for MDR2
				if (activity > 0 && caseActivities !== null && caseActivities !== undefined) {
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
				// URL to MDR3
				URLMDR3 = urlStart 
					+ "&filter=case_id eq '" + caseID + "'"
					+ " and process_type eq 'ZS34'"
					+ " and (status_code eq 'Z1' or status_code eq 'Z2' or status_code eq 'Z7'"
					+ " or status_code eq 'Z8' or status_code eq 'Z5' or status_code eq 'Z6')"
				//	+ " or status_code eq 'Z9' or status_code eq 'Z10')" // Only for ZS50
					+ "&title=Top Issues for Case " + caseID 
					+ refreshInterval
					+ layout
					+ maskData
					+ "#/MDR3";
			}
			// Create HTML Element
			if (bShowTopIssues) {
				if (topNumber > 0) {
					if (activity > 0) {
						// Top issues and open activities
						return '<span'
							+ 'class="topNumber" title="Number of (open) Top Issues: ' + topNumber + sLeveText
							+ ' \r\n'
							+ 'Click here opens List of Top Issues for Case ' + caseID + '">'
							+ '<span>' + '<a class="' + sClass + '"' + 'href="' + URLMDR3 + '" target="_blank">' + topNumber + '</a>' + '</span> / '
							+ '<span>' + '<a class="' + sClassA + '" title="Number of open Activities related to this Case: ' + activity 
							+ ' \r\n' + 'Click here opens List of open Activities for Case ' + caseID	                    	
	                    	+'" href="' + URLMDR2 + '" target="_blank">' + activity + '</a>' + '</span>';
					} else {
						// Top issues, but no open activities
						return '<span'
							+ 'class="topNumber" title="Number of (open) Top Issues: ' + topNumber + sLeveText 
							+ ' \r\n' + 'Click here opens List of Top Issues for Case ' + caseID + '">'
							+ '<span>' + '<a class="' + sClass + '"' + 'href="' + URLMDR3 + '" target="_blank">' + topNumber + '</a>' + '</span> / '
							+ '<span class="' + sClassA + '" title="Number of open Activities related to this Case: ' + activity 
							+ '">' + activity + '</span>' + '</span>';
					}	
				} else {
					if (activity > 0) {
						// No top issues, but open activities
						return '<span class="topNumber" title="Number of (open) Top Issues: '
	    	                + topNumber + sLeveText + '"><span class="' + sClass + '">' + topNumber	+ '</span> / '
	                    	+ '<span>' + '<a class="' + sClassA + '" title="Number of open Activities related to this Case: ' + activity 
							+ ' \r\n' + 'Click here opens List of open Activities for Case ' + caseID	                    	
	                    	+'" href="' + URLMDR2 + '" target="_blank">' + activity + '</a>' + '</span>';
					} else {
						// No top issues, no open activities
						return '<span class="topNumber" title="Number of (open) Top Issues: '
	    	                + topNumber + sLeveText + '"><span class="' + sClass + '">' + topNumber	+ '</span> / '
	                    	+ '<span>' + '<a class="' + sClassA + '" title="Number of open Activities related to this Case: ' + activity 
							+ '">' + activity + '</a>' + '</span>';
					}	
				}
			} else {
				return '<span class="' + sClassA + '" title="Number of open activities related to this case: ' + activity + '">' + activity + '</span>';
			}
		},
		*/

		topIssueColor: function (topNumber, rating, activity, caseID, url, bShowTopIssues, layout){
			// Top Issue Color and Mouse-Over
			var sClass = "";
			var sClassA = "";
			var sLeveText = "";
			if (rating === "A") {
				sClass = "greenNumber";
				sLeveText = " (Highest Rating: GREEN)";
			}
			if (rating === "B") {
				sClass = "yellowNumber";
				sLeveText = " (Highest Rating: YELLOW)";
			}
			if (rating === "C") {
				sClass = "redNumber";
				sLeveText = " (Highest Rating: RED)";
			}
			if (rating !== 'A' && rating !== 'B' && rating !== 'C') {
				if (layout !== "dark") {
					sClass = "whiteNumber";
				} else {
					sClass = "blackNumber";
				}
			}
			if (!rating && topNumber != "0") {
				if (layout !== "dark") {
					sClass = "blackNumber";
				} else {
					sClass = "whiteNumber";
				}
				sLeveText = " (No Rating found)";
			}
			if (topNumber == "0") {
				if (layout !== "dark") {
					sClass = "blackNumber";
				} else {
					sClass = "whiteNumber";
				}
			}
			// Activities
			if (activity > 0) {
				if (layout !== "dark") {
					sClassA = "blackNumberUnderlined";
				} else {
					sClassA = "whiteNumberUnderlined";
				}
			} else {
				if (layout !== "dark") {
					sClassA = "blackNumber";
				} else {
					sClassA = "whiteNumber";
			}
			}
			// URL to MDR3
			if (url != null) {
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
				var URL = urlStart 
					+ "&filter=case_id eq '" + caseID + "'"
					+ " and process_type eq 'ZS34'"
					+ " and (status_code eq 'Z1' or status_code eq 'Z2' or status_code eq 'Z7'"
					+ " or status_code eq 'Z8' or status_code eq 'Z5' or status_code eq 'Z6')"
					+ "&title=Top Issues for Case " + caseID 
					+ refreshInterval
					+ layout
					+ maskData
					+ "#/MDR3";
			}
			// Create HTML Element
			if (bShowTopIssues) {
				if (topNumber > 0) {
					return '<span'
						+ 'class="topNumber" title="Number of (open) Top Issues: ' + topNumber + sLeveText + ' / ' + 'Number of Activities: ' + activity
						+ ' \r\n'
						+ 'Click here opens List of Top Issues for Case ' + caseID + '">'
						+ '<span>' + '<a class="' + sClass + '"' +'href="' + URL + '" target="_blank">' + topNumber + '</a>' + '</span> / '
						+ '<span class="' + sClassA + '">' + activity + '</span>'
                    	+ '</span>';
				} else {
					return '<span class="topNumber" title="Number of (open) Top Issues: '
    	                + topNumber + sLeveText
        	            + ' / '
            	        + 'Number of Activities: '
                	    + activity + '"><span class="'
                    	+ sClass + '">' + topNumber
                    	+ '</span> / '
                    	+ '<span class="' + sClassA + '">' + activity + '</span>'
                    	+ '</span>';
				}
			} else {
				return '<span class="' + sClassA + '" title="Number of open activities related to this case: ' + activity + '">' + activity + '</span>';
			}
		},

		/*
		topIssuesAndActivitiesCardview: function (topNumber, rating, activity, caseID, url, caseActivities, bp, bShowTopIssues, layout){
			var filter = "";
			// Top Issue Color and Mouse-Over
			var sClass = "";
			var sClassA = "";
			var sLeveText = "";
			if (rating === "A") {
				sClass = "greenNumber";
				sLeveText = " (Highest Rating: GREEN)";
			}
			if (rating === "B") {
				sClass = "yellowNumber";
				sLeveText = " (Highest Rating: YELLOW)";
			}
			if (rating === "C") {
				sClass = "redNumber";
				sLeveText = " (Highest Rating: RED)";
			}
			if (rating !== 'A' && rating !== 'B' && rating !== 'C') {
				sClass = "blackNumber";
			}
			if (!rating && topNumber != "0") {
				sClass = "blackNumber";
				sLeveText = " (No Rating found)";
			}
			if (topNumber == "0") {
				sClass = "blackNumber";
			}
			// Activities
			sClassA = "blackNumber";
			// URL to MDR3
			if (url != null) {
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
				// Create filter for MDR2
				if (activity > 0 && caseActivities !== null && caseActivities !== undefined) {
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
				var URLMDR2 = "";
				var URLMDR3 = "";
				// URL to MDR 2
				URLMDR2 = urlStart
					+ "&filter=" + filter
					+ "&title=Open ZS46 Activities for Case " + caseID 
					+ refreshInterval
					+ layout
					+ maskData
					+ "#/MDR2";
				// URL to MDR3
				URLMDR3 = urlStart 
					+ "&filter=case_id eq '" + caseID + "'"
					+ " and process_type eq 'ZS34'"
					+ " and (status_code eq 'Z1' or status_code eq 'Z2' or status_code eq 'Z7'"
					+ " or status_code eq 'Z8' or status_code eq 'Z5' or status_code eq 'Z6')"
				//	+ " or status_code eq 'Z9' or status_code eq 'Z10')" // Only for ZS50
					+ "&title=Top Issues for Case " + caseID 
					+ refreshInterval
					+ layout
					+ maskData
					+ "#/MDR3";
			}
			// Create HTML Element
			if (bShowTopIssues) {
				if (topNumber > 0) {
					if (activity > 0) {
						// Top issues and open activities
						return '<span'
							+ 'class="topNumber" title="Number of (open) Top Issues: ' + topNumber + sLeveText
							+ ' \r\n'
							+ 'Click here opens List of Top Issues for Case ' + caseID + '">'
							+ '<span>' + '<a class="' + sClass + '"' + 'href="' + URLMDR3 + '" target="_blank">' + topNumber + '</a>' + '</span> / '
							+ '<span>' + '<a class="' + sClassA + '" title="Number of open Activities related to this Case: ' + activity 
							+ ' \r\n' + 'Click here opens List of open Activities for Case ' + caseID	                    	
	                    	+'" href="' + URLMDR2 + '" target="_blank">' + activity + '</a>' + '</span>';
					} else {
						// Top issues, but no open activities
						return '<span'
							+ 'class="topNumber" title="Number of (open) Top Issues: ' + topNumber + sLeveText 
							+ ' \r\n' + 'Click here opens List of Top Issues for Case ' + caseID + '">'
							+ '<span>' + '<a class="' + sClass + '"' + 'href="' + URLMDR3 + '" target="_blank">' + topNumber + '</a>' + '</span> / '
							+ '<span class="' + sClassA + '" title="Number of open Activities related to this Case: ' + activity 
							+ '">' + activity + '</span>' + '</span>';
					}	
				} else {
					if (activity > 0) {
						// No top issues, but open activities
						return '<span class="topNumber" title="Number of (open) Top Issues: '
	    	                + topNumber + sLeveText + '"><span class="' + sClass + '">' + topNumber	+ '</span> / '
	                    	+ '<span>' + '<a class="' + sClassA + '" title="Number of open Activities related to this Case: ' + activity 
							+ ' \r\n' + 'Click here opens List of open Activities for Case ' + caseID	                    	
	                    	+'" href="' + URLMDR2 + '" target="_blank">' + activity + '</a>' + '</span>';
					} else {
						// No top issues, no open activities
						return '<span class="topNumber" title="Number of (open) Top Issues: '
	    	                + topNumber + sLeveText + '"><span class="' + sClass + '">' + topNumber	+ '</span> / '
	                    	+ '<span>' + '<a class="' + sClassA + '" title="Number of open Activities related to this Case: ' + activity 
							+ '">' + activity + '</a>' + '</span>';
					}	
				}
			} else {
				return '<span class="' + sClassA + '" title="Number of open activities related to this case: ' + activity + '">' + activity + '</span>';
			}
		},
		*/
		
		topIssueColorCardview: function (topNumber, rating, activity, caseID, url, bShowTopIssues, layout){
			// Top Issue Color and Mouse-Over
			var sClass = "";
			var sClassA = "";
			var sLeveText = "";
			if (rating === "A") {
				sClass = "greenNumber";
				sLeveText = " (Highest Rating: GREEN)";
			}
			if (rating === "B") {
				sClass = "yellowNumber";
				sLeveText = " (Highest Rating: YELLOW)";
			}
			if (rating === "C") {
				sClass = "redNumber";
				sLeveText = " (Highest Rating: RED)";
			}
			if (rating !== 'A' && rating !== 'B' && rating !== 'C') {
				sClass = "blackNumber";
			}
			if (!rating && topNumber != "0") {
				sClass = "blackNumber";
				sLeveText = " (No Rating found)";
			}
			if (topNumber == "0") {
				sClass = "blackNumber";
			}
			// Activities
			if (activity > 0) {
				sClassA = "blackNumberUnderlined";
			} else {
				sClassA = "blackNumber";
			}
			// URL to MDR3
			if (url != null) {
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
				var URL = urlStart 
							+ "&filter=case_id eq '" + caseID + "'"
							+ " and process_type eq 'ZS34'"
							+ " and (status_code eq 'Z1' or status_code eq 'Z2' or status_code eq 'Z7'"
							+ " or status_code eq 'Z8' or status_code eq 'Z5' or status_code eq 'Z6')"
							+ "&title=Top Issues for Case " + caseID 
							+ refreshInterval
							+ layout
							+ maskData
							+ "#/MDR3";
			}
			// Create HTML Element
			if (bShowTopIssues) {
				if (topNumber > 0) {
					return '<span'
						+ 'class="topNumber" title="Number of (open) Top Issues: ' + topNumber + sLeveText + ' / ' + 'Number of Activities: ' + activity
						+ ' \r\n'
						+ 'Click here opens List of Top Issues for Case ' + caseID + '">'
						+ '<span>' + '<a class="' + sClass + '"' +'href="' + URL + '" target="_blank">' + topNumber + '</a>' + '</span> / '
						+ '<span class="' + sClassA + '">' + activity + '</span>'
                    	+ '</span>';
				} else {
					return '<span class="topNumber" title="Number of (open) Top Issues: '
    	                + topNumber + sLeveText
        	            + ' / '
            	        + 'Number of Activities: '
                	    + activity + '"><span class="'
                    	+ sClass + '">' + topNumber
                    	+ '</span> / '
                    	+ '<span class="' + sClassA + '">' + activity + '</span>'
                    	+ '</span>';
				}
			} else {
				return '<span class="' + sClassA + '" title="Number of open activities related to this case: ' + activity + '">' + activity + '</span>';
			}
		},		

		titleMarquee:function (title, run){
			var url = window.location.href;
			var pos1 = url.search("MDR6");
			var pos2 = url.search("MDR6A");
			var pos3 = url.search("MDR7");
			var pos4 = url.search("MDR8");
			var pos5 = url.search("MDR10");
			var title = jQuery.sap.getUriParameters().get("title");
			if (jQuery.sap.getUriParameters().get("title") === null) {
				if (pos1 > 0) {
					title = "MDR6 - Q-Gates";
				} else if (pos2 > 0) {
					title = "MDR6A - Q-Gate List";
				} else if (pos3 > 0) {
					title = "MDR7 - Cases";
				} else if (pos4 > 0) {
					title = "MDR8 - Case Map";
				} else if (pos5 > 0) {
					title = "MDR10 - Case Hierarchy";
				} else {
					title = "Cases";
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

		caseLink: function (sourceIC, caseId){
			return ["https://",
			sourceIC,
			".wdf.sap.corp/sap/bc/bsp/sap/crm_ui_start/default.htm?saprole=ZSU_DEFAULT&crm-object-type=CRM_CMG&crm-object-action=B&sap-language=EN&crm-object-keyname=EXT_KEY&crm-object-value=",
			caseId].join("");
		},

		customerNameFormatter: function (name, sMasked){
			if(sMasked === "YES" && name && name.length > 1){
				return name.substr(0,2) + "********";
			}
			return name;
		},

		caseTitleFormatter: function (title, sMasked){
			if(sMasked === "YES"){
				return "********";
			}
			return title;
		},

		personNameHeader: function (bProcessor) {
			var personNameHeader;
			if (bProcessor === "proc") {
				personNameHeader = "Processor";
			} else {
				personNameHeader = "Employee Responsible";
			}
			return personNameHeader;
		},

		personName: function (bProcessor, processor, responsible){
			var personName;
			if (bProcessor === "proc") {
				personName = processor;
			} else {
				personName = responsible;
			}
			if (personName) {
	        	return personName;
			} else {
				return " ";
			}
		},

		personNameTooltip: function (bProcessor, processor, responsible){
			if (bProcessor === "proc") {
				return ["Processor: ", processor ? processor : " ", " / Empl. Resp.: ", responsible ? responsible : " "].join("");
			} else{
				return ["Empl. Resp.: ", responsible ? responsible : " " , " / Processor: ", processor ? processor : " "].join("");
			}
		},

		nameText: function (name){
			if (name) {
	        	return name;
			} else {
				return " ";
			}
		},

		nameTitle: function (processor, responsible){
			var sProcessorName = processor ? processor : "";
			var sResponsibleName = responsible ? responsible : "";
			return ["Processor: ", sProcessorName," / Empl. Resp.: ", sResponsibleName].join("");
		},

		stringTime: function (sdate){
			if(sdate){
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
			    return formattedDate;
			}
			return "";
		},

		getFullDateFormat: function (date) {
			if (date !== null && date !== "N/A") {
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
			return "N/A";
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
		
		MCCTagColHeader: function () {
			if (jQuery.sap.getUriParameters().get("ServiceTeamVisible") !== null) {
				var dispServiceTeam = jQuery.sap.getUriParameters().get("ServiceTeamVisible").toLowerCase();
			}
			if (dispServiceTeam === "true" || dispServiceTeam === "yes") {
				return "MCC Tags";
			} else {
				return "";
			}
		},
		
		customerTypeColHeader: function () {
			if (jQuery.sap.getUriParameters().get("ServiceTeamVisible") !== null) {
				var dispServiceTeam = jQuery.sap.getUriParameters().get("ServiceTeamVisible").toLowerCase();
			}
			if (dispServiceTeam === "true" || dispServiceTeam === "yes") {
				return "Customer Type";
			} else {
				return "";
			}
		},
		
		serviceTeam: function () {
			if (jQuery.sap.getUriParameters().get("ServiceTeamVisible") !== null) {
				var dispServiceTeam = jQuery.sap.getUriParameters().get("ServiceTeamVisible").toLowerCase();
			}
			if (dispServiceTeam === "true" || dispServiceTeam === "yes") {
			//	return "12%";
				return "18%";
			} else {
				return "0px";
			}
		},

		DelUnitIcon: function (delUnit, theme){
			switch (delUnit) {
	            
	            case '0026494750': // CIM
	            	return "images/delUnit/CIM_" + theme + ".png";
	            
	            case '0000167980': // Ariba
	              return "images/delUnit/Ariba_" + theme + "_2.png";
	            
	            case '0004829451': // Concur
	              return "images/delUnit/Concur_" + theme + "_2.png";
	            
	            case '0003714250': // Crossgate
	              return "images/delUnit/crossgate_" + theme + ".png";
	            
	            case '0014081318': // CtrlS
	              return "images/delUnit/CtrlS_" + theme + "_2.png";
	            
	            case '0008470002': // Fieldglass
	              return "images/delUnit/Fieldglass_" + theme + "_2.png";
	            
	            case '0009548097': // hybris
	              return "images/delUnit/hybris_" + theme + "_2.png";
	            
	            case '0010351239': // C4C
	              return "images/delUnit/C4C_" + theme + "_2.png";
	            
	            case '0013014776': // ByD
	              return "images/delUnit/ByD_" + theme + "_2.png";
	            
	            case '0026954804': // C4P
	              return "images/delUnit/C4P_" + theme + "_2.png";
	            
	            case '0001212132': // HEC
	              return "images/delUnit/HEC_" + theme + "_2.png";
	            
	            case '0001804051': // SAP IT (ICP, BWP, SAPStore etc.)
	              return "images/delUnit/SAP_" + theme + "_2.png";
	            
	            case '0026494752': // CPI ( former HCI )
	              return "images/delUnit/HCPI_" + theme + ".png";
	            
	            case '0024688048': // SCP ( former HCI )
	              return "images/delUnit/HCPI_" + theme + ".png";
	              
	            case '0023880567': // IBP
	              return "images/delUnit/IBP_" + theme + "_2.png";
	              
	            case '0014215381': // S/4 Hana
	              return "images/delUnit/S4_" + theme + "_2.png";
	              
	            case '0000167698': // SuccessFactors
	              return "images/delUnit/SF_" + theme + ".png";
	             
	            case '0012078858': // Amazon Web Services
	              return "images/delUnit/AWS_" + theme + "_2.png"; 
	              
	            case '0001092494': // BCX
	              return "images/delUnit/BCX_" + theme + ".png";
	              
	            case '0022187741': // CenturyLink
	              return "images/delUnit/Century_" + theme + "_2.png";
	              
	    		case '0026226182': // DCX
	              return "images/delUnit/DCX_" + theme + ".png";  
	              
	            case '0022846399': // HP
	              return "images/delUnit/HP_" + theme + "_2.png";
	              
	            case '0021094140': // IBM
	              return "images/delUnit/IBM_" + theme + "_2.png";
	              
	            case '0008604698': // Injazat
	              return "images/delUnit/Inja_" + theme + "_2.png";
	              
	            case '0017958862': // NTT
	              return "images/delUnit/NTT_" + theme + "_2.png";
	              
	            case '0007254653': // Samsung
	              return "images/delUnit/Samsung_" + theme + ".png";  
	              
	            case '0001092747': // T-System
	              return "images/delUnit/T-systems_" + theme + ".png";
	            
	            case '0002135872': // TIVIT
	              return "images/delUnit/TIVIT_" + theme + ".png";
	            
	            case '0011585500': // Virtustream
	              return "images/delUnit/Virtustream_" + theme + ".png";
	            
	            case '0016755384': // Obsolete
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
				case '0000167980': // Ariba
					return "Ariba";
				case '0004829451': // Concur
					return "Concur";
				case '0003714250': // Crossgate
					return "Crossgate";
				case '0014081318': // CtrlS
					return "CtrlS";
				case '0008470002': // Fieldglass
					return "Fieldglass";
				case '0009548097': // hybris
					return "Hybris";
				case '0010351239': // C4C
					return "C4C";
				case '0013014776': // ByD
					return "ByD";
				case '0015453147': // C4TE
					return "C4TE";
				case '0026954804': // Cloud for Analytics
					return "C4A";	
				case '0001212132': // HEC
					return "HEC";
				case '0001804051': // SAP IT (ICP, BWP, SAPStore etc.)
					return "SAP IT";
				case '0026494752': // CPI ( former HCI )
					return "CPI";	
				case '0024688048': // SCP ( former HCI )
					return "SCP";
				case '0023880567': // IBP
					return "IBP";
				case '0026009812': // Event Ticketing
					return "EVT";	
				case '0018994393': // SPORTS1
					return "SPORTS1";
				case '0014215381': // S/4 HANA Cloud Edition
					return "S/4HANA CE";
				case '0000167698': // SuccessFactors
					return "Success Factors";
				case '00012078858': // AWS
					return "AWS";
				case '0001092494': // BCX
					return "BCX";
				case '0022187741': // CenturyLink
					return "CenturyLink";
				case '0026226182': // DCX
					return "DCX";	
				case '0022846399': // HP
					return "HP";
				case '0021094140': // IBM
					return "IBM";
				case '0008604698': // Injazat
					return "Injazat";
				case '0017958862': // NTT
					return "NTT";
				case '0007254653': // Samsung
					return "Samsung";
				case '0001092747': // T-System
					return "T-Systems";
				case '0002135872': // TIVIT
					return "TIVIT";	
				case '0011585500': // Virtustream
					return "Virtustream";
				case '0016755384': // Obsolete
		            return "";	
				case '':
					return "";
				default:
					return "Delivery Unit: " + delivery_unit + " - Please check KBA 2243369 for further details.";
			}
		},

		worldmap: function (apj, r_apj, y_apj,  g_apj, n_apj, emea, r_emea, y_emea, g_emea, n_emea, lac, r_lac, y_lac, g_lac, n_lac, na, r_na, y_na, g_na, n_na, notAssigned, r_nass, y_nass, g_nass, n_nass) {
			var width = window.innerWidth;
			var height = window.innerHeight - 60;
			var heightAPJ = height * 0.2;
			var heightEMEA = height * 0.18;
			var heightLAC = height * 0.5;
			var heightNA = height * 0.2;
			var heightNotAss = height * 0.6;
			
			var element =
			"<div style='width: " + width + "px; height: " + height + "px; margin-top: -15px'>" +
			"<div style='padding-left: 47%; padding-top: " + heightEMEA + "px ; position: absolute'" +
				"title='Red Cases: " + r_emea + "\r\n" + "Yellow Cases: " + y_emea + "\r\n" + "Green Cases: " + g_emea + "\r\n" + "w/o Rating: " + n_emea + "'>" +
				"<div class='labelCountry'>EMEA " + emea + "</div></div>" +
			"<div style='padding-left: 30%; padding-top: " + heightLAC + "px ; position: absolute'" +
				"title='Red Cases: " + r_lac + "\r\n" + "Yellow Cases: " + y_lac + "\r\n" + "Green Cases: " + g_lac + "\r\n" + "w/o Rating: " + n_lac + "'>" +
				"<div class='labelCountry'>LAC " + lac + "</div></div>" +
			"<div style='padding-left: 18%; padding-top: " + heightNA + "px ; position: absolute'" +
				"title='Red Cases: " + r_na + "\r\n" + "Yellow Cases: " + y_na + "\r\n" + "Green Cases: " + g_na + "\r\n" + "w/o Rating: " + n_na + "'>" +
				"<div class='labelCountry'>NA " + na + "</div></div>" +
			"<div style='padding-left: 73%; padding-top: " + heightAPJ + "px ; position: absolute'" +
				" title='Red Cases: " + r_apj + "\r\n" + "Yellow Cases: " + y_apj + "\r\n" + "Green Cases: " + g_apj + "\r\n" + "w/o Rating: " + n_apj + "'>" +
				"<div class='labelCountry'>APJ " + apj + "</div></div>" +
			"<div style='padding-left: 64%; padding-top: " + heightNotAss + "px ; position: absolute'" +
				"title='Red Cases: " + r_nass + "\r\n" + "Yellow Cases: " + y_nass + "\r\n" + "Green Cases: " + g_nass + "\r\n" + "w/o Rating: " + n_nass + "'>" +
				"<div class='labelNotAssigned'>Not Assigned " + notAssigned + "</div></div>" +
			"<img style='z-index: -999; width: " + width + "px; height: " + height + "px'; src='images/worldmap.PNG'/></div>";
			return element;
		}
	};
});