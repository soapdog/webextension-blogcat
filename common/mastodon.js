export const mastodon = {
    publishStatus: async (account, statusObj) => {
    	const access_token = account.access_token
    	const url = `${account.server}/api/v1/statuses`

        const headers = new Headers()
        headers.append("Content-Type", "application/json")
        headers.append("Authorization", `Bearer ${access_token}`)

        const obj = {
        	status: statusObj.text
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

		    if (data.id) {
			    return data.url
			} else {
				throw new Error("strange mastodon response")
			}
	    }catch(e){
    	    console.error(e.message);
    	    console.log(e)
	    }
    }
}