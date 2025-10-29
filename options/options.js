import {
  deleteFeed,
  FeedLoader,
  getAllSettings,
  saveSettings,
} from "/common/dataStorage.js";

const makeInput = (key, label) => {
  return m("div", [
    m("label", { for: key }, label),
    m("input[type=text]", {
      name: key,
      value: settings[key],
      oninput: (e) => {
        settings[key] = e.target.value;
        saveSettings(settings);
      },
    }),
  ]);
};

const makeRadio = (key, label, options) => {
  let keys = Object.keys(options);
  return m("fieldset", [
    m("legend", label),
    keys.map((v) => {
      let l = options[v];
      return m("div", [
        m("input[type=radio]", {
          name: key,
          value: v,
          checked: settings[key] == v,
          oninput: (e) => {
            settings[key] = e.target.value;
            saveSettings(settings);
          },
        }),
        m("label", { for: key }, l),
      ]);
    }),
  ]);
};

const SettingsManager = {
  view: (vnode) => {
    console.log(settings);
    return m("form", [
      makeInput("postsPerBlog", "Show how many posts per blog?"),
      makeInput(
        "maxFetchErrors",
        "Maximum amount of errors before we stop fetching that feed?",
      ),
      makeRadio("openPostsIn", "Where to open a blog post?", {
        newtab: "Posts open in a new tab",
        sametab: "Posts open on the same tab",
      }),
      makeRadio("postViewer", "How to open a blog post?", {
        reader: "Posts open using reader view (always open in a new tab)",
        web: "Posts open on their own page",
      }),
      makeRadio("openEditorIn", "Editor opens in?", {
        sidebar: "Editor opens on a sidebar",
        newtab: "Editor opens on a new tab",
      }),
      makeRadio(
        "splitPost",
        "Automatically make threads if post is too long?",
        {
          sidebar: "Split post?",
          newtab: "Don't split post",
        },
      ),
      makeRadio("openYoutubeIn", "Open YouTube Videos in?", {
        youtube: "YouTube",
        embed: "BlogCat",
        custom: "Custom Front-End",
      }),
      settings["openYoutubeIn"] == "custom"
        ? [
          makeInput("youtubeCustomURL", "Custom URL for YouTube?"),
          m("p", [
            "Open the documentation about ",
            m(
              "a",
              { href: "/docs/index.html#/youtube", target: "_blank" },
              "viewing YouTube videos inside BlogCat",
            ),
            ".",
          ]),
        ]
        : "",
    ]);
  },
};

const Options = {
  view: (vnode) => {
    return [
      m(SettingsManager),
      m("p", [
        "Open the documentation about ",
        m(
          "a",
          { href: "/docs/index.html#/options", target: "_blank" },
          "BlogCat preferences",
        ),
        ".",
      ]),
    ];
  },
};

let settings = await getAllSettings();

const appRoot = document.getElementById("app");
let feeds = [];

m.route(appRoot, "/options", {
  "/options": Options,
});
