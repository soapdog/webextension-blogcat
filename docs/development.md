BlogCat is developed using old-school technologies. There is no build system, no package manager, very few dependencies, and I try to write JavaScript that the browser understand instead of fantasy JavaScript that needs to be polyfilled and transpiled into something the browser can cope with.

Each _feature_ is developed in isolation. BlogCat is not a SPA. This way, I can work on parts of BlogCat knowing that unless I touch something that is shared between the various parts of the extension, things will not cascade into breaking stuff I'm not working on.

> BlogCat development follows the rule of fun. I develop it in a way that is fun to me. I dislike the current JS and Web ecosystem that is heavily biased towards complex tooling.

Each _feature_ is usually made of separate HTML and JS files with the same name. For example, the feature to subscribe to a website is implemented in `addFeed.html` and `addFeed.js` (using exported functions from `common/dataStorage.js`).

For simple features, I'll usually just go with vanilla JS and HTML. For more complex ones I use [Mithril](https://mithril.js.org).

BlogCat uses [Calendar Versioning](https://calver.org/) in the form of `YEAR.MONTH.RELEASE`. So the first release in March of 2025 will be `2025.3.0`, if there is an update in March, it will be `2025.3.1` and so on.

## Dependencies

I don't want to use a package manager for this add-on. Why? Because! Now, with that out of the way, lets check how dependencies are handled. Hold my hand as we travel back to 1995.

The first rule of BlogCat is: _write a simple implementation of the thing instead of adding a dependency._ Only add a dependency if you really must.

Dependencies are to be self-contained JS files to be added to pages using `<script>` tags. They should be in a format that the browser understand.

All dependencies are contained in `vendor/` and linked from there into the pages that need them.

The current dependencies are:

- [Mithril](https://mithril.js.org)
- [Pico CSS Classless](https://picocss.com/)
- [RSS Parser](https://github.com/rbren/rss-parser)
- [Browser Polyfill](https://github.com/mozilla/webextension-polyfill) (_not in vendor_)

## BlogCat Features

Think of features as modules or components. It is a loose term I'm using in this documentation to refer to isolated parts of the WebExtension.

### Toolbar button

The toolbar button is what WebExtensions call a [browser action](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface/Toolbar_button). It gives the user access to most of the add-on features. The files used to implement it are in [`browserAction/`](https://github.com/soapdog/webextension-blogcat/tree/main/browserAction).

## Background script

A [background script](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Background_scripts) is used to detect feeds and blogrolls on the opened tab. Implemented in `background.js` and `detect.js`.

### User preferences

Add-ons can have a preferences page with user-configurable interfaces. In WebExtension jargon, those are called [option pages](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface/Options_pages). The one for BlogCat is implemented inside [`options/`](https://github.com/soapdog/webextension-blogcat/tree/main/options)

### Feed management

Feed management has four different parts, all implemented separatedly.

- **Address bar button:** Also known as a [page action](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/pageAction) it is a button that appears in the address bar. In BlogCat a page action is used when the add-on detects a feed or blogroll on the page. Clicking it displays a popup allowing the user to open the website subscription page with the selected feed or open the OPML import page with the blogroll. The files for the page actions are inside the [`pageAction/` folder](https://github.com/soapdog/webextension-blogcat/tree/main/pageAction). A [background script](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Background_scripts) is used to inspect the tab and detect feeds and blogrolls.
- **Add Feed Page:** This is the page that opens allowing the user to subscribe to a specific website. The files are `addFeed.html` and `addFeed.js`.
- **Import OPML:** This page is used to import blogrolls in [OPML](https://opml.org/) format. Blorolls allows the user to bulk subscribe to websites and also to import subscriptions from other feed readers. This feature is implemented in `importOpml.html` and `importOpml.js`.
- **Feed Management:** This page lets the user to unsubscribe or edit the feeds they're following and also export their subscriptions in OPML format. Implemented in `feedManagement.html` and `feedManagement.js`.

### Reader

The reader is responsible for rendering the list of websites and their recent posts. It is implemented in `reader.html` and `reader.js`.

### Posting

BlogCat supports posting to Mastodon, Bluesky, and Micropub-enabled websites. It uses a separate list of features to do so.

- **Posting Account Manager:** This allows the user to add posting accounts. Implemented in `postingAccountManagement.html` and `postingAccountManagement.js`.
- **Editor:** This is the page that opens when the user clicks _new post_ in the browser action. It usually opens as a [sidebar](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface/Sidebars). Implemented in `editor.html` and `editor.js`.
- **Context Menu:** BlogCat also adds a context menu to allow the user to easily copy titles and text from a website and paste them into the editor. The menu is implemented in the background script.

## Common routines

All features share some routines among themselves. The shared code is contained in [`common/`](https://github.com/soapdog/webextension-blogcat/tree/main/common).

The most important file there is `dataStorage.js` which handles the [browser storage](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage) used to persist data for the add-on. All the routines needed to save, retrieve, and update feeds, posting accounts and preferences are implemented there.

Instead of using dependencies to implement our APIs for posting to social networks and blogs. I went the masochist's way and implemented them myself. Yes, they are not robust or safe when compared to the official SDKs or to other third-party libraries, but I know how they work and I can fix them in-place if needed. They'll grow as the add-on grows. **These implementations have zero dependencies and are portable to other projects**.

- **Bluesky:** implemented posting statuses to bluesky in `common/bluesky.js`. The facet calculation seems to fail sometimes. Something I will need to figure out.
- **Mastodon:** posting statuses work well. Implemented in `common/mastodon.js`.
- **Micropub:** can create new entries with a titlte. Implemented in `common/micropub.js`.
