sap.ui.define([
	"corp/sap/mdrdashboards/controller/DA_BaseController", 
	"sap/m/MessageToast", 
	"sap/ui/model/Filter", 
	"sap/ui/model/FilterOperator"
], function (DA_BaseController, MessageToast, Filter, FilterOperator) {
	"use strict";
	
	return DA_BaseController.extend("corp/sap/mdrdashboards/controller.controller.DA_Build", {
		
		onInit: function () {
			this.itemObj = {};
			this.itemObj.filters = [];
			this.itemObj.params = [];
			this.oModel = new sap.ui.model.json.JSONModel();
			this.oModel.setData(this.itemObj);
			this.tempItemsObj = {};
		},

		clearObjects: function () {
			this.itemObj = {};
			this.itemObj.filters = [];
			this.itemObj.params = [];
			this.tempItemsObj = {};
			this.oModel.setData(this.itemObj);
		},
		
		onExit: function () {
			if (this.secDialog) {
				this.secDialog.destroy(true);
			}
			if (this.oDialog) {
				this.oDialog.destroy(true);
			}
		},
		
		onReset: function () {
			this.getView().byId("buildPanel").setExpanded(false);
			this.getView().byId("dashType").setSelectedKey("");
			this.clearObjects();
		},
		
		onSearch: function (event) {
			var query = event.getParameter("value");
			var dashboard = this.oView.byId("dashType").getSelectedKey();
			var filter = new Filter({
				filters: [
					new Filter("key", FilterOperator.EQ, dashboard),
					new Filter("name", FilterOperator.Contains, query)
				//	new Filter("value", FilterOperator.Contains, query)
				],
				and: false
			});
			event.getSource().getBinding("items").filter([filter]);
		},
		
		onSearchFilter: function (event) {
			var query = event.getParameter("value");
			var dashboard = this.oView.byId("dashType").getSelectedKey();
			var filter = new Filter({
				filters: [
					new Filter("key", FilterOperator.EQ, dashboard),
					new Filter("name", FilterOperator.Contains, query)
				//	new Filter("value", FilterOperator.Contains, query)
				],
				and: true
			});
			event.getSource().getBinding("items").filter([filter]);
		},
		
		onSearchTemplates: function (event) {
			var query = event.getParameter("value");
			var filter = new Filter({
				filters: [
					new Filter("name", FilterOperator.Contains, query),
					new Filter("value", FilterOperator.Contains, query)
				],
				and: false
			});
			event.getSource().getBinding("items").filter([filter]);
		},
		
		dashSelection: function () {
			this.clearObjects();
			var oView = this.getView();
			// Expands the results panel once a valid URL has been submitted and analyzed
			if (oView.byId("dashType").getSelectedKey() !== "mdr0" && oView.byId("dashType").getSelectedKey() !== "MDR0") {
				oView.byId("buildPanel").setExpanded(true);
			} else {
				oView.byId("buildPanel").setExpanded(false);
			}
		},
		
		generateUrl: function () {
			// Gets the dashboard type selected and stores in mdrType variable. the current selection data is stored inside oData variable
			var mdrType = this.getView().byId("dashType").getSelectedKey();
			var oData = this.oModel.getData();
			var i, j;
			// Basic URL string, to be used later
			var host = window.location.host;
			var pathname = window.location.pathname;
			var urlStringFirstPart;
			urlStringFirstPart = "https://" 
				+ host
				+ pathname
				+ "?hc_reset";
			var urlStringGateway = urlStringFirstPart;
			if (urlStringGateway.indexOf("filter=") > -1) {
				urlStringGateway = urlStringGateway.slice(0, urlStringGateway.indexOf("filter="));
			}
			if (urlStringGateway.indexOf("#/") > -1) {
				urlStringGateway = urlStringGateway.slice(0, urlStringGateway.indexOf("#/"));
			}
			// Empty variables to be filled with strings to build the URL, and empty arrays to get the data from oData to the strings
			var urlStringFilters = "",
				urlStringParams = "";
			for (i in oData.filters) {
				if (i > 0) {
					urlStringFilters += " and ";
				}
				if (oData.filters[i].desc.toString() === "Filter") {
					urlStringFilters += oData.filters[i].desc + " eq '";
					urlStringFilters += oData.filters[i].value;
					urlStringFilters += "'";
				} else if (oData.filters[i].desc.toString() === "case_title") {
					urlStringFilters += "(substringof(%27" + oData.filters[i].value + "%27,case_title))";
				} else if (oData.filters[i].value.length > 1) {
					for (j in oData.filters[i].value) {
						if (Number(j) === 0) {
							urlStringFilters = urlStringFilters + "(";
						} else if (j < oData.filters[i].value.length) {
							urlStringFilters = urlStringFilters + " or ";
						}
						if (oData.filters[i].value[j].indexOf("datetime") > -1) {
							urlStringFilters += oData.filters[i].desc + " " + oData.filters[i].value[j];
						} else {
							urlStringFilters += oData.filters[i].desc + " eq '" + oData.filters[i].value[j] + "'";
						}
						if (Number(j) === oData.filters[i].value.length - 1) {
							urlStringFilters = urlStringFilters + ")";
						}
					}
				} else {
					if (oData.filters[i].value[0].indexOf("datetime") > -1) {
						urlStringFilters = urlStringFilters + oData.filters[i].desc + " " + oData.filters[i].value[0];
					} else {	
						urlStringFilters = urlStringFilters + oData.filters[i].desc + " eq '" + oData.filters[i].value[0] + "'";
					}	
				}
			}
			for (var i = 0; i < oData.params.length; i++) {
				// Special treatment for some parameters
				// 1. disp_cat
				if (oData.params[i].desc === "disp_cat" && oData.params[i].value[0] === " ") {
					continue;
				}
				// Normal treatment
				urlStringParams = urlStringParams + "&" + oData.params[i].desc + "=" + oData.params[i].value;
			}
			// URL is being built here and stored into global variable
			var generatedUrlString = urlStringGateway + "&filter=" + urlStringFilters + urlStringParams + "#/" + mdrType.toUpperCase();
			generatedUrlString = generatedUrlString.replace(/&&/g, "&");
			this.generatedUrl = generatedUrlString;
			// If generated url dialog doesn't exists, creates it
			if (!this.genDialog) {
				this.genDialog = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_GenerateUrlDialog", this);
			}
			// MAGIC and then dialog opening
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.genDialog);
			this.getView().addDependent(this.genDialog);
			sap.ui.getCore().byId("generatedText").setValue(generatedUrlString);
			this.genDialog.open();
		},
		
		handleFilterButtonPress: function (event) {
			// HandleFilterButtonPress: in "Build" page, this function is called when "Add Filter" button is pressed, 
			// filters only dashboard filters for the selected type
			var oComboBox = this.getView().byId("dashType");
			var mdrTypeKey = oComboBox.getSelectedKey();
			if (mdrTypeKey === "") {
				MessageToast.show("Please select a Dashboard!", {
					duration: 10000,
					width: "30em"
				});
				return;
			} else {
				if (!this.oDialog) {
					this.oDialog = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_FirstSelection", this);
				}
				var oData = this.oModel.getData();
				this.oDialog.setModel(this.getOwnerComponent().getModel("filters"));
				this.oDialog.getBinding("items").filter([new Filter("key", "EQ", mdrTypeKey)]);
			//	this.oDialog.getModel().setData(test);
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oDialog);
				this.getView().addDependent(this.oDialog);
				this.oDialog.open();
			}
		},
		
		handleParameterButtonPress: function () {
			// HandleParameterButtonPress: in "Build" page, this function is called when "Add Parameter" button is pressed.
			// Filters the parameters from the filters.json file (all parameters use the key "all").
			var oComboBox = this.getView().byId("dashType");
			var mdrTypeKey = oComboBox.getSelectedKey();
			if (mdrTypeKey === "") {
				MessageToast.show("Please select a Dashboard!", {
					duration: 10000,
					width: "30em"
				});
				return;
			} else {
				if (!this.oDialog) {
					this.oDialog = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_FirstSelection", this);
				}
				this.oDialog.setModel(this.getOwnerComponent().getModel("parameters"));
				this.oDialog.getBinding("items").filter([new sap.ui.model.Filter("key", "EQ", mdrTypeKey)]);
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oDialog);
				this.getView().addDependent(this.oDialog);
				this.oDialog.open();
			}
		},
		
		openTemplatesDialog: function () {
			var oComboBox = this.getView().byId("dashType");
			var mdrTypeKey = oComboBox.getSelectedKey();
			if (mdrTypeKey === "") {
				MessageToast.show("Please select a Dashboard!", {
					duration: 10000,
					width: "30em"
				});
				return;
			} else {
				if (!this.templatesDialog) {
					this.templatesDialog = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_Templates", this);
					this.getView().addDependent(this.templatesDialog);
					this.templatesDialog.open();
				} else {
					this.getView().addDependent(this.templatesDialog);
					this.templatesDialog.open();
				}
			}
		},
		
		handleData: function () {
			// HandleData: handles the selection from the "Filters" and "Parameters" selection dialogs, storing the selection as objects
			// to be inserted into data model AND to be displayed at the "Current Selection" list.
			var oData = this.oModel.getData();
			var existsName = 0,
				index = 0,
				i;
			if (this.tempItemsObj.info.toString() === "Filter" || this.tempItemsObj.info.toString() === "Date Filter") {
				for (i in oData.filters) {
					if (oData.filters[i].filter === this.tempItemsObj.filter) {
						existsName = 1;
						index = i;
						break;
					}
				}
				if (existsName === 1) {
				//	oData.filters.splice(index, 1);
					for (var k = 0; k < oData.filters[i].value.length; k++) {
						var filterExist = 0;
						for (var l = 0; l < this.tempItemsObj.value.length; l++) {
							if (oData.filters[i].value[l] === this.tempItemsObj.value[k]) {
								filterExist = 1;
								break;
							}
						}
						if (filterExist === 0 && this.tempItemsObj.value[k] !== undefined) {
							oData.filters[i].value.push(this.tempItemsObj.value[k]);
						}
					}
				}
				if (this.tempItemsObj.filter === "Service Team 1" || this.tempItemsObj.filter === "Service Team 2") {
					oData.filters.unshift(this.tempItemsObj);
				} else {
					if (existsName === 0) {
						oData.filters.push(this.tempItemsObj);
					}
				}
				for (var j = 0; j < oData.filters.length; j++) {
					if (oData.filters[j].filter === "Service Team 1") {
						var indexServTeam1 = j;
						var servTeam1 = oData.filters.slice(indexServTeam1, indexServTeam1 + 1);
					}
					if (oData.filters[j].filter === "Service Team 2") {
						var indexServTeam2 = j;
						var servTeam2 = oData.filters.slice(indexServTeam2, indexServTeam2 + 1);
					}
					// Remove blanks from start and end of filters string
					for (var m = 0; m < oData.filters[j].value.length; m++) {
						oData.filters[j].value[m] = oData.filters[j].value[m].trim();
					}
				}
				if (indexServTeam1 > -1 && indexServTeam2 > -1) {
					oData.filters.shift();
					oData.filters.shift();
					oData.filters2 = JSON.parse(JSON.stringify(oData.filters));
					oData.filters = servTeam1.concat(servTeam2);
					oData.filters = oData.filters.concat(oData.filters2);
				}	
			} else if (this.tempItemsObj.info.toString() === "Serviceteam Filter") {
				this.tempItemsObj.value = "serviceteam(" + this.tempItemsObj.value + ")";
				oData.filters.push(this.tempItemsObj);
			} else if (this.tempItemsObj.info.toString() === "Parameter") {
				for (i in oData.params) {
					if (oData.params[i].filter === this.tempItemsObj.filter) {
						existsName = 1;
						index = i;
						break;
					}
				}
				if (existsName === 1) {
					oData.params.splice(index, 1);
				}
				if (oData.params.length > 0) {
					if (this.tempItemsObj.filter === "Title") {	
						var newTitle = this.tempItemsObj.value[0].replace(/&/g, "%26");
						this.tempItemsObj.value[0] = newTitle;
						oData.params.unshift(this.tempItemsObj);
					} else {
						oData.params.push(this.tempItemsObj);	
					}	
				} else {	
					oData.params.push(this.tempItemsObj);
				}	
			}
			this.oModel.setData(oData);
			var oColumnItemTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Text({
						text: "{filter}",
						textAlign: "Center"
					}),
					new sap.m.Text({
						text: "{value}",
						textAlign: "Center"
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
			var buildTableFilters = this.byId("buildTableFilters");
			var buildTableParams = this.byId("buildTableParams");
			buildTableFilters.setModel(this.oModel);
			buildTableParams.setModel(this.oModel);
			buildTableFilters.bindItems(oFBindingInfo);
			buildTableParams.bindItems(oPBindingInfo);
		},
		
		onDelete: function (oEvent) {
			// onDelete: in "Build" page, this function handles the items deleted from the "Results" table, 
			// rearranging the stored data and the results table as well
			var oSelectedItem = oEvent.getParameter("listItem");
			var sPath = oSelectedItem.getBindingContext().getPath();
			var iSelectedItemIndex = parseInt(sPath.slice(sPath.lastIndexOf("/") + 1));
			var idTable = oEvent.getSource().getId();
			idTable = idTable.slice(idTable.indexOf("--") + 2);
			var oTable = this.getView().byId(idTable);
			var oData = this.oModel.getData();
			if (idTable === "buildTableFilters") {
				oData.filters.splice(iSelectedItemIndex, 1);
			} else if (idTable === "buildTableParams") {
				oData.params.splice(iSelectedItemIndex, 1);
			}
			this.oModel.setData(oData);
			oTable.setModel(this.oModel);
		},
		
		handleClose: function (oEvent) {
			// handleClose: this function is called when selection dialogs (filters and parameters) are closed, uses MessageToast to display the selection to the user
			// then, uses handleDialogs function to clarify if the selection needs another selection dialog (i.e. you select the 'category' filter, the second dialog is the list of categories)
			// or an input dialog (user text input, like in the 'title' parameter)
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				MessageToast.show("You have chosen " + aContexts.map(function (oContext) {
					return oContext.getObject().name;
				}).join(", "));
				var selectedItem = oEvent.getParameter("selectedItem");
				// MAGIC HERE
				this.tempItemsObj = {};
				this.tempItemsObj.filter = selectedItem.getTitle(); // i.e. Status
				this.tempItemsObj.desc = selectedItem.getDescription(); // i.e. activity_status
				this.tempItemsObj.info = aContexts.map(function (oContext) {
					return oContext.getObject().info;
				});
				// AND HERE
				var littleObj = {};
				littleObj.name = selectedItem.getTitle();
				littleObj.info = selectedItem.getInfo(); // i.e. select
				littleObj.path = selectedItem.getBindingContext().getPath(); // i.e. /1/something
				oEvent.getSource().getBinding("items").filter([]);
				this.handleDialogs(littleObj);
			} else {
				MessageToast.show("No new item was selected.");
			}
		},
		
		handleSelectClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				MessageToast.show("You have chosen " + aContexts.map(function (oContext) {
					return oContext.getObject().name;
				}).join(", "));
				var tempArray = aContexts.map(function (oContext) {
					return oContext.getObject().value;
				});
				this.tempItemsObj.value = [];
				for (var i in tempArray) {
					this.tempItemsObj.value.push(tempArray[i]);
				}
				this.handleData();
			} else {
				MessageToast.show("No new item was selected.");
			}
			this.secDialog.destroy();
			delete this.secDialog;
		},
		
		handleGenerationClose: function (oEvent) {
			var target = oEvent.getSource().data("target");
			switch (target) {
			case "browser":
				this.generatedURL = sap.ui.getCore().byId("generatedText").getValue();
				window.open(this.generatedURL);
				break;
			case "close":
			default:
				this.genDialog.destroy();
				delete this.genDialog;
				break;
			}
		},
		
		handleInputClose: function () {
			var input = sap.ui.getCore().byId("userInput").getValue();
			if (input !== "") {
				this.tempItemsObj.value = input.split(",");
				this.handleData();
			}
			this.secDialog.destroy();
			delete this.secDialog;
		},

		handleTemplateClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			var id = "";
			if (aContexts && aContexts.length) {
				MessageToast.show("You have chosen " + aContexts.map(function (oContext) {
					id = oContext.getObject();
					return oContext.getObject().name;
				}).join(", "), {
				duration: 0,
				width: "30em"
				});
			}	
			if (id === "") {
				this.templatesDialog.destroy();
				delete this.templatesDialog;
				return;
			}
			for (var j = 0; j < id.options.length; j++) {
				this.tempItemsObj = id.options[j];
				var oData = this.oModel.getData();
				var existsName = 0,
					index = 0,
					i;
				for (i in oData.params) {
					if (oData.params[i].filter === this.tempItemsObj.filter) {
						existsName = 1;
						index = i;
						break;
					}
				}
				if (existsName === 1) {
					oData.params.splice(index, 1);
				}
				oData.params.push(this.tempItemsObj);
			}
			this.oModel.setData(oData);
			var oColumnItemTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Text({
						text: "{filter}",
						textAlign: "Center"
					}),
					new sap.m.Text({
						text: "{value}",
						textAlign: "Center"
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
			var buildTableFilters = this.byId("buildTableFilters");
			var buildTableParams = this.byId("buildTableParams");
			buildTableFilters.setModel(this.oModel);
			buildTableParams.setModel(this.oModel);
			buildTableFilters.bindItems(oFBindingInfo);
			buildTableParams.bindItems(oPBindingInfo);
			MessageToast.show("Please add a Title (--> Button '+Parameter')", {
				duration: 10000,
				width: "30em"
			});
			this.templatesDialog.destroy();
			delete this.templatesDialog;
		},
		
		handleDialogs: function (data) {
			var that = this;
			if (!this.secDialog) {
				if (data.info === "Multi Select" || data.info === "Single Select") {
					if (data.info === "Multi Select") {
					//  if multi select
						this.secDialog = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_SecondSelectionMulti", this.getView().getController());
					} 
					else {
					//  else it's single select	
						this.secDialog = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_SecondSelectionSimple", this.getView().getController());
					//	this.secDialog = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_SecondSelectionMulti", this.getView().getController());
						this.secDialog.setMultiSelect(false);
					} 
					// Further processing
					var sModel = "";
					var oModel = new sap.ui.model.json.JSONModel();
					var type = that.tempItemsObj.info[0];
					if (type !== "Parameter") {
						sModel = this.getOwnerComponent().getModel("filters");
					} else {	
						sModel = this.getOwnerComponent().getModel("parameters");
					}
					var path = data.path;
					var prop = sModel.getProperty(path);
					var sPath = prop.options;
					oModel.setData(sPath);
					this.secDialog.setModel(oModel);
				} else if (data.info === "Single Input") {
					this.secDialog = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_SecondSelectionInputSingle", this.getView().getController());	
				} else if (data.info === "Serviceteam Input") {
					this.secDialog = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_SecondSelectionServiceTeamInput", this.getView().getController());
				} else if (data.info === "Date Input") {
					this.secDialog = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_SecondSelectionDateInput", this.getView().getController());
				} else if (data.info === "Rolling Date Input") {
					this.secDialog = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_SecondSelectionRollingDateInput", this.getView().getController());
				} else {
					this.secDialog = sap.ui.xmlfragment("corp.sap.mdrdashboards.view.DA_SecondSelectionInput", this.getView().getController());
				}
			}
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.secDialog);
			this.getView().addDependent(this.secDialog);
			this.secDialog.open();
		},

		openInfoPage: function () {
			var link = "";
			var dashboard = this.oView.byId("dashType").getSelectedKey();
			if (dashboard === "") {
				MessageToast.show("Please select a Dashboard!", {
					duration: 10000,
					width: "30em"
				});
				return;
			}
			switch (dashboard) {
				case "mdr2":
					link = "https://go.sap.corp/MDR2-info";
					break;
				case "mdr3":
					link = "https://go.sap.corp/MDR3-info";
					break;
				case "mdr4":
					link = "https://go.sap.corp/MDR4-info";
					break;
				case "mdr6":
					link = "https://go.sap.corp/MDR6-info";
					break;
				case "mdr6A":
					link = "https://go.sap.corp/MDR6_A-info";
					break;
				case "mdr7":
					link = "https://go.sap.corp/MDR7-info";
					break;
				case "mdr8":
					link = "https://go.sap.corp/MDR8-info";
					break;
				case "mdr9_now":
					link = "https://go.sap.corp/MDR9_NOW-info";
					break;
				case "mdr13":
					link = "https://go.sap.corp/MDR13-info";
					break;
				default:
					link =" ";
			}
			window.open(link, dashboard, " - Info");
		}
	});
});