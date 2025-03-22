import { getAllFeeds, saveFeed } from "./common/dataStorage.js";

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
  console.log("getting info for tab", request.tab.url);

  function onExecuted(result) {
    let res = result[0].result;

    console.log("sending response", res);

    sendResponse(res);
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
    const obj = {
      rss: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    };
    sendResponse(obj);
  }
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

/*
== History observer ===========================================================================================================

Removed history observer cause I'm afraid it will fire on navigation on YouTube and then cause the page action
from the content script to actually switch off.

*/

let channelId;

function onVisited(historyItem) {
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

        channelId = doc
          .querySelector('meta[property="og:url"]')
          .getAttribute("content")
          .split("/")
          .at(4);

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
 */

await clearEmptyTags();
await renameFrequencyToAlways();

browser.runtime.onMessage.addListener(handleMessage);
browser.tabs.onUpdated.addListener(pageActionToggle);
browser.runtime.onInstalled.addListener(installedOrUpdated);
browser.history.onVisited.addListener(onVisited);
initializeContextMenus();
