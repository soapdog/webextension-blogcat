import {
  deletePostingAccount,
  getAllPostingAccounts,
  savePostingAccount,
} from "./common/dataStorage.js";
import { mastodon } from "./common/mastodon.js";
import { bluesky } from "./common/bluesky.js";
import { micropub } from "./common/micropub.js";

const Model = {
  body: "",
  title: "",
  links: {},
  errors: {},
  images: [],
  onChange: (value) => {
    localStorage.setItem("draft", value);
  },
  onCreate: () => {
    Model.body = localStorage.getItem("draft") ?? "";
    m.redraw();
  },
};

const Compose = {
  oninit: (vnode) => {
    Model.onCreate();
  },
  view: (vnode) => {
    let micropubSelected = false;
    let lengthStatus = Model.body.length;

    accounts.forEach((account) => {
      if (account.selected && account.type == "Micropub") {
        micropubSelected = true;
      }
      if (account.selected && account.type !== "Micropub") {
        switch (account.type) {
          case "Mastodon":
            if (Model.body.length >= mastodon.maxPostLength()) {
              lengthStatus = `${lengthStatus}  •  Over Mastodon Limit!`;
            }

          case "Bluesky":
            if (Model.body.length >= bluesky.maxPostLength()) {
              lengthStatus = `${lengthStatus}  •  Over Bluesky Limit!`;
            }
        }
      }
    });
    return m("div", [
      !micropubSelected ? "" : [
        m("label", { for: "title" }, "Title (only used for Micropub)"),
        m("input[type=text]", {
          name: "title",
          value: Model.title,
          oninput: (e) => {
            Model.title = e.target.value;
          },
        }),
      ],
      m("textarea", {
        rows: 15,
        autofocus: true,
        value: Model.body,
        oninput: (e) => {
          Model.body = e.target.value;
          Model.onChange(Model.body);
        },
      }),
      m("div", [m("span", { style: { float: "right" } }, lengthStatus)]),
    ]);
  },
};

const Account = {
  view: (vnode) => {
    let account = vnode.attrs.account;
    return [
      m("div", [
        m("input[type=checkbox]", {
          value: account.name,
          id: account.name,
          checked: account.selected,
          oninput: (e) => {
            vnode.attrs.account.selected = e.target.checked;
          },
        }),
        m("label", { for: account.name }, m("small", account.name)),
      ]),
      Model.links[account.name]
        ? m("small", [
          "  •     ",
          m(
            "a",
            { href: Model.links[account.name], target: "_blank" },
            Model.links[account.name],
          ),
        ])
        : "",
      Model.errors[account.name]
        ? m("small", `  •     ${Model.errors[account.name]}`)
        : "",
    ];
  },
};

const Accounts = {
  view: (vnode) => {
    return m("fieldset", [
      m("legend", "Select accounts to post"),
      accounts.map((a) => m(Account, { account: a })),
    ]);
  },
};

const ImageUpload = {
  view: (vnode) => {
    return m("div", {
      class: "row",
    }, [
      m("input", {
        id: "file",
        onchange: (evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          for (const f of evt.target.files) {
            Model.images.push(f);
          }
          console.log(Model);
        },
        type: "file",
        class: "hide",
      }),
      m("button", {
        onclick: ((evt) => {
          evt.stopPropagation();
          evt.preventDefault();
          const f = document.getElementById("file");
          f.click();
        }),
      }, "Upload Image"),
      m("span", `${Model.images.length} images selected`),
    ]);
  },
};

const Editor = {
  view: (vnode) => {
    return m("form", [
      m(Compose),
      m(ImageUpload),
      m(Accounts),
      m("button", { onclick: post }, "Post"),
      m(
        "button.secondary",
        {
          onclick: (e) => {
            e.preventDefault();
            e.stopPropagation();

            Model.body = "";
            Model.errors = {};
            Model.links = {};
            accounts.forEach((a) => {
              a.selected = false;
            });
            localStorage.removeItem("draft");
          },
        },
        "Clear",
      ),
    ]);
  },
};

/*
== Posting Function ===========================================================================================================
*/

function post(ev) {
  ev.target.disabled = true;
  ev.preventDefault();
  ev.stopPropagation();

  Model.errors = {};
  Model.links = {};

  const selectedAccounts = accounts.filter((account) => account.selected);

  console.time("posting");

  let ps = selectedAccounts.map(async (account) => {
    console.log(`posting to ${account.name}`);
    try {
      switch (account.type) {
        case "Mastodon":
          let mastodonRes = await mastodon.publishStatus(account, {
            text: Model.body,
            images: Model.images,
          });
          console.log(mastodonRes);

          if (mastodonRes.url) {
            Model.links[account.name] = mastodonRes.url;
            delete Model.errors[account.name];
          } else {
            delete Model.links[account.name];
          }
          break;
        case "Bluesky":
          let blueskyRes = await bluesky.publishStatus(account, {
            text: Model.body,
            images: Model.images,
          });

          if (blueskyRes.link) {
            Model.links[account.name] = blueskyRes.link;
            delete Model.errors[account.name];
          } else {
            delete Model.links[account.name];
          }
          console.log("model", Model);
          break;
        case "Micropub":
          let micropubRes = await micropub.publish(account, {
            text: Model.body,
            title: Model.title,
            images: Model.images,
          });

          if (micropubRes.url) {
            Model.links[account.name] = micropubRes.url;
            delete Model.errors[account.name];
          } else {
            delete Model.links[account.name];
          }
          break;
      }
      console.dir(Model);
      m.redraw();
      return true;
    } catch (e) {
      console.error(`Error posting for ${account.name}:`, e.message);
      Model.errors[account.name] = `error: ${e.message}`;
      m.redraw();
      return false;
    }
  });

  Promise.allSettled(ps, (res) => {
    ev.target.disabled = false;
    m.redraw();
    console.timeEnd("posting");
  });
}

/*
== Initialisation ===========================================================================================================
*/

let accounts = [];

async function refreshAccounts() {
  let obj = await getAllPostingAccounts();

  let keys = Object.keys(obj);

  accounts = keys.map((k) => obj[k]);

  m.redraw();
}

refreshAccounts().then((accounts) => {
  const appRoot = document.getElementById("app");

  m.mount(appRoot, Editor);
});
