You can access the _feed management page_ using the browser toolbar button and clicking on _Manage feeds_.

![Browser toolbar button](_media/browser-action.png)

## Feed management

![Feed managemeng page](_media/feed-management-page.png)

On the feed management page, you'll see a list of all websites you're currently subscribing. You can click the website title to access the website or use the _remove button_ to unsubscribe. Clicking the _edit_ button will open the [Add Feed Page](feeddiscovery.md)

Sometimes websites get broken and BlogCat can't access their feed. Instead of trying every time, BlogCat keeps track of how many times the feed failed and will stop trying to access it after three times (you can change that value in the _add-on preferences page_).

Use the _Show broken feeds_ link a the top of the page to list what websites got broken feeds.

To export your list of subscriptions, click on _Export OPML_. This will download a `subscriptions.opml` to your download folder. If you selected some feeds before clicking _Export OPML_, BlogCat will export only the selected feeds and ask you for a filename. Remember to use a _.opml_ file extension when specifying your own filename.

There are many things you can do with it:

- Add it to your blog with a `<link rel="blogroll">` such as `<link rel="blogroll" title="Blogroll" href="/.well-known/recommendations.opml">`.
- Share it with friends!
- Import it into another feed reader you like.
