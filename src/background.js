var urlPattern = '*://www.facebook.com/*';

function queryTabsAndShowPageActions(queryObject) {
    chrome.tabs.query(queryObject,
        function(tabs) {
            if (tabs && tabs.length > 0) {
                for (var i = 0; i < tabs.length; i++) {
                    if (tabs[i].status === "complete") chrome.pageAction.show(tabs[i].id);
                }
            }
        }
    );
}

chrome.runtime.onInstalled.addListener(function() {
    queryTabsAndShowPageActions({
        "active": false,
        "currentWindow": true,
        "url": urlPattern
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    queryTabsAndShowPageActions({
        "active": true,
        "currentWindow": true,
        "url": urlPattern
    });
});