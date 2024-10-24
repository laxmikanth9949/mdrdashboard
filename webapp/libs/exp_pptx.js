/**
 * generate PPTX files 
 */

var pptx_one_point = 12700;
var pptx_one_cm = 360000;

var pptx_table_style_none_no_grid	= "{2D5ABB26-0587-4C30-8999-92F81FD0307C}";
var pptx_table_style_none_with_grid	= "{5940675A-B579-460E-94D1-54222C63F5DA}";
var pptx_table_style_theme1_accent1	= "{3C2FFA5D-87B4-456A-9821-1D502468CF0F}";
var pptx_table_style_theme1_accent2	= "{284E427A-3D55-4303-BF80-6455036E1DE7}";
var pptx_table_style_theme1_accent3	= "{69C7853C-536D-4A76-A0AE-DD22124D55A5}";
var pptx_table_style_theme1_accent4	= "{775DCB02-9BB8-47FD-8907-85C794F793BA}";
var pptx_table_style_theme1_accent5	= "{35758FB7-9AC5-4552-8A53-C91805E547FA}";
var pptx_table_style_theme1_accent6	= "{08FB837D-C827-4EFA-A057-4D05807E0F7C}";
var pptx_table_style_theme2_accent1	= "{D113A9D2-9D6B-4929-AA2D-F23B5EE8CBE7}";
var pptx_table_style_theme2_accent2	= "{18603FDC-E32A-4AB5-989C-0864C3EAD2B8}";
var pptx_table_style_theme2_accent3	= "{306799F8-075E-4A3A-A7F6-7FBC6576F1A4}";
var pptx_table_style_theme2_accent4	= "{E269D01E-BC32-4049-B463-5C60D7B0CCD2}";
var pptx_table_style_theme2_accent5	= "{327F97BB-C833-4FB7-BDE5-3F7075034690}";
var pptx_table_style_theme2_accent6	= "{638B1855-1B75-4FBE-930C-398BA8C253C6}";
var pptx_table_style_light1			= "{9D7B26C5-4107-4FEC-AEDC-1716B250A1EF}";
var pptx_table_style_light1_accent1	= "{3B4B98B0-60AC-42C2-AFA5-B58CD77FA1E5}";
var pptx_table_style_light1_accent2	= "{0E3FDE45-AF77-4B5C-9715-49D594BDF05E}";
var pptx_table_style_light1_accent3	= "{C083E6E3-FA7D-4D7B-A595-EF9225AFEA82}";
var pptx_table_style_light1_accent4	= "{D27102A9-8310-4765-A935-A1911B00CA55}";
var pptx_table_style_light1_accent5	= "{5FD0F851-EC5A-4D38-B0AD-8093EC10F338}";
var pptx_table_style_light1_accent6	= "{68D230F3-CF80-4859-8CE7-A43EE81993B5}";
var pptx_table_style_light2			= "{7E9639D4-E3E2-4D34-9284-5A2195B3D0D7}";
var pptx_table_style_light2_accent1	= "{69012ECD-51FC-41F1-AA8D-1B2483CD663E}";
var pptx_table_style_light2_accent2	= "{72833802-FEF1-4C79-8D5D-14CF1EAF98D9}";
var pptx_table_style_light2_accent3	= "{F2DE63D5-997A-4646-A377-4702673A728D}";
var pptx_table_style_light2_accent4	= "{17292A2E-F333-43FB-9621-5CBBE7FDCDCB}";
var pptx_table_style_light2_accent5	= "{5A111915-BE36-4E01-A7E5-04B1672EAD32}";
var pptx_table_style_light2_accent6	= "{912C8C85-51F0-491E-9774-3900AFEF0FD7}";
var pptx_table_style_light3			= "{616DA210-FB5B-4158-B5E0-FEB733F419BA}";
var pptx_table_style_light3_accent1	= "{BC89EF96-8CEA-46FF-86C4-4CE0E7609802}";
var pptx_table_style_light3_accent2	= "{5DA37D80-6434-44D0-A028-1B22A696006F}";
var pptx_table_style_light3_accent3	= "{8799B23B-EC83-4686-B30A-512413B5E67A}";
var pptx_table_style_light3_accent4	= "{ED083AE6-46FA-4A59-8FB0-9F97EB10719F}";
var pptx_table_style_light3_accent5	= "{BDBED569-4797-4DF1-A0F4-6AAB3CD982D8}";
var pptx_table_style_light3_accent6	= "{E8B1032C-EA38-4F05-BA0D-38AFFFC7BED3}";
var pptx_table_style_med1			= "{793D81CF-94F2-401A-BA57-92F5A7B2D0C5}";
var pptx_table_style_med1_accent1	= "{B301B821-A1FF-4177-AEE7-76D212191A09}";
var pptx_table_style_med1_accent2	= "{9DCAF9ED-07DC-4A11-8D7F-57B35C25682E}";
var pptx_table_style_med1_accent3	= "{1FECB4D8-DB02-4DC6-A0A2-4F2EBAE1DC90}";
var pptx_table_style_med1_accent4	= "{1E171933-4619-4E11-9A3F-F7608DF75F80}";
var pptx_table_style_med1_accent5	= "{FABFCF23-3B69-468F-B69F-88F6DE6A72F2}";
var pptx_table_style_med1_accent6	= "{10A1B5D5-9B99-4C35-A422-299274C87663}";
var pptx_table_style_med2			= "{073A0DAA-6AF3-43AB-8588-CEC1D06C72B9}";
var pptx_table_style_med2_accent1	= "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}";
var pptx_table_style_med2_accent2	= "{21E4AEA4-8DFA-4A89-87EB-49C32662AFE0}";
var pptx_table_style_med2_accent3	= "{F5AB1C69-6EDB-4FF4-983F-18BD219EF322}";
var pptx_table_style_med2_accent4	= "{00A15C55-8517-42AA-B614-E9B94910E393}";
var pptx_table_style_med2_accent5	= "{7DF18680-E054-41AD-8BC1-D1AEF772440D}";
var pptx_table_style_med2_accent6	= "{93296810-A885-4BE3-A3E7-6D5BEEA58F35}";
var pptx_table_style_med3			= "{8EC20E35-A176-4012-BC5E-935CFFF8708E}";
var pptx_table_style_med3_accent1	= "{6E25E649-3F16-4E02-A733-19D2CDBF48F0}";
var pptx_table_style_med3_accent2	= "{85BE263C-DBD7-4A20-BB59-AAB30ACAA65A}";
var pptx_table_style_med3_accent3	= "{EB344D84-9AFB-497E-A393-DC336BA19D2E}";
var pptx_table_style_med3_accent4	= "{EB9631B5-78F2-41C9-869B-9F39066F8104}";
var pptx_table_style_med3_accent5	= "{74C1A8A3-306A-4EB7-A6B1-4F7E0EB9C5D6}";
var pptx_table_style_med3_accent6	= "{2A488322-F2BA-4B5B-9748-0D474271808F}";
var pptx_table_style_med4			= "{D7AC3CCA-C797-4891-BE02-D94E43425B78}";
var pptx_table_style_med4_accent1	= "{69CF1AB2-1976-4502-BF36-3FF5EA218861}";
var pptx_table_style_med4_accent2	= "{8A107856-5554-42FB-B03E-39F5DBC370BA}";
var pptx_table_style_med4_accent3	= "{0505E3EF-67EA-436B-97B2-0124C06EBD24}";
var pptx_table_style_med4_accent4	= "{C4B1156A-380E-4F78-BDF5-A606A8083BF9}";
var pptx_table_style_med4_accent5	= "{22838BEF-8BB2-4498-84A7-C5851F593DF1}";
var pptx_table_style_med4_accent6	= "{16D9F66E-5EB9-4882-86FB-DCBF35E3C3E4}";
var pptx_table_style_dark1			= "{8EC20E35-A176-4012-BC5E-935CFFF8708E}";
var pptx_table_style_dark1_accent1	= "{125E5076-3810-47DD-B79F-674D7AD40C01}";
var pptx_table_style_dark1_accent2	= "{37CE84F3-28C3-443E-9E96-99CF82512B78}";
var pptx_table_style_dark1_accent3	= "{D03447BB-5D67-496B-8E87-E561075AD55C}";
var pptx_table_style_dark1_accent4	= "{E929F9F4-4A8F-4326-A1B4-22849713DDAB}";
var pptx_table_style_dark1_accent5	= "{8FD4443E-F989-4FC4-A0C8-D5A2AF1F390B}";
var pptx_table_style_dark1_accent6	= "{AF606853-7671-496A-8E4F-DF71F8EC918B}";
var pptx_table_style_dark2			= "{5202B0CA-FC54-4496-8BCA-5EF66A818D29}";
var pptx_table_style_dark2_accent1_2= "{0660B408-B3CF-4A94-85FC-2B1E0A45F4A2}";
var pptx_table_style_dark2_accent3_4= "{91EBBBCC-DAD2-459C-BE2E-F6DE35CF9A28}";
var pptx_table_style_dark2_accent5_6= "{46F890A9-2807-4EBB-B81D-B2AA78EC7F39}";

