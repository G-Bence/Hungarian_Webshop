const API_URL = "https://retoolapi.dev/MDEeXU/data";
const API_KEY = "https://retoolapi.dev/MDEeXU/data";

const buildHeaders = () => {
	const headers = {
		"Content-Type": "application/json"
	};

	if (API_KEY && API_KEY !== "REPLACE_WITH_YOUR_KEY") {
		headers.Authorization = `Bearer ${API_KEY}`;
	}

	return headers;
};

const extractRows = (payload) => {
	if (Array.isArray(payload)) {
		return payload;
	}

	if (payload && Array.isArray(payload.data)) {
		return payload.data;
	}

	if (payload && Array.isArray(payload.rows)) {
		return payload.rows;
	}

	if (payload && Array.isArray(payload.results)) {
		return payload.results;
	}

	return [];
};

export const fetchProductsFromRetool = async () => {
	const response = await fetch(API_URL, {
		method: "GET",
		headers: buildHeaders()
	});

	if (!response.ok) {
		throw new Error(`Retool API error: ${response.status}`);
	}

	const payload = await response.json();
	const rows = extractRows(payload);

	
	return rows.map((row) => ({
		name: row.nev ?? "",
		description: row.leiras ?? "",
		price: Number(row.ar) || 0
	}));
};

// Example usage:
// fetchProductsFromRetool()
//   .then((products) => console.log(products))
//   .catch((error) => console.error(error));
