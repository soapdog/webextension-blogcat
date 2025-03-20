import {
  getAllFeeds,
  deleteFeed,
  getAllTags,
  saveFeed,
  saveFeeds,
} from "./common/dataStorage.js";

import { opml } from "./common/opml.js";

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
            m("strong", "Match OPML Subscriptions"),
          ]),
        ),
      ),
      m("ul", [
        m("li", m("a", { href: "feedManagement.html" }, "Feed Management")),
        m(
          "li",
          m(
            "a",
            { href: "/docs/index.html#/opmlmatching", target: "_blank" },
            "Help",
          ),
        ),
      ]),
    ]);
  },
};

const InputForm = {
  view: (vnode) => {
    return m("form", [
      m("label", { for: "file" }, "OPML FILE FROM THIRD-PARTY APP"),
      m("input", {
        name: "file",
        type: "file",
        onchange: (e) => {
          const c = (fs) => {
            thirdPartyFeeds = fs;
            subscribed = false;
            generatedopml = false;
            console.log("blogcat", blogCatFeeds);
            console.log("thirdparty", thirdPartyFeeds);
            m.redraw();
          };
          opml.loadFromFile(e, c);
        },
      }),
    ]);
  },
};

let subscribed = false;
let generatedopml = false;

const CompareReport = {
  oninit: (vnode) => {
    subscribed = false;
    generatedopml = false;
  },
  view: (vnode) => {
    let blogCatMissingFeeds = [];
    let thirdpartyMissingFeeds = [];
    let blogCatKeys = Object.keys(blogCatFeeds).map((k) =>
      k.replace("feed@", ""),
    );
    let thirdpartyListOfURLs = thirdPartyFeeds.map((tpf) => tpf.url);

    thirdPartyFeeds.forEach((tpf) => {
      if (!blogCatKeys.includes(tpf.url)) {
        console.log("blogcat needs", tpf.title);
        blogCatMissingFeeds.push(tpf);
      }
    });

    blogCatKeys.forEach((bcu) => {
      if (!thirdpartyListOfURLs.includes(bcu)) {
        console.log("third-party needs", bcu);
        thirdpartyMissingFeeds.push(blogCatFeeds[`feed@${bcu}`]);
      }
    });

    const subscribe = (e) => {
      let ps = saveFeeds(blogCatMissingFeeds);

      Promise.allSettled(ps).then(() => {
        subscribed = true;
        m.redraw();
      });
    };

    const generateOPML = (e) => {
      e.preventDefault();
      e.stopPropagation();
      opml.saveFeedsToFile(thirdpartyMissingFeeds, "missing_feeds.opml");
      generatedopml = true;
    };

    return [
      m("section.summary", [
        m("h1", "Summary"),
        m("ul", [
          m(
            "li",
            `BlogCat is subscribed to a total of ${blogCatKeys.length} websites.`,
          ),
          m(
            "li",
            `Third-party app is subscribed to a total of ${thirdPartyFeeds.length} websites.`,
          ),
          blogCatMissingFeeds.length > 0
            ? m("li", [
                `BlogCat needs to subscribe to ${blogCatMissingFeeds.length} feeds to match third-party app.  `,
                m("a", { href: "#", onclick: subscribe }, "Subscribe."),
                subscribed ? "  Subscribed!" : "",
              ])
            : "",
          thirdpartyMissingFeeds.length > 0
            ? m("li", [
                `Third-party app needs to subscribe to ${thirdpartyMissingFeeds.length} feeds to match BlogCat.  `,
                m("a", { href: "#", onclick: generateOPML }, "Generate OPML."),
                generatedopml ? "  Saved 'missing_feeds.opml'." : "",
              ])
            : "",
        ]),
      ]),
    ];
  },
};

const blurb = `
<p>Select an OPML file exported from your other app. BlogCat will 
compare it to its own subscriptions and give you the option to 
subscribe to the sites from the other app that you're not subscribed 
to. It will also give you the option to generate a new OPML file to be
imported on the other app with the sites it needs to subscribe to match 
BlogCat's subscription list.</p>

<p>If you click "subscribe" and "generate OPML" and import that file into 
your other app. Both that app and BlogCat will have matching subscriptions.</p>
`;

const OPMLMatcher = {
  view: (vnode) => {
    return m("section", [
      m(Menu),
      m("blockquote", m.trust(blurb)),
      m(InputForm),
      m("p", [
        "Open the documentation about ",
        m(
          "a",
          { href: "/docs/index.html#/opml", target: "_blank" },
          "matching OPML subscriptions between multiple apps",
        ),
        ".",
      ]),
      blogCatFeeds && thirdPartyFeeds.length > 0 ? m(CompareReport) : "",
    ]);
  },
};

let blogCatFeeds = await getAllFeeds();
let thirdPartyFeeds = [];

const appRoot = document.getElementById("app");

m.mount(appRoot, OPMLMatcher);