function PPTX_textElement(aText, aSize) {
	this.text = aText===undefined?"":aText;
	this.size = aSize;
	this.bold = undefined;
	this.fill = undefined;
	// add further options like style (bold, italic, ...) or enumeration

	this.setBold = function(aBold) {
		this.bold = aBold;
	};
	
	this.setSize = function(aSize) {
		this.size = aSize;
	};
	
	this.setFill = function(aFill) {
		this.fill = aFill;
	};
	
	this.generate = function() {
		var node; // generic object
		
		var res = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:r");

		node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:rPr");
		node.setAttribute("lang", "en-US");
		node.setAttribute("dirty", "0");
		node.setAttribute("smtClean", "0");
		if (this.size) node.setAttribute("sz", this.size*100);
		if (this.bold!=undefined) node.setAttribute("b", this.bold?"1":"0");
		res.appendChild(node);
		
		if (this.fill!=undefined) node.appendChild(this.fill.generate());

		node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:t");
		node.appendChild(document.createTextNode(this.text));
		res.appendChild(node);
		
		return res;
	};
};

function PPTX_textBlock(aText, aSize) {
	this.texts = [];
	this.alignment = undefined;	// 0: left, 1: center, 2: right, 3: block
	
	this.addText = function(aText, aSize) {
		var elem = new PPTX_textElement(aText, aSize);
		this.texts[this.texts.length] = elem;
		return elem;
	};
	
	this.setAlignment = function(aAlign) {
		this.alignment = aAlign;
	};
	
	this.generate = function() {
		var node; // generic object
		
		var res = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:p");
		if (this.alignment!=undefined) {
			var node_pPr = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:pPr");
			var val;
			switch (this.alignment) {
				case 0: val = "l"; break;
				case 1: val = "ctr"; break;
				case 2: val = "r"; break;
				case 3: val = "blk"; break;
				default: val = "l"; break;
			};
			node_pPr.setAttribute("algn", val)
			res.appendChild(node_pPr);
		};
		
		for (var i in this.texts) {
			node = this.texts[i].generate();
			res.appendChild(node);
		};
		
		return res;
	};

	if (aText!=undefined) this.addText(aText, aSize);
};

function PPTX_textBody() {
	this.text_blocks = [];
	this.textbox = {
			v_align : undefined,	// 0: top, 1: middle, 2: bottom, 3: top centered, 4: middle centered, 5: bottom centered
			text_direction : undefined,	// 0: horizontal, 1: 90Â°, 2: 270Â°, 3: stacked
			autofit : undefined,	// 0: no autofit, 1: shrink on overflow, 2: resize shape to fit text
			margins : {
				left : undefined,
				right: undefined,
				top: undefined,
				bottom: undefined,
			},
		};

	this.addTextBlock = function(aText, aSize) {
		var bl = new PPTX_textBlock(aText, aSize);
		this.text_blocks[this.text_blocks.length] = bl;
		return bl;
	};
	
	this.setTextBox = function(aVAlign, aTextDirection, aAutofit, aMargins) {
		if (aVAlign!=undefined) this.textbox.v_align = aVAlign;
		if (aTextDirection!=undefined) this.textbox.text_direction = aTextDirection;
		if (aAutofit!=undefined) this.textbox.autofit = aAutofit;
		if (aMargins!=undefined) {
			if (this.textbox.margins==undefined) {
				this.textbox.margins = {left : undefined, right: undefined, top: undefined, bottom: undefined};
			}
			if (aMargins.left!=undefined) this.textbox.margins.left = aMargins.left;
			if (aMargins.right!=undefined) this.textbox.margins.right = aMargins.right;
			if (aMargins.top!=undefined) this.textbox.margins.top = aMargins.top;
			if (aMargins.bottom!=undefined) this.textbox.margins.bottom = aMargins.bottom;
		};
	};
	
	this.generate = function(aIsCell) {
		var node_txBody;
		if (aIsCell) {
			node_txBody = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:txBody");
		} else {
			node_txBody = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:txBody");
		};
		
		var node_bodyPr = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:bodyPr");
		node_bodyPr.setAttribute("wrap", "none");
		node_bodyPr.setAttribute("rtlCol", "0");
		if (this.textbox.margins!=undefined) {
			if (this.textbox.margins.left!=undefined) node_bodyPr.setAttribute("lIns", this.textbox.margins.left);
			if (this.textbox.margins.top!=undefined) node_bodyPr.setAttribute("tIns", this.textbox.margins.top);
			if (this.textbox.margins.right!=undefined) node_bodyPr.setAttribute("rIns", this.textbox.margins.right);
			if (this.textbox.margins.bottom!=undefined) node_bodyPr.setAttribute("bIns", this.textbox.margins.bottom);
		}
		
		if (this.textbox.text_direction!=undefined) {
			var val;
			switch (this.textbox.text_direction) {
				case 1: val = "vert"; break;
				default: val = "horz"; break;
			};
			node_bodyPr.setAttribute("vert", val);
		};
		
		if (this.textbox.v_align!=undefined) {
			var val;
			switch (this.textbox.v_align) {
				case 0: val = "t"; break;
				case 2: val = "b"; break;
				default: val = "ctr"; break;
			};
			node_bodyPr.setAttribute("anchor", val);
		};

		node_txBody.appendChild(node_bodyPr);

		if (this.textbox.autofit!=undefined) {
			switch (this.textbox.autofit) {
				case 1: {
					node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:spAutoFit");
					break;
				}
				case 2: {
					node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:normAutofit");
					break;
				}
				default: {
					node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:noAutofit");
					break;
				}
			};
			node_bodyPr.appendChild(node);
		};

		node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:lstStyle");
		node_txBody.appendChild(node);
		
		if (this.text_blocks.length>0) {
			for (var i_texts in this.text_blocks) {
				node = this.text_blocks[i_texts].generate();
				node_txBody.appendChild(node);
			};
		} else {
			// create one empty entry
			node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:p");
			node_txBody.appendChild(node);
		}

		return node_txBody;
	};
};

