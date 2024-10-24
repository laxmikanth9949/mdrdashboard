/**
 * MCCAuthHelper Module
 * 
 * @author Marvin Hoffmann, MCC Automation, SAP
 * @version 2.1
 * @since 2022-08-10
 * @updated 2023-08-09 redirect approach with APIM session check
 * @updated 2023-09-20 use authUrl from APIM mccsessioninfo endpoint instead of hardcoded mccauth utility url
 *
 * @alias MCCAuthHelper
 * 
 * Use instructions:
 * Prerequisite:
 * - ensure that you have the ext_mcc_apim destination via route "/apim" added to your application
 * 
 *  You can manually (via MCCAuthHelper.isUserServerSessionStillValid()) and then initiate an authorization method, or you can use simply the authorize() method...
 * 		 * sample call:
		 * 
		 * 		MCCAuthHelper.authorize()
				.done(function() {
					//authorization successful, or user session still valid... call ServiceNow URLs now...
				})
				.fail(function(error) {
					//error handling here, show an error message to the user
					//this should only happen if the isUserServerSessionStillValid() method is running into an error
				});
 *
 * further details in our wiki: https://github.tools.sap/mcc/mcc-ui5-authtester/wiki/MCCAuthHelper
 * **/
				sap.ui.define(function() {
					"use strict";
					
					/**
					 * Logger function for logging errors to console
					 * **/
					function logError(text) {
						
						sap.ui.require(["sap/base/Log"], async function(Log){
							
							Log.error("MCCAuthHelper", text);
						});
					}
					
					/**
					 * Logger function to log debug messages
					 * 
					 * To display info logs in console, open Support Assistant (Ctrl + Alt + Shift + P) and activate "use debug sources" check box
					 * **/
					function logInfo(text) {
						
						sap.ui.require(["sap/base/Log"], async function(Log){
							
							Log.info("MCCAuthHelper", text);
						});
						
					}
				
					var Module = {
						
						/**
						 * Add here the App-specific identifier that is used to identifying the source application
						 **/
						getAppIdentifier: function() {
							
							return "FiZyusTKckAGBGC6VR5jAfCfuJAjuiNZ";
							
						},
				
						/**
						 * Return the app-specific URL (required for calling destinations), specifically for Cloud Foundry apps in launchpad
						 * 
						 * 
						 * **/
						getAppURL: function() {
							
							var appWindowUrl = new URL(window.location.href);
				
							var appUrl = appWindowUrl.origin + appWindowUrl.pathname.substring(0, appWindowUrl.pathname.lastIndexOf("/")); //remove everything behind the last slash (e.g. remove index.html)
				
							if (appUrl.includes("/webapp")) {
								//fix for webide
								appUrl = appUrl.substring(0, appUrl.lastIndexOf("/webapp"));
							}
				
							return appUrl;
				
						},
				
						
						/**
						 * Convenient function. 
						 * Method will check whether the user has a valid session (send a request to APIM via isUserServerSessionStillValid method). If yes, then directly resolve, otherwise initiate Authentication redirect  flow.
						 * With this the promise should never fail (as this would trigger the redirect flow...)
						 * 
						 * @return promise that is resolved in case user session is available
						 * 
						 * sample call:
						 * 
						 * 		MCCAuthHelper.authorize()
								.done(function() {
									//call ServiceNow URLs...
								})
								.fail(function(error) {
									//error handling here, show an error message to the user
									//this should only happen if the isUserServerSessionStillValid method is running into en error
								});
						 * 
						 * **/
						 authorize: function() {
							 
							 var that = this;
							 var d = jQuery.Deferred();
							 logInfo("checking authorization for HCSM integration...");
							 
							 this.isUserServerSessionStillValid()
								.done(function() {
									d.resolve();
								})                         	
								.fail(function(error, data) {
									
									if ("No valid session" === error) {
										logInfo("Server Session not valid, thus initiating Authorization flow via redirect...");
										that.authorizeUserForServiceNowViaRedirect(data.authurl);
									} else {
										//we have an error during session-check
										d.reject(error);
									}
								});
								
							return d.promise();
				
						 },
						
						/**
						 * Method is used to perform the authorization for ServiceNow via browser redirect.
						 * The redirect url (mccauth utility) is called via destination and is then forwarding the request:
						 * 
						 * @param authUrl the environment-specific url of the MCCAuth utility (if not available, url will be dynamically retrieved from mccsessioninfo endpoint)
						 * 
						 * DEV: https://mccauth-ssn8r5sjsj.dispatcher.hana.ondemand.com
						 * TEST: https://mccauth-a44f228ad.dispatcher.hana.ondemand.com
						 * PROD: https://mccauth-a87daa223.dispatcher.hana.ondemand.com
						 * 
						 * **/
						authorizeUserForServiceNowViaRedirect: function(authUrl) {
				
							var that = this;
							var fullWindowURLEncoded = encodeURIComponent(window.location.href);
							var urlToCall = "";
				
							if (authUrl !== "" && authUrl !== undefined && authUrl !== null) {
				
								urlToCall = authUrl + "?mcctool=" + fullWindowURLEncoded;
								logInfo("Redirect URL: " + urlToCall);
										
								//window.top.location.replace(urlToCall);
								//window.top.location.href = urlToCall; //does not work in cFLP
								
								$('<a id="mccauthlink" />').attr('href', urlToCall).attr('target', '_top').text('MCC Authentication').appendTo('body').get(0).click();
				
							} else {
								//retrieve auth url from APIM
								$.ajax({
									method: "GET",
									url: that.getAppURL() + "/apim/hcsm/mccsessioninfo",
									beforeSend: function (xhr) {
											xhr.setRequestHeader("AppIdentifier", that.getAppIdentifier());
								  }
								  }).done(function(data) {
								  
									  if (data !== "" && data !== undefined && data !== null) {
										  
										  if (data.authurl !== undefined) {
											  
											urlToCall = data.authurl + "?mcctool=" + fullWindowURLEncoded;
											logInfo("Redirect URL: " + data.authurl);
											
											$('<a id="mccauthlink" />').attr('href', urlToCall).attr('target', '_top').text('MCC Authentication').appendTo('body').get(0).click();
										  } 
									  } else {
										  logError("Method authorizeUserForServiceNowViaRedirect() failed. Data Parsing Error");
									  }
									  
								  }).fail(function (data, textStatus, jqXHR){
									  
									  //construct error
									  var errMsg = "ERROR";
									  if (jqXHR === "") {
										  errMsg = "ERROR! \n\nHTTP Status Code: " + data.status + " " + data.statusText + "\n\n" + "Response Text: \n" + data.responseText;
									  } else  {
										  errMsg = "ERROR! \n\nHTTP Status Code: " + jqXHR.status + "\n\n" + "Response Text: \n" + JSON.stringify(data);
									  }
									  
									  logError("Method isUserServerSessionStillValid() failed. Request failed: " + errMsg);
								  });
							  }
				
						},	
						
						/**
						 * Method is used to check whether the user needs a new ID token. 
						 * The OAuth refresh token is valid for 12 hours, afterwards the browser has to request a new token.
						 * 
						 * The method will send a request to MCC APIM in order to validate whether there is still a token cached.
						 * @return a promise that resolves, in case MCC APIM confirms that there is still a cached token, otherwise rejects with the error message and data object (with data.authurl you can receive the mccauth url)
						 * **/
						isUserServerSessionStillValid: function() {
							
							var that = this;
							var d = jQuery.Deferred();
				
							  $.ajax({
							  method: "GET",
							  url: that.getAppURL() + "/apim/hcsm/mccsessioninfo",
							  beforeSend: function (xhr) {
									  xhr.setRequestHeader("AppIdentifier", that.getAppIdentifier());
							}
							}).done(function(data) {
							
								if (data !== "" && data !== undefined && data !== null) {
									
									if (data.session !== undefined) {
										
										if (data.session === "true") {
											logInfo("Session is still valid!");
											d.resolve(data);
										} else {
											logInfo("No valid session");
											d.reject("No valid session", data);
										}
									} 
								} else {
									logError("Method isUserServerSessionStillValid() failed. Data Parsing Error");
									d.reject("Method isUserServerSessionStillValid() failed. Data Parsing Error");
								}
								
							}).fail(function (data, textStatus, jqXHR){
								
								//construct error
								var errMsg = "ERROR";
								if (jqXHR === "") {
									errMsg = "ERROR! \n\nHTTP Status Code: " + data.status + " " + data.statusText + "\n\n" + "Response Text: \n" + data.responseText;
								} else  {
									errMsg = "ERROR! \n\nHTTP Status Code: " + jqXHR.status + "\n\n" + "Response Text: \n" + JSON.stringify(data);
								}
								
								logError("Method isUserServerSessionStillValid() failed. Request failed: " + errMsg);
								d.reject("Method isUserServerSessionStillValid() failed. Request failed: " + errMsg);
							});
							
							return d.promise();
						}
					};
				
					return Module;
				
				}, /* bExport= */ true);