(function feedAndBlogrollDetection() {
	var resObj = {
		blogroll: false,
		rss: false,
		atom: false,
	}

	var blogroll = document.querySelector('link[rel="blogroll"]')
	if (blogroll) {
		resObj.blogroll = blogroll.href
	} 

	var rss = document.querySelector('link[type="application/rss+xml"]')
	if (rss) {
		resObj.rss = rss.href
	}

	var atom = document.querySelector('link[type="application/atom+xml"]')
	if (atom) {
		resObj.atom = atom.href
	}

	return resObj
})()

