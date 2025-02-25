export const mastodon = {
	methodCall: async (account, method, obj) => {
		const access_token = account.access_token
    	const url = new URL(method, account.server)

        const headers = new Headers()

        if (typeof obj !== undefined) {
        	headers.append("Content-Type", "application/json")
    	}
    	
        headers.append("Authorization", `Bearer ${access_token}`)

        try {
        	const payload = {
	            headers,
	            method: "POST",
	        }

	        if (typeof obj !== undefined) {
	        	payload.body = JSON.stringify(obj)
	        }

	        const response = await fetch(url, payload)

	        if (!response.ok) {
		      throw new Error(`Response status: ${response.status}`);
		    }

		    const data = await response.json()

		    console.log(data)

		    if (data) {
			    return data
			} else {
				throw new Error("strange mastodon response")
			}
	    }catch(e){
    	    console.error(e.message);
    	    console.log(e)
	    }
    },
	
    publishStatus: async (account, statusObj) => {
    	const access_token = account.access_token
    	const url = new URL(`/api/v1/statuses`, account.server)

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