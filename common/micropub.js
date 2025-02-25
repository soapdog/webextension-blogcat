export const micropub = {
  publish: async (account, statusObj) => {
    const access_token = account.access_token;
    const url = new URL(account.endpoint);

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${access_token}`);

    const content = statusObj.text;
    const title = statusObj.title;

    try {
      const response = await fetch(url, {
        headers,
        method: "POST",
        redirect: "follow",
        body: JSON.stringify({
          type: ["h-entry"],
          properties: {
            content: [content],
            name: [title],
          },
        }),
      });

      if (response.status !== 201) {
        throw new Error(`Micropub Error: ${response.status}`);
      }

      const data = {
        url: response.headers.get("location"),
      };

      console.log(data);

      if (data.url) {
        return data;
      } else {
        throw new Error("strange micropub response");
      }
    } catch (e) {
      console.error(e.message);
      console.log(e);
    }
  },
};
