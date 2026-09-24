export const opml = {
  loadFromURL: async (u) => {
    let feeds = [];

    const response = await fetch(u);
    const text = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");
    const opml = doc.documentElement;
    let currentTag = "";

    const outlines = opml.querySelectorAll(`outline`);

    for (const outline of outlines) {
      if (
        outline.hasAttribute("xmlUrl") &&
        outline.getAttribute("xmlUrl") !== ""
      ) {
        const feed = {
          title: outline.getAttribute("title"),
          url: outline.getAttribute("xmlUrl"),
          web: outline.getAttribute("htmlUrl"),
          selected: false,
          subscribed: false,
          tags: [currentTag],
        };

        if (feed.web == "") {
          feed.web = undefined;
        }

        if (feed.title == "") {
          feed.title = feed.url;
        }

        if (outline.hasAttribute("category")) {
          let categories = outline
            .getAttribute("category")
            .split(",")
            .map((c) => c.trim())
            .filter((c) => !c.includes("/"));

          feed.tags = [...feed.tags, ...categories];
        }

        feeds.push(feed);
      } else {
        if (outline.hasAttribute("title")) {
          currentTag = outline.getAttribute("title").trim();
        } else if (outline.hasAttribute("text")) {
          currentTag = outline.getAttribute("text").trim();
        } else {
          currentTag = "";
        }
      }
    }
    return { url: u, feeds };
  },
  loadFromFile: (ev, callback) => {
    const opmlFile = ev.target.files[0];
    const reader = new FileReader();
    let feeds = [];

    reader.onload = function (evt) {
      const text = evt.target.result;
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/xml");
      const el = doc.documentElement;
      let currentTag = "";

      const outlines = el.querySelectorAll(`outline`);

      for (const outline of outlines) {
        if (
          outline.hasAttribute("xmlUrl") &&
          outline.getAttribute("xmlUrl") !== ""
        ) {
          const feed = {
            title: outline.getAttribute("title"),
            url: outline.getAttribute("xmlUrl"),
            web: outline.getAttribute("htmlUrl"),
            selected: false,
            subscribed: false,
            tags: [currentTag],
          };

          if (feed.web == "") {
            feed.web = undefined;
          }

          if (!feed.title || feed.title == "") {
            feed.title = feed.url;
          }

          if (outline.hasAttribute("category")) {
            let categories = outline
              .getAttribute("category")
              .split(",")
              .map((c) => c.trim())
              .filter((c) => !c.includes("/"));

            feed.tags = [...feed.tags, ...categories];
          }

          feeds.push(feed);
        } else {
          if (outline.hasAttribute("title")) {
            currentTag = outline.getAttribute("title").trim();
          } else if (outline.hasAttribute("text")) {
            currentTag = outline.getAttribute("text").trim();
          } else {
            currentTag = "";
          }
        }
      }
      callback(feeds);
    };
    reader.readAsText(opmlFile);
  },
  loadFromCSV: (ev, callback, statusCallback) => {
    const opmlFile = ev.target.files[0];
    const reader = new FileReader();
    let feeds = [];

    reader.onload = async function (evt) {
      const text = evt.target.result;

      const lines = text.split("\n");
      const total = lines.length;
      let x = 1;

      for await (const line of lines) {
        x++;
        const count = `(${x}/${total}) `;
        const items = line.split(",");

        if (items[0].includes("@")) {
          const acct = items[0];

          // WebFinger

          const pieces = acct.split("@");
          const user = pieces[0];
          const domain = pieces[1];
          const webFingerURL =
            `https://${domain}/.well-known/webfinger?resource=acct:${acct}`;

          statusCallback(
            `${count} - Querying WebFinger for ${webFingerURL}...`,
          );
          let response;
          try {
            response = await fetch(webFingerURL, {
              signal: AbortSignal.timeout(3000),
            });

            if (response.ok) {
              const data = await response.json();

              if (data) {
                let userPage;
                try {
                  userPage = data.links.filter((l) => l.type == "text/html")[0]
                    .href;
                } catch (_n) {
                  userPage = data.aliases[0];
                }

                // Fetch HTML page for user

                if (userPage) {
                  statusCallback(
                    `${count} - Fetching HTML page for ${userPage}...`,
                  );
                  const pageResponse = await fetch(userPage, {
                    signal: AbortSignal.timeout(5000),
                  });

                  if (pageResponse.ok) {
                    try {
                      const text = await pageResponse.text();
                      const doc = Document.parseHTMLUnsafe(text);
                      const el = doc.documentElement;

                      // Look for RSS <link>

                      const rss = el.querySelector(
                        'link[type="application/rss+xml"]',
                      );
                      let rssUrl;
                      if (rss) {
                        rssUrl = new URL(rss?.href, userPage);
                      } else {
                        console.log("no rss for", userPage);
                        rssUrl = `${userPage}.rss`;
                      }
                      statusCallback(`${count} - Found RSS at ${rssUrl}...`);

                      const feed = {
                        title: doc.title ?? userPage,
                        url: rssUrl.href,
                        web: userPage,
                        selected: false,
                        subscribed: false,
                        mastodon: true,
                        tags: ["🐘"],
                      };

                      if (feed.web == "") {
                        feed.web = undefined;
                      }

                      if (!feed.title || feed.title == "") {
                        feed.title = feed.url;
                      }

                      feeds.push(feed);
                    } catch (_n) {
                      console.log("error finding the feed for", userPage);
                    }
                  }
                }
              }
            }
          } catch (_n) {
            console.log("unrecoverable error fetching");
            continue;
          }
        }
      }

      callback(feeds);

      // const parser = new DOMParser();
      // const doc = parser.parseFromString(text, "text/xml");
      // const el = doc.documentElement;
      // let currentTag = "";

      // const outlines = el.querySelectorAll(`outline`);

      // for (const outline of outlines) {
      //   if (
      //     outline.hasAttribute("xmlUrl") &&
      //     outline.getAttribute("xmlUrl") !== ""
      //   ) {
      //     const feed = {
      //       title: outline.getAttribute("title"),
      //       url: outline.getAttribute("xmlUrl"),
      //       web: outline.getAttribute("htmlUrl"),
      //       selected: false,
      //       subscribed: false,
      //       tags: [currentTag],
      //     };

      //     if (feed.web == "") {
      //       feed.web = undefined;
      //     }

      //     if (!feed.title || feed.title == "") {
      //       feed.title = feed.url;
      //     }

      //     if (outline.hasAttribute("category")) {
      //       let categories = outline
      //         .getAttribute("category")
      //         .split(",")
      //         .map((c) => c.trim())
      //         .filter((c) => !c.includes("/"));

      //       feed.tags = [...feed.tags, ...categories];
      //     }

      //     feeds.push(feed);
      //   } else {
      //     if (outline.hasAttribute("title")) {
      //       currentTag = outline.getAttribute("title").trim();
      //     } else if (outline.hasAttribute("text")) {
      //       currentTag = outline.getAttribute("text").trim();
      //     } else {
      //       currentTag = "";
      //     }
      //   }
      // }
      // callback(feeds);
    };
    reader.readAsText(opmlFile);
  },
  saveFeedsToFile: (feeds, filename) => {
    const xmlDoc = document.implementation.createDocument(null, "opml");
    const opml = xmlDoc.getElementsByTagName("opml");
    opml[0].setAttribute("version", "2.0");

    const head = xmlDoc.createElement("head");
    opml[0].appendChild(head);

    const body = xmlDoc.createElement("body");
    opml[0].appendChild(body);

    const title = xmlDoc.createElement("title");
    title.appendChild(xmlDoc.createTextNode("Exported from BlogCat"));
    head.appendChild(title);

    const dateCreated = xmlDoc.createElement("dateCreated");
    dateCreated.appendChild(xmlDoc.createTextNode(new Date()));
    head.appendChild(dateCreated);

    const docs = xmlDoc.createElement("docs");
    docs.appendChild(xmlDoc.createTextNode("https://opml.org/spec2.opml"));
    head.appendChild(docs);

    feeds.forEach((feed) => {
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

    if (!filename) {
      filename = "blogcat.opml";
    }

    let downloading = browser.downloads.download({
      url: downloadUrl,
      filename,
      conflictAction: "uniquify",
    });

    downloading.then(onStartedDownload, onFailed);
  },
};
