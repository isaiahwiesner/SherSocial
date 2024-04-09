const imageForm = document.getElementById("image-form");
const postBtn = document.getElementById("post-btn");
const backBtn = document.getElementById("back-btn");
const cancelBtn = document.getElementById("cancel-btn");
const saveImageBtn = document.getElementById("save-image-btn");
const fields = {
    image: document.getElementById("image-input"),
    imageLink: document.getElementById("image-link-input")
};
const imageFormError = document.getElementById("image-form-error");

const setLoading = (loading) => {
    if (loading) {
        // Set disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].setAttribute("disabled", "true");
        });
        saveImageBtn.setAttribute("disabled", "true");
        postBtn.setAttribute("disabled", "true");
        backBtn.setAttribute("disabled", "true");
        cancelBtn.setAttribute("disabled", "true");
    } else {
        // Remove disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].removeAttribute("disabled");
        });
        saveImageBtn.removeAttribute("disabled");
        postBtn.removeAttribute("disabled");
        backBtn.removeAttribute("disabled");
        cancelBtn.removeAttribute("disabled");
    }
};

const setError = (field, message) => {
    if (fields[field]) {
        fields[field].classList.add("is-invalid");
        fields[field].parentElement.getElementsByClassName("form-text")[0].innerText = message;
    };
};

const setImageFormError = (message) => {
    Object.keys(fields).forEach(k => {
        fields[k].classList.add("is-invalid");
    });
    imageFormError.innerText = message;
};

const resetErrors = () => {
    Object.keys(fields).forEach(k => {
        fields[k].classList.remove("is-invalid");
        fields[k].parentElement.getElementsByClassName("form-text")[0].innerText = "";
    });
    imageFormError.innerText = "";
};

const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        fields.imageLink.value = "https://";
    }
    handleAnyImage();
};

const handleImageLinkChange = (e) => {
    fields.image.value = null;
    handleAnyImage();
};

const handleAnyImage = () => {
    if ((fields.image.files && fields.image.files[0]) || /https?:\/\/[^\.]*\..+/.test(fields.imageLink.value)) {
        saveImageBtn.removeAttribute("disabled");
    } else {
        saveImageBtn.setAttribute("disabled", true);
    }
};

const convertDataUri = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.onerror = (err) => {
            reject(err);
        }
        reader.readAsDataURL(file);
    });
};

const handleSaveImage = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetErrors();
    const file = fields.image.files[0];
    const body = {
        image: file ? await convertDataUri(file) : fields.imageLink.value,
        fileType: file ? file.name.split(".").slice(-1) : null
    };
    const res = await fetch(`/api/posts/add-image?postId=${post.postId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (res.ok) {
        window.location.reload();
    } else {
        const data = await res.json();
        if (data.errors) {
            if (data.errors.image) {
                setImageFormError(data.errors.image);
            }
        } else if (data.detail) {
            setImageFormError(data.detail);
        } else {
            setImageFormError("Unable to add post image.");
        }
        setLoading(false);
    }
};

const handleRemoveImage = async (e) => {
    const imagePath = e.target.getAttribute("data-image-path");
    setLoading(true);
    const res = await fetch(`/api/posts/remove-image?postId=${post.postId}&imagePath=${encodeURIComponent(imagePath)}`, {
        method: "DELETE"
    });
    if (res.ok) {
        window.location.reload();
    } else {
        const data = await res.json();
        if (data.errors) {
            if (data.errors.image) {
                setImageFormError(data.errors.image);
            }
        } else if (data.detail) {
            setImageFormError(data.detail);
        } else {
            setImageFormError("Unable to add post image.");
        }
        setLoading(false);
    }
};

const handlePublish = async () => {
    setLoading(true);
    const res = await fetch(`/api/posts/publish?postId=${post.postId}`, {
        method: "POST"
    });
    if (res.ok) {
        window.location = `/posts/${post.postId}`;
    }
    else {
        setLoading(false);
    }
};

const handleCancel = async () => {
    setLoading(true);
    if (!post) {
        window.location = "/";
    } else {
        const res = await fetch(`/api/posts/delete?postId=${post.postId}`, {
            method: "DELETE"
        });
        if (res.ok) {
            window.location = "/";
        } else {
            window.location = "/";
            setLoading(false);
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    imageForm.addEventListener("submit", handleSaveImage);
    cancelBtn.addEventListener("click", handleCancel);
    postBtn.addEventListener("click", handlePublish);
    fields.image.addEventListener("change", handleImageChange);
    fields.imageLink.addEventListener("change", handleImageLinkChange);
    fields.imageLink.addEventListener("keyup", handleImageLinkChange);
    [...document.querySelectorAll("[data-image-path]")].forEach(e => {
        e.addEventListener("click", handleRemoveImage);
    });
});