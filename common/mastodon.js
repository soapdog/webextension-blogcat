export const mastodon = {
  maxPostLength: () => {
    return 500;
  },
  methodCall: async (account, method, obj) => {
    const access_token = account.access_token;
    const url = new URL(method, account.server);

    const headers = new Headers();

    if (typeof obj !== undefined) {
      headers.append("Content-Type", "application/json");
    }

    headers.append("Authorization", `Bearer ${access_token}`);

    try {
      const payload = {
        headers,
        method: "POST",
      };

      if (typeof obj !== undefined) {
        payload.body = JSON.stringify(obj);
      }

      const response = await fetch(url, payload);

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const data = await response.json();

      console.log(data);

      if (data) {
        return data;
      } else {
        throw new Error("strange mastodon response");
      }
    } catch (e) {
      console.error(e.message);
      console.log(e);
    }
  },

  /*
== Post Thread ===========================================================================================================
  */

  publishThread: async (account, statusObj, splitChar = false) => {
    let thread = [];
    if (!splitChar) {
      // doesn't actually happen at the moment.
      // in the future will auto split on paragraphs.
    } else {
      const images = statusObj.images;
      delete statusObj.images;
      thread = statusObj.text.split(`\n${splitChar}\n`).map((s) => {
        let newObj = {};
        Object.assign(newObj, statusObj);
        newObj.text = s.trim();
        return newObj;
      });
      thread[0].images = images;
    }

    let responses = [];

    for (const t in thread) {
      if (responses.length > 0) {
        thread[t].in_reply_to_id = responses.toReversed()[0].id;
      }
      const r = await mastodon.publishStatus(account, thread[t]);
      console.log("thread item", r);
      responses.push(r);
    }
    console.log("thread", responses);
    const resultObj = responses[0];
    resultObj["threads"] = responses;
    return resultObj;
  },

  /*
  == Post Status ===========================================================================================================
  */

  publishStatus: async (account, statusObj) => {
    const access_token = account.access_token;

    /*
== Post images ===========================================================================================================
    */

    const images = [];

    if (statusObj?.images && statusObj.images.length > 0) {
      for (const img of statusObj.images) {
        const res = await mastodon.uploadImage(account, img);

        images.push(res);
      }
    }

    /*
== Post status ===========================================================================================================
    */

    const url = new URL(`/api/v1/statuses`, account.server);

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${access_token}`);

    const obj = {
      status: statusObj.text,
    };

    if (images.length > 0) {
      obj["media_ids"] = images.map((i) => i.id);
    }

    if (statusObj?.in_reply_to_id) {
      obj["in_reply_to_id"] = statusObj.in_reply_to_id;
    }

    try {
      const response = await fetch(url, {
        headers,
        method: "POST",
        body: JSON.stringify(obj),
      });

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const data = await response.json();

      // console.log(data)

      if (data.id) {
        return data;
      } else {
        throw new Error("strange mastodon response");
      }
    } catch (e) {
      console.error(e.message);
      console.log(e);
    }
  },

  uploadImage: async (account, image) => {
    const access_token = account.access_token;
    const url = new URL(`/api/v2/media`, account.server);

    const headers = new Headers();
    headers.append("Authorization", `Bearer ${access_token}`);

    const formData = new FormData();
    formData.append("file", image);

    if (image.alttext) {
      formData.append("description", image.alttext);
    }

    const response = await fetch(url, {
      headers,
      method: "POST",
      redirect: "follow",
      body: formData,
    });

    const data = await response.json();

    // console.log(data)

    if (response.ok && data.id) {
      return data;
    } else if (response.status == 403) {
      throw new Error(data.error ?? response.statusText);
    } else {
      throw new Error("strange mastodon response");
    }
  },
};
