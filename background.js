import {
  getAllFeeds,
  getLinksForURL,
  saveFeed,
  updateLinkGraph,
} from "./common/dataStorage.js";

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

    // check linkgraph
    getLinksForURL(tabInfo.url).then((links) => {
      console.log(tabInfo.url, links);
      if (links.length > 0) {
        res["linkgraph"] = links;
      }

      if (res.atom || res.rss || res.blogroll || res.linkgraph) {
        browser.pageAction.show(tabId);
      } else {
        browser.pageAction.hide(tabId);
      }
    });
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
  console.log("getting info for tab", request.tab.url);

  function onExecuted(result) {
    let res = result[0].result;

    // check linkgraph
    getLinksForURL(request.tab.url).then((links) => {
      if (links.length > 0) {
        console.log(request.tab.url, links);
        res["linkgraph"] = links;
      }
      console.log("sending response", res);
      sendResponse(res);
    });
  }

  if (!request.tab.url.startsWith("https://www.youtube.com/")) {
    const executing = browser.scripting.executeScript({
      target: {
        tabId: request.tab.id,
      },
      files: ["/detect.js"],
    });
    executing.then(onExecuted, onError);

    return true;
  } else {
    console.log("handling youtube channel for pageAction");
    browser.tabs
      .query({ currentWindow: true, active: true })
      .then(async (tabs) => {
        let tab = tabs[0];
        let channelId;
        const tabId = tab.id;
        // damn youtube complicating things.
        if (tab.url.startsWith("https://www.youtube.com/")) {
          const res = await fetch(tab.url);
          const text = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "text/html");

          let el = doc.querySelector('meta[property="og:url"]');

          if (el !== null) {
            channelId = el.getAttribute("content").split("/").at(4);
          }

          if (channelId) {
            const obj = {
              rss:
                `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
            };
            console.dir("response", obj);
            sendResponse(obj);
          } else {
            console.log("not found");
            sendResponse(null);
            browser.pageAction.hide(tabId);
          }
        }
      });
  }
  return true;
}

/**
 * Context Menu
 * ==================================================
 *
 * Context menus need to be installed only once during the WebExtension install/update
 * event. They are persistent even if the background script is not.
 *
 * The key to making them work was moving the onClicked event listener for the contextMenus
 * to toplevel instead of the onInstalled function callback.
 *
 * Also, even though MDN says "menus" and "contextMenus" are just aliases of each other, I'm
 * seeing "menus" being undefined in runtime and "contextMenus" working.
 */

function onContextMenuCreated() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  } else {
    console.log("Context menu item created successfully");
  }

  return true;
}

async function setClipboard(text) {
  const type = "text/plain";
  const clipboardItemData = {
    [type]: text,
  };
  const clipboardItem = new ClipboardItem(clipboardItemData);
  await navigator.clipboard.write([clipboardItem]);
  console.log(text);
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
}

function handleContextMenu(info, tab) {
  let template;
  console.dir("info", info);
  switch (info.menuItemId) {
    case "text-selection-to-clipboard-as-quotation":
      let lines = info.selectionText
        .split(`\n`)
        .map((l) => `> ${l}`)
        .join(`\n`);
      template =
        `${lines}\n>\n> &mdash; _Source: [${tab.title}](${info.pageUrl})_`;
      setClipboard(template);
      break;
    case "page-action-to-clipboard-as-link":
      template = `[${tab.title}](${tab.url})`;
      setClipboard(template);
      break;
    case "link-to-clipboard-as-link":
      template = `[${info.linkText}](${info.linkUrl})`;
      setClipboard(template);
      break;
  }
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

  // MDN says context menus should only be run one during install. Cue:
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Background_scripts#initialize_the_extension
  initializeContextMenus();

  return true;
}

function aboutToSuspend(details) {
  // background script will unload for who knows the reason.
  console.info("Yo! Background is gonna suspend!");

  return true;
}

/*
== History observer ===========================================================================================================

Removed history observer cause I'm afraid it will fire on navigation on YouTube and then cause the page action
from the content script to actually switch off.

--- potential issue ---
Might be the cause for:
* https://github.com/soapdog/webextension-blogcat/issues/3
* https://github.com/soapdog/webextension-blogcat/issues/2

Manifest v3 WebExtensions background scripts are not persistent. They might be unloaded. Seen the background script
stopped many times. I'm not sure this is the case that is happening but there is a chance that between `onVisited()`
firing and the pageAction sending a message, the background is unloaded or restarted and then `channelId` becomes undefined.

The `onVisited` and `channelId` hack was first done to avoid the latency in UI in the pageAction popup cause the old script
executed an XHR request in the tab to fetch the YouTube HTML for the channel. I  might need to go back into using that slower
code cause it doesn't require the background script to be persistent.

*/

function onVisited(historyItem) {
  let channelId;
  browser.tabs
    .query({ currentWindow: true, active: true })
    .then(async (tabs) => {
      let tab = tabs[0];
      const tabId = tab.id;
      // damn youtube complicating things.
      if (tab.url.startsWith("https://www.youtube.com/")) {
        const res = await fetch(tab.url);
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");

        let el = doc.querySelector('meta[property="og:url"]');

        if (el !== null) {
          channelId = el.getAttribute("content").split("/").at(4);
        }

        if (channelId) {
          browser.pageAction.show(tabId);
        } else {
          browser.pageAction.hide(tabId);
        }
      }
    });
}

/**
 * Migrations
 * ===================================================
 */

async function clearEmptyTags() {
  let feeds = await getAllFeeds();
  for (const feedKey in feeds) {
    let feed = feeds[feedKey];

    if (feed.tags && feed.tags.length > 0) {
      feed.tags = feed.tags.filter((t) => t !== "");
    } else {
      feed.tags = [];
    }
    await saveFeed(feed);
  }
}

async function renameFrequencyToAlways() {
  let feeds = await getAllFeeds();
  for (const feedKey in feeds) {
    let feed = feeds[feedKey];

    if (feed.frequency == "realtime" || feed.frequency == "runtime") {
      feed.frequency = "always";
    }
    await saveFeed(feed);
  }
}

/**
 * Initialise
 * ==================================================
 *
 * All listeners need to be synchronous and toplevel or they won't cause
 * the background to fire back up.
 */

browser.runtime.onMessage.addListener(handleMessage);
browser.tabs.onUpdated.addListener(pageActionToggle);
browser.runtime.onInstalled.addListener(installedOrUpdated);
browser.runtime.onSuspend.addListener(aboutToSuspend);
browser.history.onVisited.addListener(onVisited);
browser.contextMenus.onClicked.addListener(handleContextMenu);

await clearEmptyTags();
await renameFrequencyToAlways();
await updateLinkGraph();