function PPTX_tableColumn(aText) {
	this.textbody = null;
	this.width = undefined;
	this.gridSpan = undefined;
	this.merge = undefined;
	this.fill = undefined;
	this.textbox = {
			v_align : undefined,	// 0: top, 1: middle, 2: bottom, 3: top centered, 4: middle centered, 5: bottom centered
			text_direction : undefined,	// 0: horizontal, 1: 90Â°, 2: 270Â°, 3: stacked
			margins : {
				left : undefined,
				right: undefined,
				top: undefined,
				bottom: undefined,
			},
		};
	this.lines = [{code: "lnL", width: undefined, style: undefined, use_scheme_color: undefined,	color: undefined},	// left
	              {code: "lnR", width: undefined, style: undefined, use_scheme_color: undefined,	color: undefined},	// right
	              {code: "lnT", width: undefined, style: undefined, use_scheme_color: undefined,	color: undefined},	// top
	              {code: "lnB", width: undefined, style: undefined, use_scheme_color: undefined,	color: undefined},	// bottom
	              {code: "lnTlToBr", width: undefined, style: undefined, use_scheme_color: undefined,	color: undefined},	// Tl to Br
	              {code: "lnBlToTr", width: undefined, style: undefined, use_scheme_color: undefined,	color: undefined}];	// Bl to Tr

	this.getTextBody = function() {
		if (!this.textbody) this.textbody = new PPTX_textBody();
		return this.textbody;
	};
	
	this.addTextBlock = function(aText, aSize) {
		if (!this.textbody) this.textbody = new PPTX_textBody();
		return this.textbody.addTextBlock(aText, aSize);
	};
	
	this.setTextBox = function(aVAlign, aTextDirection, aMargins) {
		if (aVAlign!=undefined) this.textbox.v_align = aVAlign;
		if (aTextDirection!=undefined) this.textbox.text_direction = aTextDirection;
		if (aMargins!=undefined) {
			if (this.textbox.margins==undefined) {
				this.textbox.margins = {left : undefined, right: undefined, top: undefined, bottom: undefined};
			}
			if (aMargins.left!=undefined) this.textbox.margins.left = aMargins.left;
			if (aMargins.right!=undefined) this.textbox.margins.right = aMargins.right;
			if (aMargins.top!=undefined) this.textbox.margins.top = aMargins.top;
			if (aMargins.bottom!=undefined) this.textbox.margins.bottom = aMargins.bottom;
		};
	};

	this.setWidth = function(aWidth) {
		this.width = aWidth;
	};
	
	this.clearLines = function() {
		for (var l in this.lines) this.lines[l].width=0;
	};
	
	this.setGridSpan = function(aGridSpan) {
		this.gridSpan = aGridSpan;
	};

	this.setMerge = function(aMerge) {
		this.merge = aMerge;
	};
	
	this.setFill = function(aFill) {
		this.fill = aFill;
	};

	this.generate = function() {
		var node_col = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:tc");
		
		if (this.gridSpan!=undefined) node_col.setAttribute("gridSpan", this.gridSpan);
		if (this.merge!=undefined) node_col.setAttribute("hMerge", this.merge?"1":"0");

		if (this.textbody) {
			node_col.appendChild(this.textbody.generate(true));
		};
		
		var node_tcPr = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:tcPr");
		node_col.appendChild(node_tcPr);
		if (this.textbox.margins!=undefined) {
			if (this.textbox.margins.left!=undefined) node_tcPr.setAttribute("marL", this.textbox.margins.left);
			if (this.textbox.margins.top!=undefined) node_tcPr.setAttribute("marT", this.textbox.margins.top);
			if (this.textbox.margins.right!=undefined) node_tcPr.setAttribute("marR", this.textbox.margins.right);
			if (this.textbox.margins.bottom!=undefined) node_tcPr.setAttribute("marB", this.textbox.margins.bottom);
		};
		
		if (this.fill!=undefined) node_tcPr.appendChild(this.fill.generate());
		
		for (var l in this.lines) {
			if (this.lines[l].width===undefined) continue;
			var node_line = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:"+this.lines[l].code);
			node_tcPr.appendChild(node_line);
			
			if (this.lines[l].width==0) {
				var node_fill = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:noFill");
				node_line.appendChild(node_fill);
			};
		};

		return node_col;
	};
	
	if (aText!=undefined) this.addTextBlock(aText)
};

function PPTX_tableRow() {
	this.columns = [];
	this.height = undefined;	// 370840;

	this.addTableColumn = function(aText) {
		var col = new PPTX_tableColumn(aText);
		this.columns[this.columns.length] = col;
		return col;
	};
	
	this.setHeight = function(aHeight) {
		this.height = aHeight;
	};
	
	this.generate = function() {
		var node_row = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:tr");
		if (this.height===undefined) this.height = pptx_one_cm;	// 1cm
		node_row.setAttribute("h", this.height);
//		if (this.height!=undefined) node_row.setAttribute("h", this.height);
		
		// now columns
		for (var i in this.columns) {
			var col = this.columns[i];
			node_row.appendChild(col.generate());
		};
		
		return node_row;
	};
};

function PPTX_fill(aFillType, aUseSchemeColor, aColor, aTransparency) {
	this.type 				= 0;	// 0: no fill; 1: solid fill; 2: gradient fill; 3: pic or text fill; 4: pattern; 5: slide background
	this.use_scheme_color 	= true;
	this.color 				= "accent1";
	this.transparency 		= 0;

	this.setFill = function(aFillType, aUseSchemeColor, aColor, aTransparency) {
		this.type = aFillType===undefined?0:aFillType;
		this.use_scheme_color = aUseSchemeColor===undefined?true:aUseSchemeColor;
		this.color = aColor===undefined?"accent1":aColor;
		this.transparency = aTransparency===undefined?0:aTransparency;
	};
	
	this.generate = function() {
		var node_fill;
		switch (this.type) {
			case 0: {	// no fill
				node_fill = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:noFill");
				break;
			}
			case 1: {	// solid fill
				node_fill = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:solidFill");
				var node_col;
				if (this.use_scheme_color) {
					node_col = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:schemeClr");
					node_col.setAttribute("val", this.color);
				} else {
					node_col = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:srgbClr");
					node_col.setAttribute("val", this.color);
				};
				if (this.transparency!=0) {
					var node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:alpha");
					var i = (100-this.transparency)*1000;
					node.setAttribute("val", i)
					node_col.appendChild(node);
				}
				node_fill.appendChild(node_col);
				break;
			}
		};
		
		return node_fill;
	};
	
	this.setFill(aFillType, aUseSchemeColor, aColor, aTransparency);
};

