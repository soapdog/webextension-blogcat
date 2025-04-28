(function feedAndBlogrollDetection() {
  var resObj = {
    blogroll: false,
    rss: false,
    atom: false,
  };

  var blogroll = document.querySelector('link[rel="blogroll"]');
  if (blogroll) {
    resObj.blogroll = blogroll.href;
  }

  var rss = document.querySelector('link[type="application/rss+xml"]');
  if (rss) {
    resObj.rss = rss.href;
  }

  var atom = document.querySelector('link[type="application/atom+xml"]');
  if (atom) {
    resObj.atom = atom.href;
  }

  /* special cases */

  if (!resObj.rss && !resObj.atom) {
    console.log("looking for special cases..");
    let links = document.links;
    for (a of links) {
      if (a.href.startsWith("pcast://")) {
        // pcast:// schema is used to launch Apple Podcasts and others.
        resObj.rss = a.href.replace("pcast://", "https://");
      } else if (a.href.startsWith("http://rss.acast.com/")) {
        // acast is a popular host.
        resObj.rss = a.href;
      } else if (a.href.startsWith("https://feeds.libsyn.com/")) {
        resObj.rss = a.href;
      } else if (a.href.startsWith("https://open.spotify.com/show/")) {
        // spotify is a horrible company, tries to hide the feed url.
      }
    }
  }
  return resObj;
})();
