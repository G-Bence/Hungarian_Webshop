const API_URL = "https://retoolapi.dev/IY9OP1/data";
const API_KEY = "";

const MAX_IMAGE_BYTES = 350 * 1024;
const IMAGE_MAX_SIZE = 900;
const IMAGE_QUALITY = 0.75;

const buildHeaders = () => {
	const headers = {
		"Content-Type": "application/json"
	};

	if (API_KEY && API_KEY !== "REPLACE_WITH_YOUR_KEY") {
		headers.Authorization = `Bearer ${API_KEY}`;
	}

	return headers;
};

const adminList = document.querySelector("#admin-product-list");
const refreshButton = document.querySelector("#refresh-products");
const newProductButton = document.querySelector("#new-product");
const editButton = document.querySelector("#edit-product");
const deleteButton = document.querySelector("#delete-selected-product");
const sendButton = document.querySelector("#send-product");
const cancelButton = document.querySelector("#cancel-edit");

const nameInput = document.querySelector("#product-name");
const priceInput = document.querySelector("#product-price");
const descriptionInput = document.querySelector("#product-description");
const imageUrlInput = document.querySelector("#product-image-url");
const imageFileInput = document.querySelector("#product-image-file");
const previewImage = document.querySelector("#product-preview");
const toast = document.querySelector("#admin-toast");
const editorHelp = document.querySelector("#editor-help");
const confirmModal = document.querySelector("#confirm-modal");
const confirmYes = document.querySelector("#confirm-yes");
const confirmNo = document.querySelector("#confirm-no");

let selectedProductId = null;
let editMode = "create";

const setFormEnabled = (enabled) => {
	[nameInput, priceInput, descriptionInput, imageUrlInput, imageFileInput].forEach((input) => {
		if (input) {
			input.disabled = !enabled;
		}
	});

	if (sendButton) {
		sendButton.disabled = !enabled;
	}

	if (cancelButton) {
		cancelButton.disabled = !enabled;
	}

	if (editButton) {
		editButton.disabled = enabled || !selectedProductId;
	}

	if (deleteButton) {
		deleteButton.disabled = enabled || !selectedProductId;
	}
};

const resetForm = () => {
	if (nameInput) nameInput.value = "";
	if (priceInput) priceInput.value = "";
	if (descriptionInput) descriptionInput.value = "";
	if (imageUrlInput) imageUrlInput.value = "";
	if (imageFileInput) imageFileInput.value = "";
	if (previewImage) previewImage.src = "https://picsum.photos/seed/admin/600/400";
};

const setSelectedProduct = (row) => {
	selectedProductId = row?.id ?? null;

	if (!row) {
		resetForm();
		return;
	}

	if (nameInput) nameInput.value = row.nev ?? "";
	if (priceInput) priceInput.value = row.ar ?? "";
	if (descriptionInput) descriptionInput.value = row.leiras ?? "";
	if (imageUrlInput) imageUrlInput.value = row.kep ?? "";
	if (previewImage) previewImage.src = row.kep || "https://picsum.photos/seed/admin/600/400";
};

const estimateDataUrlBytes = (dataUrl) => {
	const base64 = dataUrl.split(",")[1] || "";
	return Math.floor(base64.length * 0.75);
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.onload = () => resolve(String(reader.result || ""));
	reader.onerror = () => reject(new Error("Nem sikerult beolvasni a kepet."));
	reader.readAsDataURL(file);
});

const resizeDataUrl = (dataUrl) => new Promise((resolve, reject) => {
	const image = new Image();
	image.onload = () => {
		const scale = Math.min(IMAGE_MAX_SIZE / image.width, IMAGE_MAX_SIZE / image.height, 1);
		const targetWidth = Math.round(image.width * scale);
		const targetHeight = Math.round(image.height * scale);

		const canvas = document.createElement("canvas");
		canvas.width = targetWidth;
		canvas.height = targetHeight;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			reject(new Error("Nem sikerult feldolgozni a kepet."));
			return;
		}

		ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
		const resized = canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
		resolve(resized);
	};
	image.onerror = () => reject(new Error("Nem sikerult beolvasni a kepet."));
	image.src = dataUrl;
});