function PPTX_element(x, y, cx, cy) {
	this.style = undefined;
	this.position = {
		x: x===undefined?50:x,
		y: y===undefined?50:y,
	};
	this.size = {
		width: cx===undefined?500:cx,
		height: cy===undefined?500:cy,
	};
	this.fill = new PPTX_fill();
	this.outline = {
		width: 0,	// e.g. 0.5 for 1/2pt; 1 for 1 pt; ...
		use_scheme_color : true,
		color : "tx1",
	}
	
	this.standard_type = 0;	// nothing specific
	this.type = 0;	// 0: standard element, 1: picture, 2: table
	this.index = 0;
	this.picture_uri = "";
	this.extension = "";
	this.relID = 0;
	this.textbody = null;
	this.table = {
		rows		: [],
		banded_rows	: undefined,
		header_row	: undefined,
	};
	this.geometry = "rect";
	
	this.addTextBlock = function(aText, aSize) {
		if (!this.textbody) this.textbody = new PPTX_textBody();
		return this.textbody.addTextBlock(aText, aSize);
	};
	
	this.setStandardType = function(aStandardType) {	// 0: nothing specific; 1: title; 2: body; 3: ...
		this.standard_type = aStandardType===undefined?0:aStandardType;
	};
	
	this.setStyle = function(aStyle) {
		this.style=aStyle;
	};
	
	this.setType = function(aType) {		// 0: standard element, 1: picture, 2: table
		this.type = aType===undefined?0:aType;
	};
	
	this.setIndex = function(aIndex) {
		this.index = aIndex;
	};
	
	this.setPosition = function(aX, aY) {
		this.position.x = aX===undefined?0:aX;
		this.position.y = aY===undefined?0:aY;
	};
	
	this.setSize = function(aWidth, aHeight) {
		this.size.width = aWidth===undefined?500:aWidth;
		this.size.height = aHeight===undefined?500:aHeight;
	};
	
	this.setOutline = function(aWidth, aUseSchemeColor, aColor) {
		this.outline.width = aWidth===undefined?0:aWidth;
		this.outline.use_scheme_color = aUseSchemeColor===undefined?true:aUseSchemeColor;
		this.outline.color = aColor===undefined?"accent1":aColor;
	};
	
	this.setTextBox = function(aVAlign, aTextDirection, aAutofit, aMargins) {
		if (!this.textbody) this.textbody = new PPTX_textBody();
		this.textbody.setTextBox(aVAlign, aTextDirection, aAutofit, aMargins);
	};
	
	this.setPictureURI = function(aPictureURI) {
		this.picture_uri = aPictureURI;
		this.getPictureExtension();
	};
	
	this.getPictureExtension = function() {
		var i = this.picture_uri.lastIndexOf(".");
		if (i==-1) {
			this.extension = "";
			return;
		};
		
		this.extension = this.picture_uri.substring(i+1, 99);
	};
	
	this.addTableRow = function() {
		var row = new PPTX_tableRow();
		this.table.rows[this.table.rows.length] = row;
		return row;
	};
	
	this.distributeTableRows = function(aSizeCm) {
		var r_height = Math.round(aSizeCm / this.table.rows.length * pptx_one_cm);
		for (var i in this.table.rows) this.table.rows[i].setHeight(r_height);
	};

	this.distributeTableCols = function(aSizeCm) {	// distribute columns evenly based on first row
		if (this.table.rows.length==0) return;
		var r_width = Math.round(aSizeCm / this.table.rows[0].columns.length * pptx_one_cm);
		for (var i in this.table.rows[0].columns) this.table.rows[0].columns[i].setWidth(r_width);
	};
	
	this.setGeometry = function(aGeom) {
		this.geometry = aGeom;
	};

	this.generate = function(aID) {
		var node; // generic object
		
		var res;
		switch (this.type) {
			case 1: {	// picture
				res = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:pic"); 

				var node_nvSpPr = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:nvPicPr");
				res.appendChild(node_nvSpPr);

				var node_blipFill = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:blipFill");
				res.appendChild(node_blipFill);
				
				node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:blip");
				node.setAttribute("r:embed", "rId"+this.relID);
				node_blipFill.appendChild(node);
				
				var node_stretch = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:stretch");
				node_blipFill.appendChild(node_stretch);

				node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:fillRect");
				node_stretch.appendChild(node);

				break;
			}
			case 2: {	// table
				res = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:graphicFrame"); 

				var node_nvSpPr = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:nvGraphicFramePr");
				res.appendChild(node_nvSpPr);

				break;				
			}
			default: {
				res = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:sp"); 
				
				var node_nvSpPr = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:nvSpPr");
				res.appendChild(node_nvSpPr);

				break;
			}
		};
		
		var node = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:cNvPr");
		node.setAttribute("id", aID);
		node.setAttribute("name", "element_"+aID);
		node_nvSpPr.appendChild(node);
		
		switch (this.type) {
			case 1: {	// picture
				var node_cNvPicPr = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:cNvPicPr");
				node_nvSpPr.appendChild(node_cNvPicPr);

				node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:picLocks");
				node.setAttribute("noChangeAspect", "1");
				node_cNvPicPr.appendChild(node);
				break;
			}
			case 2: {	// table;
				var node_cNvGraphicFramePr = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:cNvGraphicFramePr");
				node_nvSpPr.appendChild(node_cNvGraphicFramePr);

				node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:graphicFrameLocks");
				node.setAttribute("noGrp", "1");
				node_cNvGraphicFramePr.appendChild(node);
				break;				
			}
			default: {
				var node = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:cNvSpPr");
				node_nvSpPr.appendChild(node);
				break;
			}
		};
		
		var node_nvPr = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:nvPr");
		node_nvSpPr.appendChild(node_nvPr);
		
		if (this.standard_type!=0) {
			var node = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:ph");
			switch(this.standard_type) {
				case 1: node.setAttribute("type", "title"); break;
				case 2: node.setAttribute("type", "body"); node.setAttribute("sz", "quarter"); break;
			};
			node_nvPr.appendChild(node);
			
			if (this.index!=0) node.setAttribute("idx", this.index); 
		};

		if (this.type!=2) {	// not for tables
			var node_spPr = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:spPr");
			res.appendChild(node_spPr);

			// in case the element references one of the template components (title, body, ...) 
			if ((this.standard_type==0) && (this.index==0)) {
				var node_xfrm = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:xfrm");
				node_spPr.appendChild(node_xfrm);

				node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:off");
				node.setAttribute("x", this.position.x);
				node.setAttribute("y", this.position.y);
				node_xfrm.appendChild(node);

				node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:ext");
				node.setAttribute("cx", this.size.width);
				node.setAttribute("cy", this.size.height);
				node_xfrm.appendChild(node);

				var node_prstGeom = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:prstGeom");
				node_prstGeom.setAttribute("prst", this.geometry);
				node_spPr.appendChild(node_prstGeom);

				var node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:avLst");
				node_prstGeom.appendChild(node);
			}

			node_spPr.appendChild(this.fill.generate());

			if (this.outline.width>0) {
				var node_ln = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:ln");
				node_ln.setAttribute("w", Math.round(this.outline.width*pptx_one_point));

				node_fill = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:solidFill");
				node_ln.appendChild(node_fill);
				if (this.outline.use_scheme_color) {
					var node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:schemeClr");
					node.setAttribute("val", this.outline.color);
				} else {
					var node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:srgbClr");
					node.setAttribute("val", this.outline.color);
				};
				node_fill.appendChild(node);

				node_spPr.appendChild(node_ln);			
			};
		} else {	// for tables
			var node_xfrm = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:xfrm");
			res.appendChild(node_xfrm);

			node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:off");
			node.setAttribute("x", this.position.x);
			node.setAttribute("y", this.position.y);
			node_xfrm.appendChild(node);

			node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:ext");
			node.setAttribute("cx", this.size.width);
			node.setAttribute("cy", this.size.height);
			node_xfrm.appendChild(node);
			
			var node_graphic = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:graphic");
			res.appendChild(node_graphic);

			var node_graphicData = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:graphicData");
			node_graphicData.setAttribute("uri", "http://purl.oclc.org/ooxml/drawingml/table");
			node_graphic.appendChild(node_graphicData);

			var node_tbl = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:tbl");
			node_graphicData.appendChild(node_tbl);
			
			if (this.style!=undefined) {
				var node_tblPr = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:tblPr");
				node_tbl.appendChild(node_tblPr);
				
				if (this.table.banded_rows!=undefined) node_tblPr.setAttribute("bandRow", this.table.banded_rows?"1":"0");
				if (this.table.header_row!=undefined) node_tblPr.setAttribute("firstRow", this.table.header_row?"1":"0");

				var node_tableStyleId = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:tableStyleId");
				node_tblPr.appendChild(node_tableStyleId);
				node_tableStyleId.appendChild(document.createTextNode(this.style));
			};
			
			var node_tblGrid = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:tblGrid");
			node_tbl.appendChild(node_tblGrid);
			if (this.table.rows.length>0) {
				for (var i in this.table.rows[0].columns) {
					node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:gridCol");
					if (this.table.rows[0].columns[i].width===undefined) this.table.rows[0].columns[i].width = 3*pptx_one_cm;	// default 3cm
					node.setAttribute("w", this.table.rows[0].columns[i].width);
					node_tblGrid.appendChild(node);
				}
			}

			// now rows
			for (var i in this.table.rows) {
				var row = this.table.rows[i];
				node_tbl.appendChild(row.generate());
			}
		};
		
		if (this.textbody) {
			res.appendChild(this.textbody.generate());
		}
		
		return res;
	};
};

