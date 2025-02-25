import {
    savePostingAccount, 
    getAllPostingAccounts, 
    deletePostingAccount
} from "./common/dataStorage.js"
import {mastodon} from "./common/mastodon.js"
import {bluesky} from "./common/bluesky.js"


/*
== Bluesky ===========================================================================================================
*/
async function saveBlueskyAccount(ev, account) {
    ev.target.disabled = true 
    console.log(account)
    
    account.name = `@${account.handle}`
    account.type = "Bluesky"

    console.log(account)

    savePostingAccount(account)

    ev.target.disabled = false

    refreshAccounts().then((e) => {
        m.redraw()
    })

    m.route.set("/AccountList")

}

const AddBluesky = {
    oninit: vnode => {
        vnode.state.account = {
            handle: "",
            password: ""
        }
    },
    view: vnode => {
        let account = vnode.state.account
        return m("form", [
            m("h3", "Add Bluesky Account"),
            m("label", { for: "handle" }, "Account Handle"),
            m("input[type=text]", {
                name: "handle",
                value: account["handle"],
                oninput: e => {
                    account["handle"] = e.target.value
                }
            }),
            m("label", { for: "password" }, "Application Password"),
            m("input[type=text]", {
                name: "password",
                value: account["password"],
                oninput: e => {
                    account["password"] = e.target.value
                }
            }),          
            m("button", {onclick: (ev) => saveBlueskyAccount(ev, account)}, "Save")
        ])
    }
}




/*
== Mastodon ===========================================================================================================
*/
async function saveMastodonAccount(ev, account) {
	ev.target.disabled = true 
	console.log(account)
	let server = account.server

	if (!server.includes("://")) {
		account.server = `https://${server}`
		server = account.server
	}

	let serverURL = new URL("/",server)
    /*
    BUG: This is the wrong method to call. It doesn't prove that the access token has read access to the profile.
    It proves if the profile exists, which is a plus. It needs a subsequent call to read the profile.
    */
    let profileURL = new URL (`/api/v1/accounts/lookup?acct=${account.handle}`, serverURL) // public call, if I go through normal mastodon.methodCall() it fails

	let response = await fetch(profileURL)
    let profileInfo

    if (response.ok) {
        profileInfo = await response.json()
    } else {
        throw("Mastodon account error")
    }

    account.profileInfo = profileInfo
    account.name = `@${account.handle}@${serverURL.hostname}`
    account.type = "Mastodon"

    console.log(account)

    savePostingAccount(account)

	ev.target.disabled = false

    refreshAccounts()
    m.route.set("/AccountList")
    
}

const AddMastodon = {
    oninit: vnode => {
        vnode.state.account = {
            handle: "",
            server: "",
            access_token: ""
        }
    },
	view: vnode => {
		let account = vnode.state.account
		return m("form", [
			m("h3", "Add Mastodon Account"),
            m("label", { for: "handle" }, "Account Handle"),
            m("input[type=text]", {
                name: "handle",
                value: account["handle"],
                oninput: e => {
                    account["handle"] = e.target.value
                }
            }),
            m("label", { for: "server" }, "Mastodon server"),
            m("input[type=text]", {
                name: "server",
                value: account["server"],
                oninput: e => {
                    account["server"] = e.target.value
                }
            }),
            m("label", { for: "access_token" }, "Personal Access Token"),
            m("input[type=text]", {
                name: "access_token",
                value: account["access_token"],
                oninput: e => {
                    account["access_token"] = e.target.value
                }
            }),          
			m("button", {onclick: (ev) => saveMastodonAccount(ev, account)}, "Save")
		])
	}
}

/*
== Account List ===========================================================================================================
*/

const AccountDisplay = {
    view: vnode => {
        let account = vnode.attrs.account
        return m("li", [
            m("strong", account.name),
            m("span", `  (${account.type})  •  `),
            m("a", {href: "#", onclick: (e) => {
                deletePostingAccount(account)
                refreshAccounts()
            }}, "delete")
        ])
    }
}

const AccountList = {
    view: vnode => {
        vnode.state.accounts = accounts
        return m("section", [
            m("h3", "Accounts for posting"),
            vnode.state.accounts.length > 0 ? m("ul", vnode.state.accounts.map(account => m(AccountDisplay, {account}))) : m("strong","Add posting accounts using the buttons below."),
            m("nav", m("ol", [
                m("li", m(m.route.Link, {selector: "button", href: "/AddMastodon"}, "Add Mastodon Account")),
                m("li", m(m.route.Link, {selector: "button", href: "/AddBluesky"}, "Add Bluesky Account")),
                m("li", m(m.route.Link, {selector: "button", href: "/AddMicropub"}, "Add Micropub Account"))
            ]))
        ])
    }
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

    m.route(appRoot, "/AccountList", {
        "/AddMastodon": AddMastodon,
        "/AddBluesky": AddBluesky,
        "/AccountList": AccountList
    })

})