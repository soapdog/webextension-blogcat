import { mastodon } from "./common/mastodon.js"

function tryPost() {
	console.log("trying to post")
	mastodon.publishStatus()
}

const debug = {
	view: vnode => {
		return m("button", {onclick: tryPost}, "Test post")
	}
}

const appRoot = document.getElementById("app")

m.route(appRoot, "/debug", {
    "/debug": debug
})
