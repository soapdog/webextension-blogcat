/**
 * Converts an AT URI for a Bluesky post to a https://bsky.app.
 *
 * @param atUri The AT URI of the post.  Must be in the format at://<DID>/<COLLECTION>/<RKEY>
 * @returns The HTTPS URL to view the post on bsky.app, or null if the AT URI is invalid or not a post.
 *
 * This was copied, pasted, and modified from https://github.com/bluesky-social/atproto/discussions/2523
 */
function atUriToBskyAppUrl(atUri) {
  const regex = /^at:\/\/([^/]+)\/([^/]+)\/([^/]+)$/;
  const match = atUri.match(regex);

  if (!match) {
    return null; // Invalid AT URI format
  }

  const did = match[1];
  const collection = match[2];
  const rkey = match[3];

  if (collection === "app.bsky.feed.post") {
    return `https://bsky.app/profile/${did}/post/${rkey}`;
  } else {
    return null; // Not a post record
  }
}

export const bluesky = {
  createSession: async (account) => {
    const createSessionURL =
      "https://bsky.social/xrpc/com.atproto.server.createSession";

    try {
      const headers = new Headers();
      headers.append("Content-Type", "application/json");
      const response = await fetch(createSessionURL, {
        headers,
        method: "POST",
        body: JSON.stringify({
          identifier: account.handle,
          password: account.password,
        }),
      });
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const data = await response.json();

      if (data.accessJwt) {
        return data;
      } else {
        throw new Error("strange bluesky response");
      }
    } catch (e) {
      console.error(e.message);
      console.log(e);
    }
  },
  getFacetsForURLS: (text) => {
    const spans = [];
    // partial/naive URL regex based on: https://stackoverflow.com/a/3809435
    // tweaked to disallow some training punctuation
    const url_regex =
      /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*[-a-zA-Z0-9@%_\+~#//=])?)/dgi;
    const matches = text.matchAll(url_regex);

    matches.forEach((m) => {
      try {
        spans.push({
          index: {
            byteStart: m.index,
            byteEnd: m.index + m[0].length,
          },
          features: [
            {
              $type: "app.bsky.richtext.facet#link",
              uri: m[0],
            },
          ],
        });
      } catch (e) {
        console.error(e);
      }
    });
    return spans;
  },
  getFacetsForTags: (text) => {
    const spans = [];
    const url_regex = /#[a-z0-9_]+/dgi;
    const matches = text.matchAll(url_regex);

    matches.forEach((m) => {
      try {
        spans.push({
          index: {
            byteStart: m.index,
            byteEnd: m.index + m[0].length,
          },
          features: [
            {
              $type: "app.bsky.richtext.facet#tag",
              tag: m[0],
            },
          ],
        });
      } catch (e) {
        console.error(e);
      }
    });
    return spans;
  },
  publishStatus: async (account, statusObj) => {
    const session = await bluesky.createSession(account);
    if (!session && !session.accessJwt) {
      throw "Can't create Bluesky session";
    }
    const access_token = session.accessJwt;
    const repo = session.did;
    const url = "https://bsky.social/xrpc/com.atproto.repo.createRecord";

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${access_token}`);

    if (!statusObj.date) {
      statusObj.date = new Date();
    }

    const post = {
      $type: "app.bsky.feed.post",
      text: statusObj.text,
      createdAt: statusObj.date,
      facets: [
        ...bluesky.getFacetsForURLS(statusObj.text),
        ...bluesky.getFacetsForTags(statusObj.text),
      ],
    };

    const obj = {
      repo,
      collection: "app.bsky.feed.post",
      record: post,
    };

    try {
      // console.log("payload", obj)

      const response = await fetch(url, {
        headers,
        method: "POST",
        body: JSON.stringify(obj),
      });

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const data = await response.json();

      console.log(data);

      if (data.uri) {
        data.link = atUriToBskyAppUrl(data.uri);
        return data;
      } else {
        throw new Error("strange bluesky response");
      }
    } catch (e) {
      console.error(e.message);
      console.log(e);
    }
  },
};
