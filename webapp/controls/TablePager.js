sap.ui.define([
	"sap/ui/base/EventProvider"
],
function (
	EventProvider
) {
	
	var TablePager = EventProvider.extend("corp.sap.mdrdashboards.controls.TablePager", {
		constructor: function(oTable) {
			EventProvider.call(this);
			
			this._oTable = oTable;

			//NOTE: Currently the _rowsUpdated event is only protected
			this._oTable.attachEvent("_rowsUpdated", function() {
				this._updatePageInfo();
			}, this);
			
			this._iCurrentPage = 0;
			this._iPageSize = 0;
			this._iPageCount = 0;
			
			this._updatePageInfo();
		},
		
		getCurrentPage: function() {
			return this._iCurrentPage;
		},
		
		setCurrentPage: function(iPage) {
			if (!this._oTable) {
				return;
			}
			iPage = iPage - 1;
			this._oTable.setFirstVisibleRow(iPage * this._iPageSize);
		},
		
		getPageCount: function() {
			return this._iPageCount;
		},
		
		_updatePageInfo: function() {
			if (!this._oTable) {
				return;
			}
			
			var oBinding = this._oTable.getBinding("rows");
			var iLength = oBinding ? oBinding.getLength() : 0;
			var iVisibleRows = this._oTable.getVisibleRowCount();
			

			var iFirstVisibleRow = this._oTable.getFirstVisibleRow() || 0;
			
			var iPageSize = iVisibleRows;
			var iPageCount = Math.ceil(iLength / iVisibleRows);
			var iCurrentPage = Math.ceil(iFirstVisibleRow / iPageSize) + 1;
			
			
			if (iPageSize != this._iPageSize || iPageCount != this._iPageCount || iCurrentPage != this._iCurrentPage) {
				this._iCurrentPage = iCurrentPage;
				this._iPageSize = iPageSize;
				this._iPageCount = iPageCount;
				this.fireEvent("pagingUpdated");
			}
		},
		
		destroy: function() {
			this._oTable = null;
			sap.ui.base.EventProvider.prototype.destroy.apply(this, arguments);
		},
		
		getInterface: function() { return this; }
	});
	
	return TablePager;
}, true);
