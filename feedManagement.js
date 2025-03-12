import { getAllFeeds, deleteFeed } from "./common/dataStorage.js";

function exportOPML() {
  const xmlDoc = document.implementation.createDocument(null, "opml");
  const opml = xmlDoc.getElementsByTagName("opml");
  opml[0].setAttribute("version", "2.0");

  const head = xmlDoc.createElement("head");
  opml[0].appendChild(head);

  const body = xmlDoc.createElement("body");
  opml[0].appendChild(body);

  const title = xmlDoc.createElement("title");
  title.innerText = "Exported from BlogCat";
  head.appendChild(title);

  const dateCreated = xmlDoc.createElement("dateCreated");
  dateCreated.innerText = new Date();
  head.appendChild(dateCreated);

  const anyFeedSelected = feeds.some((f) => f.selected);

  const selectedFeeds = anyFeedSelected
    ? feeds.filter((f) => f.selected)
    : feeds;

  selectedFeeds.forEach((feed) => {
    const outline = xmlDoc.createElement("outline");
    outline.setAttribute("text", feed.title);
    outline.setAttribute("title", feed.title);
    outline.setAttribute("xmlUrl", feed.url);
    outline.setAttribute("htmlUrl", feed.web);
    outline.setAttribute("type", "rss");
    body.appendChild(outline);
  });

  const serializer = new XMLSerializer();
  const xmlString = serializer.serializeToString(xmlDoc);

  function onStartedDownload(id) {
    console.log(`Started downloading: ${id}`);
  }

  function onFailed(error) {
    console.log(`Download failed: ${error}`);
  }

  const xmlBlob = new Blob([xmlString], {
    type: "text/x-opml",
  });

  const downloadUrl = URL.createObjectURL(xmlBlob);

  const filename = anyFeedSelected
    ? prompt(
        `You selected feeds to export. Do you want to save the OPML file with a different name? Remember to add the ".opml" extension.`,
        "subscriptions.opml",
      )
    : "subscriptions.opml";

  if (filename == null) {
    return;
  }

  let downloading = browser.downloads.download({
    url: downloadUrl,
    filename,
    conflictAction: "uniquify",
  });

  downloading.then(onStartedDownload, onFailed);
}

const FeedItem = {
  view: (vnode) => {
    let feed = vnode.attrs.feed;
    let title = feed.title ?? feed.url;

    if (title.length == 0) {
      title = feed.url;
    }

    if (feed.errorFetching) {
      title = [
        m("span", title),
        m("small", "  •  "),
        m("mark", "error fetching this feed"),
      ];
    }
    return m("tr", [
      m(
        "td",
        m("input[type=checkbox]", {
          checked: feed.selected,
          oninput: (e) => {
            feed.selected = e.target.checked;
          },
        }),
      ),
      m(
        "td",
        feed?.data?.link
          ? m("a", { href: feed?.data?.link, target: "_blank" }, title)
          : title,
      ),
      m("td", feed.tags ? feed.tags.join(", ") : ""),
      m(
        "td",
        m(
          "button",
          {
            disabled: feed.subscribed,
            onclick: (e) => {
              deleteFeed(feed);
              fetchFeeds();
            },
          },
          feed.subscribed ? "Removed" : "Remove",
        ),
      ),
      m(
        "td",
        m(
          "button",
          {
            onclick: (ev) => {
              browser.tabs.create({
                url: `/addFeed.html?url=${feed.url}`,
              });
            },
            target: "_blank",
          },
          "Edit",
        ),
      ),
    ]);
  },
};

const removeAllSelected = (e) => {
  e.preventDefault();
  e.stopPropagation();
  feeds.forEach((feed) => {
    if (feed.selected) {
      deleteFeed(feed);
    }
  });
  fetchFeeds();
};

const FeedList = {
  view: (vnode) => {
    return m("table", [
      m("thead", [
        m("tr", [
          m(
            "th",
            m("input", {
              type: "checkbox",
              oninput: (e) => {
                feeds.forEach((f) => (f.selected = e.target.checked));
                m.redraw();
              },
            }),
          ),
          m("th", "Title"),
          m("th", "Tags"),
          m(
            "th",
            m(
              "a",
              { href: "#", onclick: removeAllSelected },
              "Remove Selected",
            ),
          ),
          m("th", ""),
        ]),
      ]),
      m(
        "tbody",
        feeds.map((feed) => m(FeedItem, { feed })),
      ),
    ]);
  },
};

const EmptyList = {
  view: (vnode) => {
    let chunk = `
      You have not yet subscribed to any website. You can:
      <ul>
        <li><a href="/docs/index.html#/quickstart">Check out the Getting Started guide.</a></li>
        <li><a href="/docs/index.html#/feeddiscovery">Learn more about feed discovery.</a></li>
        <li><a href="/docs/index.html#/opml">Learn how to import an OPML from another reader.</a></li>
      </ul>
      `;
    return m("p", m.trust(chunk));
  },
};

function showBrokenFeeds() {
  feeds = feeds.filter((f) => f.errorFetching);
}

const Menu = {
  view: (vnode) => {
    return m("nav", [
      m(
        "ul",
        m(
          "li",
          m("div.box", [
            m("img", {
              src: "../icons/cat_computer512c.png",
              class: "cat-icon",
            }),
            m("strong", "Manage Feeds"),
          ]),
        ),
      ),
      m("ul", [
        m("li", m("a", { href: "#", onclick: exportOPML }, "Export OPML")),
        m(
          "li",
          m("a", { href: "#", onclick: showBrokenFeeds }, "Show broken feeds"),
        ),
        m(
          "li",
          m(
            "a",
            { href: "/docs/index.html#/feedmanagement", target: "_blank" },
            "Help",
          ),
        ),
      ]),
    ]);
  },
};

const feedManager = {
  view: (vnode) => {
    return [
      m(Menu),
      m("section", [feeds.length == 0 ? m(EmptyList) : m(FeedList)]),
    ];
  },
};

let feeds = [];

async function fetchFeeds() {
  let feedsObj = await getAllFeeds();

  feeds = Object.keys(feedsObj)
    .map((k) => feedsObj[k])
    .sort((a, b) => a.title.localeCompare(b.title));

  console.log(feeds);
  m.redraw();
}

await fetchFeeds();

const appRoot = document.getElementById("app");

m.route(appRoot, "/feedManager", {
  "/feedManager": feedManager,
});
