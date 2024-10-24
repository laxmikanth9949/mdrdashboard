// window.saveAs
// Shims the saveAs method, using saveBlob in IE10.
// And for when Chrome and FireFox get round to implementing saveAs we have their vendor prefixes ready.
// But otherwise this creates a object URL resource and opens it on an anchor tag which contains the "download" attribute (Chrome)
// ... or opens it in a new tab (FireFox)
// @author Andrew Dodson
// @copyright MIT, BSD. Free to clone, modify and distribute for commercial and personal use.


  window.saveAs = (window.navigator.msSaveBlob ? function(b, n) {
    "use strict";
    return window.navigator.msSaveBlob(b, n);
  } : false) || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs || (function() {
    "use strict";
    // URL's
    // window.URL || (window.URL = window.webkitURL);
    if (window.URL) {
      window.URL = window.webkitURL;
    }

    if (!window.URL) {
      return false;
    }

    return function(blob, name) {
      var url = URL.createObjectURL(blob);

      // Test for download link support
      if ("download" in document.createElement("a")) {

        var a = document.createElement("a");
        a.setAttribute("href", url);
        a.setAttribute("download", name);

        // Create Click event
        var clickEvent = document.createEvent("MouseEvent");
        // Test ////////////////////////
        /*
        clickEvent.initMouseEvent("click", true, true, window, 0,
          event.screenX, event.screenY, event.clientX, event.clientY,
          event.ctrlKey, event.altKey, event.shiftKey, event.metaKey,
          0, null);
        */
        clickEvent.initMouseEvent("click", true, true, window, 0,
          1, 1, 1, 1,
          false, false, false, false,
          0, null);  
		// End Test //////////////////////
        // dispatch click event to simulate download
        a.dispatchEvent(clickEvent);

      } else {
        // fallover, open resource in new tab.
        window.open(url, "_blank", "");
      }
    };

  })();

var tableToExcel = (function() {
  "use strict";
  var uri = "data:application/vnd.ms-excel;base64,",
    template = 
    	"<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-" + 
    	"com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'><head><!--[if gte mso 9]>" +
    	"<xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}" + 
    	"</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>" + 
    	"</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}" + 
    	"</table></body></html>",
    base64 = function(s) {
      return window.btoa(unescape(encodeURIComponent(s)));
    },
    format = function(s, c) {
      return s.replace(/{(\w+)}/g, function(m, p) {
        return c[p];
      });
    };

  function b64ToUint6(nChr) {

    return nChr > 64 && nChr < 91 ?
      nChr - 65 : nChr > 96 && nChr < 123 ?
      nChr - 71 : nChr > 47 && nChr < 58 ?
      nChr + 4 : nChr === 43 ?
      62 : nChr === 47 ?
      63 :
      0;

  }

  function base64DecToArr(sBase64, nBlocksSize) {

    var
      sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""),
      nInLen = sB64Enc.length,
      nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2,
      taBytes = new Uint8Array(nOutLen);

    for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
      nMod4 = nInIdx & 3;
      nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
      if (nMod4 === 3 || nInLen - nInIdx === 1) {
        for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
          taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
        }
        nUint24 = 0;

      }
    }

    return taBytes;
  }

  return function(tableId, name) {
  	var table = sap.ui.getCore().byId(tableId).$().find(".sapUiTableCtrl");
    // if (!table.nodeType) {
    //  table = document.getElementById(table);
    	// table = sap.ui.getCore().byId(table).$().find(".sapUiTableCtrl");
    //  table = sap.ui.getCore().byId("excel_download_table").$().find("sap.m.Table")[0];
    // }
    var ctx = {
      worksheet: name || "Worksheet",
      table: table.prevObject.context.innerHTML // Test
    };

    var sBase64Excel = base64(format(template, ctx));
    var oBuffer = base64DecToArr(sBase64Excel).buffer;
    var oBlob = new Blob([oBuffer], {
    //type: "data:application/vnd.ms-excel"
    type: "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    // window.location.href = uri + base64(format(template, ctx));
    // var excel = uri + base64(format(template, ctx));
    // var excel = uri + sBase64Excel;
    // var newWindow = window.open(excel, "newDocument");
    // var newWindow = window.open(excel, "_blank");
    // window.saveAs(oBlob, "download.xls");
    window.saveAs(oBlob, "download.xls");
    
  };
})();