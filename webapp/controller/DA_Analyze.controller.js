sap.ui.define([
	"corp/sap/mdrdashboards/controller/DA_BaseController", 
	"sap/m/MessageBox", 
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel"
], function (DA_BaseController, MessageBox, MessageToast, JSONModel) {
	"use strict";

	return DA_BaseController.extend("corp/sap/mdrdashboards.controller.DA_App", {

		onInit: function () {
			this.formattedUrlObj = {};
			var searchParams = window.location.hash;
			if (searchParams.indexOf("Analyze") > -1) {
				var complete_url = window.location.href;
				var pieces;
				var urlToAnalyze;
				if (complete_url.indexOf("URL=") > -1) {
					var mdrURL = complete_url.slice(complete_url.indexOf("URL=") + 4, complete_url.indexOf("&MDR="));
					var mdrMDR = complete_url.slice(complete_url.indexOf("&MDR=") + 5 , complete_url.indexOf("#/"));
					urlToAnalyze = mdrURL + "#/" + mdrMDR;
				} else {
					pieces = complete_url.split("?Analyze=");
					urlToAnalyze = pieces[1];
				}
				if (urlToAnalyze !== undefined) {
					this.getView().byId("inputBox").setValue(decodeURIComponent(urlToAnalyze).replace(/amp;/g, "").replace(/%20/g, " ").replace(
						/%27/g, "'"));
				//	this.onSubmit();
				}
			}
		},
		
		isObjEmpty: function (obj) {
			for (var key in obj) {
				return false;
			}
			return true;
		},
		
		// User friendly switch
		checkKeyFilter: function (data) {
			return data.key === this;
		},
		
		checkKeyParam: function (data) {
			return data.key === "all";
		},
		
		transformValue: function (obj1, obj2) {
			for (var i in obj1) {
				for (var j in obj2) {
					if (obj1[i].trim() === obj2[j].value) {
						obj1[i] = " " + obj2[j].name;
						break;
					} else if (obj1[i].trim() === obj2[j].name) {
						obj1[i] = " " + obj2[j].value;
						break;
					}
				}
			}
			return obj1;
		},
		
		modifyObj: function () {
			if (this.isObjEmpty(this.formattedUrlObj) === false) {
				var i, j,
					filters = [],
					parameters = [];
				var oModel = this.formattedUrlObj;
				var mdr = oModel.mdr;
				var filtersModel = this.getOwnerComponent().getModel("filters").getProperty("/");
				filters = filtersModel.filter(this.checkKeyFilter, mdr.toLowerCase());
				parameters = filtersModel.filter(this.checkKeyParam);
				// Conversion tech names to user friendly, and vice versa (filters)
				for (i in oModel.filters) {
					for (j in filters) {
						if (oModel.filters[i].filter.trim() === filters[j].filter) {
							oModel.filters[i].filter = " " + filters[j].name;
							oModel.filters[i].value = this.transformValue(oModel.filters[i].value, filters[j].options);
						} else if (oModel.filters[i].filter.trim() === filters[j].name) {
							oModel.filters[i].filter = " " + filters[j].filter;
							oModel.filters[i].value = this.transformValue(oModel.filters[i].value, filters[j].options);
						}
					}
				}
				// Conversion tech names to user friendly, and vice versa (parameters)
				for (i in oModel.params) {
					for (j in parameters) {
						if (oModel.params[i].filter === parameters[j].filter) {
							oModel.params[i].filter = parameters[j].name;
						} else if (oModel.params[i].filter === parameters[j].name) {
							oModel.params[i].filter = parameters[j].filter;
						}
					}
				}
				this.formattedUrlObj = oModel;
				this.bindDataAnalyzeLists(oModel);
			}
		},
		
		dashTypeText: function (dashType) {
			var result = "";
			var oModel = this.getOwnerComponent().getModel("dashboards");
			var oData = oModel.getProperty("/");
			for (var i = 0; i < oData.length; i++) {
				if (oData[i].key === dashType) {
					result = oData[i].name;
					break;
				}
			}
		//	result += " (" + dashType.toUpperCase() + ")";
			result += dashType.toUpperCase();
			this.getView().setModel(new JSONModel(),"dashboardName");
			this.getView().setModel("dashboardName", result);
			return result;
		},
		
		bindDataAnalyzeLists: function (object) {
			var filtersModel = new sap.ui.model.json.JSONModel();
			filtersModel.setData(object);
			var oColumnItemTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Text({
						text: "{filter}"
					}),
					new sap.m.Text({
						text: "{operator}"
					}),
					new sap.m.Text({
						text: "{value}"
					})
				]
			});
			var oFBindingInfo = {
				path: "/filters",
				template: oColumnItemTemplate
			};
			var oPBindingInfo = {
				path: "/params",
				template: oColumnItemTemplate
			};
			var filtersTable = this.byId("filtersTable");
			var paramsTable = this.byId("paramsTable");
			filtersTable.setModel(filtersModel);
			paramsTable.setModel(filtersModel);
			filtersTable.bindItems(oFBindingInfo);
			paramsTable.bindItems(oPBindingInfo);
		},
		
		onSubmit: function () {
			var url = this.getView().byId("inputBox").getValue();
			var host = window.location.host;
			var pos0 = host.search("port5000");
			var pos1 = host.search("dev-mallard");
			var pos2 = host.search("test-kinkajou");
			var pos3 = host.search("sapit-home-test-004");
			var pos4 = host.search("sapit-home-prod-004");
			var pos5 = host.search("mccdashboardrepository-dev");
			var pos6 = host.search("mccdashboardrepository-test");
			var pos7 = host.search("mccdashboardrepository.cfapp");
			var errorSubmit, 
				containsError = 0,
				locationError = "",
				errorCode = 0;
			url = decodeURIComponent(url).replace(/amp;/g, "").replace(/%20/g, " ").replace(/%27/g, "'");
			this.getView().byId("inputBox").setValue(url);
			if (url === "") {
				return MessageToast.show("Please enter an URL before submitting.");
			} else if (url.indexOf("https") === -1) {
				return MessageToast.show("Please enter a valid dashboard URL.");
			} else if (pos0 < 0 && pos1 < 0 && pos2 < 0 && pos3 < 0 && pos4 < 0 && pos5 < 0 && pos6 < 0 && pos7 < 0) {
				return MessageToast.show("Please enter a valid dashboard URL.");
			} else if (url.indexOf("MDR") === -1) {
				return MessageToast.show("Please enter a valid dashboard URL.");
			} else if (url.indexOf("filter=") === -1) {
				return MessageToast.show("Please enter a dashboard URL containing filters.");
			}	
			var urlSplit = url.split("#/");
			urlSplit[0] = urlSplit[0].slice(urlSplit[0].indexOf("&filter=") + 8);  // Filter + parameter string
			var filterString = urlSplit[0].substring(0, urlSplit[0].indexOf("&")); // Only filters
			var paramString = urlSplit[0].substring(urlSplit[0].indexOf("&") + 1); // Only parameters
			if (filterString === "" || paramString === "") {
				return MessageToast.show("Please enter a dashboard URL containing filters and parameters.");
			}
			// Verification for missing operators in URL, if there are errors, user needs to fix it
			var returnedArray = this.verificationOperators(filterString, paramString, urlSplit[1]);
			// Inform user about errors
			containsError = returnedArray[0];
			locationError = returnedArray[1];
			errorCode = returnedArray[2];
			if (containsError === 1) {
				var errorStartPosition = filterString.indexOf(locationError);
				var errorMessage = this.containsError(errorCode, urlSplit[1]);
				MessageBox.show("Your URL has an error. View details below, review your URL and try again.", {
					icon: MessageBox.Icon.INFO,
					title: "Info",
					actions: [sap.m.MessageBox.Action.IGNORE, sap.m.MessageBox.Action.CLOSE],
					id: "messageBoxURLError",
					details: "<p><strong>Error description: </strong>" + errorMessage + "</p>" +
						"<strong>Gateway: </strong>" + "<em>" + url.substring(0, url.indexOf("&filter=")) + "</em><br>" +
						"<strong>Filters: </strong>" + "<em>" + "&filter=" + filterString.substring(0, errorStartPosition) +
						"<span style='color:red;background-color:yellow;font-weight:bold'>" + filterString.substring(errorStartPosition, errorStartPosition +
							locationError.length) + "</span>" +
						filterString.substring(errorStartPosition + locationError.length, filterString.length) + "</em><br>" +
						"<strong>Parameters: </strong>" + "<em>" + "&" + paramString + "</em><br>" +
						"<strong>MDR: </strong>" + "<em>" + "#/" + urlSplit[1] + "</em>",
					onClose: function (sAction) {
						if (sAction === "CLOSE") {
							errorSubmit = null;
						} else if (sAction === "IGNORE") {
							errorSubmit = "ignore";
							this.objFormatToBind(errorSubmit, filterString, paramString, urlSplit[1]);
						}
					}.bind(this)
				});
			} else {
				this.objFormatToBind(errorSubmit, filterString, paramString, urlSplit[1]);
				this.modifyObj();         
			}
		},
		
		objFormatToBind: function (errorSubmit, filterString, paramString, mdr) {
			// Check if the user pressed submit with: empty input field / invalid URL / URL without filters / URL without parameters
			switch (errorSubmit) {
			case null:
				return MessageToast.show("Please try again.");
			case "ignore":
				MessageToast.show("Error ignored.");
				break;
			default:
				break;
			}
			// Expands the Results panel once a valid URL has been submitted and analyzed
			var oView = this.getView();
			oView.byId("resultsPanel").setExpanded(true);
			// Retrieves the MDR type and sets the value in the MDR Type box
			var objAllFiltersParameters = this.urlParser(filterString, paramString, mdr); 
			// Parses the url into an object
			var mdrValue = objAllFiltersParameters.mdr;
			var oValue = this.dashTypeText(mdrValue);
			oView.byId("urlBox").setCols(oValue.length).setValue(oValue).setVisible(true);
			// Everything from the giant object to arrays, divided into Filters (keys and values) and Parameters (keys and values)
			var arrayFKeys = Object.keys(objAllFiltersParameters.filters);
			var arrayFValues = Object.keys(objAllFiltersParameters.filters).map(function (key) {
				return objAllFiltersParameters.filters[key];
			});
			var arrayPKeys = Object.keys(objAllFiltersParameters.params);
			var arrayPValues = Object.keys(objAllFiltersParameters.params).map(function (key) {
				return objAllFiltersParameters.params[key];
			});
			var arrayFiltersToModify = [],
				arrayParamsToModify = [],
				i;
			var j,
				k,
				filters = [],
				parameters = [];
			var mdr = mdrValue;
			var filtersModel = this.getOwnerComponent().getModel("filters").getProperty("/");
			filters = filtersModel.filter(this.checkKeyFilter, mdr.toLowerCase());
			parameters = filtersModel.filter(this.checkKeyParam);	
			for (i in arrayFKeys) {
				arrayFiltersToModify[i] = {
					filter: arrayFKeys[i],
					operator: objAllFiltersParameters.operators[i],
					value: arrayFValues[i]
				};
				for (j in filters) {
					for (k in filters[j].options) {
						if (arrayFiltersToModify[i].value[0].trim() === filters[j].options[k].name.trim()) {
							arrayFiltersToModify[i].value = this.transformValue(arrayFiltersToModify[i].value, filters[j].options);
							break;
						}
					}	
				}	
			}
			for (i in arrayPKeys) {
				arrayParamsToModify[i] = {
					filter: arrayPKeys[i],
					value: arrayPValues[i]
				};
				for (j in parameters) {
					if (arrayParamsToModify[i].filter === parameters[j].filter) {
						arrayParamsToModify[i].filter = parameters[j].name;
						break;
					}
				}		
			}
			this.formattedUrlObj.mdr = mdrValue;
			this.formattedUrlObj.filters = arrayFiltersToModify;
			this.formattedUrlObj.params = arrayParamsToModify;
			if (this.getView().byId("userFriendlySwitch").getState() === false) {
				this.bindDataAnalyzeLists(this.formattedUrlObj);
			} else {
				this.modifyObj();
				this.bindDataAnalyzeLists(this.formattedUrlObj);
			}
		},
		
		checkFilterExists: function (filteredModel, eqVerification) {
			return filteredModel.some(function (fil) {
				return fil.filter === eqVerification;
			});
		},
		
		verificationOperators: function (filterString, paramString, mdr) {
			var eqVerification = filterString.replace(/\(|\)/g, "").trim().split(/ +(?=(?:(?:[^']*'){2})*[^']*$)/g); // splits by spaces, but only those outside quotes
			var i, posCompOperator = 1,
				posFilter = 0,
				filteredModel = [],
				posLogiOperator = 3,
				containsError = 0,
				locationError = "",
				errorCode = 0;
			var arrayCompOperators = ["eq", "ne", "ge", "le"];
			var arrayLogiOperators = ["and", "or"];
			var filtersModel = this.getOwnerComponent().getModel("filters").getProperty("/");
			filteredModel = filtersModel.filter(this.checkKeyFilter, mdr.toLowerCase());
			// Check filters and parameters
			for (i = 0; i < eqVerification.length; i++) {
				if (i === posFilter) {
					if (this.checkFilterExists(filteredModel, eqVerification[i]) === true) {
						containsError = 0;
						posFilter += 4;
					} else {
						containsError = 1;
						locationError = eqVerification[i];
						errorCode = 31;
						break;
					}
				} else if (i === posCompOperator) {
					if (arrayCompOperators.indexOf(eqVerification[i]) === -1) { // error here, was expecting operator and didn't find an exact match, could be an operator or a blank space missing
						containsError = 1;
						if (eqVerification[i - 1].indexOf("eq" || "ne" || "ge" || "le") > -1) { // do we have an operator before? if yes than the error is 1 position before, just a blank space missing
							locationError = eqVerification[i - 1];
							errorCode = 11;
						} else if (eqVerification[i].indexOf("eq" || "ne" || "ge" || "le") > -1) { // do we have an operator at the error position? if yes than it's just a blank space missing
							locationError = eqVerification[i];
							errorCode = 11;
						} else { // else the error is an operator missing
							locationError = eqVerification[i - 1].substring(eqVerification[i - 1].length - 5) + " " + eqVerification[i].substring(0, 5);
							errorCode = 12;
						}
						break;
					} else {
						posCompOperator += 4;
					}
				} else if (i === posLogiOperator) {
					if (arrayLogiOperators.indexOf(eqVerification[i]) === -1) {
						containsError = 1;
						if (eqVerification[i - 1].indexOf("and" || "or") > -1) {
							locationError = eqVerification[i - 1];
							errorCode = 21;
						} else if (eqVerification[i].indexOf("and" || "or") > -1) {
							locationError = eqVerification[i];
							errorCode = 21;
						} else {
							locationError = eqVerification[i - 1].substring(eqVerification[i - 1].length - 5) + " " + eqVerification[i].substring(0, 5);
							errorCode = 22;
						}
						break;
					} else {
						posLogiOperator += 4;
					}
				}
			}
			var pos = 0;
			var firstExist = 0;
			var secondExist = 0;
			var count = 0;
			// Check for superfluous "'" or "%27%27"
			pos = filterString.indexOf("''");
			if (pos > -1) {
				locationError = filterString.slice(pos, pos + 2);
				containsError = 1;
				errorCode = 25;
			}
			pos = filterString.indexOf("%27%27");
			if (pos > -1) {
				locationError = filterString.slice(pos, pos + 6);
				containsError = 1;
				errorCode = 26;
			}
			// Check for missing "'"
			for (var j = 0; j < filterString.length; j++) {
				if (filterString.charAt(j) === "'") {
					count = count + 1;
				}
			}
			if (Math.ceil(count/2) != count/2) {
				locationError = filterString;
				containsError = 1;
				errorCode = 27;
			}	
			// Check for missing "(" or ")"
			firstExist = 0;
			secondExist = 0;
			for (var j = 0; j < filterString.length; j++) {
				if (filterString.charAt(j) === "(") {
					firstExist = firstExist + 1;
				}
				if (filterString.charAt(j) === ")") {
					secondExist = secondExist + 1;
				}
			}
			if (firstExist < secondExist) {
				containsError = 1;
				locationError = filterString;
				errorCode = 23;
			}
			if (firstExist > secondExist) {
				containsError = 1;
				locationError = filterString;
				errorCode = 24;
			}
			// Check for superfluous "'" or "%27%27"
			pos = filterString.indexOf('"');
			if (pos > -1) {
				containsError = 1;
				locationError = filterString.slice(pos, pos + 1);
				errorCode = 28;
			}
			// Collect error
			var arrayReturn = [];
			arrayReturn[0] = containsError;
			arrayReturn[1] = locationError;
			arrayReturn[2] = errorCode;
			return arrayReturn;
		},
		
		urlParser: function (filters, parameters, mdr) {
			var filterString = filters;
			var paramString = parameters;
			filterString = filterString.replace(/ eq /g, "=").replace(/ ne /g, "!=").replace(/ ge /g, ">=").replace(/ le /g, "<=");
			filterString = filterString.replace(new RegExp("\\b" + "or" + "\\b", "gi"), "and").replace(/\(|\)/g, "");
			var arrayFilters = filterString.split("and");
			var arrayParam = paramString.split("&");
			var filtersKeysValues = {},
				paramsKeysValues = {},
				filtersOperators = [];
			var keyNameAndValue, keyName, keyValue, lastChar;
			var sizeFilters = arrayFilters.length;
			var sizeParam = arrayParam.length;
			// Handles the filters
			for (var i = 0; i < sizeFilters; i++) {
				keyNameAndValue = arrayFilters[i].split("=");
				keyName = keyNameAndValue[0].replace(/ /g, "");
				lastChar = keyName.charAt(keyName.length - 1);
				switch (true) {
				case /^[A-Z]$/i.test(lastChar):
					filtersOperators.push("Equal");
					break;
				case lastChar === "!":
					filtersOperators.push("Not Equal");
					keyName = keyName.slice(0, -1);
					break;
				case lastChar === ">":
					filtersOperators.push("Greater Than");
					keyName = keyName.slice(0, -1);
					break;
				case lastChar === "<":
					filtersOperators.push("Less Than");
					keyName = keyName.slice(0, -1);
					break;
				}
				keyValue = (typeof (keyNameAndValue[1]) === "undefined" || keyNameAndValue[1] === "") ? "NO VALUE" : keyNameAndValue[1]; 
				// --> if string is undefined (non existent) or blank, true shows "no value", false shows the value
				keyValue = keyValue.replace(/'/g, "").trim();
				if (keyName === "Filter") { 
					// Check if this magical filter exists (it's different from all the others)
					filtersKeysValues.Filter = [];
					keyValue = keyValue.slice(11);
					var serviceTeams = keyValue.split(";");
					for (var value in serviceTeams) {
						filtersKeysValues.Filter.push(serviceTeams[value]);
					}
				} else {
					if (filtersKeysValues[keyName]) { 
						// If name already exists - when the same filter is encountered multiple times
						if (typeof filtersKeysValues[keyName] === "string") { // if the value inside is still a string...
							filtersKeysValues[keyName] = [filtersKeysValues[keyName]]; 
							// ...transform to array, so we can add multiple values by pushing...
						}
						filtersKeysValues[keyName].push(" " + keyValue); 
						// ...pushing new values if name already exists...
					} else {
						filtersKeysValues[keyName] = [keyValue]; 
						// ... if name doesn't exists, just assign value to object
					}
				}
			}
			// Handles the parameters
			for (i = 0; i < sizeParam; i++) {
				keyNameAndValue = arrayParam[i].split("=");
				keyName = keyNameAndValue[0];
				keyValue = (typeof (keyNameAndValue[1]) === "undefined" || keyNameAndValue[1] === "") ? "NO VALUE" : keyNameAndValue[1];
				paramsKeysValues[keyName] = [keyValue]; 
				// Parameters should never be repeated, so just assign value to object
			}
			var objAllKeysValues = {};
			objAllKeysValues.filters = filtersKeysValues;
			objAllKeysValues.operators = filtersOperators;
			objAllKeysValues.params = paramsKeysValues;
			objAllKeysValues.mdr = mdr;
			return objAllKeysValues;
		},
		
		containsError: function (errorCode, mdr) {
			var errorMessage;
			switch (errorCode) {
			case 11:
				errorMessage = "Blank space missing before and/or after comparison operator.";
				break;
			case 12:
				errorMessage = "Comparison operator missing ('eq', 'ne', 'ge', 'le').";
				break;
			case 21:
				errorMessage = "Blank space missing before and/or after logical operator.";
				break;
			case 22:
				errorMessage = "Logical operator missing ('and', 'or').";
				break;
			case 23:
				errorMessage = "Missing or superfluous '('.";
				break;	
			case 24:
				errorMessage = "Missing or superfluous ')'.";
				break;	
			case 25:
				errorMessage = "Superfluous '.";
				break;	
			case 26:
				errorMessage = "Superfluous %27";
				break;		
			case 27:
				errorMessage = "Missing or superfluous '.";
				break;		
			case 28:
				errorMessage = 'Incorrect usage of ".';
				break;		
			case 31:
				errorMessage = "Filter doesn't exist or isn't supported by '" + mdr.toUpperCase().trim() + "' dashboard type.";
				break;
			case 40:
				errorMessage = "URL not correct.";
				break;
			default:
				errorMessage = "Undefined error.";
				break;
			}
			return errorMessage;
		},
		
		clearAnalyze: function () {
			var oView = this.getView();
			this.formattedUrlObj = {};
			oView.byId("resultsPanel").setExpanded(false);
			oView.byId("filtersTable").unbindItems();
			oView.byId("paramsTable").unbindItems();
			oView.byId("urlBox").setValue("").setVisible(false);
			oView.byId("inputBox").setValue("");
		},
		
		openInfoPage: function () {
			var url = this.getView().byId("inputBox").getValue();
			var urlSplit = url.split("#/");
			var dashboard = urlSplit[1];
			if (dashboard === "" || dashboard === undefined) {
				MessageToast.show("Please analyze an URL before!", {
					duration: 10000,
					width: "30em"
				});
				return;
			}
			var link = "";
			switch (dashboard) {
				case "MDR2":
					link = "https://go.sap.corp/MDR2-info";
					break;
				case "MDR3":
					link = "https://go.sap.corp/MDR3-info";
					break;
				case "MDR4":
					link = "https://go.sap.corp/MDR4-info";
					break;
				case "MDR6":
					link = "https://go.sap.corp/MDR6-info";
					break;
				case "MDR6A":
					link = "https://go.sap.corp/MDR6_A-info";
					break;
				case "MDR7":
					link = "https://go.sap.corp/MDR7-info";
					break;
				case "MDR8":
					link = "https://go.sap.corp/MDR8-info";
					break;
				case "MDR9_NOW":
					link = "https://go.sap.corp/MDR9_NOW-info";
					break;
				case "MDR13":
					link = "https://go.sap.corp/MDR13-info";
					break;
				default:
					link =" ";
			}
			window.open(link, dashboard, " - Info");
		},
		
		openUrlInBrowser: function () {
			var url = this.getView().byId("inputBox").getValue();
			var urlSplit = url.split("#/");
			var dashboard = urlSplit[1];
			if (dashboard === "" || dashboard === undefined) {
				MessageToast.show("Please analyze an URL before!", {
					duration: 10000,
					width: "30em"
				});
				return;
			}
			window.open(url);
		}
	});
});