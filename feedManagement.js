import {
  getAllFeeds,
  deleteFeed,
  getAllTags,
  saveFeed,
} from "./common/dataStorage.js";

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
    if (feed?.tags) {
      outline.setAttribute(
        "category",
        feed.tags.filter((t) => t.length > 0).join(","),
      );
    }
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
        "blogcat.opml",
      )
    : "blogcat.opml";

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

/*
== Feed Table ===========================================================================================================
*/

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
      m(
        "td",
        feed.tags
          ? feed.tags
              .filter((t) => t.length > 0)
              .sort()
              .join(", ")
          : "",
      ),
      m("td", feed.frequency),
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

const deselectAllFeeds = () => {
  allFeeds.forEach((f) => (f.selected = false));
};

const addTags = (e) => {
  e.preventDefault();
  e.stopPropagation();
  let tags = prompt("Add tags (comma separated)");
  if (tags) {
    let ps = feeds.map((feed) => {
      if (feed.selected) {
        if (!feed.tags) {
          feed.tags = [];
        }
        feed.tags = [...feed.tags, ...tags.split(",").map((t) => t.trim())];
        return saveFeed(feed);
      } else {
        return false;
      }
    });

    Promise.allSettled(ps).then(() => {
      console.log("after adding");
      fetchFeeds();
    });
  }
};

const replaceTags = (e) => {
  e.preventDefault();
  e.stopPropagation();
  let tags = prompt("Replace tags (comma separated)");
  if (tags) {
    let ps = feeds.map((feed) => {
      if (feed.selected) {
        if (!feed.tags) {
          feed.tags = [];
        }
        feed.tags = [...tags.split(",").map((t) => t.trim())];
        return saveFeed(feed);
      }
    });

    Promise.allSettled(ps).then(() => {
      console.log("after replace");
      fetchFeeds();
    });
  }
};

const removeTags = (e) => {
  e.preventDefault();
  e.stopPropagation();
  let tags = prompt("Remove Tags (comma separated)");
  if (tags) {
    let ps = feeds.map((feed) => {
      if (feed.selected) {
        if (feed.tags) {
          let tagsToRemove = tags.split(",").map((t) => t.trim());

          tagsToRemove.forEach((tr) => {
            feed.tags = feed.tags.filter((t) => t !== tr);
          });

          return saveFeed(feed);
        }
      }
    });

    Promise.allSettled(ps).then(() => {
      console.log("after remove");
      fetchFeeds();
    });
  }
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
              checked: feeds.some((f) => f.selected),
              oninput: (e) => {
                feeds.forEach((f) => (f.selected = e.target.checked));
                m.redraw();
              },
            }),
          ),
          m("th", "Title"),
          m("th", "Tags"),
          m("th", "Frequency"),

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

/*
== Tags ===========================================================================================================
*/

const Tag = {
  view: (vnode) => {
    let tag = vnode.attrs.tags;

    if (tag == currentTag) {
      if (currentTag == "All") {
        feeds = allFeeds;
      } else if (tag == "Untagged") {
        feeds = allFeeds.filter((f) => !f.tags || f.tags.length == 0);
      } else if (tag == "Broken Feeds") {
        feeds = allFeeds.filter((f) => f.errorFetching);
      } else {
        feeds = allFeeds.filter((f) => {
          if (f?.tags) {
            let tags = f.tags.map((t) => {
              return t.toLowerCase();
            });
            return tags.includes(currentTag.toLowerCase());
          } else {
            return false;
          }
        });

        if (feeds.length == 0) {
          currentTag = "All";
          feeds = allFeeds;
          m.redraw();
        }
      }
      console.log(`${tag}`, feeds);
      return m("li", m("button", {}, tag));
    } else {
      return m(
        "li",
        m(
          "a",
          {
            href: "#",
            onclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              deselectAllFeeds();
              currentTag = tag;
            },
          },
          tag,
        ),
      );
    }
  },
};

const TagsMenu = {
  view: (vnode) => {
    let menuTags = ["All", "Broken Feeds"];

    if (allFeeds.some((f) => (f.tags ? f.tags.includes("") : false))) {
      menuTags.push("Untagged");
    }

    menuTags = [...menuTags, ...tags];

    return m(
      "nav",
      m(
        "ul",
        menuTags.map((t) => m(Tag, { tags: t })),
      ),
    );
  },
};

/*
== Feed Manager ===========================================================================================================
*/

function changeFrequency(e, frequency) {
  e.preventDefault();
  e.stopPropagation();

  let ps = feeds.map((feed) => {
    if (feed.selected) {
      feed.frequency = frequency;
      return saveFeed(feed);
    } else {
      return false;
    }
  });

  Promise.allSettled(ps).then(() => {
    console.log("after adding");
    fetchFeeds();
  });
}

const feedManager = {
  view: (vnode) => {
    return [
      m(Menu),
      feeds.some((f) => f.selected)
        ? m(
            "nav",
            m("ul", [
              m("li", m("strong", "Tags")),
              m("li", m("a", { href: "#", onclick: addTags }, "Add")),
              m("li", m("a", { href: "#", onclick: replaceTags }, "Replace")),
              m("li", m("a", { href: "#", onclick: removeTags }, "Remove")),
            ]),
            m("ul", [
              m("li", m("strong", "Frequency")),
              m(
                "li",
                m(
                  "a",
                  { href: "#", onclick: (v) => changeFrequency(v, "runtime") },
                  "Runtime",
                ),
              ),
              m(
                "li",
                m(
                  "a",
                  { href: "#", onclick: (v) => changeFrequency(v, "daily") },
                  "Daily",
                ),
              ),
              m(
                "li",
                m(
                  "a",
                  { href: "#", onclick: (v) => changeFrequency(v, "weekly") },
                  "Weekly",
                ),
              ),

              m(
                "li",
                m(
                  "a",
                  { href: "#", onclick: (v) => changeFrequency(v, "monthly") },
                  "Monthly",
                ),
              ),
            ]),
            m("ul", [
              m("li", m("strong", "Subscription")),
              m(
                "li",
                m(
                  "a",
                  { href: "#", onclick: removeAllSelected },
                  "Remove Feeds",
                ),
              ),
            ]),
          )
        : m(
            "blockquote",
            "Select feeds to do bulk editing such as managing tags, removing, and changing fetch frequency.",
          ),
      m(TagsMenu),
      m("section", [allFeeds.length == 0 ? m(EmptyList) : m(FeedList)]),
    ];
  },
};

let allFeeds = [];
let feeds = [];
let tags = [];

async function fetchFeeds() {
  let feedsObj = await getAllFeeds();

  allFeeds = Object.keys(feedsObj)
    .map((k) => feedsObj[k])
    .sort((a, b) => a.title.localeCompare(b.title));

  feeds = allFeeds;

  tags = Array.from(await getAllTags())
    .filter((t) => t.length > 0)
    .sort();

  console.log("tags", tags.join(", "));
  m.redraw();
}

let currentTag = "All";

await fetchFeeds();

const appRoot = document.getElementById("app");

m.route(appRoot, "/feedManager", {
  "/feedManager": feedManager,
});
