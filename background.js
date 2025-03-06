/**
 * Page Action
 * ==================================================
 */

// Check for <link rel="blogroll">

function onError(error) {
  console.log(`Error: ${error}`);
}

function pageActionToggle(tabId, changeInfo, tabInfo) {
  function onExecuted(result) {
    let res = result[0].result;
    // console.log(`exec`, result[0]);

    if (res.atom || res.rss || res.blogroll) {
      browser.pageAction.show(tabId);
    } else {
      browser.pageAction.hide(tabId);
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
  console.log("getting info for tab", request.tab);

  function onExecuted(result) {
    let res = result[0].result;

    console.log("sending response", res);

    sendResponse(res);
  }

  const executing = browser.scripting.executeScript({
    target: {
      tabId: request.tab,
    },
    files: ["/detect.js"],
  });
  executing.then(onExecuted, onError);

  return true;
}

/**
 * Context Menu
 * ==================================================
 */

function onContextMenuCreated() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  } else {
    console.log("Context menu item created successfully");
  }
}

function copyToClipboard(text, html) {
  function oncopy(event) {
    document.removeEventListener("copy", oncopy, true);
    // Hide the event from the page to prevent tampering.
    event.stopImmediatePropagation();

    // Overwrite the clipboard content.
    event.preventDefault();
    event.clipboardData.setData("text/plain", text);
    event.clipboardData.setData("text/html", html);
  }
  document.addEventListener("copy", oncopy, true);

  // Requires the clipboardWrite permission, or a user gesture:
  document.execCommand("copy");
}

function initializeContextMenus() {
  browser.contextMenus.create(
    {
      id: "text-selection-to-clipboard-as-quotation",
      title: "Copy selected text as quotation",
      contexts: ["selection"],
    },
    onContextMenuCreated,
  );

  browser.contextMenus.create(
    {
      id: "page-action-to-clipboard-as-link",
      title: "Copy link to the current page",
      contexts: ["all", "page"],
    },
    onContextMenuCreated,
  );

  browser.contextMenus.create(
    {
      id: "link-to-clipboard-as-link",
      title: "Copy link",
      contexts: ["link"],
    },
    onContextMenuCreated,
  );

  browser.contextMenus.onClicked.addListener(function (info, tab) {
    let template;
    console.dir("info", info);
    switch (info.menuItemId) {
      case "text-selection-to-clipboard-as-quotation":
        let lines = info.selectionText
          .split(`\n`)
          .map((l) => `> ${l}`)
          .join(`\n`);
        template = `${lines}\n>\n> &mdash; _Source: [${tab.title}](${info.pageUrl})_`;
        copyToClipboard(template, template);
        break;
      case "page-action-to-clipboard-as-link":
        template = `[${tab.title}](${tab.url})`;
        copyToClipboard(template, template);
        break;
      case "link-to-clipboard-as-link":
        template = `[${info.linkText}](${info.linkUrl})`;
        copyToClipboard(template, template);
        break;
    }
  });
}

/*
== Update Checker ===========================================================================================================
*/

function installedOrUpdated(details) {
  let url;
  let version = browser.runtime.getManifest().version;
  let previousVersion = details.previousVersion;
  switch (details.reason) {
    case "update":
      if (version !== previousVersion) {
        url = browser.runtime.getURL(
          `/docs/index.html#/release-notes/${version}`,
        );
        browser.tabs.create({
          url: `${url}`,
        });
      }
      break;
    case "install":
      url = browser.runtime.getURL("/docs/index.html#/quickstart");
      browser.tabs.create({
        url: `${url}`,
      });
      break;
  }
}

/**
 * Initialise
 * ==================================================
 */

browser.runtime.onMessage.addListener(handleMessage);
browser.tabs.onUpdated.addListener(pageActionToggle);
browser.runtime.onInstalled.addListener(installedOrUpdated);
initializeContextMenus();
