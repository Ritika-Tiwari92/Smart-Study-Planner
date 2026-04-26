function getStoredToken() {
    return (localStorage.getItem("token") || "").trim();
}

function getAuthHeader() {
    const token = getStoredToken();

    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
}

async function apiFetch(url, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const token = getStoredToken();

    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    if (method !== "GET" && method !== "HEAD" && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    const contentType = response.headers.get("content-type") || "";
    let payload;

    if (contentType.includes("application/json")) {
        payload = await response.json();
    } else {
        payload = await response.text();
    }

    if (!response.ok) {
        const message =
            typeof payload === "string"
                ? payload
                : payload?.message || `HTTP ${response.status}`;
        throw new Error(message);
    }

    return payload;
}