function PPTX_slide() {
	this.content = [];
	this.layout = 1;
	
	this.addContent = function(x, y, cx, cy) {
		var elem = new PPTX_element(x, y, cx, cy); 
		this.content[this.content.length] = elem;
		return elem;
	};
	
	this.addPicture = function(aURI, x, y, cx, cy) {
		var elem = new PPTX_element(x, y, cx, cy);
		elem.setType(1);	// picture
		elem.setPictureURI(aURI);
		this.content[this.content.length] = elem;

		return elem;
	};
	
	this.addTable = function(x, y, cx, cy) {
		var elem = new PPTX_element(x, y, cx, cy);
		elem.setType(2);	// table
		this.content[this.content.length] = elem;

		return elem;
	};
	
	this.setLayout = function(aLayoutId) {
		this.layout = aLayoutId;
	};
	
	this.generate = function() {
		var node;	// generic object
		
		var xml = document.implementation.createDocument("","", null);
		xml.xmlEncoding="utf-8";
		xml.xmlVersion="1.0";
		var root = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main","p:sld");
		root.setAttribute("xmlns:a", "http://purl.oclc.org/ooxml/drawingml/main");
		root.setAttribute("xmlns:r", "http://purl.oclc.org/ooxml/officeDocument/relationships");
		
		// generate slide node
		var node_slide = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:cSld");
		root.appendChild(node_slide);

		var node_tree = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:spTree");
		node_slide.appendChild(node_tree);

		var node_tree1 = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:nvGrpSpPr");
		node_tree.appendChild(node_tree1);
		
		node = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:cNvPr");
		node.setAttribute("id", "1");
		node.setAttribute("name", "");
		node_tree1.appendChild(node);

		node = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:cNvGrpSpPr");
		node_tree1.appendChild(node);
		
		node = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:nvPr");
		node_tree1.appendChild(node);

		var node_tree2 = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:grpSpPr");
		node_tree.appendChild(node_tree2);
		
		var node_xfrm = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:xfrm");
		node_tree2.appendChild(node_xfrm);
		
		node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:off");
		node.setAttribute("x", "0");
		node.setAttribute("y", "0");
		node_xfrm.appendChild(node);

		node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:ext");
		node.setAttribute("cx", "0");
		node.setAttribute("cy", "0");
		node_xfrm.appendChild(node);

		node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:chOff");
		node.setAttribute("x", "0");
		node.setAttribute("y", "0");
		node_xfrm.appendChild(node);
		
		node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:chExt");
		node.setAttribute("cx", "0");
		node.setAttribute("cy", "0");
		node_xfrm.appendChild(node);
		
		for (var i_content in this.content) {
			// add content nodes
			node = this.content[i_content].generate(i_content);
			node_tree.appendChild(node);
		};
		
		var node_clrMapOvr = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:clrMapOvr");
		root.appendChild(node_clrMapOvr);

		node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:masterClrMapping");
		node_clrMapOvr.appendChild(node);
		
		var node_timing = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:timing");
		root.appendChild(node_timing);
		
		var node_tnLst = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:tnLst");
		root.appendChild(node_tnLst);
		
		var node_par = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:par");
		node_tnLst.appendChild(node_par);
		
		node = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:cTn");
		node.setAttribute("id", "1");
		node.setAttribute("dur", "indefinite");
		node.setAttribute("restart", "never");
		node.setAttribute("nodeType", "tmRoot");
		node_par.appendChild(node);

		xml.appendChild(root);
		return('<?xml version="1.0" encoding="utf-8" standalone="yes"?>'+new XMLSerializer().serializeToString(xml));
	}
	
};