const showToast = (message, isError = false) => {
	if (!toast) return;
	toast.textContent = message;
	toast.hidden = false;
	toast.style.background = isError ? "#fee2e2" : "#dcfce7";
	toast.style.color = isError ? "#b91c1c" : "#166534";

	setTimeout(() => {
		toast.hidden = true;
	}, 3000);
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

const fetchProducts = async () => {
	const response = await fetch(API_URL, {
		method: "GET",
		headers: buildHeaders()
	});

	if (!response.ok) {
		throw new Error(`Retool API error: ${response.status}`);
	}

	const payload = await response.json();
	return extractRows(payload);
};

const createProduct = async (product) => {
	const response = await fetch(API_URL, {
		method: "POST",
		headers: buildHeaders(),
		body: JSON.stringify(product)
	});

	if (!response.ok) {
		throw new Error(`Retool API error: ${response.status}`);
	}

	return response.json();
};

const updateProduct = async (id, product) => {
	const response = await fetch(`${API_URL}/${id}`, {
		method: "PUT",
		headers: buildHeaders(),
		body: JSON.stringify(product)
	});

	if (!response.ok) {
		throw new Error(`Retool API error: ${response.status}`);
	}

	return response.json();
};

const deleteProduct = async (id) => {
	const response = await fetch(`${API_URL}/${id}`, {
		method: "DELETE",
		headers: buildHeaders()
	});

	if (!response.ok) {
		throw new Error(`Retool API error: ${response.status}`);
	}
};

const renderList = (rows) => {
	if (!adminList) return;

	if (!Array.isArray(rows) || rows.length === 0) {
		adminList.innerHTML = "<p class=\"admin-empty-message\">Nincs termek.</p>";
		return;
	}

	adminList.innerHTML = rows
		.map((row) => {
			const name = row.nev ?? "";
			const description = row.leiras ?? "";
			const price = row.ar ?? "";
			const imageUrl = row.kep ?? "";

			return `
						<div class="admin-list-row" data-id="${row.id}" data-name="${name}" data-description="${description}" data-price="${price}" data-image="${imageUrl}">
					<span>${name}</span>
					<span>${description}</span>
					<span>${price}</span>
					<span>${imageUrl}</span>
					<span>—</span>
				</div>`;
		})
		.join("");
};

const loadProducts = async () => {
	if (!adminList) return;
	adminList.innerHTML = "<p class=\"admin-empty-message\">Termekek betoltese...</p>";

	try {
		const rows = await fetchProducts();
		renderList(rows);
	} catch (error) {
		console.error(error);
		adminList.innerHTML = "<p class=\"admin-empty-message\">Nem sikerult betolteni.</p>";
	}
};

if (newProductButton) {
	newProductButton.addEventListener("click", () => {
		editMode = "create";
		selectedProductId = null;
		setFormEnabled(true);
		resetForm();
		if (editorHelp) {
			editorHelp.textContent = "Toltsd ki a mezoket es kattints a Kuldes gombra.";
		}
	});
}

if (adminList) {
	adminList.addEventListener("click", (event) => {
		const row = event.target.closest(".admin-list-row");
		if (!row) {
			return;
		}

		const selectedRow = {
			id: row.dataset.id,
			nev: row.dataset.name,
			leiras: row.dataset.description,
			ar: row.dataset.price,
			kep: row.dataset.image
		};

		editMode = "view";
		setSelectedProduct(selectedRow);
		setFormEnabled(false);
		if (editorHelp) {
			editorHelp.textContent = "Kattints a Termek szerkesztese gombra a modositasokhoz.";
		}
	});
}

if (editButton) {
	editButton.addEventListener("click", () => {
		if (!selectedProductId) {
			showToast("Eloszor valassz ki egy termeket.", true);
			return;
		}

		editMode = "edit";
		setFormEnabled(true);
		if (editorHelp) {
			editorHelp.textContent = "Modositsd a mezoket es kattints a Kuldes gombra.";
		}
	});
}

if (deleteButton) {
	deleteButton.addEventListener("click", () => {
		if (!selectedProductId) {
			showToast("Eloszor valassz ki egy termeket.", true);
			return;
		}

		if (confirmModal) {
			confirmModal.hidden = false;
		}
	});
}

if (confirmNo) {
	confirmNo.addEventListener("click", () => {
		if (confirmModal) {
			confirmModal.hidden = true;
		}
	});
}

if (confirmYes) {
	confirmYes.addEventListener("click", async () => {
		if (!selectedProductId) {
			showToast("Eloszor valassz ki egy termeket.", true);
			return;
		}

		try {
			await deleteProduct(selectedProductId);
			showToast("Termek torolve.");
			selectedProductId = null;
			editMode = "view";
			resetForm();
			setFormEnabled(false);
			await loadProducts();
		} catch (error) {
			console.error(error);
			showToast("Hiba tortent a torlesnel.", true);
		} finally {
			if (confirmModal) {
				confirmModal.hidden = true;
			}
		}
	});
}

if (cancelButton) {
	cancelButton.addEventListener("click", () => {
		editMode = "view";
		setFormEnabled(false);
		resetForm();
		selectedProductId = null;
		if (editorHelp) {
			editorHelp.textContent = "Eloszor valassz ki egy termeket a listabol, vagy hozz letre egy ujat.";
		}
	});
}

if (imageUrlInput && previewImage) {
	imageUrlInput.addEventListener("input", () => {
		if (imageUrlInput.value.trim()) {
			previewImage.src = imageUrlInput.value.trim();
		}
	});
}

if (imageFileInput && imageUrlInput && previewImage) {
	imageFileInput.addEventListener("change", async () => {
		const file = imageFileInput.files?.[0];
		if (!file) {
			return;
		}

		if (!file.type.startsWith("image/")) {
			showToast("Csak kep fajl toltheto fel.", true);
			imageFileInput.value = "";
			return;
		}

		try {
			const dataUrl = await readFileAsDataUrl(file);
			const resized = await resizeDataUrl(dataUrl);
			const estimatedBytes = estimateDataUrlBytes(resized);

			if (estimatedBytes > MAX_IMAGE_BYTES) {
				showToast("A kep tul nagy. Valassz kisebbet.", true);
				imageFileInput.value = "";
				return;
			}

			// Save as data URL so Retool can store it in the `kep` column.
			imageUrlInput.value = resized;
			previewImage.src = resized;
		} catch (error) {
			console.error(error);
			showToast("Nem sikerult beolvasni a kepet.", true);
		}
	});
}

if (sendButton) {
	sendButton.addEventListener("click", async () => {
		const name = nameInput?.value.trim() || "";
		const description = descriptionInput?.value.trim() || "";
		const price = Number(priceInput?.value) || 0;
		const imageUrl = imageUrlInput?.value.trim() || "";

		if (!name || !description || !price) {
			showToast("Toltsd ki a nevet, leirast es arat.", true);
			return;
		}

		const payload = {
			nev: name,
			leiras: description,
			ar: price
		};

		if (imageUrl) {
			payload.kep = imageUrl;
		}

		try {
			if (editMode === "edit" && selectedProductId) {
				await updateProduct(selectedProductId, payload);
				showToast("Termek frissitve.");
			} else {
				await createProduct(payload);
				showToast("Termek hozzaadva.");
			}
			resetForm();
			setFormEnabled(false);
			selectedProductId = null;
			editMode = "view";
			await loadProducts();
		} catch (error) {
			console.error(error);
			showToast("Hiba tortent a kuldesnel.", true);
		}
	});
}

if (refreshButton) {
	refreshButton.addEventListener("click", () => {
		loadProducts();
	});
}

setFormEnabled(false);
loadProducts();
