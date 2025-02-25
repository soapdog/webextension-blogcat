import {
    savePostingAccount, 
    getAllPostingAccounts, 
    deletePostingAccount
} from "./common/dataStorage.js"
import {mastodon} from "./common/mastodon.js"
import {bluesky} from "./common/bluesky.js"

const Model = {
    body: "",
    links: {},
    errors: {}
}

const Compose = {
    view: vnode => {
        return m("div", [
            m("textarea", {
                rows: 15,
                autofocus: true,
                value: Model.body,
                oninput: (e) => {
                    Model.body = e.target.value
                }
            }),
            m("div", [
                m("span", {style: {float: "right"}}, Model.body.length),
            ])
        ])
    }
}

const Account = {
    view: vnode => {
        let account = vnode.attrs.account
        return [
            m("div", [
                m("input[type=checkbox]", {
                    value: account.name, 
                    id: account.name,
                    oninput: e => {
                        vnode.attrs.account.selected = e.target.checked
                    }
                }),
                m("label", {for: account.name}, m("small",account.name)),
            ]),
            Model.links[account.name] ? m("small", ["  •     ", m("a", {href: Model.links[account.name], target: "_blank"}, Model.links[account.name])]) : "",
            Model.errors[account.name] ? m("small", `  •     ${Model.errors[account.name]}`)  : ""
        ]

    }
}

const Accounts = {
    view: vnode => {
        return m("fieldset", [
            m("legend", "Select accounts to post"),
            accounts.map(a => m(Account, {account: a}))
        ])
    }
}

const Editor = {
    view: vnode => {
        return m("form",  [
            m(Compose),
            m(Accounts),
            m("button", {onclick: post}, "Post")
        ])
    }
}

/*
== Posting Function ===========================================================================================================
*/

function post(ev) {
    ev.target.disabled = true 
    ev.preventDefault()
    ev.stopPropagation()

    console.log("posting")

    let ps = accounts.map(async (account) => {
        if (!account.selected) {
            console.log(`${account.name} not selected`)
            return
        }

        try {
            console.dir(account)
            switch(account.type) {
            case "Mastodon":
                let mastodonRes = await mastodon.publishStatus(account, {text: Model.body})
                console.log(mastodonRes)

                if (mastodonRes.url) {
                   Model.links[account.name] = mastodonRes.url
                   delete Model.errors[account.name]
                } else {
                    delete Model.links[account.name]
                }
            case "Bluesky":
                let blueskyRes = await bluesky.publishStatus(account, {text: Model.body})
                console.log(blueskyRes)

                if (blueskyRes.link) {
                    Model.links[account.name] = blueskyRes.link
                    delete Model.errors[account.name]
                } else {
                    delete Model.links[account.name]
                }
            }
        } catch(e) {
            Model.errors[account.name] = `error: ${e.message}`
        }
        console.log("model", Model)

        m.redraw()

    })

    Promise.allSettled(ps, res => {
        ev.target.disabled = false
        m.redraw()
    })
}


/*
== Initialisation ===========================================================================================================
*/

let accounts = []

async function refreshAccounts() {
    let obj = await getAllPostingAccounts()

    let keys = Object.keys(obj)

    accounts = keys.map(k => obj[k])

    m.redraw()

}


refreshAccounts().then(accounts => {
const appRoot = document.getElementById("app")

    m.mount(appRoot, Editor)

})