function PPTX_Generator(template_uri) {
	this.template_uri = template_uri || "";
	this.slides = [];
	this.title = "Short Presentation Title";
	
	this.addSlide = function() {
		var aSlide = new PPTX_slide();
		this.slides[this.slides.length] = aSlide;
		return aSlide;
	};
	
	this.setTitle = function(aTitle) {
		this.title = aTitle;
	};

	this.generate = function(fct_finish, oController) {
		// if nobody want's to know the result, we do nothing
		if (fct_finish===undefined) return;
		
		// create zip file
		var zip = new JSZip();
		var calls = 0;
		var rel_count = 1;
		var rel_root;
		var sldMasterId = 0;
		var sldId = 0;
		var notesMasterId = 0;
		var notesSlideId = 0;		
		var slideLayoutId = 0;
		var slidesId = 0;
		
		checkAllBack = function() {
			calls--;
			if (calls==0) fct_finish(zip.generate({type:"string"}));
		};
		
		var templ_copy = [{folder: "fonts", count: 0, prefix: "font", extension: "fntdata", rels: false, contentType: ""},
		                  {folder: "handoutMasters", count: 0, prefix: "handoutMaster", extension: "xml", rels: false, contentType: "application/vnd.openxmlformats-officedocument.presentationml.handoutMaster+xml"},
		                  {folder: "media", count: 0, prefix: "image", extension: "png", rels: false, contentType: ""},
//		                  {folder: "media", count: 0, prefix: "image", extension: "jpeg", rels: false, contentType: ""},
		                  {folder: "notesMasters", count: 0, prefix: "notesMaster", extension: "xml", rels: false, contentType: "application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"},
		                  {folder: "notesSlides", count: 0, prefix: "notesSlide", extension: "xml", rels: false, contentType: "application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"},
		                  {folder: "slideLayouts", count: 0, prefix: "slideLayout", extension: "xml", rels: false, contentType: "application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"},
		                  {folder: "slideMasters", count: 0, prefix: "slideMaster", extension: "xml", rels: false, contentType: "application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"},
		                  {folder: "slides", count: 0, prefix: "slide", extension: "xml", rels: false, contentType: "application/vnd.openxmlformats-officedocument.presentationml.slide+xml"},
		                  {folder: "theme", count: 0, prefix: "theme", extension: "xml", rels: false, contentType: "application/vnd.openxmlformats-officedocument.theme+xml"},
		                  ];
		
		$.ajax({
			url: template_uri + "/template_info.xml", 
			dataType : "xml",
			async : false,
			cache : false,
			success: function(data) {
				var node;
				for (var i in templ_copy) {
					node = data.getElementsByTagName(templ_copy[i].folder)[0];
					if (!node) continue;
					
					var c = node.getAttribute("count");
					if (c) templ_copy[i].count = parseInt(c);
					var r = node.getAttribute("rels");
					if (r) templ_copy[i].rels  = parseInt(r);
				}
			}, 
			error: function() {
				// couldn't retrieve information for this specific template file
			},
		} );

		getTemplateContent = function(what, where, text) {
			calls++;
			text = text || true;

			$.ajax({
				url: what, 
				dataType : "text",
				cache: false,
				beforeSend: function( xhr ) {	// read the raw-data
				    xhr.overrideMimeType("text/plain; charset=x-user-defined");
				},
				success: function(data) {

					data = oController.replacePPT(data);

					zip.file(where, data, {binary: true});
					checkAllBack();
				}, 
				error: function() {
					// couldn't retrieve this specific template file
					checkAllBack();
				},
			} );
		};

		addRelationshipEntry = function(aType, aTarget) {
			var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationship")
			rel_root.appendChild(node);
			
			node.setAttribute("Id", "rId"+parseInt(rel_count));
			rel_count++;
			
			node.setAttribute("Type", aType);
			node.setAttribute("Target", aTarget);
		};
		
		addContentTypeEntry = function(aPartName, aContentType) {
			var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/content-types", "Override")
			cont_root.appendChild(node);
			
			node.setAttribute("PartName", aPartName);
			node.setAttribute("ContentType", aContentType);
		};

		
		
		// add slides to the zip file
		for (var i_slide in this.slides) {
			// generate rels-file
			var xml = document.implementation.createDocument("","", null);
			xml.xmlEncoding="UTF-8";
			xml.xmlVersion="1.0";
			
			var relsl_root = document.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationships");
			xml.appendChild(relsl_root);

			var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationship")
			node.setAttribute("Id", "rId1");
			node.setAttribute("Type", "http://purl.oclc.org/ooxml/officeDocument/relationships/slideLayout");
			node.setAttribute("Target", "../slideLayouts/slideLayout"+this.slides[i_slide].layout+".xml");
			relsl_root.appendChild(node);

			var i_pic = 2;
			for (var i_elem in this.slides[i_slide].content) {
				if (this.slides[i_slide].content[i_elem].type!=1) continue;	// only pics relevant

				var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationship")
				this.slides[i_slide].content[i_elem].relID = i_pic;
				node.setAttribute("Id", "rId"+parseInt(i_pic));
				
				node.setAttribute("Type", "http://purl.oclc.org/ooxml/officeDocument/relationships/image");
				node.setAttribute("Target", "../media/z_image_"+parseInt(i_slide)+"_"+parseInt(i_pic)+"."+this.slides[i_slide].content[i_elem].extension);
				relsl_root.appendChild(node);

				i_pic++;
			};

			var i=parseInt(i_slide)+1;
			zip.file("ppt/slides/_rels/slide"+i+".xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+new XMLSerializer().serializeToString(xml));
			
			// generate slide itself
			var s = this.slides[i_slide].generate();
			zip.file("ppt/slides/slide"+i+".xml", s);
		}
		
				
		// generate releationship xml
//		var xml = document.implementation.createDocument("","", null);
//		xml.xmlEncoding="utf-8";
//		xml.xmlVersion="1.0";
//		
//		var rel_root = document.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationships");
//		xml.appendChild(rel_root);
//		
//		rel_count = 1;
//		for (var i in templ_copy) {
//			var templ = templ_copy[i];
//			
//			for (var j=1; j<=templ.count; j++) {
//				if ((sldMasterId==0) && (templ.folder=="slideMasters")) sldMasterId = parseInt(rel_count);
//				if ((notesMasterId==0) && (templ.folder=="notesMasters")) notesMasterId = parseInt(rel_count);
//				if ((notesSlideId==0) && (templ.folder=="notesSlides")) notesSlideId = parseInt(rel_count);
//				if ((slideLayoutId==0) && (templ.folder=="slideLayouts")) slideLayoutId = parseInt(rel_count);
//				if ((sldId==0) && (templ.folder=="slides")) sldId = parseInt(rel_count);
//				if((j==1 ||templ.folder=="slides") && templ.folder!="notesSlides" && templ.folder!="slideLayouts" && templ.folder!="media") 
//					addRelationshipEntry("http://schemas.openxmlformats.org/officeDocument/2006/relationships/"+templ.prefix, templ.folder+"/"+templ.prefix+parseInt(j)+"."+templ.extension);
//			};
//		};
//		
//		// slides
//		for (var i_slide in this.slides) {
//			var i=parseInt(i_slide)+1;
//			if (sldId==0) sldId = parseInt(rel_count);
//			addRelationshipEntry("http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide", "slides/slide"+i+".xml");
//		}
//		// viewProps, ...
//		addRelationshipEntry("http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps", "viewProps.xml");
//		addRelationshipEntry("http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps", "presProps.xml");
//		addRelationshipEntry("http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles", "tableStyles.xml");
		
//		zip.file("ppt/_rels/presentation.xml.rels", '<?xml version="1.0" encoding="utf-8" standalone="yes"?>'+new XMLSerializer().serializeToString(xml));
		
		// generate [Content_Types].xml
		var xml = document.implementation.createDocument("","", null);
		xml.xmlEncoding="utf-8";
		xml.xmlVersion="1.0";
		
		var cont_root = document.createElementNS("http://schemas.openxmlformats.org/package/2006/content-types", "Types");
		xml.appendChild(cont_root);

		var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/content-types", "Default")
		node.setAttribute("Extension", "png");
		node.setAttribute("ContentType", "image/png");
		cont_root.appendChild(node);

		var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/content-types", "Default")
		node.setAttribute("Extension", "jpeg");
		node.setAttribute("ContentType", "image/jpeg");
		cont_root.appendChild(node);
		
		var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/content-types", "Default")
		node.setAttribute("Extension", "rels");
		node.setAttribute("ContentType", "application/vnd.openxmlformats-package.relationships+xml");
		cont_root.appendChild(node);
		
		var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/content-types", "Default")
		node.setAttribute("Extension", "xml");
		node.setAttribute("ContentType", "application/xml");
		cont_root.appendChild(node);
		
//		var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/content-types", "Default")
//		node.setAttribute("Extension", "fntdata");
//		node.setAttribute("ContentType", "application/x-fontdata");
//		cont_root.appendChild(node);
		
		addContentTypeEntry("/ppt/commentAuthors.xml", "application/vnd.openxmlformats-officedocument.presentationml.commentAuthors+xml");
		addContentTypeEntry("/ppt/presentation.xml", "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml");
		addContentTypeEntry("/ppt/presProps.xml", "application/vnd.openxmlformats-officedocument.presentationml.presProps+xml");
		addContentTypeEntry("/ppt/viewProps.xml", "application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml");
		addContentTypeEntry("/ppt/tableStyles.xml", "application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml");
		addContentTypeEntry("/docProps/core.xml", "application/vnd.openxmlformats-package.core-properties+xml");
		addContentTypeEntry("/docProps/app.xml", "application/vnd.openxmlformats-officedocument.extended-properties+xml");
		addContentTypeEntry("/docProps/custom.xml", "application/vnd.openxmlformats-officedocument.custom-properties+xml");

		for (var i in templ_copy) {
			var templ = templ_copy[i];
			if (templ.contentType=="") continue;
			
			for (var j=1; j<=templ.count; j++) {

				addContentTypeEntry("/ppt/"+templ.folder+"/"+templ.prefix+parseInt(j)+"."+templ.extension, templ.contentType);
			};
		};
		
		// slides
		for (var i_slide in this.slides) {
			var i=parseInt(i_slide)+1;
			if (sldId==0) sldId = parseInt(rel_count);
			addContentTypeEntry("/ppt/slides/slide"+i+".xml", "application/vnd.openxmlformats-officedocument.presentationml.slide+xml");
		}

		zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="utf-8" standalone="yes"?>'+new XMLSerializer().serializeToString(xml));

		getTemplateContent(this.template_uri + "/ppt/_rels/presentation.xml.rels", "ppt/_rels/presentation.xml.rels")
		getTemplateContent(this.template_uri + "/ppt/presentation.xml", "ppt/presentation.xml")
		
		// generate presentation.xml
//		var xml = document.implementation.createDocument("","", null);
//		xml.xmlEncoding="utf-8";
//		xml.xmlVersion="1.0";
//		
//		var pres_root = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:presentation");
//		pres_root.setAttribute("xmlns:a", "http://purl.oclc.org/ooxml/drawingml/main");
//		pres_root.setAttribute("xmlns:r", "http://purl.oclc.org/ooxml/officeDocument/relationships");
//		pres_root.setAttribute("saveSubsetFonts", "1");
//		pres_root.setAttribute("conformance", "strict");
//		xml.appendChild(pres_root);
//		
//		if (sldMasterId!=0) {
//			var node_sldMasterIdLst = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:sldMasterIdLst");
//			pres_root.appendChild(node_sldMasterIdLst);
//			
//			var node = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:sldMasterId");
//			node.setAttribute("id", "2147483648");
//			node.setAttributeNS("http://purl.oclc.org/ooxml/officeDocument/relationships", "r:id", "rId"+sldMasterId);
//			node_sldMasterIdLst.appendChild(node);
//		};
//		
//		if (notesMasterId!=0) {
//			var node_nodesMasterIdLst = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:notesMasterIdLst");
//			pres_root.appendChild(node_nodesMasterIdLst);
//			
//			var node = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:notesMasterId");
//			node.setAttributeNS("http://purl.oclc.org/ooxml/officeDocument/relationships", "r:id", "rId"+notesMasterId);
//			node_nodesMasterIdLst.appendChild(node);
//		};
//		
//		
//		if (notesSlideId!=0) {
//			var node_nodesSlideIdLst = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:notesSlideIdLst");
//			pres_root.appendChild(node_nodesSlideIdLst);
//			
//			var node = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:notesSlideId");
//			node.setAttributeNS("http://purl.oclc.org/ooxml/officeDocument/relationships", "r:id", "rId"+notesSlideId);
//			node_nodesSlideIdLst.appendChild(node);
//		};
//		
//		if (slideLayoutId!=0) {
//			var node_slideLayoutIdIdLst = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:slideLayoutIdIdLst");
//			pres_root.appendChild(node_slideLayoutIdIdLst);
//			
//			var node = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:slideLayoutId");
//			node.setAttributeNS("http://purl.oclc.org/ooxml/officeDocument/relationships", "r:id", "rId"+slideLayoutId);
//			node_slideLayoutIdIdLst.appendChild(node);
//		};
//		
//
//		if (sldId!=0) {
//			var node_sldIdLst = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:sldIdLst");
//			pres_root.appendChild(node_sldIdLst);
//			
//			for (var i_slide in this.slides) {
//				var node = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:sldId");
//				var i = 256 + parseInt(i_slide);
//				node.setAttribute("id", i);
//				node.setAttributeNS("http://purl.oclc.org/ooxml/officeDocument/relationships", "r:id", "rId"+parseInt(sldId));
//				node_sldIdLst.appendChild(node);
//				sldId++;
//			};
//		};
//
//		var node = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:sldSz");
//		node.setAttribute("cx", "12192000");
//		node.setAttribute("cy", "6858000");
//		pres_root.appendChild(node);
//
//		var node = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:notesSz");
//		node.setAttribute("cx", "6858000");
//		node.setAttribute("cy", "9144000");
//		pres_root.appendChild(node);
//
//		var node_defaultTextStyle = document.createElementNS("http://purl.oclc.org/ooxml/presentationml/main", "p:defaultTextStyle");
//		pres_root.appendChild(node_defaultTextStyle);
//
//		var node_defPPr = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:defPPr");
//		node_defaultTextStyle.appendChild(node_defPPr);
//
//		var node = document.createElementNS("http://purl.oclc.org/ooxml/drawingml/main", "a:defRPr");
//		node.setAttribute("lang", "en-US");
//		node_defaultTextStyle.appendChild(node);
//
//		zip.file("ppt/presentation.xml", '<?xml version="1.0" encoding="utf-8" standalone="yes"?>'+new XMLSerializer().serializeToString(xml));

		// now copy all the template stuff
//		getTemplateContent(this.template_uri + "/[Content_Types].xml", "[Content_Types].xml")
		getTemplateContent(this.template_uri + "/ppt/commentAuthors.xml", "ppt/commentAuthors.xml")
		getTemplateContent(this.template_uri + "/ppt/presProps.xml", "ppt/presProps.xml")
		getTemplateContent(this.template_uri + "/ppt/tableStyles.xml", "ppt/tableStyles.xml")
		getTemplateContent(this.template_uri + "/ppt/viewProps.xml", "ppt/viewProps.xml")
//		getTemplateContent(this.template_uri + "/docProps/thumbnail.jpeg", "docProps/thumbnail.jpeg")
		
		
		getTemplateContent(this.template_uri + "/docProps/app.xml", "docProps/app.xml")

		
		// generate docProps\app.xml
//		var xml = document.implementation.createDocument("","", null);
//		xml.xmlEncoding="utf-8";
//		xml.xmlVersion="1.0";
//		
//		var app_root = document.createElementNS("http://purl.oclc.org/ooxml/officeDocument/extendedProperties", "Properties");
//		app_root.setAttribute("xmlns:vt", "http://purl.oclc.org/ooxml/officeDocument/docPropsVTypes");
//		xml.appendChild(app_root);

//		var node = document.createElementNS("http://purl.oclc.org/ooxml/officeDocument/extendedProperties", "Template");
//		node.appendChild(document.createTextNode("0"));
//		app_root.appendChild(node);
//
//		node = document.createElementNS("http://purl.oclc.org/ooxml/officeDocument/extendedProperties", "TotalTime");
//		node.appendChild(document.createTextNode("Microsoft Office PowerPoint"));
//		app_root.appendChild(node);
//
//		node = document.createElementNS("http://purl.oclc.org/ooxml/officeDocument/extendedProperties", "Words");
//		node.appendChild(document.createTextNode("Custom"));
//		app_root.appendChild(node);
//
//		node = document.createElementNS("http://purl.oclc.org/ooxml/officeDocument/extendedProperties", "Application");
//		node.appendChild(document.createTextNode(this.slides.length));
//		app_root.appendChild(node);
//
//		node = document.createElementNS("http://purl.oclc.org/ooxml/officeDocument/extendedProperties", "PresentationFormat");
//		node.appendChild(document.createTextNode(this.slides.length));
//		app_root.appendChild(node);
//
//		node = document.createElementNS("http://purl.oclc.org/ooxml/officeDocument/extendedProperties", "Paragraphs");
//		node.appendChild(document.createTextNode("0"));
//		app_root.appendChild(node);
//
//		node = document.createElementNS("http://purl.oclc.org/ooxml/officeDocument/extendedProperties", "Slides");
//		node.appendChild(document.createTextNode("false"));
//		app_root.appendChild(node);
//
//		node = document.createElementNS("http://purl.oclc.org/ooxml/officeDocument/extendedProperties", "Notes");
//		node.appendChild(document.createTextNode("SAP"));
//		app_root.appendChild(node);
//
//		node = document.createElementNS("http://purl.oclc.org/ooxml/officeDocument/extendedProperties", "HiddenSlides");
//		node.appendChild(document.createTextNode("false"));
//		app_root.appendChild(node);
//
//		node = document.createElementNS("http://purl.oclc.org/ooxml/officeDocument/extendedProperties", "MMClips");
//		node.appendChild(document.createTextNode("false"));
//		app_root.appendChild(node);
//
//		node = document.createElementNS("http://purl.oclc.org/ooxml/officeDocument/extendedProperties", "ScaleCrop");
//		node.appendChild(document.createTextNode("false"));
//		app_root.appendChild(node);
//
//		node = document.createElementNS("http://purl.oclc.org/ooxml/officeDocument/extendedProperties", "HeadingPairs");
//		node.appendChild(document.createTextNode("15.000"));
//		app_root.appendChild(node);

//		zip.file("docProps/app.xml", '<?xml version="1.0" encoding="utf-8" standalone="yes"?>'+new XMLSerializer().serializeToString(xml));
		
		
		getTemplateContent(this.template_uri + "/docProps/core.xml", "docProps/core.xml")
		
		// generate docProps\core.xml
//		var xml = document.implementation.createDocument("","", null);
//		xml.xmlEncoding="utf-8";
//		xml.xmlVersion="1.0";
//		
//		var core_root = document.createElementNS("http://schemas.openxmlformats.org/package/2006/metadata/core-properties", "cp:coreProperties");
//		core_root.setAttribute("xmlns:dc", "http://purl.org/dc/elements/1.1/");
//		core_root.setAttribute("xmlns:dcterms", "http://purl.org/dc/terms/");
//		core_root.setAttribute("xmlns:dcmitype", "http://purl.org/dc/dcmitype/");
//		core_root.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
//		xml.appendChild(core_root);
//
//		var node = document.createElementNS("http://purl.org/dc/elements/1.1/", "dc:title");
//		node.appendChild(document.createTextNode(this.title));
//		core_root.appendChild(node);
//
//		node = document.createElementNS("http://purl.org/dc/elements/1.1/", "dc:creator");
//		node.appendChild(document.createTextNode("SAP SE"));
//		core_root.appendChild(node);
//
//		node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/metadata/core-properties", "cp:revision");
//		node.appendChild(document.createTextNode("1"));
//		core_root.appendChild(node);
//
//		zip.file("docProps/core.xml", '<?xml version="1.0" encoding="utf-8" standalone="yes"?>'+new XMLSerializer().serializeToString(xml));

		
		getTemplateContent(this.template_uri + "/docProps/custom.xml", "docProps/custom.xml")
		
		// generate docProps\custom.xml
//		var xml = document.implementation.createDocument("","", null);
//		xml.xmlEncoding="utf-8";
//		xml.xmlVersion="1.0";
//		
//		var custom_root = document.createElementNS("http://purl.oclc.org/ooxml/officeDocument/customProperties", "Properties");
//		custom_root.setAttribute("xmlns:vt", "http://purl.oclc.org/ooxml/officeDocument/docPropsVTypes");
//		xml.appendChild(custom_root);
//
//		zip.file("docProps/custom.xml", '<?xml version="1.0" encoding="utf-8" standalone="yes"?>'+new XMLSerializer().serializeToString(xml));
		
		// generate _rels\.rels
		var xml = document.implementation.createDocument("","", null);
		xml.xmlEncoding="utf-8";
		xml.xmlVersion="1.0";
		
		var rels_root = document.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationships");
		xml.appendChild(rels_root);

		var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationship");
		node.setAttribute("Id", "rId3");
		node.setAttribute("Type", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties");
		node.setAttribute("Target", "docProps/app.xml");
		rels_root.appendChild(node);
		
		var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationship");
		node.setAttribute("Id", "rId2");
		node.setAttribute("Type", "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties");
		node.setAttribute("Target", "docProps/core.xml");
		rels_root.appendChild(node);
		
		var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationship");
		node.setAttribute("Id", "rId1");
		node.setAttribute("Type", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument");
		node.setAttribute("Target", "ppt/presentation.xml");
		rels_root.appendChild(node);
		
		var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationship");
		node.setAttribute("Id", "rId4");
		node.setAttribute("Type", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties");
		node.setAttribute("Target", "docProps/custom.xml");
		rels_root.appendChild(node);


//		var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationship");
//		node.setAttribute("Id", "rId2");
//		node.setAttribute("Type", "http://purl.oclc.org/ooxml/officeDocument/relationships/metadata/thumbnail");
//		node.setAttribute("Target", "docProps/thumbnail.jpeg");
//		rels_root.appendChild(node);
//
//		var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationship");
//		node.setAttribute("Id", "rId3");
//		node.setAttribute("Type", "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties");
//		node.setAttribute("Target", "docProps/core.xml");
//		rels_root.appendChild(node);
//
//		var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationship");
//		node.setAttribute("Id", "rId4");
//		node.setAttribute("Type", "http://purl.oclc.org/ooxml/officeDocument/relationships/extendedProperties");
//		node.setAttribute("Target", "docProps/app.xml");
//		rels_root.appendChild(node);
//
//		var node = document.createElementNS("http://schemas.openxmlformats.org/package/2006/relationships", "Relationship");
//		node.setAttribute("Id", "rId5");
//		node.setAttribute("Type", "http://purl.oclc.org/ooxml/officeDocument/relationships/customProperties");
//		node.setAttribute("Target", "docProps/custom.xml");
//		rels_root.appendChild(node);

		zip.file("_rels/.rels", '<?xml version="1.0" encoding="utf-8" standalone="yes"?>'+new XMLSerializer().serializeToString(xml));
		
		// copy template content
		for (var i in templ_copy) {
			var templ = templ_copy[i];
			
			for (var j=1; j<=templ.count; j++) {
				getTemplateContent(this.template_uri + "/ppt/"+templ.folder+"/"+templ.prefix+parseInt(j)+"."+templ.extension, 
						"ppt/"+templ.folder+"/"+templ.prefix+parseInt(j)+"."+templ.extension);
				
				if (!templ.rels) continue;
				
				getTemplateContent(this.template_uri + "/ppt/"+templ.folder+"/_rels/"+templ.prefix+parseInt(j)+"."+templ.extension+".rels", 
						"ppt/"+templ.folder+"/_rels/"+templ.prefix+parseInt(j)+"."+templ.extension+".rels");
			};
		};
		
		// copy relevant pictures
		
		
		
		
		for (var i_slide in this.slides) {
			var i_pic = 2;
			for (var i_elem in this.slides[i_slide].content) {
				if (this.slides[i_slide].content[i_elem].type!=1) continue;	// only pics relevant
				
				var s = this.slides[i_slide].content[i_elem].picture_uri;
				var ext = this.slides[i_slide].content[i_elem].extension;
				getTemplateContent(this.slides[i_slide].content[i_elem].picture_uri, "ppt/media/z_image_"+parseInt(i_slide)+"_"+parseInt(i_pic)+"."+ext);
				
				i_pic++;
			};
		}
		
		// copy themes
//		for (var i_themes=1; i_themes<=c_themes; i_themes++) {
//			getTemplateContent(this.template_uri + "/ppt/theme/theme"+parseInt(i_themes)+".xml", "ppt/theme/theme"+parseInt(i_themes)+".xml");
//		};
		
	}
}