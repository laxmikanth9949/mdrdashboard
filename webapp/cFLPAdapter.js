sap.ui.define([], function () {
    "use strict";

    return {
        init: function (scenario) {
            switch (scenario) {
                case "standalone":
                    this.initStandalone();
                    break;
                case "flp":
                    this.initFLP();
                    break;
                default:
                    this.initStandalone();
            }
        },
        _attachHashChange: function (source, target, fnPrepareHash) {
            source.addEventListener(
                "hashchange",
                (e) => {
                    target.postMessage(
                        JSON.stringify({
                            type: "request",
                            service:
                                "sap.ushell.services.CrossApplicationNavigation.setInnerAppRoute",
                            body: {
                                appSpecificRoute: `&/${fnPrepareHash(
                                    e.newURL
                                )}`,
                            },
                        }),
                        "*"
                    );
                },
                false
            );
        },
        //used in case the app is integrated as standalone app (no flp around)
        initStandalone: function () {
            if (location !== window.parent.location) {
                const targetHash = location.hash.split("&/")[1] || "";
                const splittedHash = location.hash.split("#");
                const currentHash = location.hash.split("#")[1];
                if (targetHash) {
                    location.replace(`#${targetHash}`);
                } else if (!!currentHash && splittedHash.length > 2) {
                    location.replace(`#${currentHash.split("?")[0]}`);
                } else {
                    location.replace("#");
                }

                let prepareHash = (sNewUrl) => {
                    let newHash = sNewUrl.split("#")[1];

                    if (newHash.startsWith("/")) {
                        newHash = newHash.substring(1);
                    }
                    return newHash;
                };
                this._attachHashChange(window, window.parent, prepareHash);
            }
            return this;
        },
        //used in case the app is integrated within an own flp
        initFLP: function () {
            let ownedLocation = window.parent.location;
            let embeddedLocation = window.parent.parent.location;
            if (ownedLocation !== embeddedLocation) {
                let targetHash = ownedLocation.hash.split("&/")[1] || "";
                let splittedHash = ownedLocation.hash.split("#");
                let currentHash = ownedLocation.hash
                    .split("#")[1]
                    .split("?")[0];
                //its not required to replace the hash if the hash is correct => # signs equals 1
                if (splittedHash.length - 1 > 1) {
                    if (targetHash) {
                        window.location.replace(
                            `#${currentHash}&/${targetHash}`
                        );
                    } else {
                        window.location.replace(`#${currentHash}`);
                    }
                }
                let prepareHash = (sNewUrl) => {
                    let newHash = sNewUrl.split("#")[1].split("&/")[1];
                    if (!newHash) newHash = "";
                    if (newHash.startsWith("/")) {
                        newHash = newHash.substring(1);
                    }
                    return newHash;
                };
                this._attachHashChange(
                    window,
                    window.parent.parent,
                    prepareHash
                );
            }
            return this;
        },
    };
});