import {
  getAllSettings,
  getFeedWithURL,
  saveFeed,
} from "./common/dataStorage.js";

const Menu = {
  view: (vnode) => {
    return m("nav", [
      m(
        "ul",
        m(
          "li",
          m("div.box", [
            m("img", {
              src: "../icons/cat_reading512c.png",
              class: "cat-icon",
            }),
            m("h3", { style: { display: "inline" } }, item.title || "BlogCat Content Viewer"),
          ]),
        ),
      ),
      
          ]);
  },
};

const ContentDisplay = {
  view: (vnode) => {
    console.log(item.content)
    if (item.content?.type === "xhtml" || item.content?.type === "html") {
      return m("iframe", m.trust(item.content))
    }
     if (item.contentType === "xhtml" || item.contentType === "html") {
      return m("iframe", {
        srcdoc: item.content
      })
    }
  }
}

const ContentReader = {
  view: (vnode) => {
    return [m(Menu), m(ContentDisplay)];
  },
};

/*
== Initialise ===========================================================================================================
*/

let feed;
let item;
let error = {};
let currentTime = false;

const handleUncaughtException = (message, source, lineno, colno, error) => {
  console.log("error happened!", message);

  error = {
    message,
    source,
    lineno,
    colno,
    error,
  };

  window.location = `/error.html?url=${feed.url}&error=${
    JSON.stringify(error)
  }`;
  return true;
};

window.onerror = handleUncaughtException;

const search = new URLSearchParams(location.search);

if (search.has("feed")) {
  let url = search.get("feed");
  feed = await getFeedWithURL(url);
}

if (search.has("id")) {
  let id = search.get("id");
  console.log("looking for episode id", id);

  item = feed.data.items.find(
    (i) => i.id == id,
  );
}

console.log(item);

let settings = await getAllSettings();

const appRoot = document.getElementById("app");

m.route(appRoot, "/content", {
  "/content": ContentReader,
});
