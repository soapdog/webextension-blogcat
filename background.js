

// Check for <link rel="blogroll">

console.log("starting")

function onError(error) {
  console.log(`Error: ${error}`);
}

function pageActionToggle(tabId, changeInfo, tabInfo) {


	function onExecuted(result) {
		let res = result[0].result
	  console.log(`exec`, result[0]);

	  if (res.atom || res.rss || res.blogroll) {
	  	browser.pageAction.show(tabId)
	  } else {
	  	browser.pageAction.hide(tabId)
	  }
	}

	

	if (changeInfo.status === "complete") {
		const executing = browser.scripting.executeScript({
	      target: {
	        tabId: tabId,
	      },
	      files: ["/detect.js"],
	    });
		executing.then(onExecuted, onError);
	}

}

// background-script.js
function handleMessage(request, sender, sendResponse) {

	console.log("getting info for tab", request.tab)

	function onExecuted(result) {
		let res = result[0].result

		console.log("sending response",res)

	  	sendResponse(res)

	}


	const executing = browser.scripting.executeScript({
      target: {
        tabId: request.tab,
      },
      files: ["/detect.js"],
    });
	executing.then(onExecuted, onError);
	
	return true
}

browser.runtime.onMessage.addListener(handleMessage);

browser.tabs.onUpdated.addListener(pageActionToggle)