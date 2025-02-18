export const bluesky = {
	createSession: async(account) => {
		const createSessionURL = "https://bsky.social/xrpc/com.atproto.server.createSession"

		try {
			const headers = new Headers()
	        headers.append("Content-Type", "application/json")
			const response = await fetch(createSessionURL, {
				headers,
				method: "POST",
				body: JSON.stringify({
					identifier: account.handle,
					password: account.password
				})
			})
			if (!response.ok) {
		      throw new Error(`Response status: ${response.status}`);
		    }

		    const data = await response.json()

		    console.log(data)

		    if (data.accessJwt) {
			    return data
			} else {
				throw new Error("strange bluesky response")
			}
		}catch(e){
			console.error(e.message);
    	    console.log(e)
		}
	},
    publishStatus: async (account, statusObj) => {
    	const session = await bluesky.createSession(account)
    	const access_token = session.accessJwt
    	const repo = session.did
    	const url = `"https://bsky.social/xrpc/com.atproto.repo.createRecord"`

        const headers = new Headers()
        headers.append("Content-Type", "application/json")
        headers.append("Authorization", `Bearer ${access_token}`)

        const post = {
        	"$type": "app.bsky.feed.post",
    		"text": statusObj.text,
    		"createdAt": statusObj.date,
        }

        const obj = {
        	repo,
        	collection: "app.bsky.feed.post",
        	record: post
        }

        try {
	        const response = await fetch(url, {
	            headers,
	            method: "POST",
	  			body: JSON.stringify(obj),
	        })

	        if (!response.ok) {
		      throw new Error(`Response status: ${response.status}`);
		    }

		    const data = await response.json()

		    console.log(data)

		    if (data.uri) {
			    return data
			} else {
				throw new Error("strange mastodon response")
			}
	    }catch(e){
    	    console.error(e.message);
    	    console.log(e)
	    }
    }
}