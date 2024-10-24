sap.ui.define([
	"sap/ui/core/Core",
	"sap/ui/core/Control",
	"sap/base/Log",
	"corp/sap/mdrdashboards/libs/JQPaginator"
],
function (
	Core,
	Control,
	Log,
	DummyPaginator
) {

	var CustomPaginator = Control.extend("corp.sap.mdrdashboards.controls.CustomPaginator", { 
		
		metadata : {
			properties: {
				currentPage : {type : "int", defaultValue : 1},
				numberOfPages : {type : "int", defaultValue : null}
			},
			
			events: {
				page: {
					parameters: {
						targetPage : {type : "int"}
					}
				}
			}
		}
	});
	
	CustomPaginator.prototype.init = function(oEvent) {
		this._inited = false;
	};
	
	CustomPaginator.prototype.setCurrentPage = function(iCurrent) {
		
		var iCurrentPage = iCurrent;
		if (this._inited) {
			if (iCurrent < 1 ) {
				iCurrentPage = 1;
			} else if (iCurrent > this.getNumberOfPages()) {
				iCurrentPage = this.getNumberOfPages();
			}
			
			if (this.$().length > 0) {
				this.$().jqPaginator("option", {
			    	currentPage: iCurrentPage
				});
			}
		}
		
		this.setProperty("currentPage", iCurrentPage);
		
		return this;
	};
	
	CustomPaginator.prototype.setNumberOfPages = function(iPages) {
		
		var iTotalPages = iPages;
		if (this._inited) {
			if (iPages < 1 ) {
				iTotalPages = 0;
			}
			
			if (iTotalPages > 0 && this.$().length > 0) {
				this.$().jqPaginator("option", {
			    	totalPages: iTotalPages
				});
			}
		}
		
		this.setProperty("numberOfPages", iPages);
		
		return this;
	};
	
	CustomPaginator.prototype.onBeforeRendering = function(oEvent) {
		this._inited = false;
		var iCurrentPage = this.getCurrentPage();
		if (iCurrentPage < 1 ) {
			iCurrentPage = 1;
		} else if (iCurrentPage > this.getNumberOfPages()) {
			iCurrentPage = this.getNumberOfPages();
		}
		this.setCurrentPage(iCurrentPage);	
	};
	
	CustomPaginator.prototype.onAfterRendering = function(oEvent) {
		if (this.getNumberOfPages() > 0) {
			var first = this.getNumberOfPages() > 5 ? '<li class="first"><a href="javascript:void(0);">«<\/a><\/li>' : "";
			var last = this.getNumberOfPages() > 5 ? '<li class="last"><a href="javascript:void(0);">»<\/a><\/li>' : "";
			this.$().jqPaginator({
			    totalPages: this.getNumberOfPages(),
			    visiblePages: 5,
			    currentPage: this.getCurrentPage(),
			    first: first,
			    prev: '<li class="prev"><a href="javascript:void(0);">‹<\/a><\/li>',
			    next: '<li class="next"><a href="javascript:void(0);">›<\/a><\/li>',
			    last: last,
			    page: '<li class="page"><a href="javascript:void(0);">{{page}}<\/a><\/li>',
			    onPageChange: function (num, type) {
			    	this.setProperty("currentPage", num, true);
			    	this.firePage({
			    		targetPage: num
			    	});
					Log.debug('Current Page: ' + num);
				}.bind(this)
			});
			
			this._inited = true;
		}
		
	};
	
	return CustomPaginator;
}, true);