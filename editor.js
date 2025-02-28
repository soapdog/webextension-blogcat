import {
  savePostingAccount,
  getAllPostingAccounts,
  deletePostingAccount,
} from "./common/dataStorage.js";
import { mastodon } from "./common/mastodon.js";
import { bluesky } from "./common/bluesky.js";
import { micropub } from "./common/micropub.js";

const Model = {
  body: "",
  title: "",
  links: {},
  errors: {},
};

const Compose = {
  view: (vnode) => {
    let micropubSelected = false;
    accounts.forEach((account) => {
      if (account.selected && account.type == "Micropub") {
        micropubSelected = true;
      }
    });
    return m("div", [
      !micropubSelected
        ? ""
        : [
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
        },
      }),
      m("div", [m("span", { style: { float: "right" } }, Model.body.length)]),
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

const Editor = {
  view: (vnode) => {
    return m("form", [
      m(Compose),
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
  console.dir(selectedAccounts);

  let ps = selectedAccounts.map(async (account) => {
    console.log(`posting to ${account.name}`);
    try {
      switch (account.type) {
        case "Mastodon":
          let mastodonRes = await mastodon.publishStatus(account, {
            text: Model.body,
          });
          console.log(mastodonRes);

          if (mastodonRes.url) {
            Model.links[account.name] = mastodonRes.url;
            delete Model.errors[account.name];
          } else {
            delete Model.links[account.name];
          }
        case "Bluesky":
          let blueskyRes = await bluesky.publishStatus(account, {
            text: Model.body,
          });

          console.dir(blueskyRes);

          if (blueskyRes.link) {
            Model.links[account.name] = blueskyRes.link;
            delete Model.errors[account.name];
          } else {
            delete Model.links[account.name];
          }
        case "Micropub":
          let micropubRes = await micropub.publish(account, {
            text: Model.body,
            title: Model.title,
          });

          if (micropubRes.url) {
            Model.links[account.name] = micropubRes.url;
            delete Model.errors[account.name];
          } else {
            delete Model.links[account.name];
          }
      }
      return true;
    } catch (e) {
      console.error(`Error posting for ${account.name}:`, e.message);
      Model.errors[account.name] = `error: ${e.message}`;
      return false;
    }

    m.redraw();
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
